// Acceso a las salas de Ciudadelas: API para crearlas y unirse, y WebSocket para jugar.
//
// REST (bajo /api/ciudadelas):
//   POST /rooms               Crea una sala. Cuerpo: { name, maxPlayers, bots, cityLimit, tutorial }
//   POST /rooms/:code/join    Se une a una sala. Cuerpo: { name }
//
// WebSocket (/ws/ciudadelas). El primer mensaje identifica al jugador:
//   { type: 'hello', code, token }
// Después: { type: 'play', action }, y las del anfitrión en la sala de espera:
//   addBot, removeBot, setMax, setLimit, start y rematch.
// El servidor responde con { type: 'state', room, game } o { type: 'error', code }.

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const rooms = require('./ciudadelas/rooms');
const { registerSocketServer } = require('./sockets');

const SOCKET_PATH = '/ws/ciudadelas';
const MAX_MESSAGE_BYTES = 2048;
const HEARTBEAT_MS = 30000;
const CODE_PATTERN = /^[2-9A-HJKMNP-Z]{6}$/;
const TUTORIAL = { maxPlayers: 4, bots: 3, cityLimit: 8 };

const roomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

function readOptions(body) {
  const { name, tutorial = false } = body ?? {};

  if (tutorial === true) return { name, tutorial: true, ...TUTORIAL };

  const { maxPlayers = 4, bots = 0, cityLimit = 8 } = body ?? {};
  const isValid = Number.isInteger(maxPlayers) && maxPlayers >= rooms.MIN_PLAYERS && maxPlayers <= rooms.MAX_PLAYERS
    && Number.isInteger(bots) && bots >= 0 && bots < maxPlayers
    && rooms.CITY_LIMITS.includes(cityLimit);

  return isValid ? {
    name, tutorial: false, maxPlayers, bots, cityLimit,
  } : null;
}

function respondWithError(res, error) {
  if (!(error instanceof rooms.RoomError)) throw error;
  res.status(error.message === 'room_not_found' ? 404 : 409).json({ error: error.message });
}

const router = express.Router();

router.post('/rooms', roomLimiter, (req, res) => {
  const options = readOptions(req.body);

  if (!options) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  res.status(201).json(rooms.createRoom(options));
});

router.post('/rooms/:code/join', roomLimiter, (req, res) => {
  const code = req.params.code.toUpperCase();

  if (!CODE_PATTERN.test(code)) {
    res.status(404).json({ error: 'room_not_found' });
    return;
  }

  try {
    res.json(rooms.joinRoom(code, req.body?.name));
  } catch (error) {
    respondWithError(res, error);
  }
});

// ---------- WebSocket ----------

const isValidHello = ({ code, token }) => typeof code === 'string' && CODE_PATTERN.test(code) && typeof token === 'string';

function sendError(socket, code) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'error', code }));
}

function handleConnection(socket) {
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('error', () => socket.terminate());
  socket.on('close', () => rooms.disconnect(socket));

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (!socket.roomCode) {
        if (message.type !== 'hello' || !isValidHello(message)) throw new rooms.RoomError('room_forbidden');
        rooms.connect(socket, message);
        return;
      }
      rooms.handle(socket, message);
    } catch (error) {
      if (error instanceof rooms.RoomError) {
        sendError(socket, error.message);
      } else if (error instanceof SyntaxError) {
        sendError(socket, 'invalid_request');
      } else {
        console.error('Error en una sala de Ciudadelas:', error);
        sendError(socket, 'server_error');
      }

      if (socket.roomCode) rooms.resend(socket);
    }
  });
}

function attachCiudadelasSockets(server) {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });

  registerSocketServer(server, SOCKET_PATH, sockets);
  sockets.on('connection', handleConnection);

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

module.exports = { attachCiudadelasSockets, router };
