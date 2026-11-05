// Acceso a las salas de ajedrez: API para crearlas y unirse, y WebSocket para jugar.
//
// REST (bajo /api/chess):
//   POST /rooms                Crea una sala. Cuerpo: { color, clock: { minutes, increment } | null }
//   POST /rooms/:code/join     Se une a una sala
//
// WebSocket (/ws/ajedrez). El primer mensaje identifica al jugador:
//   { type: 'hello', code, token }
// Después: { type: 'move', from, to, promotion }, { type: 'resign' },
//          { type: 'draw' } y { type: 'decline' }.
// El servidor responde con { type: 'state', ... } o { type: 'error', code }.

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const rooms = require('./chess-rooms');
const { pool } = require('./db');

const SOCKET_PATH = '/ws/ajedrez';
const MAX_MESSAGE_BYTES = 1024;
const HEARTBEAT_MS = 30000;
const MAX_CLOCK_MINUTES = 180;
const MAX_INCREMENT_SECONDS = 60;
const CODE_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;
const COLORS = ['white', 'black', 'random'];

const roomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

function readClock(clock) {
  if (clock === null || clock === undefined) return null;

  const { minutes, increment } = clock;
  const isValid = Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_CLOCK_MINUTES
    && Number.isInteger(increment) && increment >= 0 && increment <= MAX_INCREMENT_SECONDS;

  return isValid ? { minutes, increment } : undefined;
}

function respondWithError(res, error) {
  if (!(error instanceof rooms.RoomError)) throw error;
  res.status(error.message === 'room_not_found' ? 404 : 409).json({ error: error.message });
}

const router = express.Router();

router.post('/rooms', roomLimiter, async (req, res) => {
  const { color = 'random', clock: rawClock } = req.body ?? {};
  const clock = readClock(rawClock);

  if (!COLORS.includes(color) || clock === undefined) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  res.status(201).json(await rooms.createRoom({ color, clock }));
});

router.post('/rooms/:code/join', roomLimiter, async (req, res) => {
  const code = req.params.code.toUpperCase();

  if (!CODE_PATTERN.test(code)) {
    res.status(404).json({ error: 'room_not_found' });
    return;
  }

  try {
    res.json(await rooms.joinRoom(code));
  } catch (error) {
    respondWithError(res, error);
  }
});

// ---------- WebSocket ----------

const ACTIONS = {
  move: (socket, { from, to, promotion }) => rooms.move(socket, { from, to, promotion }),
  resign: (socket) => rooms.resign(socket),
  draw: (socket) => rooms.offerDraw(socket),
  decline: (socket) => rooms.declineDraw(socket),
};

const isValidHello = ({ code, token }) => typeof code === 'string' && CODE_PATTERN.test(code) && typeof token === 'string';

async function handleMessage(socket, message) {
  if (!socket.roomCode) {
    if (message.type !== 'hello' || !isValidHello(message)) throw new rooms.RoomError('room_forbidden');
    await rooms.connect(socket, message);
    return;
  }

  if (!Object.hasOwn(ACTIONS, message.type)) throw new rooms.RoomError('invalid_request');
  await ACTIONS[message.type](socket, message);
}

function sendError(socket, code) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'error', code }));
}

function handleConnection(socket) {
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('error', () => socket.terminate());
  socket.on('close', () => {
    rooms.disconnect(socket).catch((error) => console.error('Error al cerrar un socket:', error));
  });

  socket.on('message', async (data) => {
    try {
      await handleMessage(socket, JSON.parse(data));
    } catch (error) {
      if (error instanceof rooms.RoomError) {
        sendError(socket, error.message);
      } else if (error instanceof SyntaxError) {
        sendError(socket, 'invalid_request');
      } else {
        console.error('Error en una sala de ajedrez:', error);
        sendError(socket, 'server_error');
      }

      if (socket.roomCode) rooms.resend(socket);
    }
  });
}

function attachChessSockets(server) {
  if (!pool) return;

  const sockets = new WebSocketServer({ server, path: SOCKET_PATH, maxPayload: MAX_MESSAGE_BYTES });

  sockets.on('connection', handleConnection);

  // Detecta conexiones perdidas y mantiene viva la conexión a través del proxy
  const heartbeat = setInterval(() => {
    sockets.clients.forEach((socket) => {
      if (!socket.isAlive) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, HEARTBEAT_MS);

  heartbeat.unref();
}

module.exports = { router, attachChessSockets };
