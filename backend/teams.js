const { db, RequestError, transaction, id, field, skills, writeSkills } = require('./data');
const { requireCompleteProfile } = require('./profile');

// Count the leader even for older teams without a corresponding membership row.
const memberCount = `(1 + (SELECT COUNT(*) FROM team_members m
  WHERE m.team_id = t.id AND m.student_id <> t.leader_id))`;

async function getTeams(connection, studentId, where, parameters = []) {
  const [rows] = await connection.execute(`
    SELECT t.id, t.name, t.project_title, t.project_description, t.capacity, t.status,
           leader.full_name AS leader_name, t.leader_id = ? AS is_leader,
           membership.student_id IS NOT NULL AS is_member, own_request.status AS request_status,
           ${memberCount} AS member_count,
           CASE WHEN t.leader_id = ? THEN (
             SELECT COUNT(*) FROM team_requests r WHERE r.team_id = t.id AND r.status = 'pending'
           ) ELSE 0 END AS pending_request_count
    FROM teams t
    JOIN students leader ON leader.id = t.leader_id
    LEFT JOIN team_members membership ON membership.team_id = t.id AND membership.student_id = ?
    LEFT JOIN team_requests own_request ON own_request.team_id = t.id AND own_request.student_id = ?
    WHERE ${where}
    ORDER BY t.id DESC`, [studentId, studentId, studentId, studentId, ...parameters]);
  if (!rows.length) return rows;

  const byId = new Map(rows.map(row => {
    row.member_count = Number(row.member_count);
    row.pending_request_count = Number(row.pending_request_count);
    row.is_leader = Boolean(row.is_leader);
    row.is_member = row.is_leader || Boolean(row.is_member);
    if (row.status === 'open' && row.member_count >= row.capacity) row.status = 'full';
    row.skills = [];
    row.hackathons = [];
    return [row.id, row];
  }));
  const teamIds = [...byId.keys()];
  const [skillRows] = await connection.query(`
    SELECT ts.team_id, s.name FROM team_skills ts JOIN skills s ON s.id = ts.skill_id
    WHERE ts.team_id IN (?) ORDER BY s.name`, [teamIds]);
  const [eventRows] = await connection.query(`
    SELECT th.team_id, h.id, h.name FROM team_hackathons th JOIN hackathons h ON h.id = th.hackathon_id
    WHERE th.team_id IN (?) ORDER BY h.name`, [teamIds]);
  for (const row of skillRows) byId.get(row.team_id).skills.push(row.name);
  for (const { team_id, ...event } of eventRows) byId.get(team_id).hackathons.push(event);
  return rows;
}

async function lockTeam(connection, teamId) {
  const [[team]] = await connection.execute(
    'SELECT id, leader_id, capacity, status FROM teams WHERE id = ? FOR UPDATE', [teamId]);
  if (!team) throw new RequestError(404, 'Team not found.');
  return team;
}

async function requireOpenSlot(connection, team) {
  const [[{ count }]] = await connection.execute(
    `SELECT ${memberCount} AS count FROM teams t WHERE t.id = ?`, [team.id]);
  const memberTotal = Number(count);
  if (team.status !== 'open' || memberTotal >= team.capacity) {
    throw new RequestError(409, 'This team is no longer accepting members.');
  }
  return memberTotal;
}

