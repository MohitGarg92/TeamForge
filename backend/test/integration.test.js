const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');

if (!/^teamforge_test(?:_[a-z0-9]+)?$/.test(process.env.DB_NAME || '')) {
  throw new Error('Set DB_NAME to a disposable teamforge_test database initialized with db/schema.sql.');
}

// Use real OAuth redirects, state, sessions and database operations. Replace the
// two remote Google calls so the suite requires neither accounts nor internet.
process.env.GOOGLE_CLIENT_ID = 'integration-client';
process.env.GOOGLE_CLIENT_SECRET = 'integration-secret';
process.env.GOOGLE_CALLBACK_URL = '/api/auth/google/callback';
process.env.FRONTEND_URL = '';
process.env.SESSION_SECRET = randomUUID();
process.env.NODE_ENV = 'test';

const app = require('../server');
const db = require('../db').promise();
const passport = require('passport');
const strategy = passport._strategy('google');
const runId = randomUUID().slice(0, 8);
strategy._oauth2.getOAuthAccessToken = (code, params, callback) => callback(null, code, null, {});
strategy.userProfile = (code, callback) => {
  const domain = code === 'external' ? 'example.org' : 'thapar.edu';
  callback(null, {
    id: `${runId}-${code}`,
    displayName: code,
    emails: [{ value: `${runId}-${code}@${domain}`, verified: code !== 'unverified' }],
  });
};

