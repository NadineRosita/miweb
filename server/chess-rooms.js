// Lógica de las salas de ajedrez.
//
// PostgreSQL es la fuente de verdad: cada cambio se guarda, así que un reinicio de
// Railway no pierde partidas. En memoria solo están las salas con alguien conectado.
//
// El servidor reproduce cada partida con chess.js y valida todas las jugadas:
// el navegador solo propone, nunca decide.

const crypto = require('node:crypto');
const { Chess } = require('chess.js');
const { pool } = require('./db');

const CODE_LENGTH = 6;
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Sin 0/O ni 1/I/L, que se confunden
const CODE_ATTEMPTS = 5;
const UNIQUE_VIOLATION = '23505';
const FLAG_MARGIN_MS = 20;

const OPPOSITE = { white: 'black', black: 'white' };
const COLOR_OF_TURN = { w: 'white', b: 'black' };

class RoomError extends Error {}

const rooms = new Map(); // Salas con alguien conectado
const queues = new Map(); // Una cola por sala, para aplicar los cambios de uno en uno

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const createToken = () => crypto.randomBytes(32).toString('base64url');

function createCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
}

// Ejecuta task cuando acaben las tareas anteriores de la misma sala
function enqueue(code, task) {
  const previous = queues.get(code) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  const settled = current.catch(() => {}).then(() => {
    if (queues.get(code) === settled) queues.delete(code);
  });

  queues.set(code, settled);
  return current;
}

function replay(moves) {
  const chess = new Chess();
  moves.forEach((move) => chess.move(move));
  return chess;
}

const turnColor = (room) => COLOR_OF_TURN[room.chess.turn()];

// El reloj corre desde la primera jugada de las blancas
const activeColor = (room) => (room.status === 'playing' && room.moves.length > 0 ? turnColor(room) : null);

function timeLeft(room, color) {
  const stored = room[`${color}Ms`];
  return activeColor(room) === color ? stored - (Date.now() - room.lastMoveAt) : stored;
}

function finish(room, result, reason) {
  room.status = 'finished';
  room.result = result;
  room.reason = reason;
  room.drawOffer = null;
}

// Si se acabó el tiempo, gana el rival
function checkFlag(room) {
  const color = room.hasClock ? activeColor(room) : null;
  if (color && timeLeft(room, color) <= 0) {
    room[`${color}Ms`] = 0;
    finish(room, OPPOSITE[color], 'timeout');
  }
}

function roomFromRow(row) {
  const room = {
    code: row.code,
    whiteHash: row.white_token_hash,
    blackHash: row.black_token_hash,
    moves: row.moves,
    chess: replay(row.moves),
    status: row.status,
    result: row.result,
    reason: row.reason,
    drawOffer: row.draw_offer,
    hasClock: row.clock_initial_ms !== null,
    clockInitialMs: row.clock_initial_ms,
    clockIncrementMs: row.clock_increment_ms,
    whiteMs: row.white_ms,
    blackMs: row.black_ms,
    lastMoveAt: row.last_move_at?.getTime() ?? null,
    sockets: new Set(),
    flagTimer: null,
  };

  return room;
}

async function save(room) {
  await pool.query(
    `UPDATE chess_rooms
     SET white_token_hash = $2, black_token_hash = $3, moves = $4, status = $5, result = $6,
         reason = $7, draw_offer = $8, white_ms = $9, black_ms = $10, last_move_at = $11,
         updated_at = now()
     WHERE code = $1`,
    [
      room.code, room.whiteHash, room.blackHash, JSON.stringify(room.moves), room.status, room.result,
      room.reason, room.drawOffer, room.whiteMs, room.blackMs,
      room.lastMoveAt === null ? null : new Date(room.lastMoveAt),
    ],
  );
}

async function loadRoom(code) {
  const cached = rooms.get(code);
  if (cached) return cached;

  const { rows } = await pool.query('SELECT * FROM chess_rooms WHERE code = $1', [code]);
  if (!rows[0]) throw new RoomError('room_not_found');

  const room = roomFromRow(rows[0]);

  // El tiempo sigue corriendo mientras no hay nadie conectado
  const statusBefore = room.status;
  checkFlag(room);
  if (room.status !== statusBefore) await save(room);

  return room;
}

function publicState(room, color) {
  const opponent = OPPOSITE[color];
  const clock = room.hasClock
    ? {
      white: Math.max(timeLeft(room, 'white'), 0),
      black: Math.max(timeLeft(room, 'black'), 0),
      active: activeColor(room),
      increment: room.clockIncrementMs,
    }
    : null;

  return {
    type: 'state',
    code: room.code,
    color,
    status: room.status,
    result: room.result,
    reason: room.reason,
    moves: room.moves,
    clock,
    opponentConnected: [...room.sockets].some((socket) => socket.color === opponent),
    drawOffer: room.drawOffer && (room.drawOffer === color ? 'you' : 'opponent'),
  };
}

function broadcast(room) {
  room.sockets.forEach((socket) => socket.send(JSON.stringify(publicState(room, socket.color))));
}

function scheduleFlag(room) {
  clearTimeout(room.flagTimer);
  room.flagTimer = null;

  const color = room.hasClock ? activeColor(room) : null;
  if (!color) return;

  room.flagTimer = setTimeout(() => {
    enqueue(room.code, async () => {
      checkFlag(room);
      if (room.status === 'finished') await commit(room);
    }).catch((error) => console.error('Error al cerrar una partida por tiempo:', error));
  }, timeLeft(room, color) + FLAG_MARGIN_MS);
}

