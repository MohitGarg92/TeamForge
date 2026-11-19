const { RequestError, id, transaction, field, link, skills, writeSkills } = require('./data');

async function getProfile(connection, studentId) {
  const [[profile]] = await connection.execute(`
    SELECT id, full_name, email, student_id, phone, github, linkedin, resume_url
    FROM students WHERE id = ?`, [studentId]);
  const [rows] = await connection.execute(`
    SELECT s.name FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
    WHERE ss.student_id = ? ORDER BY s.name`, [studentId]);
  const names = rows.map(row => row.name);
  const missing = [];
  if (!profile.full_name?.trim()) missing.push('Full name');
  if (!profile.student_id?.trim()) missing.push('Student ID');
  if (!profile.phone?.trim()) missing.push('Phone');
  if (!names.length) missing.push('Skills');
  return { ...profile, skills: names, profile_complete: missing.length === 0, missing_fields: missing };
}

async function requireCompleteProfile(connection, studentId) {
  // Serialize with profile edits so completion cannot change during the action.
  await connection.execute('SELECT id FROM students WHERE id = ? FOR UPDATE', [studentId]);
  const profile = await getProfile(connection, studentId);
  if (!profile.profile_complete) {
    const error = new RequestError(403, `Complete your profile before creating or joining a team. Missing: ${profile.missing_fields.join(', ')}.`);
    error.code = 'PROFILE_INCOMPLETE';
    throw error;
  }
}

function mountProfileRoutes(router, route) {
  router.get('/profile', route(async (req, res) => {
    res.json(await transaction(connection => getProfile(connection, req.user.id)));
  }));

  router.get('/requests/:id/profile', route(async (req, res) => {
    const requestId = id(req.params.id);
    const profile = await transaction(async connection => {
      const [[request]] = await connection.execute(`
        SELECT r.student_id, t.leader_id FROM team_requests r
        JOIN teams t ON t.id = r.team_id WHERE r.id = ?`, [requestId]);
      if (!request) throw new RequestError(404, 'Join request not found.');
      if (request.leader_id !== req.user.id) throw new RequestError(403, 'Only the team leader can view this applicant’s profile.');
      return getProfile(connection, request.student_id);
    });
    res.json(profile);
  }));

  router.put('/profile', route(async (req, res) => {
    const body = req.body ?? {};
    const updates = Object.entries({
      full_name: value => field(value, 'Full name', 255, true),
      student_id: value => field(value, 'Student ID', 50),
      phone: value => field(value, 'Phone', 20),
      github: value => link(value, 'GitHub link'),
      linkedin: value => link(value, 'LinkedIn link'),
      resume_url: value => link(value, 'Resume link'),
    }).filter(([name]) => Object.hasOwn(body, name))
      .map(([name, validate]) => [name, validate(body[name])]);
    const names = Object.hasOwn(body, 'skills') ? skills(body.skills) : null;
    const studentId = req.user.id;

    const profile = await transaction(async connection => {
      await connection.execute('SELECT id FROM students WHERE id = ? FOR UPDATE', [studentId]);
      if (updates.length) {
        const assignments = updates.map(([name]) => `${name} = ?`).join(', ');
        await connection.execute(`UPDATE students SET ${assignments} WHERE id = ?`,
          [...updates.map(([, value]) => value), studentId]);
      }
      if (names) await writeSkills(connection, 'student', studentId, names);
      return getProfile(connection, studentId);
    });
    res.json(profile);
  }));
}

module.exports = mountProfileRoutes;
module.exports.requireCompleteProfile = requireCompleteProfile;
