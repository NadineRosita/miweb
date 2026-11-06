// Reglas de Ciudadelas (segunda edición), de 2 a 7 jugadores.
//
// El estado es un objeto simple que solo se modifica con applyAction. Nada sabe de
// sockets ni de salas: el servidor llama a applyAction y envía viewFor a cada jugador.
// Los errores llevan un código, no una frase: el navegador pone el texto.

const {
  BONUS_POINTS, CHARACTERS, COLOR, INCOME_COLOR, buildDeck,
} = require('./data');

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 7;
const START_HAND = 4;
const START_GOLD = 2;
const LOG_LIMIT = 80;
const FACE_UP_DISCARDS = { 4: 2, 5: 1, 6: 0, 7: 0 };
const KING = 4;
const BISHOP = 5;
const CHARACTER_NUMBERS = Object.keys(CHARACTERS).map(Number);

class GameError extends Error {}

const fail = (code) => {
  throw new GameError(code);
};

let random = Math.random;

// Solo para las pruebas: partidas repetibles
function setRandom(fn) {
  random = fn ?? Math.random;
}

function shuffle(list) {
  const items = [...list];

  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const pickRandom = (list) => list[Math.floor(random() * list.length)];

function log(state, entry) {
  state.log.push(entry);
  if (state.log.length > LOG_LIMIT) state.log.shift();
}

const has = (player, key) => player.city.some((card) => card.key === key);

// ---------- Mazo ----------

function drawCards(state, count) {
  return state.deck.splice(0, Math.min(count, state.deck.length));
}

const putUnderDeck = (state, cards) => state.deck.push(...cards);

// ---------- Creación ----------

// players: [{ name, bot }]. cityLimit: distritos que acaban la partida (8, 7 o 6)
function createGame({ players, cityLimit = 8 }) {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) fail('invalid_players');

  const state = {
    players: players.map(({ name, bot }) => ({
      name, bot: Boolean(bot), hand: [], city: [], gold: START_GOLD, chars: [],
    })),
    deck: shuffle(buildDeck()),
    cityLimit,
    crown: Math.floor(random() * players.length),
    nextCrown: null,
    round: 0,
    phase: 'select',
    sel: null,
    turn: null,
    killed: null,
    robbed: null,
    assassin: null,
    thief: null,
    pending: null,
    firstComplete: null,
    scores: null,
    winners: null,
    log: [],
  };

  state.players.forEach((player) => {
    player.hand = drawCards(state, START_HAND);
  });
  log(state, { k: 'start', crown: state.crown });
  startRound(state);
  return state;
}

// ---------- Elección de personajes ----------

const nextSeat = (state, seat) => (seat + 1) % state.players.length;

function selectionSteps(state) {
  const count = state.players.length;
  const order = [];
  let seat = state.crown;

  for (let i = 0; i < count; i += 1) {
    order.push(seat);
    seat = nextSeat(state, seat);
  }

  const pick = (player) => ({ player, kind: 'pick' });
  const discard = (player) => ({ player, kind: 'discard' });

  if (count === 2) {
    const [a, b] = order;

    return [pick(a), pick(b), discard(b), pick(a), discard(a), pick(b)];
  }
  if (count === 3) return [...order, ...order].map(pick);
  return order.map(pick);
}

function startRound(state) {
  state.round += 1;
  state.phase = 'select';
  state.turn = null;
  state.killed = null;
  state.robbed = null;
  state.assassin = null;
  state.thief = null;
  state.nextCrown = null;
  state.players.forEach((player) => { player.chars = []; });

  const count = state.players.length;
  let pool = shuffle(CHARACTER_NUMBERS);
  const faceUp = [];
  const faceDown = [];

  // El Rey no puede quedar descartado bocarriba
  for (let i = 0; i < (FACE_UP_DISCARDS[count] ?? 0); i += 1) {
    const card = pickRandom(pool.filter((number) => number !== KING));

    faceUp.push(card);
    pool = pool.filter((number) => number !== card);
  }

  const hidden = pool.pop();

  faceDown.push(hidden);

  state.sel = {
    steps: selectionSteps(state),
    index: 0,
    pool,
    faceUp,
    faceDown,
    hidden: count === 7 ? hidden : null, // Con 7, el último jugador también puede coger esta
  };
  log(state, { k: 'round', round: state.round, faceUp });
  prepareStep(state);
}

