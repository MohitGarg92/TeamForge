// server.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Middleware ==== //
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5500', // frontend origin (adjust if needed)
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
}));

app.use(passport.initialize());
app.use(passport.session());

// ==== Passport configuration (Google OAuth 2.0) ==== //
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract essential fields
    const email = profile.emails[0].value;
    const fullName = profile.displayName;
    const googleId = profile.id;
    // Upsert student record
    const [rows] = await db.promise().execute(
      `INSERT INTO students (google_id, full_name, email) VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email)`,
      [googleId, fullName, email]
    );
    // Retrieve the student row (including internal id)
    const [studentRows] = await db.promise().execute(
      'SELECT * FROM students WHERE google_id = ?',
      [googleId]
    );
    const student = studentRows[0];
    return done(null, student);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id); // internal DB id
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.promise().execute('SELECT * FROM students WHERE id = ?', [id]);
    const user = rows[0];
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ==== Routes ==== //
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/pages/login.html' }),
  (req, res) => {
    // Successful auth – redirect to dashboard or send JSON
    res.redirect('/pages/dashboard.html');
  }
);

app.get('/api/auth/logout', (req, res) => {
  req.logout(() => {});
  res.json({ message: 'Logged out' });
});

// Current user endpoint (protected)
app.get('/api/auth/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  const { id, full_name, email, student_id, phone } = req.user;
  res.json({ id, full_name, email, student_id, phone });
});

// ----------------------------
// Real API: List all teams (development)
// ----------------------------
app.get('/api/teams', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT t.id, t.name, t.project_title, t.project_description, t.status, t.capacity,
             l.full_name AS leader_name
      FROM teams t
      JOIN students l ON t.leader_id = l.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ----------------------------
// Mock login route (development only) – allows you to create a session without Google OAuth
// ----------------------------
app.post('/api/auth/mock-login', async (req, res) => {
  const { googleId, email, fullName } = req.body;
  if (!googleId || !email) {
    return res.status(400).json({ error: 'googleId and email required' });
  }
  try {
    // Upsert student record
    await db.promise().execute(
      `INSERT INTO students (google_id, full_name, email) VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email)`,
      [googleId, fullName || 'Mock User', email]
    );
    const [rows] = await db.promise().execute('SELECT * FROM students WHERE google_id = ?', [googleId]);
    const user = rows[0];
    req.login(user, err => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      return res.json({ message: 'Mock login successful', user: { id: user.id, full_name: user.full_name, email: user.email } });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/debug/teams', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT t.id, t.name, t.project_title, t.status, t.capacity,
             l.full_name AS leader_name
      FROM teams t
      JOIN students l ON t.leader_id = l.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});
