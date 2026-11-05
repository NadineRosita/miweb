// API de Mi Pet (bajo /api/pet). El juego vive en server/mi-pet/.
//
// GET  /catalog   datos del juego; es público y no cambia entre usuarios
// GET  /widget    resumen para el widget de las demás páginas
// GET  /state     partida actual, con el tiempo transcurrido ya aplicado
// GET  /journal   igual, añadiendo diario y álbum
// POST /action    { type, ...datos }: ver ACTIONS en server/mi-pet/actions.js
//
// Cada petición lee la partida dentro de una transacción con la fila bloqueada: dos pestañas
// a la vez no pueden gastar dos veces las mismas monedas.

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { applyAction } = require('./mi-pet/actions');
const { clientCatalog } = require('./mi-pet/catalog');
const { GameError } = require('./mi-pet/progress');
const { createSave, loadSave, SaveError } = require('./mi-pet/save');
const { tick } = require('./mi-pet/sim');
const { view, widgetView } = require('./mi-pet/view');
const { findUser, requireUser } = require('./auth');
const { pool } = require('./db');

const router = express.Router();

const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

// Cuentas anteriores al juego: se conserva lo que tuviera su mascota.
// Una fila con los valores iniciales de la tabla no es una mascota antigua: auth.js la crea
// en cada registro, y heredarla taparía las estadísticas propias de cada especie.
async function createFromLegacy(client, userId, now) {
  const { rows } = await client.query('SELECT name, food, happiness, energy FROM pets WHERE user_id = $1', [userId]);
  const old = rows[0];
  const untouched = !old || (old.name === 'Mi Pet' && old.food === 50 && old.happiness === 50 && old.energy === 50);

  return createSave(now, untouched ? null : old);
}

// Abre la partida, aplica el tiempo, ejecuta fn y la guarda. Si fn lanza, no se guarda nada.
async function withSave(userId, fn) {
  const client = await pool.connect();
  const now = Date.now();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT data, backup FROM pet_saves WHERE user_id = $1 FOR UPDATE', [userId]);
    const row = rows[0];
    const save = row ? loadSave(row.data, row.backup, now) : await createFromLegacy(client, userId, now);
    const context = { now, rng: Math.random, fx: [] };

    tick(save, now, context.rng, context.fx);
    const result = fn(save, context);

    await client.query(
      `INSERT INTO pet_saves (user_id, version, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET version = EXCLUDED.version, data = EXCLUDED.data, backup = pet_saves.data, updated_at = now()`,
      [userId, save.version, save],
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function sendGameError(error, res) {
  if (error instanceof GameError) {
    res.status(400).json({ error: error.code });
    return true;
  }
  if (error instanceof SaveError) {
    console.error(error.message);
    res.status(503).json({ error: 'save_unavailable' });
    return true;
  }
  return false;
}

const validTz = (value) => Number.isInteger(value) && Math.abs(value) <= 840;

// Las cabeceras del navegador indican su zona horaria para fijar los días y la noche
function readTz(req, save) {
  const tz = Number(req.get('X-Pet-Tz'));
  if (req.get('X-Pet-Tz') !== undefined && validTz(tz)) save.tz = tz;
}

router.get('/catalog', (req, res) => {
  res.set('Cache-Control', 'no-cache'); // Se revalida con ETag
  res.json(clientCatalog);
});

// Consulta de solo lectura para el widget: simula el tiempo sobre una copia y no guarda,
// para no gastar avisos como el de «te he echado de menos» antes de que el jugador los vea.
// Siempre responde 200: no tener sesión no es un error, solo que no hay widget.
router.get('/widget', async (req, res) => {
  const user = await findUser(req);

  if (!user) {
    res.json({ active: false });
    return;
  }

  const { rows } = await pool.query('SELECT data, backup FROM pet_saves WHERE user_id = $1', [user.id]);

  if (!rows[0]) {
    res.json({ active: false });
    return;
  }

  try {
    const now = Date.now();
    const save = loadSave(rows[0].data, rows[0].backup, now);

    tick(save, now, Math.random);
    res.json(widgetView(save, now));
  } catch (error) {
    if (!sendGameError(error, res)) throw error;
  }
});

router.use(requireUser);

router.get('/state', async (req, res) => {
  try {
    res.json(await withSave(req.user.id, (save, { now, fx }) => {
      readTz(req, save);
      return { state: view(save, now), fx };
    }));
  } catch (error) {
    if (!sendGameError(error, res)) throw error;
  }
});

router.get('/journal', async (req, res) => {
  try {
    res.json(await withSave(req.user.id, (save, { now, fx }) => ({ state: view(save, now, { journal: true }), fx })));
  } catch (error) {
    if (!sendGameError(error, res)) throw error;
  }
});

router.post('/action', actionLimiter, async (req, res) => {
  const { type, ...payload } = req.body ?? {};

  if (typeof type !== 'string') {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  try {
    res.json(await withSave(req.user.id, (save, context) => {
      readTz(req, save);
      applyAction(save, type, payload, context);
      return { state: view(save, context.now), fx: context.fx };
    }));
  } catch (error) {
    if (!sendGameError(error, res)) throw error;
  }
});

module.exports = { router };