function prepareStep(state) {
  const { sel } = state;
  const isLastOfSeven = state.players.length === 7 && sel.index === sel.steps.length - 1;

  if (isLastOfSeven && sel.hidden !== null) {
    sel.pool.push(sel.hidden);
    sel.faceDown = sel.faceDown.filter((number) => number !== sel.hidden);
    sel.hidden = null;
  }
}

function finishSelectionStep(state) {
  const { sel } = state;

  sel.index += 1;
  if (sel.index < sel.steps.length) {
    prepareStep(state);
    return;
  }

  // La carta que sobra se descarta bocabajo
  sel.faceDown.push(...sel.pool);
  sel.pool = [];
  startCalls(state);
}

function pickCharacter(state, seat, number) {
  const { sel } = state;

  if (!sel.pool.includes(number)) fail('invalid_character');
  sel.pool = sel.pool.filter((item) => item !== number);
  state.players[seat].chars.push(number);
  finishSelectionStep(state);
}

function discardCharacter(state, number) {
  const { sel } = state;

  if (!sel.pool.includes(number)) fail('invalid_character');
  sel.pool = sel.pool.filter((item) => item !== number);
  sel.faceDown.push(number);
  finishSelectionStep(state);
}

// ---------- Turnos ----------

const ownerOf = (state, number) => state.players.findIndex((player) => player.chars.includes(number));

function startCalls(state) {
  state.phase = 'turn';
  state.turn = null;
  callNext(state, 0);
}

// Llama al siguiente personaje que alguien tenga; si no queda ninguno, acaba la ronda
function callNext(state, from) {
  for (let number = from + 1; number <= 8; number += 1) {
    const owner = ownerOf(state, number);

    if (owner >= 0 && beginTurn(state, number, owner)) return;
  }
  endRound(state);
}

// Devuelve false si el personaje no juega (asesinado)
function beginTurn(state, number, seat) {
  const player = state.players[seat];

  if (number === state.killed) {
    log(state, { k: 'killed', char: number });
    if (number === KING) state.nextCrown = seat;
    return false;
  }

  log(state, { k: 'call', char: number, player: seat });

  if (number === state.robbed && state.thief !== null && state.thief !== seat) {
    const thief = state.players[state.thief];
    const stolen = player.gold;

    thief.gold += stolen;
    player.gold = 0;
    log(state, {
      k: 'robbed', thief: state.thief, victim: seat, gold: stolen,
    });
  }

  state.turn = {
    char: number,
    player: seat,
    stage: 'income', // income -> pick (elegir carta) -> main
    pick: null,
    built: 0,
    buildMax: number === 7 ? 3 : 1,
    collected: false,
    ability: false,
    lab: false,
    smithy: false,
  };

  if (number === KING) {
    state.nextCrown = seat;
    log(state, { k: 'crown', player: seat });
  }
  if (number === 6) {
    player.gold += 1;
    log(state, { k: 'merchantGold', player: seat });
  }
  if (number === 7) {
    const cards = drawCards(state, 2);

    player.hand.push(...cards);
    log(state, { k: 'architectCards', player: seat, count: cards.length });
  }
  return true;
}

function endTurn(state) {
  const { char } = state.turn;

  state.turn = null;
  callNext(state, char);
}

function endRound(state) {
  if (state.nextCrown !== null) state.crown = state.nextCrown;

  const completed = state.players.some((player) => player.city.length >= state.cityLimit);

  if (completed) {
    finishGame(state);
    return;
  }
  startRound(state);
}

// ---------- Puntos ----------

