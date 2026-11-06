// Página de ajedrez: lobby y partida, contra la máquina o contra otra persona.
//
// Contra la máquina todo ocurre en el navegador (motor.worker.js).
// En una sala, el servidor es quien decide: aquí solo se muestra su estado.

import { Chess } from '/vendor/chess.js';
import { clearEnding, playEnding } from './final.js';
import { Board } from './tablero.js';
import { RoomConnection, forgetToken, saveToken, savedToken } from './sala.js';

const LOCAL_GAME_KEY = 'ajedrez-maquina';
const CLOCK_TICK_MS = 200;
const ENGINE_MIN_DELAY_MS = 500; // Para que se vea tu jugada antes de la respuesta
const ENDING_DELAY_MS = 350; // Deja terminar la última jugada antes del final
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

// ---------- Repasar la partida ----------
// game.viewPly es el número de jugadas de la posición que se está mirando.
// Con null se ve la partida en curso. Solo cambia lo que se ve, nunca la partida.

const totalPlies = () => game.chess.history().length;
const shownPly = () => game.viewPly ?? totalPlies();
const isPreviewing = () => game.viewPly !== null;

function positionAt(ply) {
  const moves = game.chess.history({ verbose: true }).slice(0, ply);
  return replay(moves.map(({ from, to, promotion }) => ({ from, to, promotion })));
}

function goToPly(ply) {
  if (!game) return;

  game.viewPly = ply >= totalPlies() ? null : Math.max(ply, 0);
  render();
}

function renderMoves() {
  const moves = game.chess.history();
  const list = $('chess-moves');
  const current = shownPly();

  list.replaceChildren();

  for (let i = 0; i < moves.length; i += 2) {
    const item = document.createElement('li');

    moves.slice(i, i + 2).forEach((san, offset) => {
      const ply = i + offset + 1;
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'chess-move';
      button.dataset.ply = ply;
      button.textContent = san;
      if (ply === current) button.setAttribute('aria-current', 'true');
      item.append(button);
    });

    list.append(item);
  }

  const active = list.querySelector('[aria-current]');
  const showActive = isPreviewing() && active;

  list.scrollTop = showActive ? active.offsetTop - list.clientHeight / 2 : list.scrollHeight;
}

function renderHistory() {
  const total = totalPlies();
  const ply = shownPly();
  const previewing = isPreviewing();
  const viewing = $('chess-viewing');

  $('chess-history').hidden = total === 0;
  $('chess-first').disabled = ply === 0;
  $('chess-prev').disabled = ply === 0;
  $('chess-next').disabled = !previewing;
  $('chess-last').disabled = !previewing;
  $('chess-live').hidden = !previewing;

  viewing.hidden = !previewing;
  if (previewing) {
    viewing.textContent = ply === 0
      ? i18n.t('chess.history.start')
      : i18n.t('chess.history.viewing').replace('{ply}', ply).replace('{total}', total);
  }
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

function endingKind() {
  const { result, reason } = game.finished;

  if (reason === 'stalemate') return 'stalemate';
  if (result === 'draw') return 'draw';
  return result === game.color ? 'won' : 'lost';
}

// Los finales de partida se ven una vez, al ocurrir: no al recargar una ya acabada
function showEnding() {
  const current = game;
  const kind = endingKind();
  const { result, reason } = game.finished;
  const isDecisive = result !== 'draw';

  game.endingShown = true;

  setTimeout(() => {
    if (game !== current) return;

    playEnding(board, {
      kind,
      title: i18n.t(`chess.ending.${kind}`),
      subtitle: i18n.t(kind === 'stalemate' ? 'chess.outcome.draw' : `chess.reason.${reason}`),
      winner: isDecisive ? result : null,
      loser: isDecisive ? opposite(result) : null,
      stuck: turnColor(game.chess),
    });
  }, ENDING_DELAY_MS);
}

function render() {
  if (!game) return;

  // Si la partida acaba mientras se repasa, se vuelve para ver el final
  if (game.finished && !game.endingShown) game.viewPly = null;

  const previewing = isPreviewing();
  const shown = previewing ? positionAt(game.viewPly) : game.chess;
  const canMove = !previewing
    && !game.finished
    && turnColor(game.chess) === game.color
    && (game.mode === 'machine' || (game.status === 'playing' && game.connected));

  board.render({
    chess: shown,
    orientation: game.color,
    interactive: canMove,
    lastMove: lastMoveOf(shown),
    preview: previewing,
    free: Boolean(game.finished),
  });

  $('chess-free-hint').hidden = !game.finished || previewing;

  $('chess-status').textContent = statusText();
  renderPlayers();
  renderClock();
  renderMoves();
  renderHistory();
  renderActions();

  if (game.finished && !game.endingShown) showEnding();
}

function showGame() {
  if (gameView.hidden) window.scrollTo({ top: 0, behavior: 'instant' });

  lobby.hidden = true;
  gameView.hidden = false;
  document.body.classList.add('chess-playing');
}

function showLobby() {
  game = null;
  clearEnding();
  board.reset();
  gameView.hidden = true;
  lobby.hidden = false;
  document.body.classList.remove('chess-playing');
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
  const askedAt = Date.now();

  engine.onmessage = ({ data }) => {
    setTimeout(() => {
      if (data.id !== engineRequest || game !== current) return; // Partida ya abandonada

      current.chess.move(data.move);
      afterLocalMove();
    }, ENGINE_MIN_DELAY_MS - (Date.now() - askedAt));
  };

  // Sin esto, si el motor no se descarga se quedaría pensando para siempre
  engine.onerror = () => {
    engine = null;
    $('chess-error').dataset.i18n = 'error.connection';
    $('chess-error').textContent = i18n.t('error.connection');
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
    viewPly: null,
  };
  game.finished ??= ruleResult(game.chess);
  game.endingShown = Boolean(game.finished);
  restoreFallenKing();

  showGame();
  afterLocalMove();
}

// ---------- Contra otra persona ----------

// Una partida ya terminada se muestra quieta, con el rey vencido tumbado
function restoreFallenKing() {
  const { result } = game.finished ?? {};
  board.fallen = result && result !== 'draw' ? opposite(result) : null;
}

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

  if (!game.synced) {
    game.synced = true;
    game.endingShown = Boolean(game.finished);
    restoreFallenKing();
  }

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
    viewPly: null,
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

$('chess-first').addEventListener('click', () => goToPly(0));
$('chess-prev').addEventListener('click', () => goToPly(shownPly() - 1));
$('chess-next').addEventListener('click', () => goToPly(shownPly() + 1));
$('chess-last').addEventListener('click', () => goToPly(totalPlies()));
$('chess-live').addEventListener('click', () => goToPly(totalPlies()));

$('chess-moves').addEventListener('click', (event) => {
  const ply = event.target.closest('[data-ply]')?.dataset.ply;
  if (!ply) return;

  goToPly(Number(ply));
  $('chess-moves').querySelector('[aria-current]')?.focus(); // La lista se acaba de repintar
});

const HISTORY_KEYS = {
  ArrowLeft: () => shownPly() - 1,
  ArrowRight: () => shownPly() + 1,
  Home: () => 0,
  End: () => totalPlies(),
};

document.addEventListener('keydown', (event) => {
  const isTyping = event.target.closest('input, select, textarea');

  if (!game || isTyping || document.querySelector('.promotion') || !Object.hasOwn(HISTORY_KEYS, event.key)) return;

  event.preventDefault();
  goToPly(HISTORY_KEYS[event.key]());
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
