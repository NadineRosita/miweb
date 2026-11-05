// Reúne todos los datos del juego y crea índices por id.
// Es lo único que el motor importa de data/, y lo que se envía al navegador.

const { DIALOGUES, DIARY, EPITAPHS } = require('./data/dialogues');
const { ITEMS, MYSTERY_POOL } = require('./data/items');
const { SPECIES, BRANCHES, EVOLUTION_LOOK } = require('./data/species');
const world = require('./data/world');
const config = require('./config');

const byId = (list) => Object.fromEntries(list.map((entry) => [entry.id, entry]));

const ITEM = byId(ITEMS);
const SPECIES_BY_ID = byId(SPECIES);
const ZONE = byId(world.ZONES);
const EVENT = byId(world.EVENTS);
const ACHIEVEMENT = byId(world.ACHIEVEMENTS);
const THEME = byId(world.ROOM_THEMES);
const MISSION = byId(world.MISSIONS.pool);

// Lo que necesita el navegador para pintar. No incluye probabilidades internas de eventos:
// no son secretas, pero no le hacen falta.
const clientCatalog = {
  items: ITEMS,
  species: SPECIES,
  branches: BRANCHES,
  evolutionLook: EVOLUTION_LOOK,
  achievements: world.ACHIEVEMENTS,
  events: world.EVENTS.map(({ id, icon, text }) => ({ id, icon, text })),
  zones: world.ZONES,
  collectibles: world.COLLECTIBLES,
  dailyRewards: world.DAILY_REWARDS,
  missions: world.MISSIONS.pool,
  levelRewards: world.LEVEL_REWARDS,
  roomThemes: world.ROOM_THEMES,
  roomLights: world.ROOM_LIGHTS,
  fish: world.FISH,
  trivia: world.TRIVIA,
  dialogues: DIALOGUES,
  diary: DIARY,
  epitaphs: EPITAPHS,
  config: {
    name: config.name,
    room: config.room,
    start: config.start,
    states: config.states,
    sickness: { criticalHealth: config.sickness.criticalHealth },
    arcade: config.arcade,
    limits: config.limits,
    dayHours: config.dayHours,
    evolution: config.evolution,
    affinityTiers: config.affinityTiers,
  },
};

module.exports = {
  ...world, ITEMS, MYSTERY_POOL, SPECIES, BRANCHES, EVOLUTION_LOOK, DIALOGUES, DIARY, EPITAPHS,
  ITEM, SPECIES_BY_ID, ZONE, EVENT, ACHIEVEMENT, THEME, MISSION, clientCatalog,
};
