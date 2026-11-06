// Salas de Ciudadelas.
//
// Viven en memoria: si el servidor se reinicia, las partidas en curso se pierden.
// El servidor es quien decide: el navegador solo propone acciones (ver game.js).

const crypto = require('node:crypto');
const { runBot } = require('./bots');
const {
  GameError, MAX_PLAYERS, MIN_PLAYERS, applyAction, awaiting, createGame, viewFor,
} = require('./game');

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Sin 0/O ni 1/I/L, que se confunden
const CODE_LENGTH = 6;
const NAME_LIMIT = 16;
const BOT_NAMES = ['Ada', 'Bruno', 'Clara', 'Dante', 'Elena', 'Fausto', 'Gala'];
const BOT_DELAY_MS = [700, 1300];
const TUTORIAL_BOT_DELAY_MS = [1100, 1700];
const IDLE_ROOM_MS = 3 * 60 * 60 * 1000;
const CITY_LIMITS = [6, 7, 8];

class RoomError extends Error {}

const rooms = new Map();

const fail = (code) => {
  throw new RoomError(code);
};

const createToken = () => crypto.randomBytes(24).toString('base64url');

function createCode() {
  for (;;) {
    const code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

    if (!rooms.has(code)) return code;
  }
}

function cleanName(raw, fallback) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_LIMIT);

  return name || fallback;
}

// Evita dos jugadores con el mismo nombre
function uniqueName(room, wanted) {
  const taken = new Set(room.members.map((member) => member.name.toLowerCase()));
  let name = wanted;
  let suffix = 2;

  while (taken.has(name.toLowerCase())) {
    name = `${wanted.slice(0, NAME_LIMIT - 3)} ${suffix}`;
    suffix += 1;
  }
  return name;
}

function addMember(room, { name, bot }) {
  const member = {
    name: uniqueName(room, name), bot, token: bot ? null : createToken(), sockets: new Set(),
  };

  room.members.push(member);
  return member;
}

function addBot(room) {
  const used = new Set(room.members.map((member) => member.name));
  const name = BOT_NAMES.find((candidate) => !used.has(candidate)) ?? `Bot ${room.members.length + 1}`;

  return addMember(room, { name, bot: true });
}

// ---------- Vistas ----------

function roomInfo(room, seat) {
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    cityLimit: room.cityLimit,
    tutorial: room.tutorial,
    host: 0,
    seat,
    members: room.members.map((member) => ({
      name: member.name, bot: member.bot, connected: member.bot || member.sockets.size > 0,
    })),
  };
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(room) {
  room.members.forEach((member, seat) => {
    member.sockets.forEach((socket) => {
      send(socket, {
        type: 'state',
        room: roomInfo(room, seat),
        game: room.game ? viewFor(room.game, seat) : null,
      });
    });
  });
}

// ---------- Bots ----------

function scheduleBot(room) {
  if (room.timer || room.status !== 'playing' || !room.game) return;

  const seat = awaiting(room.game);

  if (seat < 0 || !room.members[seat].bot) return;

  const [min, max] = room.tutorial ? TUTORIAL_BOT_DELAY_MS : BOT_DELAY_MS;
  const delay = min + Math.random() * (max - min);

  room.timer = setTimeout(() => {
    room.timer = null;
    if (room.status !== 'playing' || !room.game) return;

    const current = awaiting(room.game);

    if (current >= 0 && room.members[current].bot) {
      try {
        runBot(room.game, current, applyAction);
      } catch (error) {
        console.error('Error de un bot de Ciudadelas:', error);
        return;
      }
      afterChange(room);
    }
  }, delay);
  room.timer.unref?.();
}

function afterChange(room) {
  room.touchedAt = Date.now();
  if (room.game.phase === 'over') room.status = 'over';
  broadcast(room);
  scheduleBot(room);
}

// ---------- Salas ----------

function startGame(room) {
  if (room.members.length < MIN_PLAYERS) fail('not_enough_players');

  room.game = createGame({
    players: room.members.map((member) => ({ name: member.name, bot: member.bot })),
    cityLimit: room.cityLimit,
  });
  room.status = 'playing';
}

