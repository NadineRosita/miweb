// Página de ajedrez: lobby y partida, contra la máquina o contra otra persona.
//
// Contra la máquina todo ocurre en el navegador (motor.worker.js).
// En una sala, el servidor es quien decide: aquí solo se muestra su estado.

import { Chess } from '/vendor/chess.js';
import { Board } from './tablero.js';
import { RoomConnection, forgetToken, saveToken, savedToken } from './sala.js';

const LOCAL_GAME_KEY = 'ajedrez-maquina';
const CLOCK_TICK_MS = 200;
const LOW_TIME_MS = 30000;

const $ = (id) => document.getElementById(id);

const lobby = $('chess-lobby');
const gameView = $('chess-game');

// Partida en curso. mode es 'machine' o 'room'.
let game = null;
let engine = null;
let engineRequest = 0;

const board = new Board($('chess-board'), { onMove: handlePlayerMove });

const opposite = (color) => (color === 'white' ? 'black' : 'white');
const turnColor = (chess) => (chess.turn() === 'w' ? 'white' : 'black');
const randomColor = () => (Math.random() < 0.5 ? 'white' : 'black');

function replay(moves) {
  const chess = new Chess();
  moves.forEach((move) => chess.move(move));
  return chess;
}

const lastMoveOf = (chess) => chess.history({ verbose: true }).at(-1) ?? null;

