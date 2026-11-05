// Estado de la mascota (bajo /api/pet). Todas las rutas requieren sesión.
//
// Las reglas viven en el servidor: el navegador pide una acción y no puede
// fijar las estadísticas a su antojo. Para ampliar el juego, añade acciones aquí.

const express = require('express');
const { requireUser } = require('./auth');
const { pool } = require('./db');

const PET_COLUMNS = 'name, food, happiness, energy, updated_at';
const NAME_MAX_LENGTH = 24;

// Lo que suma o resta cada acción a cada estadística
const ACTIONS = {
  feed: { food: 20, happiness: 5, energy: -5 },
  play: { food: -10, happiness: 20, energy: -15 },
  sleep: { food: -5, happiness: 0, energy: 30 },
};

const router = express.Router();

router.use(requireUser);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${PET_COLUMNS} FROM pets WHERE user_id = $1`, [req.user.id]);
  res.json(rows[0]);
});

router.patch('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name || name.length > NAME_MAX_LENGTH) {
    res.status(400).json({ error: `El nombre debe tener de 1 a ${NAME_MAX_LENGTH} caracteres.` });
    return;
  }

  const { rows } = await pool.query(
    `UPDATE pets SET name = $2, updated_at = now() WHERE user_id = $1 RETURNING ${PET_COLUMNS}`,
    [req.user.id, name],
  );
  res.json(rows[0]);
});

router.post('/actions/:action', async (req, res) => {
  if (!Object.hasOwn(ACTIONS, req.params.action)) {
    res.status(400).json({ error: 'Esa acción no existe.' });
    return;
  }

  const { food, happiness, energy } = ACTIONS[req.params.action];
  const { rows } = await pool.query(
    `UPDATE pets
     SET food = LEAST(100, GREATEST(0, food + $2)),
         happiness = LEAST(100, GREATEST(0, happiness + $3)),
         energy = LEAST(100, GREATEST(0, energy + $4)),
         updated_at = now()
     WHERE user_id = $1
     RETURNING ${PET_COLUMNS}`,
    [req.user.id, food, happiness, energy],
  );
  res.json(rows[0]);
});

module.exports = { router };