function mountTeamRoutes(router, route) {
  router.get('/hackathons', route(async (req, res) => {
    const [events] = await db.execute('SELECT id, name FROM hackathons ORDER BY name');
    res.json(events);
  }));

  router.post('/teams', route(async (req, res) => {
    const body = req.body ?? {};
    const name = field(body.name, 'Team name', 255, true);
    const title = field(body.project_title, 'Project title', 255, true);
    const description = field(body.project_description, 'Project description', 10000, true);
    const capacity = body.capacity;
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 10) {
      throw new RequestError(400, 'Team capacity must be a whole number between 2 and 10.');
    }
    const names = skills(body.skills, true);
    const eventId = body.hackathon_id == null ? null : id(body.hackathon_id);
    const leaderId = req.user.id;
    const team = await transaction(async connection => {
      await requireCompleteProfile(connection, leaderId);
      if (eventId) {
        const [[event]] = await connection.execute('SELECT id FROM hackathons WHERE id = ? FOR SHARE', [eventId]);
        if (!event) throw new RequestError(400, 'Choose a listed hackathon.');
      }
      const [[duplicate]] = await connection.execute(`
        SELECT t.id FROM teams t LEFT JOIN team_hackathons h ON h.team_id = t.id
        WHERE t.leader_id = ? AND t.name = ? AND t.project_title = ? AND h.hackathon_id <=> ?
        LIMIT 1`, [leaderId, name, title, eventId]);
      if (duplicate) throw new RequestError(409, 'You already created this team for this project and event.');

      const [created] = await connection.execute(`
        INSERT INTO teams (name, project_title, project_description, leader_id, capacity)
        VALUES (?, ?, ?, ?, ?)`, [name, title, description, leaderId, capacity]);
      const teamId = created.insertId;
      await connection.execute('INSERT INTO team_members (team_id, student_id) VALUES (?, ?)', [teamId, leaderId]);
      if (eventId) {
        await connection.execute('INSERT INTO team_hackathons (team_id, hackathon_id) VALUES (?, ?)', [teamId, eventId]);
      }
      await writeSkills(connection, 'team', teamId, names);
      const [team] = await getTeams(connection, leaderId, 't.id = ?', [teamId]);
      return team;
    });
    res.status(201).json(team);
  }));

  router.get('/teams', route(async (req, res) => {
    const teams = await transaction(connection => getTeams(connection, req.user.id,
      `t.status = 'open' AND ${memberCount} < t.capacity`));
    res.json(teams);
  }));

  router.get('/teams/:id', route(async (req, res) => {
    const teamId = id(req.params.id);
    const team = await transaction(async connection => {
      const [team] = await getTeams(connection, req.user.id, 't.id = ?', [teamId]);
      if (!team || (team.status !== 'open' && !team.is_member)) throw new RequestError(404, 'Team not found.');
      if (team.is_member) {
        const [members] = await connection.execute(`
          SELECT s.id, s.full_name, s.id = t.leader_id AS is_leader
          FROM teams t JOIN students s ON s.id = t.leader_id OR EXISTS (
            SELECT 1 FROM team_members m WHERE m.team_id = t.id AND m.student_id = s.id
          ) WHERE t.id = ? ORDER BY is_leader DESC, s.full_name`, [teamId]);
        team.members = members;
      }
      if (team.is_leader) {
        const [requests] = await connection.execute(`
          SELECT r.id, s.id AS applicant_id, s.full_name, s.email, s.student_id, s.github, s.linkedin, s.resume_url
          FROM team_requests r JOIN students s ON s.id = r.student_id
          WHERE r.team_id = ? AND r.status = 'pending' ORDER BY r.id`, [teamId]);
        if (requests.length) {
          const [rows] = await connection.query(`
            SELECT ss.student_id, s.name FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
            WHERE ss.student_id IN (?) ORDER BY s.name`, [requests.map(request => request.applicant_id)]);
          const byStudent = new Map(requests.map(request => [request.applicant_id, request]));
          for (const request of requests) request.skills = [];
          for (const row of rows) byStudent.get(row.student_id).skills.push(row.name);
        }
        team.pending_requests = requests;
      }
      return team;
    });
    res.json(team);
  }));

  router.delete('/teams/:id', route(async (req, res) => {
    const teamId = id(req.params.id);
    await transaction(async connection => {
      const team = await lockTeam(connection, teamId);
      if (team.leader_id !== req.user.id) {
        throw new RequestError(403, 'Only the team leader can delete this team.');
      }
      await connection.execute('DELETE FROM teams WHERE id = ?', [teamId]);
    });
    res.status(204).end();
  }));

  router.post('/teams/:id/request', route(async (req, res) => {
    const teamId = id(req.params.id);
    const studentId = req.user.id;
    const request = await transaction(async connection => {
      const team = await lockTeam(connection, teamId);
      if (team.leader_id === studentId) throw new RequestError(409, 'You already lead this team.');
      if (team.status !== 'open') throw new RequestError(404, 'Team not found.');
      await requireCompleteProfile(connection, studentId);
      const [[membership]] = await connection.execute(
        'SELECT 1 FROM team_members WHERE team_id = ? AND student_id = ?', [teamId, studentId]);
      if (membership) throw new RequestError(409, 'You are already a member of this team.');
      const [[previous]] = await connection.execute(
        'SELECT id, status FROM team_requests WHERE team_id = ? AND student_id = ?', [teamId, studentId]);
      if (previous) throw new RequestError(409, 'You already requested to join this team.');
      await requireOpenSlot(connection, team);
      const [created] = await connection.execute(
        'INSERT INTO team_requests (team_id, student_id) VALUES (?, ?)', [teamId, studentId]);
      return { id: created.insertId, team_id: teamId, status: 'pending' };
    });
    res.status(201).json(request);
  }));

  router.put('/requests/:id', route(async (req, res) => {
    const requestId = id(req.params.id);
    const status = req.body?.status;
    if (status !== 'accepted' && status !== 'rejected') {
      throw new RequestError(400, 'Choose accepted or rejected.');
    }
    // Look up the team outside the transaction so the first consistent read after
    // locking the team sees any membership changes committed by a prior approval.
    const [[target]] = await db.execute('SELECT team_id FROM team_requests WHERE id = ?', [requestId]);
    if (!target) throw new RequestError(404, 'Join request not found.');
    const request = await transaction(async connection => {
      const team = await lockTeam(connection, target.team_id);
      if (team.leader_id !== req.user.id) throw new RequestError(403, 'Only the team leader can review requests.');
      const [[request]] = await connection.execute(`
        SELECT id, team_id, student_id, status FROM team_requests WHERE id = ? FOR UPDATE`, [requestId]);
      if (!request) throw new RequestError(404, 'Join request not found.');
      if (request.status === status) return request;
      if (request.status !== 'pending') throw new RequestError(409, 'This request has already been reviewed.');

      if (status === 'accepted') {
        await requireCompleteProfile(connection, request.student_id);
        const count = await requireOpenSlot(connection, team);
        await connection.execute('INSERT INTO team_members (team_id, student_id) VALUES (?, ?)',
          [team.id, request.student_id]);
        if (count + 1 === team.capacity) {
          await connection.execute("UPDATE teams SET status = 'full' WHERE id = ?", [team.id]);
        }
      }
      await connection.execute('UPDATE team_requests SET status = ? WHERE id = ?', [status, requestId]);
      return { ...request, status };
    });
    res.json(request);
  }));

  router.get('/my-requests', route(async (req, res) => {
    const [rows] = await db.execute(`
      SELECT r.id, r.team_id, r.status, r.created_at, t.name AS team_name,
             (t.status = 'open' AND ${memberCount} < t.capacity) OR m.student_id IS NOT NULL
               OR t.leader_id = r.student_id AS can_view_team
      FROM team_requests r JOIN teams t ON t.id = r.team_id
      LEFT JOIN team_members m ON m.team_id = t.id AND m.student_id = r.student_id
      WHERE r.student_id = ? ORDER BY r.id DESC`, [req.user.id]);
    res.json(rows.map(row => ({ ...row, can_view_team: Boolean(row.can_view_team) })));
  }));

  router.get('/my-teams', route(async (req, res) => {
    const teams = await transaction(connection => getTeams(connection, req.user.id,
      '(t.leader_id = ? OR membership.student_id IS NOT NULL)', [req.user.id]));
    res.json(teams);
  }));
}

module.exports = mountTeamRoutes;