// Resultado según las reglas, para las partidas contra la máquina
function ruleResult(chess) {
  if (chess.isCheckmate()) return { result: opposite(turnColor(chess)), reason: 'checkmate' };
  if (chess.isStalemate()) return { result: 'draw', reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { result: 'draw', reason: 'insufficient' };
  if (chess.isThreefoldRepetition()) return { result: 'draw', reason: 'repetition' };
  if (chess.isDrawByFiftyMoves()) return { result: 'draw', reason: 'fifty' };
  return null;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

// ---------- Pintar ----------

function statusText() {
  if (game.finished) {
    const { result, reason } = game.finished;
    const outcome = result === 'draw' ? 'draw' : (result === game.color ? 'won' : 'lost');
    return `${i18n.t(`chess.outcome.${outcome}`)} ${i18n.t(`chess.reason.${reason}`)}`;
  }

  if (game.mode === 'room') {
    if (!game.connected) return i18n.t('chess.status.reconnecting');
    if (game.status === 'waiting') return i18n.t('chess.status.waiting');
  }

  const key = turnColor(game.chess) === game.color ? 'yourTurn' : (game.mode === 'machine' ? 'thinking' : 'opponentTurn');
  const check = game.chess.inCheck() ? ` ${i18n.t('chess.status.check')}` : '';
  return `${i18n.t(`chess.status.${key}`)}${check}`;
}

function renderMoves() {
  const history = game.chess.history();
  const list = $('chess-moves');

  list.replaceChildren();

  for (let i = 0; i < history.length; i += 2) {
    const item = document.createElement('li');

    item.textContent = history.slice(i, i + 2).join('  ');
    list.append(item);
  }

  list.scrollTop = list.scrollHeight;
}

function playerLabel(color) {
  if (color === game.color) return i18n.t('chess.you');
  return i18n.t(game.mode === 'machine' ? 'chess.machine' : 'chess.opponent');
}

function renderPlayers() {
  const rival = opposite(game.color);

  $('chess-player-top-name').textContent = playerLabel(rival);
  $('chess-player-bottom-name').textContent = playerLabel(game.color);

  const presence = $('chess-presence');
  presence.hidden = game.mode !== 'room' || game.status !== 'playing' || game.opponentConnected;
}

function renderClock() {
  const clock = game?.clock;

  $('chess-clock-top').hidden = !clock;
  $('chess-clock-bottom').hidden = !clock;
  if (!clock) return;

  const elapsed = Date.now() - clock.receivedAt;
  const remaining = (color) => Math.max(clock[color] - (clock.active === color ? elapsed : 0), 0);

  [['chess-clock-top', opposite(game.color)], ['chess-clock-bottom', game.color]].forEach(([id, color]) => {
    const element = $(id);
    const ms = remaining(color);

    element.textContent = formatTime(ms);
    element.classList.toggle('is-active', clock.active === color);
    element.classList.toggle('is-low', ms < LOW_TIME_MS);
  });
}

function renderActions() {
  const isPlaying = !game.finished && !(game.mode === 'room' && game.status === 'waiting');
  const isRoom = game.mode === 'room';

  $('chess-resign').hidden = !isPlaying;
  $('chess-draw').hidden = !(isRoom && isPlaying && game.drawOffer !== 'you');
  $('chess-draw').textContent = i18n.t(game.drawOffer === 'opponent' ? 'chess.acceptDraw' : 'chess.offerDraw');
  $('chess-decline').hidden = !(isRoom && isPlaying && game.drawOffer === 'opponent');

  const offer = $('chess-offer');
  offer.hidden = !(isRoom && isPlaying && game.drawOffer);
  if (game.drawOffer) offer.textContent = i18n.t(game.drawOffer === 'you' ? 'chess.drawOffered' : 'chess.drawReceived');

  $('chess-room').hidden = !isRoom;
  if (isRoom) $('chess-room-code').textContent = game.code;
}

function render() {
  if (!game) return;

  const canMove = !game.finished
    && turnColor(game.chess) === game.color
    && (game.mode === 'machine' || (game.status === 'playing' && game.connected));

  board.render({
    chess: game.chess,
    orientation: game.color,
    interactive: canMove,
    lastMove: lastMoveOf(game.chess),
  });

  $('chess-status').textContent = statusText();
  renderPlayers();
  renderClock();
  renderMoves();
  renderActions();
}

function showGame() {
  lobby.hidden = true;
  gameView.hidden = false;
}

function showLobby() {
  game = null;
  gameView.hidden = true;
  lobby.hidden = false;
  history.replaceState(null, '', location.pathname);
}

// ---------- Contra la máquina ----------

function saveLocalGame() {
  localStorage.setItem(LOCAL_GAME_KEY, JSON.stringify({
    level: game.level,
    color: game.color,
    moves: game.chess.history({ verbose: true }).map(({ from, to, promotion }) => ({ from, to, promotion })),
    resigned: game.finished?.reason === 'resign',
  }));
}

function askEngine() {
  engine ??= new Worker(new URL('./motor.worker.js', import.meta.url), { type: 'module' });
  engineRequest += 1;

  const request = engineRequest;
  const current = game;

  engine.onmessage = ({ data }) => {
    if (data.id !== request || game !== current) return; // Respuesta de una partida ya abandonada

    current.chess.move(data.move);
    afterLocalMove();
  };

  engine.postMessage({ id: request, fen: game.chess.fen(), level: game.level });
}

function afterLocalMove() {
  game.finished ??= ruleResult(game.chess);
  saveLocalGame();
  render();

  if (!game.finished && turnColor(game.chess) !== game.color) askEngine();
}

function startMachineGame({ level, color, moves = [], resigned = false }) {
  game = {
    mode: 'machine',
    level,
    color,
    chess: replay(moves),
    finished: resigned ? { result: opposite(color), reason: 'resign' } : null,
  };

  showGame();
  afterLocalMove();
}

// ---------- Contra otra persona ----------

function handleRoomState(state) {
  clearRoomError();
  Object.assign(game, {
    color: state.color,
    chess: replay(state.moves),
    status: state.status,
    finished: state.status === 'finished' ? { result: state.result, reason: state.reason } : null,
    opponentConnected: state.opponentConnected,
    drawOffer: state.drawOffer,
    clock: state.clock && { ...state.clock, receivedAt: Date.now() },
  });

  showGame();
  render();
}

function handleRoomError(code) {
  // Un token que ya no vale, o una sala borrada: no hay partida a la que volver
  if (code === 'room_forbidden' || code === 'room_not_found') {
    forgetToken(game.code);
    leaveRoom();
    showLobbyError(code);
    return;
  }

  $('chess-error').dataset.i18n = `error.${code}`;
  $('chess-error').textContent = i18n.t(`error.${code}`);
}

function clearRoomError() {
  delete $('chess-error').dataset.i18n;
  $('chess-error').textContent = '';
}

function enterRoom(code, token) {
  game = {
    mode: 'room',
    code,
    color: 'white',
    chess: new Chess(),
    status: 'waiting',
    finished: null,
    connected: false,
    opponentConnected: false,
    drawOffer: null,
    clock: null,
  };

  history.replaceState(null, '', `?sala=${code}`);

  game.connection = new RoomConnection({
    code,
    token,
    onState: handleRoomState,
    onError: handleRoomError,
    onConnection: (connected) => {
      if (!game) return;
      game.connected = connected;
      render();
    },
  });

  showGame();
  render();
}

function leaveRoom() {
  game?.connection?.close();
  showLobby();
}

async function api(path, body) {
  const response = await fetch(`/api/chess${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json();

  if (!response.ok) throw new Error(data.error);
  return data;
}

function showLobbyError(code) {
  const element = $('lobby-error');

  element.dataset.i18n = `error.${code}`;
  element.textContent = i18n.t(element.dataset.i18n);
}

function clearLobbyError() {
  delete $('lobby-error').dataset.i18n;
  $('lobby-error').textContent = '';
}

async function joinRoom(rawCode) {
  const code = rawCode.trim().toUpperCase();
  const token = savedToken(code);

  // En este navegador ya se jugó en esa sala: se vuelve a ella
  if (token) {
    enterRoom(code, token);
    return;
  }

  try {
    const room = await api(`/rooms/${encodeURIComponent(code)}/join`);
    saveToken(room.code, room.token);
    enterRoom(room.code, room.token);
  } catch (error) {
    showLobbyError(error instanceof TypeError ? 'connection' : error.message);
  }
}

// ---------- Acciones ----------

function handlePlayerMove(move) {
  game.chess.move(move);

  if (game.mode === 'machine') {
    afterLocalMove();
    return;
  }

  // Se adelanta en pantalla; el estado del servidor manda y lo corrige si hace falta
  game.connection.send({ type: 'move', ...move });
  render();
}

$('machine-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const { level, color } = Object.fromEntries(new FormData(event.target));
  startMachineGame({ level, color: color === 'random' ? randomColor() : color });
});

$('room-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearLobbyError();

  const { color, clock } = Object.fromEntries(new FormData(event.target));
  const [minutes, increment] = clock === 'none' ? [] : clock.split('+').map(Number);

  try {
    const room = await api('/rooms', { color, clock: clock === 'none' ? null : { minutes, increment } });
    saveToken(room.code, room.token);
    enterRoom(room.code, room.token);
  } catch (error) {
    showLobbyError(error instanceof TypeError ? 'connection' : error.message);
  }
});

$('join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  clearLobbyError();
  joinRoom(new FormData(event.target).get('code'));
});

$('chess-resign').addEventListener('click', () => {
  if (!confirm(i18n.t('chess.confirmResign'))) return;

  if (game.mode === 'room') {
    game.connection.send({ type: 'resign' });
    return;
  }

  engineRequest += 1;
  game.finished = { result: opposite(game.color), reason: 'resign' };
  saveLocalGame();
  render();
});

$('chess-draw').addEventListener('click', () => game.connection.send({ type: 'draw' }));
$('chess-decline').addEventListener('click', () => game.connection.send({ type: 'decline' }));

$('chess-new').addEventListener('click', () => {
  if (game.mode === 'room') {
    leaveRoom();
    return;
  }

  engineRequest += 1;
  localStorage.removeItem(LOCAL_GAME_KEY);
  showLobby();
});

$('chess-copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(location.href);
  $('chess-copy').dataset.i18n = 'chess.copied';
  $('chess-copy').textContent = i18n.t('chess.copied');
});

setInterval(renderClock, CLOCK_TICK_MS);
i18n.onChange(render);

// ---------- Al cargar: volver a lo que hubiera en marcha ----------

function start() {
  const code = new URLSearchParams(location.search).get('sala');

  if (code) {
    joinRoom(code);
    return;
  }

  const saved = JSON.parse(localStorage.getItem(LOCAL_GAME_KEY));
  if (saved) startMachineGame(saved);
}

start();