async function commit(room) {
  await save(room);
  scheduleFlag(room);
  broadcast(room);
}

function applyMove(room, color, { from, to, promotion }) {
  if (room.status !== 'playing') throw new RoomError('game_not_active');

  checkFlag(room);
  if (room.status !== 'playing') return; // Se acabó el tiempo justo antes de mover
  if (turnColor(room) !== color) throw new RoomError('not_your_turn');

  let played;
  try {
    played = room.chess.move({ from, to, promotion });
  } catch {
    throw new RoomError('invalid_move');
  }

  const isFirstMove = room.moves.length === 0;
  const now = Date.now();

  if (room.hasClock && !isFirstMove) {
    room[`${color}Ms`] += room.clockIncrementMs - (now - room.lastMoveAt);
  }

  room.lastMoveAt = now;
  room.moves.push({ from: played.from, to: played.to, ...(played.promotion && { promotion: played.promotion }) });
  room.drawOffer = null;

  const { chess } = room;
  if (chess.isCheckmate()) finish(room, color, 'checkmate');
  else if (chess.isStalemate()) finish(room, 'draw', 'stalemate');
  else if (chess.isInsufficientMaterial()) finish(room, 'draw', 'insufficient');
  else if (chess.isThreefoldRepetition()) finish(room, 'draw', 'repetition');
  else if (chess.isDrawByFiftyMoves()) finish(room, 'draw', 'fifty');
}

// ---------- Acciones de los jugadores ----------

async function createRoom({ color, clock }) {
  const token = createToken();
  const hash = hashToken(token);
  const initial = clock ? clock.minutes * 60 * 1000 : null;
  const increment = clock ? clock.increment * 1000 : null;
  const playerColor = color === 'random' ? (crypto.randomInt(2) ? 'white' : 'black') : color;

  await pool.query("DELETE FROM chess_rooms WHERE updated_at < now() - interval '30 days'");

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = createCode();

    try {
      await pool.query(
        `INSERT INTO chess_rooms
           (code, white_token_hash, black_token_hash, clock_initial_ms, clock_increment_ms, white_ms, black_ms)
         VALUES ($1, $2, $3, $4, $5, $4, $4)`,
        [code, playerColor === 'white' ? hash : null, playerColor === 'black' ? hash : null, initial, increment],
      );
      return { code, token, color: playerColor };
    } catch (error) {
      if (error.code !== UNIQUE_VIOLATION) throw error;
    }
  }

  throw new Error('No se pudo generar un código de sala libre');
}

function joinRoom(code) {
  return enqueue(code, async () => {
    const room = await loadRoom(code);
    if (room.status !== 'waiting') throw new RoomError(room.status === 'finished' ? 'game_not_active' : 'room_full');

    const token = createToken();
    const color = room.whiteHash ? 'black' : 'white';

    room[`${color}Hash`] = hashToken(token);
    room.status = 'playing';
    await commit(room);

    return { code, token, color };
  });
}

// Conecta un socket a su sala si el token es válido
function connect(socket, { code, token }) {
  return enqueue(code, async () => {
    const room = await loadRoom(code);
    const hash = hashToken(token);
    const color = ['white', 'black'].find((candidate) => room[`${candidate}Hash`] === hash);

    if (!color) throw new RoomError('room_forbidden');

    Object.assign(socket, { roomCode: code, color });
    room.sockets.add(socket);
    rooms.set(code, room);
    scheduleFlag(room);
    broadcast(room);
  });
}

function disconnect(socket) {
  const { roomCode: code } = socket;
  if (!code) return Promise.resolve();

  return enqueue(code, async () => {
    const room = rooms.get(code);
    if (!room) return;

    room.sockets.delete(socket);

    if (room.sockets.size === 0) {
      // Sale de memoria: al volver alguien, se lee de la base de datos
      clearTimeout(room.flagTimer);
      rooms.delete(code);
    } else {
      broadcast(room);
    }
  });
}

// Aplica una acción de un jugador. Si no se puede guardar, se descarta la copia
// en memoria para no quedar distinta de la base de datos.
function act(socket, action) {
  const { roomCode: code, color } = socket;

  return enqueue(code, async () => {
    const room = rooms.get(code);
    if (!room) throw new RoomError('room_not_found');

    action(room, color);

    try {
      await commit(room);
    } catch (error) {
      room.sockets.forEach((client) => client.close());
      rooms.delete(code);
      throw error;
    }
  });
}

const move = (socket, proposal) => act(socket, (room, color) => applyMove(room, color, proposal));

const resign = (socket) => act(socket, (room, color) => {
  if (room.status !== 'playing') throw new RoomError('game_not_active');
  finish(room, OPPOSITE[color], 'resign');
});

// Ofrece tablas, o las acepta si el rival ya las ofreció
const offerDraw = (socket) => act(socket, (room, color) => {
  if (room.status !== 'playing') throw new RoomError('game_not_active');

  if (room.drawOffer === OPPOSITE[color]) finish(room, 'draw', 'agreement');
  else room.drawOffer = color;
});

const declineDraw = (socket) => act(socket, (room, color) => {
  if (room.drawOffer === OPPOSITE[color]) room.drawOffer = null;
});

// Tras un error, reenvía el estado real para deshacer lo que el navegador adelantó
function resend(socket) {
  const room = rooms.get(socket.roomCode);
  if (room) socket.send(JSON.stringify(publicState(room, socket.color)));
}

module.exports = {
  RoomError, createRoom, joinRoom, connect, disconnect, move, resign, offerDraw, declineDraw, resend,
};
