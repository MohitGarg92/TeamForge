const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const { RequestError } = require('./data');
const mountProfileRoutes = require('./profile');
const mountTeamRoutes = require('./teams');

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in backend/.env');
}
const FRONTEND_URL = process.env.FRONTEND_URL ? new URL(process.env.FRONTEND_URL).origin : '';
const production = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Middleware ==== //
if (FRONTEND_URL) app.use('/api', cors({ origin: FRONTEND_URL, credentials: true }));
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use('/api', express.json());

app.use('/api', session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: production, sameSite: 'lax' },
}));

app.use('/api', passport.initialize());
app.use('/api', passport.session());

// ==== Passport configuration (Google OAuth 2.0) ==== //
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  state: true,
  proxy: process.env.TRUST_PROXY === '1',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const emailObj = profile.emails && profile.emails[0];
    const email = emailObj && emailObj.value.toLowerCase();

    // Only verified @thapar.edu accounts may sign in
    if (!email || emailObj.verified !== true || !email.endsWith('@thapar.edu')) {
      return done(null, false);
    }

    await db.promise().execute(
      `INSERT INTO students (google_id, full_name, email) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = ?`,
      [profile.id, profile.displayName || email, email, email]
    );
    const [rows] = await db.promise().execute(
      'SELECT * FROM students WHERE google_id = ?', [profile.id]);
    return done(null, rows[0]);
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
app.get('/api/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    hd: 'thapar.edu',
    prompt: 'select_account',
  }));

app.get('/api/auth/google/callback',
  (req, res, next) => passport.authenticate('google', (error, user) => {
    if (error) {
      console.error('Google sign-in failed:', error.code || error.name);
      return res.redirect(`${FRONTEND_URL}/pages/login.html?error=sign_in_failed`);
    }
    if (!user) return res.redirect(`${FRONTEND_URL}/pages/login.html?error=not_allowed`);
    req.logIn(user, err => err ? next(err) : next());
  })(req, res, next),
  (req, res) => res.redirect(`${FRONTEND_URL}/pages/dashboard.html`));

app.get('/api/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
});
// Current user endpoint (protected)
app.get('/api/auth/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  const { id, full_name, email, student_id, phone } = req.user;
  res.json({ id, full_name, email, student_id, phone });
});

const router = express.Router();
router.get('/stats', (req, res, next) => {
  db.promise().execute(`
    SELECT (SELECT COUNT(*) FROM students) AS registered_students,
           (SELECT COUNT(*) FROM teams WHERE status IN ('open', 'full')) AS active_teams,
           (SELECT COUNT(*) FROM teams) AS total_teams,
           (SELECT COUNT(*) FROM hackathons) AS hackathons
  `).then(([[stats]]) => {
    res.set('Cache-Control', 'no-store');
    res.json(Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, Number(value)])));
  }).catch(next);
});
const route = handler => (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthenticated' });
  const origin = req.get('origin');
  if (req.method !== 'GET' && req.method !== 'HEAD' && origin &&
      origin !== FRONTEND_URL && origin !== `${req.protocol}://${req.get('host')}`) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  return Promise.resolve(handler(req, res)).catch(next);
};
mountProfileRoutes(router, route);
mountTeamRoutes(router, route);
app.use('/api', router);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.use('/api', (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof RequestError) return res.status(error.status).json({ error: error.message, code: error.code });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This record already exists.' });
  console.error('API request failed:', req.method, req.path, error.code || error.name);
  res.status(500).json({ error: 'The server could not complete this request.' });
});

const frontend = path.resolve(__dirname, '..');
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(frontend, 'index.html')));
for (const directory of ['pages', 'css', 'js']) {
  app.use(`/${directory}`, express.static(path.join(frontend, directory)));
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`TeamForge listening on http://localhost:${PORT}`));
}
module.exports = app;