function cityPoints(player) {
  const total = player.city.reduce((sum, card) => sum + card.cost + (BONUS_POINTS[card.key] ?? 0), 0);
  const haunted = player.city.some((card) => card.key === 'hauntedcity');
  // La Ciudad Encantada vale como el color que falte: no cuenta como violeta por sí sola
  const others = new Set(player.city.filter((card) => card.key !== 'hauntedcity').map((card) => card.color));
  const allColors = others.size === 5 || (haunted && others.size === 4);

  return { total, colors: allColors ? 3 : 0 };
}

function finishGame(state) {
  state.phase = 'over';
  state.turn = null;
  state.pending = null;

  state.scores = state.players.map((player, seat) => {
    const { total, colors } = cityPoints(player);
    const completed = player.city.length >= state.cityLimit;
    let completion = 0;

    if (completed) completion = seat === state.firstComplete ? 4 : 2;

    return {
      seat, districts: total, colors, completion, total: total + colors + completion,
    };
  });

  const best = Math.max(...state.scores.map((score) => score.total));
  const leaders = state.scores.filter((score) => score.total === best);
  const topGold = Math.max(...leaders.map((score) => state.players[score.seat].gold));

  state.winners = leaders.filter((score) => state.players[score.seat].gold === topGold).map((score) => score.seat);
  log(state, { k: 'over', winners: state.winners });
}

// ---------- Acciones del turno ----------

function takeGold(state) {
  const { turn } = state;

  state.players[turn.player].gold += 2;
  turn.stage = 'main';
  log(state, { k: 'takeGold', player: turn.player });
}

function takeCards(state) {
  const { turn } = state;
  const player = state.players[turn.player];
  const count = has(player, 'observatory') ? 3 : 2;
  const cards = drawCards(state, count);

  if (cards.length === 0) fail('deck_empty');

  log(state, { k: 'drawCards', player: turn.player, count: cards.length });

  if (has(player, 'library') || cards.length === 1) {
    player.hand.push(...cards);
    turn.stage = 'main';
    return;
  }

  turn.pick = cards;
  turn.stage = 'pick';
}

function keepCard(state, uid) {
  const { turn } = state;
  const card = turn.pick.find((item) => item.uid === uid);

  if (!card) fail('invalid_card');

  state.players[turn.player].hand.push(card);
  putUnderDeck(state, turn.pick.filter((item) => item !== card));
  turn.pick = null;
  turn.stage = 'main';
}

function build(state, uid) {
  const { turn } = state;
  const player = state.players[turn.player];
  const card = player.hand.find((item) => item.uid === uid);

  if (!card) fail('invalid_card');
  if (turn.built >= turn.buildMax) fail('build_limit');
  if (player.city.some((item) => item.key === card.key)) fail('duplicate_district');
  if (player.gold < card.cost) fail('not_enough_gold');

  player.gold -= card.cost;
  player.hand = player.hand.filter((item) => item !== card);
  player.city.push(card);
  turn.built += 1;
  log(state, { k: 'build', player: turn.player, card: card.key });

  if (player.city.length >= state.cityLimit && state.firstComplete === null) {
    state.firstComplete = turn.player;
    log(state, { k: 'complete', player: turn.player });
  }
}

function collectIncome(state) {
  const { turn } = state;
  const color = INCOME_COLOR[turn.char];

  if (!color || turn.collected) fail('invalid_action');

  const player = state.players[turn.player];
  const count = player.city.filter((card) => card.color === color || card.key === 'schoolofmagic').length;

  player.gold += count;
  turn.collected = true;
  log(state, {
    k: 'income', player: turn.player, gold: count, color,
  });
}

function useLaboratory(state, uid) {
  const { turn } = state;
  const player = state.players[turn.player];
  const card = player.hand.find((item) => item.uid === uid);

  if (!has(player, 'laboratory') || turn.lab || !card) fail('invalid_action');

  player.hand = player.hand.filter((item) => item !== card);
  putUnderDeck(state, [card]);
  player.gold += 1;
  turn.lab = true;
  log(state, { k: 'laboratory', player: turn.player });
}

