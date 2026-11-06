// Cartas de Ciudadelas: distritos y personajes.

const COLOR = {
  BLUE: 'blue', // Eclesiástico
  GREEN: 'green', // Comercial
  PURPLE: 'purple', // Maravilla
  YELLOW: 'yellow', // Noble
  RED: 'red', // Militar
};

// key: [color, coste, copias]
const DISTRICTS = {
  manor: [COLOR.YELLOW, 3, 5],
  castle: [COLOR.YELLOW, 4, 4],
  palace: [COLOR.YELLOW, 5, 3],

  temple: [COLOR.BLUE, 1, 3],
  church: [COLOR.BLUE, 2, 3],
  monastery: [COLOR.BLUE, 3, 3],
  cathedral: [COLOR.BLUE, 5, 2],

  tavern: [COLOR.GREEN, 1, 5],
  market: [COLOR.GREEN, 2, 4],
  tradingpost: [COLOR.GREEN, 2, 3],
  docks: [COLOR.GREEN, 3, 3],
  harbor: [COLOR.GREEN, 4, 3],
  townhall: [COLOR.GREEN, 5, 2],

  watchtower: [COLOR.RED, 1, 3],
  prison: [COLOR.RED, 2, 3],
  battlefield: [COLOR.RED, 3, 3],
  fortress: [COLOR.RED, 5, 2],

  // Maravillas: cada una tiene un efecto (ver game.js)
  hauntedcity: [COLOR.PURPLE, 2, 1],
  keep: [COLOR.PURPLE, 3, 2],
  laboratory: [COLOR.PURPLE, 5, 1],
  smithy: [COLOR.PURPLE, 5, 1],
  observatory: [COLOR.PURPLE, 5, 1],
  graveyard: [COLOR.PURPLE, 5, 1],
  library: [COLOR.PURPLE, 6, 1],
  greatwall: [COLOR.PURPLE, 6, 1],
  university: [COLOR.PURPLE, 6, 1],
  dragongate: [COLOR.PURPLE, 6, 1],
  schoolofmagic: [COLOR.PURPLE, 6, 1],
};

// Puntos extra al final de la partida
const BONUS_POINTS = { university: 2, dragongate: 2 };

const CHARACTERS = {
  1: 'assassin',
  2: 'thief',
  3: 'magician',
  4: 'king',
  5: 'bishop',
  6: 'merchant',
  7: 'architect',
  8: 'warlord',
};

// Color de distrito que da monedas a cada personaje
const INCOME_COLOR = {
  4: COLOR.YELLOW,
  5: COLOR.BLUE,
  6: COLOR.GREEN,
  8: COLOR.RED,
};

function buildDeck() {
  const deck = [];
  let uid = 1;

  Object.entries(DISTRICTS).forEach(([key, [color, cost, copies]]) => {
    for (let i = 0; i < copies; i += 1) {
      deck.push({ uid, key, color, cost });
      uid += 1;
    }
  });
  return deck;
}

module.exports = { BONUS_POINTS, CHARACTERS, COLOR, DISTRICTS, INCOME_COLOR, buildDeck };
