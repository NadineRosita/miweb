// Pruebas de las reglas de Ciudadelas. No necesitan base de datos: npm test

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { runBot } = require('../../server/ciudadelas/bots');
const { buildDeck } = require('../../server/ciudadelas/data');
const {
  GameError, applyAction, awaiting, createGame, setRandom, viewFor,
} = require('../../server/ciudadelas/game');

const TOTAL_CARDS = buildDeck().length;

// Generador con semilla: cada partida de prueba se puede repetir
function seeded(seed) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function cardsInPlay(state) {
  const held = state.players.flatMap((player) => [...player.hand, ...player.city]);

  return state.deck.length + held.length + (state.turn?.pick?.length ?? 0) + (state.pending ? 1 : 0);
}

function players(count) {
  return Array.from({ length: count }, (_, index) => ({ name: `Bot ${index + 1}`, bot: true }));
}

function playUntilOver(count, seed, cityLimit = 8) {
  const random = seeded(seed);

  setRandom(random);

  const state = createGame({ players: players(count), cityLimit });
  let steps = 0;

  while (state.phase !== 'over') {
    runBot(state, awaiting(state), applyAction, random);
    assert.equal(cardsInPlay(state), TOTAL_CARDS, 'Se perdió o apareció una carta');
    steps += 1;
    assert.ok(steps < 20000, `La partida de ${count} jugadores no termina (semilla ${seed})`);
  }
  setRandom();
  return state;
}

describe('Ciudadelas', () => {
  it('el mazo tiene las cartas esperadas', () => {
    assert.equal(TOTAL_CARDS, 66);
  });

  for (const count of [2, 3, 4, 5, 6, 7]) {
    it(`una partida de ${count} bots llega al final con puntos y ganador`, () => {
      for (let seed = 1; seed <= 8; seed += 1) {
        const state = playUntilOver(count, seed);

        assert.ok(state.winners.length >= 1);
        assert.ok(state.players.some((player) => player.city.length >= 8));
        assert.equal(state.scores.length, count);
      }
    });
  }

  it('la partida corta acaba con menos distritos', () => {
    const state = playUntilOver(4, 3, 6);

    assert.ok(state.players.some((player) => player.city.length >= 6));
  });

  it('solo actúa quien tiene el turno', () => {
    setRandom(seeded(5));

    const state = createGame({ players: players(4) });
    const other = (awaiting(state) + 1) % 4;

    assert.throws(() => applyAction(state, other, { type: 'pick', char: 1 }), GameError);
    setRandom();
  });

  it('la vista no enseña las manos de los demás', () => {
    setRandom(seeded(9));

    const state = createGame({ players: players(4) });
    const view = viewFor(state, 0);

    assert.equal(view.players[1].hand, 4);
    assert.ok(Array.isArray(view.me.hand));
    assert.equal(view.players[1].chars, 0);
    setRandom();
  });

  it('con 4 jugadores se descartan dos personajes bocarriba y nunca es el Rey', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      setRandom(seeded(seed));

      const state = createGame({ players: players(4) });

      assert.equal(state.sel.faceUp.length, 2);
      assert.ok(!state.sel.faceUp.includes(4));
      assert.equal(state.sel.pool.length, 5);
    }
    setRandom();
  });

  it('con 2 jugadores cada uno acaba con dos personajes', () => {
    const random = seeded(11);

    setRandom(random);

    const state = createGame({ players: players(2) });

    while (state.phase === 'select') runBot(state, awaiting(state), applyAction, random);

    assert.deepEqual(state.players.map((player) => player.chars.length), [2, 2]);
    setRandom();
  });
});