function useSmithy(state) {
  const { turn } = state;
  const player = state.players[turn.player];

  if (!has(player, 'smithy') || turn.smithy) fail('invalid_action');
  if (player.gold < 2) fail('not_enough_gold');

  player.gold -= 2;
  player.hand.push(...drawCards(state, 3));
  turn.smithy = true;
  log(state, { k: 'smithy', player: turn.player });
}

// ---------- Habilidades de los personajes ----------

const ABILITIES = {
  1(state, action) {
    const target = Number(action.target);

    if (!CHARACTER_NUMBERS.includes(target) || target < 2) fail('invalid_target');
    state.killed = target;
    state.assassin = state.turn.player;
  },

  2(state, action) {
    const target = Number(action.target);

    if (!CHARACTER_NUMBERS.includes(target) || target < 3) fail('invalid_target');
    state.robbed = target;
    state.thief = state.turn.player;
  },

  3(state, action) {
    const player = state.players[state.turn.player];

    if (action.mode === 'swap') {
      const other = state.players[action.target];

      if (!other || other === player) fail('invalid_target');

      [player.hand, other.hand] = [other.hand, player.hand];
      log(state, { k: 'swap', player: state.turn.player, target: action.target });
      return;
    }

    if (action.mode === 'discard') {
      const uids = Array.isArray(action.cards) ? [...new Set(action.cards)] : [];
      const cards = player.hand.filter((card) => uids.includes(card.uid));

      if (cards.length === 0 || cards.length !== uids.length) fail('invalid_card');

      player.hand = player.hand.filter((card) => !cards.includes(card));
      putUnderDeck(state, cards);
      player.hand.push(...drawCards(state, cards.length));
      log(state, { k: 'magicDiscard', player: state.turn.player, count: cards.length });
      return;
    }

    fail('invalid_action');
  },

  8(state, action) {
    const seat = state.turn.player;
    const target = state.players[action.target];
    const card = target?.city.find((item) => item.uid === action.card);

    if (!target || action.target === seat || !card) fail('invalid_target');
    if (target.city.length >= state.cityLimit) fail('city_complete');
    if (card.key === 'keep') fail('protected');

    // El Obispo protege su ciudad, salvo que lo hayan asesinado
    if (target.chars.includes(BISHOP) && state.killed !== BISHOP) fail('protected');

    const wall = has(target, 'greatwall') && card.key !== 'greatwall' ? 1 : 0;
    const cost = card.cost - 1 + wall;
    const player = state.players[seat];

    if (player.gold < cost) fail('not_enough_gold');

    player.gold -= cost;
    target.city = target.city.filter((item) => item !== card);
    log(state, {
      k: 'destroy', player: seat, target: action.target, card: card.key, gold: cost,
    });

    if (has(target, 'graveyard') && target.gold >= 1) {
      state.pending = { type: 'graveyard', player: action.target, card };
      return;
    }
    putUnderDeck(state, [card]);
  },
};

function useAbility(state, action) {
  const { turn } = state;
  const handler = ABILITIES[turn.char];

  if (!handler || turn.ability) fail('invalid_action');

  handler(state, action);
  turn.ability = true;
  if (turn.char <= 2) log(state, { k: 'ability', char: turn.char, player: turn.player });
}

function resolveGraveyard(state, take) {
  const { pending } = state;
  const player = state.players[pending.player];

  state.pending = null;
  if (take && player.gold >= 1) {
    player.gold -= 1;
    player.hand.push(pending.card);
    log(state, { k: 'graveyard', player: pending.player });
    return;
  }
  putUnderDeck(state, [pending.card]);
}

// ---------- Punto de entrada ----------

// Quién debe actuar ahora, o -1 si la partida acabó
function awaiting(state) {
  if (state.phase === 'over') return -1;
  if (state.pending) return state.pending.player;
  if (state.phase === 'select') return state.sel.steps[state.sel.index].player;
  return state.turn.player;
}

