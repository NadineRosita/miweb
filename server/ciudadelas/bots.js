// Jugadores controlados por el ordenador.
//
// botActions devuelve las acciones que el bot quiere hacer, de más a menos deseada.
// Quien las aplique prueba una tras otra y se queda con la primera válida,
// así que un bot nunca deja la partida atascada.

const { INCOME_COLOR } = require('./data');

const KING = 4;
const BISHOP = 5;
const ARCHITECT = 7;
const WARLORD = 8;

const BASE_VALUE = {
  1: 3, 2: 3, 3: 2.5, 4: 4, 5: 3.5, 6: 4, 7: 4, 8: 3,
};

const count = (city, color) => city.filter((card) => card.color === color).length;
const hasDistrict = (player, key) => player.city.some((card) => card.key === key);

const isNearEnd = (state, player) => player.city.length >= state.cityLimit - 2;

function characterValue(state, seat, number, random) {
  const me = state.players[seat];
  const others = state.players.filter((_, index) => index !== seat);
  const threat = others.some((player) => isNearEnd(state, player));
  let value = BASE_VALUE[number] + random() * 1.5;

  if (INCOME_COLOR[number]) value += count(me.city, INCOME_COLOR[number]) * 0.7;
  if (number === 6 && me.gold <= 1) value += 2;
  if (number === 2 && me.gold <= 1) value += 0.5;
  if (number === ARCHITECT && me.hand.length >= 3 && me.gold >= 3) value += 2;
  if (number === 3 && me.hand.length === 0) value += 3;
  if ((number === 1 || number === WARLORD) && threat) value += 2;
  if (number === BISHOP && isNearEnd(state, me)) value += 2;
  if (number === KING && state.crown !== seat) value += 0.5;
  return value;
}

function selectActions(state, seat, random) {
  const { sel } = state;
  const step = sel.steps[sel.index];
  const scored = sel.pool.map((number) => ({
    number, value: characterValue(state, seat, number, random),
  }));

  if (step.kind === 'discard') {
    scored.sort((a, b) => a.value - b.value);
    return scored.map(({ number }) => ({ type: 'discard', char: number }));
  }

  scored.sort((a, b) => b.value - a.value);
  return scored.map(({ number }) => ({ type: 'pick', char: number }));
}

// Qué se puede construir ahora
const buildable = (player, turn) => (
  turn.built >= turn.buildMax
    ? []
    : player.hand.filter((card) => card.cost <= player.gold && !hasDistrict(player, card.key))
);

function cardValue(player, card) {
  const newColor = player.city.some((item) => item.color === card.color) ? 0 : 1.5;
  const wonder = card.color === 'purple' ? 0.5 : 0;

  return card.cost + newColor + wonder;
}

function incomeActions(state, seat, random) {
  const player = state.players[seat];
  const { turn } = state;
  const cheapest = Math.min(...player.hand.filter((card) => !hasDistrict(player, card.key)).map((card) => card.cost), Infinity);
  const wantsCards = state.deck.length > 0
    && (player.hand.length <= 1
      || (turn.char !== ARCHITECT && player.gold >= cheapest + 2 && player.hand.length < 4)
      || random() < 0.25);

  const gold = { type: 'income', mode: 'gold' };
  const cards = { type: 'income', mode: 'cards' };

  return wantsCards ? [cards, gold] : [gold, cards];
}

function keepActions(state, seat) {
  const player = state.players[seat];
  const ranked = [...state.turn.pick].sort((a, b) => {
    const duplicateA = hasDistrict(player, a.key) || player.hand.some((card) => card.key === a.key) ? -5 : 0;
    const duplicateB = hasDistrict(player, b.key) || player.hand.some((card) => card.key === b.key) ? -5 : 0;

    return (cardValue(player, b) + duplicateB) - (cardValue(player, a) + duplicateA);
  });

  return ranked.map((card) => ({ type: 'keep', card: card.uid }));
}