test('profile completion, applicant privacy, live counts, team approvals and deletion', async t => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.end();
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  async function call(path, { cookie, method = 'GET', body, status = 200, headers = {} } = {}) {
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${origin}/api${path}`, {
      method, headers, body: JSON.stringify(body), redirect: 'manual',
    });
    const result = response.headers.get('content-type')?.includes('application/json')
      ? await response.json() : await response.text();
    if (status) assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
    return { response, result };
  }

  async function signIn(code, allowed = true) {
    const start = (await call('/auth/google', { status: 302 })).response;
    const state = new URL(start.headers.get('location')).searchParams.get('state');
    assert.ok(state);
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const callback = (await call(`/auth/google/callback?code=${code}&state=${state}`, {
      cookie, status: 302,
    })).response;
    assert.equal(callback.headers.get('location'), allowed ? '/pages/dashboard.html' : '/pages/login.html?error=not_allowed');
    if (allowed) return callback.headers.get('set-cookie').split(';')[0];
    await call('/auth/me', { cookie, status: 401 });
  }

  await call('/profile', { status: 401 });
  await call('/teams', { status: 401 });
  const initialStats = (await call('/stats')).result;
  await signIn('external', false);
  await signIn('unverified', false);
  const leader = await signIn('leader');
  const alice = await signIn('alice');
  const bob = await signIn('bob');
  const chris = await signIn('chris');
  assert.equal((await call('/stats')).result.registered_students, initialStats.registered_students + 4);
  const incomplete = (await call('/profile', { cookie: leader })).result;
  assert.equal(incomplete.profile_complete, false);
  assert.deepEqual(incomplete.missing_fields, ['Student ID', 'Phone', 'Skills']);

  const edited = (await call('/profile', {
    cookie: alice, method: 'PUT', body: {
      full_name: 'Alice Updated', student_id: '1024031006', phone: '0123456789', github: 'github.com/alice',
      linkedin: 'https://linkedin.com/in/alice', resume_url: 'https://example.org/resume',
      skills: ['JavaScript', 'javascript', 'SQL'], email: 'changed@example.org',
    },
  })).result;
  assert.equal(edited.github, 'https://github.com/alice');
  assert.deepEqual(edited.skills, ['JavaScript', 'SQL']);
  assert.match(edited.email, /@thapar\.edu$/);
  assert.equal(edited.profile_complete, true);
  const secondSignIn = await signIn('alice');
  assert.deepEqual((await call('/profile', { cookie: secondSignIn })).result, edited);
  await call('/profile', {
    cookie: alice, method: 'PUT', body: { github: 'javascript:alert(1)' }, status: 400,
  });
  await call('/profile', {
    cookie: alice, method: 'PUT', body: { full_name: 'Cross-origin change' },
    headers: { Origin: 'https://example.org' }, status: 403,
  });

  const [event] = await db.execute('INSERT INTO hackathons (name) VALUES (?)', [`Verification ${runId}`]);
  const teamInput = {
    name: `Team ${runId}`, project_title: 'Capacity checks', project_description: 'A full-flow test',
    capacity: 2, hackathon_id: event.insertId, skills: ['SQL'],
  };
  const blockedCreate = await call('/teams', { cookie: leader, method: 'POST', body: teamInput, status: 403 });
  assert.equal(blockedCreate.result.code, 'PROFILE_INCOMPLETE');
  const completeBody = { full_name: 'Complete Student', student_id: '1024031007', phone: '0123456789', skills: ['SQL'] };
  await call('/profile', { cookie: leader, method: 'PUT', body: completeBody });
  const { result: team } = await call('/teams', { cookie: leader, method: 'POST', body: teamInput, status: 201 });
  assert.equal((await call('/stats')).result.active_teams, initialStats.active_teams + 1);
  assert.equal(team.member_count, 1);
  assert.deepEqual(team.skills, ['SQL']);
  assert.deepEqual(team.hackathons.map(hackathon => hackathon.id), [event.insertId]);
  assert.ok((await call('/my-teams', { cookie: leader })).result.some(row => row.id === team.id));
  await call('/teams', { cookie: leader, method: 'POST', body: teamInput, status: 409 });
  assert.ok((await call('/teams', { cookie: alice })).result.some(row => row.id === team.id));
  const teamPath = `/teams/${team.id}`;
  const blockedJoin = await call(`${teamPath}/request`, { cookie: bob, method: 'POST', status: 403 });
  assert.equal(blockedJoin.result.code, 'PROFILE_INCOMPLETE');
  await call('/profile', { cookie: bob, method: 'PUT', body: completeBody });
  await call('/profile', { cookie: chris, method: 'PUT', body: completeBody });
  const join = cookie => call(`${teamPath}/request`, { cookie, method: 'POST', status: 201 });
  const [a, b, c] = await Promise.all([join(alice), join(bob), join(chris)]);
  await call(`${teamPath}/request`, { cookie: alice, method: 'POST', status: 409 });
  const detail = (await call(teamPath, { cookie: leader })).result;
  assert.equal(detail.pending_requests.find(request => request.id === a.result.id).full_name, 'Alice Updated');
  assert.deepEqual(detail.members.map(member => member.full_name), ['Complete Student']);
  assert.equal((await call(teamPath, { cookie: alice })).result.pending_requests, undefined);
  const applicantPath = `/requests/${a.result.id}/profile`;
  assert.deepEqual((await call(applicantPath, { cookie: leader })).result, edited);
  await call(applicantPath, { cookie: bob, status: 403 });
  await call(applicantPath, { status: 401 });
  const review = (cookie, request, decision, status) => call(`/requests/${request.result.id}`, {
    cookie, method: 'PUT', body: { status: decision }, status,
  });
  await review(alice, a, 'accepted', 403);
  await review(leader, c, 'rejected', 200);
  // An applicant who clears required fields cannot be accepted until complete.
  await call('/profile', { cookie: bob, method: 'PUT', body: { skills: [] } });
  await review(leader, b, 'accepted', 403);
  await call('/profile', { cookie: bob, method: 'PUT', body: { skills: ['SQL'] } });
  const decisions = await Promise.all([review(leader, a, 'accepted', null), review(leader, b, 'accepted', null)]);
  assert.deepEqual(decisions.map(decision => decision.response.status).sort(), [200, 409]);
  const aliceWon = decisions[0].response.status === 200;
  const winner = aliceWon ? alice : bob;
  const loser = aliceWon ? bob : alice;
  await review(leader, aliceWon ? a : b, 'accepted', 200);
  const full = (await call(teamPath, { cookie: winner })).result;
  assert.equal(full.status, 'full');
  assert.equal(full.member_count, 2);
  assert.equal(full.members.length, 2);
  assert.equal(full.pending_requests, undefined);
  await call(teamPath, { cookie: loser, status: 404 });
  assert.ok(!(await call('/teams', { cookie: loser })).result.some(row => row.id === team.id));
  assert.equal((await call('/my-teams', { cookie: winner })).result[0].id, team.id);
  assert.equal((await call('/my-teams', { cookie: leader })).result[0].is_leader, true);
  assert.deepEqual((await call('/my-teams', { cookie: loser })).result, []);
  assert.equal((await call('/my-requests', { cookie: winner })).result[0].status, 'accepted');
  assert.equal((await call('/my-requests', { cookie: loser })).result[0].can_view_team, false);
  assert.equal((await call('/my-requests', { cookie: chris })).result[0].status, 'rejected');
  await call(teamPath, { method: 'DELETE', status: 401 });
  await call(teamPath, { cookie: winner, method: 'DELETE', status: 403 });
  await call(teamPath, { cookie: leader, method: 'DELETE', headers: { Origin: 'https://example.org' }, status: 403 });
  await call(teamPath, { cookie: leader, method: 'DELETE', status: 204 });
  await call(teamPath, { cookie: leader, status: 404 });
  assert.deepEqual((await call('/my-teams', { cookie: leader })).result, []);
  assert.deepEqual((await call('/my-teams', { cookie: winner })).result, []);
  assert.deepEqual((await call('/my-requests', { cookie: winner })).result, []);
  assert.equal((await call('/stats')).result.active_teams, initialStats.active_teams);
  assert.equal((await call('/stats')).result.total_teams, initialStats.total_teams);
  await call(applicantPath, { cookie: leader, status: 404 });
  for (const table of ['team_members', 'team_requests', 'team_skills', 'team_hackathons']) {
    const [rows] = await db.query('SELECT team_id FROM ?? WHERE team_id = ?', [table, team.id]);
    assert.deepEqual(rows, [], `${table} rows for the deleted team`);
  }
  await call('/auth/logout', { cookie: leader });
  await call('/auth/me', { cookie: leader, status: 401 });
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /TeamForge/);
  assert.equal((await fetch(`${origin}/backend/.env`)).status, 404);
});