function createRoom({
  name, maxPlayers, bots, cityLimit, tutorial,
}) {
  const room = {
    code: createCode(),
    status: 'lobby',
    maxPlayers,
    cityLimit,
    tutorial,
    members: [],
    game: null,
    timer: null,
    touchedAt: Date.now(),
  };
  const host = addMember(room, { name: cleanName(name, 'Jugador 1'), bot: false });

  for (let i = 0; i < bots; i += 1) addBot(room);
  rooms.set(room.code, room);

  if (tutorial) startGame(room);

  return { code: room.code, token: host.token, seat: 0 };
}

function joinRoom(code, rawName) {
  const room = rooms.get(code);

  if (!room) fail('room_not_found');
  if (room.status !== 'lobby') fail('game_started');
  if (room.members.length >= room.maxPlayers) fail('room_full');

  const member = addMember(room, { name: cleanName(rawName, `Jugador ${room.members.length + 1}`), bot: false });

  room.touchedAt = Date.now();
  broadcast(room);
  return { code, token: member.token, seat: room.members.length - 1 };
}

// ---------- Mensajes del WebSocket ----------

function connect(socket, { code, token }) {
  const room = rooms.get(code);
  const seat = room ? room.members.findIndex((member) => member.token && member.token === token) : -1;

  if (!room || seat < 0) fail('room_forbidden');

  socket.roomCode = code;
  socket.seat = seat;
  room.members[seat].sockets.add(socket);
  broadcast(room);
  scheduleBot(room);
}

function disconnect(socket) {
  const room = rooms.get(socket.roomCode);

  if (!room) return;

  room.members[socket.seat].sockets.delete(socket);
  broadcast(room);
}

const isHost = (socket) => socket.seat === 0;

const LOBBY_ACTIONS = {
  addBot(room) {
    if (room.members.length >= room.maxPlayers) fail('room_full');
    addBot(room);
  },

  removeBot(room, message) {
    const member = room.members[message.seat];

    if (!member?.bot) fail('invalid_request');
    room.members.splice(message.seat, 1);
    // Los de detrás suben un puesto: sus conexiones tienen que saberlo
    room.members.forEach((item, seat) => item.sockets.forEach((socket) => { socket.seat = seat; }));
  },

  setMax(room, message) {
    const value = message.value;

    if (!Number.isInteger(value) || value < Math.max(MIN_PLAYERS, room.members.length) || value > MAX_PLAYERS) {
      fail('invalid_request');
    }
    room.maxPlayers = value;
  },

  setLimit(room, message) {
    if (!CITY_LIMITS.includes(message.value)) fail('invalid_request');
    room.cityLimit = message.value;
  },

  start(room) {
    startGame(room);
  },
};

function handle(socket, message) {
  const room = rooms.get(socket.roomCode);

  if (!room) fail('room_forbidden');

  if (message.type === 'play') {
    if (room.status !== 'playing') fail('game_not_active');

    try {
      applyAction(room.game, socket.seat, message.action ?? {});
    } catch (error) {
      if (error instanceof GameError) fail(error.message);
      throw error;
    }
    afterChange(room);
    return;
  }

  if (message.type === 'rematch') {
    if (!isHost(socket) || room.status !== 'over') fail('invalid_request');

    clearTimeout(room.timer);
    room.timer = null;
    room.game = null;
    room.status = 'lobby';
    room.tutorial = false;
    broadcast(room);
    return;
  }

  if (Object.hasOwn(LOBBY_ACTIONS, message.type)) {
    if (!isHost(socket)) fail('invalid_request');
    if (room.status !== 'lobby') fail('game_started');

    LOBBY_ACTIONS[message.type](room, message);
    room.touchedAt = Date.now();
    if (room.status === 'playing') afterChange(room);
    else broadcast(room);
    return;
  }

  fail('invalid_request');
}

function resend(socket) {
  const room = rooms.get(socket.roomCode);

  if (!room) return;
  send(socket, {
    type: 'state',
    room: roomInfo(room, socket.seat),
    game: room.game ? viewFor(room.game, socket.seat) : null,
  });
}

// Borra las salas abandonadas
const cleanup = setInterval(() => {
  rooms.forEach((room, code) => {
    const connected = room.members.some((member) => member.sockets.size > 0);

    if (!connected && Date.now() - room.touchedAt > IDLE_ROOM_MS) {
      clearTimeout(room.timer);
      rooms.delete(code);
    }
  });
}, 10 * 60 * 1000);

cleanup.unref();

module.exports = {
  CITY_LIMITS, MAX_PLAYERS, MIN_PLAYERS, RoomError, connect, createRoom, disconnect, handle, joinRoom, resend,
};
