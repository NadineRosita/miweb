// Punto de entrada: sirve la web de public/ y la API de Mi Pet.
//
// Los errores de la API llevan un código, no una frase: el navegador muestra
// el texto en el idioma elegido (ver error.* en public/js/i18n.js).

const path = require('node:path');
const cookieParser = require('cookie-parser');
const express = require('express');
const { runMigrations } = require('../db/migrate');
const { router: authRouter } = require('./auth');
const { attachChessSockets, router: chessRouter } = require('./chess');
const { pool } = require('./db');
const { router: petRouter } = require('./pet');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// Mismas reglas de ajedrez en el navegador y en el servidor
const CHESS_LIBRARY = path.join(path.dirname(require.resolve('chess.js/package.json')), 'dist/esm/chess.js');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Railway va por delante: da la IP real y detecta HTTPS

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: Boolean(pool) });
});

app.use('/api', (req, res, next) => {
  if (pool) {
    next();
    return;
  }
  res.status(503).json({ error: 'database_unavailable' });
});

app.use('/api', express.json({ limit: '10kb' }), cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/pet', petRouter);
app.use('/api/chess', chessRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.get('/vendor/chess.js', (req, res) => res.sendFile(CHESS_LIBRARY));

// extensions permite abrir /juegos además de /juegos.html
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// Express identifica este middleware de errores por sus cuatro parámetros
app.use((error, req, res, next) => {
  if (error.status && error.status < 500) {
    res.status(error.status).json({ error: 'invalid_request' });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'server_error' });
});

async function start() {
  if (pool) {
    await runMigrations(pool);
  } else {
    console.warn('Sin DATABASE_URL: la web funciona, pero Mi Pet queda desactivado.');
  }

  const server = app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

  attachChessSockets(server);
}

start().catch((error) => {
  console.error('No se pudo arrancar:', error.message);
  process.exit(1);
});