function assassinTarget(state, seat, random) {
  const weights = { 2: 1, 3: 1, 4: 2, 5: 1.5, 6: 2, 7: 2.5, 8: 2 };
  const me = state.players[seat];
  const rich = state.players.some((player, index) => index !== seat && player.gold >= 5);

  if (rich) weights[6] += 1;
  if (me.chars.includes(8)) weights[8] = 0.2;

  const entries = Object.entries(weights).map(([number, weight]) => ({ number: Number(number), weight }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.number;
  }
  return 7;
}

function abilityActions(state, seat, random) {
  const player = state.players[seat];
  const { turn } = state;

  if (turn.char === 1) return [{ type: 'ability', target: assassinTarget(state, seat, random) }];

  if (turn.char === 2) {
    const targets = [3, 4, 5, 6, 7, 8].filter((number) => !player.chars.includes(number));

    return [{ type: 'ability', target: targets[Math.floor(random() * targets.length)] ?? 6 }];
  }

  if (turn.char === 3) {
    const others = state.players.map((item, index) => ({ item, index })).filter(({ index }) => index !== seat);
    const richest = others.reduce((best, entry) => (entry.item.hand.length > best.item.hand.length ? entry : best), others[0]);
    const stuck = player.hand.filter((card) => card.cost > player.gold + 3 || hasDistrict(player, card.key));

    if (richest.item.hand.length >= player.hand.length + 2) {
      return [{ type: 'ability', mode: 'swap', target: richest.index }];
    }
    if (stuck.length > 0) {
      return [{ type: 'ability', mode: 'discard', cards: stuck.map((card) => card.uid) }];
    }
    return [];
  }

  if (turn.char === WARLORD) return warlordActions(state, seat);
  return [];
}

function warlordActions(state, seat) {
  const player = state.players[seat];
  const options = [];

  state.players.forEach((target, index) => {
    if (index === seat || target.city.length >= state.cityLimit) return;
    if (target.chars.includes(BISHOP) && state.killed !== BISHOP) return;

    target.city.forEach((card) => {
      if (card.key === 'keep') return;

      const wall = hasDistrict(target, 'greatwall') && card.key !== 'greatwall' ? 1 : 0;
      const cost = card.cost - 1 + wall;

      if (cost <= player.gold) {
        // Interesa golpear a quien está cerca de acabar y los distritos caros
        const pressure = target.city.length >= state.cityLimit - 1 ? 3 : 0;

        options.push({ target: index, card: card.uid, value: card.cost + pressure - cost * 0.5 });
      }
    });
  });

  options.sort((a, b) => b.value - a.value);

  // Solo ataca si le sobra oro o merece mucho la pena
  const best = options[0];

  if (!best || best.value < 3 || player.gold - 1 < 1) return [];
  return [{ type: 'ability', target: best.target, card: best.card }];
}

function mainActions(state, seat, random) {
  const player = state.players[seat];
  const { turn } = state;
  const actions = [];

  if (INCOME_COLOR[turn.char] && !turn.collected) actions.push({ type: 'collect' });

  if (!turn.ability) actions.push(...abilityActions(state, seat, random));

  const options = buildable(player, turn).sort((a, b) => cardValue(player, b) - cardValue(player, a));

  if (options.length > 0) actions.push({ type: 'build', card: options[0].uid });

  if (hasDistrict(player, 'smithy') && !turn.smithy && player.gold >= 4 && player.hand.length < 3) {
    actions.push({ type: 'smithy' });
  }

  if (hasDistrict(player, 'laboratory') && !turn.lab) {
    const spare = player.hand.find((card) => hasDistrict(player, card.key));

    if (spare) actions.push({ type: 'lab', card: spare.uid });
  }

  actions.push({ type: 'end' });
  return actions;
}

function botActions(state, seat, random = Math.random) {
  if (state.pending) {
    return [{ type: 'graveyard', take: state.players[seat].gold >= 1 && random() < 0.7 }, { type: 'graveyard', take: false }];
  }

  if (state.phase === 'select') return selectActions(state, seat, random);

  const { turn } = state;

  if (turn.stage === 'income') return incomeActions(state, seat, random);
  if (turn.stage === 'pick') return keepActions(state, seat);
  return mainActions(state, seat, random);
}

// Aplica la primera acción válida del bot y la devuelve. Si ninguna lo es, es un fallo del juego
function runBot(state, seat, applyAction, random = Math.random) {
  const wanted = botActions(state, seat, random);

  for (const action of wanted) {
    try {
      applyAction(state, seat, action);
      return action;
    } catch (error) {
      if (error.constructor.name !== 'GameError') throw error;
    }
  }
  throw new Error('El bot no encontró ninguna acción válida');
}

module.exports = { botActions, runBot };