function applyAction(state, seat, action) {
  if (awaiting(state) !== seat) fail('not_your_turn');

  if (state.pending) {
    if (action.type !== 'graveyard') fail('invalid_action');
    resolveGraveyard(state, Boolean(action.take));
    return;
  }

  if (state.phase === 'select') {
    const step = state.sel.steps[state.sel.index];

    if (action.type === 'pick' && step.kind === 'pick') pickCharacter(state, seat, Number(action.char));
    else if (action.type === 'discard' && step.kind === 'discard') discardCharacter(state, Number(action.char));
    else fail('invalid_action');
    return;
  }

  const { turn } = state;

  if (turn.stage === 'income') {
    if (action.type !== 'income') fail('invalid_action');
    if (action.mode === 'gold') takeGold(state);
    else if (action.mode === 'cards') takeCards(state);
    else fail('invalid_action');
    return;
  }

  if (turn.stage === 'pick') {
    if (action.type !== 'keep') fail('invalid_action');
    keepCard(state, action.card);
    return;
  }

  switch (action.type) {
    case 'build': build(state, action.card); break;
    case 'collect': collectIncome(state); break;
    case 'ability': useAbility(state, action); break;
    case 'lab': useLaboratory(state, action.card); break;
    case 'smithy': useSmithy(state); break;
    case 'end': endTurn(state); break;
    default: fail('invalid_action');
  }
}

// ---------- Lo que ve cada jugador ----------

function viewFor(state, seat) {
  const me = state.players[seat];
  const actor = awaiting(state);
  const { turn, sel } = state;
  const isOver = state.phase === 'over';

  const view = {
    phase: state.phase,
    round: state.round,
    crown: state.crown,
    cityLimit: state.cityLimit,
    deck: state.deck.length,
    actor,
    seat,
    players: state.players.map((player, index) => ({
      name: player.name,
      bot: player.bot,
      hand: player.hand.length,
      gold: player.gold,
      city: player.city,
      chars: isOver ? player.chars : player.chars.length,
      seat: index,
    })),
    me: { hand: me.hand, chars: me.chars },
    log: state.log.slice(-40),
    firstComplete: state.firstComplete,
    scores: state.scores,
    winners: state.winners,
    secret: {
      killed: state.assassin === seat ? state.killed : null,
      robbed: state.thief === seat ? state.robbed : null,
    },
  };

  if (sel && state.phase === 'select') {
    const step = sel.steps[sel.index];

    view.sel = {
      faceUp: sel.faceUp,
      faceDownCount: sel.faceDown.length,
      kind: step.kind,
      pool: actor === seat ? sel.pool : null,
      poolCount: sel.pool.length,
    };
  }

  if (turn && state.phase === 'turn') {
    view.turn = {
      char: turn.char,
      player: turn.player,
      stage: turn.stage,
      pick: turn.player === seat ? turn.pick : null,
      built: turn.built,
      buildMax: turn.buildMax,
      collected: turn.collected,
      ability: turn.ability,
      lab: turn.lab,
      smithy: turn.smithy,
    };
  }

  if (turn && state.phase === 'turn') {
    // Qué personajes ya se han llamado esta ronda (los que no responden, asesinados o no, no se distinguen)
    view.timeline = CHARACTER_NUMBERS.map((char) => {
      const owner = ownerOf(state, char);

      if (char === turn.char) return { char, status: 'current', player: turn.player };
      if (char > turn.char) return { char, status: 'waiting' };
      if (owner >= 0 && char !== state.killed) return { char, status: 'done', player: owner };
      return { char, status: 'skipped' };
    });
  }

  if (state.pending) {
    view.pending = {
      type: state.pending.type,
      player: state.pending.player,
      card: state.pending.card,
    };
  }

  return view;
}

module.exports = {
  GameError, MAX_PLAYERS, MIN_PLAYERS, applyAction, awaiting, cityPoints, createGame, setRandom, viewFor,
};
