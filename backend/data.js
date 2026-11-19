const db = require('./db').promise();

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function transaction(work) {
  for (let attempt = 0; ; attempt++) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if (error.code !== 'ER_LOCK_DEADLOCK' || attempt >= 2) throw error;
    } finally {
      connection.release();
    }
  }
}

function id(value) {
  const number = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isInteger(number) || number < 1 || number > 2147483647) {
    throw new RequestError(400, 'Invalid ID.');
  }
  return number;
}

function field(value, label, max, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    throw new RequestError(400, `${label} ${required ? 'is required and ' : ''}must be at most ${max} characters.`);
  }
  return value.trim() || null;
}

function link(value, label) {
  const text = field(value, label, 255);
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || url.href.length > 255) {
      throw new Error('Invalid URL');
    }
    return url.href;
  } catch {
    throw new RequestError(400, `${label} must be a valid web URL.`);
  }
}

function skills(value, required = false) {
  if (!Array.isArray(value) || value.length > 30 || (required && !value.length)) {
    throw new RequestError(400, required ? 'Provide between 1 and 30 skills.' : 'Provide a list of up to 30 skills.');
  }
  const names = new Map();
  for (const entry of value) {
    const name = field(entry, 'Each skill', 100, true);
    const key = name.normalize('NFKC').toLowerCase();
    if (!names.has(key)) names.set(key, name);
  }
  return [...names.keys()].sort().map(key => names.get(key));
}

async function writeSkills(connection, owner, ownerId, names) {
  const table = owner === 'student' ? 'student_skills' : 'team_skills';
  const column = owner === 'student' ? 'student_id' : 'team_id';
  await connection.execute(`DELETE FROM ${table} WHERE ${column} = ?`, [ownerId]);
  const skillIds = new Set();
  for (const name of names) {
    const [result] = await connection.execute(
      'INSERT INTO skills (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)', [name]);
    skillIds.add(result.insertId);
  }
  if (skillIds.size) {
    await connection.query(`INSERT INTO ${table} (${column}, skill_id) VALUES ?`,
      [[...skillIds].map(skillId => [ownerId, skillId])]);
  }
}

module.exports = { db, RequestError, transaction, id, field, link, skills, writeSkills };
