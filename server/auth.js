// Registro, inicio de sesión y sesiones de usuario.
//
// Las rutas son POST /register, POST /login, POST /logout y GET /me (bajo /api/auth).
// La sesión viaja en una cookie httpOnly: el JavaScript de la página no puede leerla.

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { pool } = require('./db');

const COOKIE_NAME = 'sid';
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignora lo que pase de este límite
const UNIQUE_VIOLATION = '23505';

// Se compara contra este hash si el usuario no existe, para que la respuesta
// tarde lo mismo y no delate qué nombres de usuario están registrados
const DUMMY_HASH = bcrypt.hashSync('contraseña-inexistente', BCRYPT_COST);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');

  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), userId, SESSION_DAYS],
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_MS,
  });
}

async function findUser(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;

  const { rows } = await pool.query(
    `SELECT users.id, users.username
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
    [hashToken(token)],
  );

  return rows[0] ?? null;
}

// Protege una ruta: deja el usuario en req.user o responde 401
async function requireUser(req, res, next) {
  req.user = await findUser(req);
  if (!req.user) {
    res.status(401).json({ error: 'Tienes que iniciar sesión.' });
    return;
  }
  next();
}

function readCredentials(body) {
  const { username, password } = body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  return { username: username.trim().toLowerCase(), password };
}

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Prueba de nuevo en unos minutos.' },
});

const router = express.Router();

router.post('/register', credentialsLimiter, async (req, res) => {
  const credentials = readCredentials(req.body);

  if (!credentials || !USERNAME_PATTERN.test(credentials.username)) {
    res.status(400).json({ error: 'El usuario debe tener de 3 a 24 letras, números o guiones bajos.' });
    return;
  }

  const { username, password } = credentials;
  if (password.length < PASSWORD_MIN_LENGTH || Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    res.status(400).json({ error: `La contraseña debe tener de ${PASSWORD_MIN_LENGTH} a ${PASSWORD_MAX_BYTES} caracteres.` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const client = await pool.connect();
  let userId;

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash],
    );
    userId = rows[0].id;
    await client.query('INSERT INTO pets (user_id) VALUES ($1)', [userId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === UNIQUE_VIOLATION) {
      res.status(409).json({ error: 'Ese nombre de usuario ya existe.' });
      return;
    }
    throw error;
  } finally {
    client.release();
  }

  await startSession(req, res, userId);
  res.status(201).json({ username });
});

router.post('/login', credentialsLimiter, async (req, res) => {
  const credentials = readCredentials(req.body);

  if (!credentials) {
    res.status(400).json({ error: 'Escribe tu usuario y tu contraseña.' });
    return;
  }

  const { rows } = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [credentials.username],
  );
  const user = rows[0];
  const passwordMatches = await bcrypt.compare(credentials.password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    return;
  }

  await pool.query('DELETE FROM sessions WHERE expires_at <= now()');
  await startSession(req, res, user.id);
  res.json({ username: user.username });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);

  res.clearCookie(COOKIE_NAME);
  res.status(204).end();
});

router.get('/me', requireUser, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = { router, requireUser };
