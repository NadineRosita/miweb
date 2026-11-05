// Formato de la partida: creación, validación y migración.
//
// Para cambiar el formato sin perder partidas:
//   1. Sube SAVE_VERSION en config.js.
//   2. Añade a MIGRATIONS una función que convierta de la versión anterior a la nueva.
// sanitizeSave rellena además los campos que falten, así que añadir un campo opcional
// no necesita migración.

const config = require('./config');
const { ITEM, SPECIES_BY_ID, THEME, ROOM_LIGHTS, ZONE, EVENT, MISSION } = require('./catalog');

const { SAVE_VERSION } = config;
const STAT_KEYS = ['happiness', 'hunger', 'energy', 'hygiene', 'fun', 'affection'];
const SLOTS = ['head', 'eyes', 'neck', 'back', 'body'];

// MIGRATIONS[n] convierte una partida de la versión n a la n + 1
const MIGRATIONS = {};

class SaveError extends Error {}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const stat = (value, fallback) => clamp(num(value, fallback), 0, 100);
const text = (value, max, fallback = '') => (typeof value === 'string' ? value.slice(0, max) : fallback);
const list = (value, limit = Infinity) => (Array.isArray(value) ? value.slice(-limit) : []);
const bool = (value) => value === true;
const timestamp = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

function createPet({ id, species, name, variant = 0, now, statsOverride = {} }) {
  const data = SPECIES_BY_ID[species];

  return {
    id,
    species,
    name,
    variant,
    evolution: null,
    born: now,
    stats: { ...config.start.stats, ...data.stats, ...statsOverride },
    health: 100,
    sick: false,
    neglectHours: 0,
    asleep: false,
    mess: 0,
    messHours: 0,
    traits: { care: 0, smart: 0, adventure: 0, neglect: 0 },
    careDays: 0,
    lastCareDay: '',
    equipped: {},
    room: { theme: 'basic', light: 'auto', items: [] },
    cooldowns: {},
    lastInteraction: now,
    rainbowUntil: 0,
    affinityTier: 0,
    criticalWarned: false,
  };
}

function createSave(now, legacy = null) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastTick: now,
    tz: 0,
    coins: config.start.coins,
    level: 1,
    xp: 0,
    inventory: { apple: 3, strawberries: 1, coffee: 1 },
    unlockedSpecies: [],
    roomThemes: ['basic'],
    flags: {},
    stats: {},
    activities: [],
    achievements: {},
    discoveredEvolutions: [],
    discoveredSpecies: [],
    collectibles: {},
    activePetId: null,
    nextPetId: 1,
    nextUid: 1,
    pets: {},
    graveyard: [],
    pendingFuneral: null,
    daily: null,
    dailyClaims: 0,
    records: {},
    arcadeSession: null,
    expedition: null,
    pendingEvent: null,
    lastEventAt: now,
    luckUntil: 0,
    diary: [],
    album: [],
    legacy,
    recovered: false,
    settings: { volume: 0.5, muted: false, music: false, widget: true },
  };
}

function sanitizeRoom(room) {
  const source = isObject(room) ? room : {};
  const items = list(source.items).filter((entry) => (
    isObject(entry) && ITEM[entry.id]?.cat === 'furniture'
    && Number.isInteger(entry.uid) && Number.isInteger(entry.x) && Number.isInteger(entry.y)
  ));

  return {
    theme: THEME[source.theme] ? source.theme : 'basic',
    light: ROOM_LIGHTS.includes(source.light) ? source.light : 'auto',
    items,
  };
}

function sanitizePet(pet, id, now) {
  if (!isObject(pet) || !SPECIES_BY_ID[pet.species]) return null;

  const base = createPet({ id, species: pet.species, name: text(pet.name, config.name.max) || SPECIES_BY_ID[pet.species].name[0], now });
  const stats = isObject(pet.stats) ? pet.stats : {};
  const traits = isObject(pet.traits) ? pet.traits : {};
  const equipped = {};

  if (isObject(pet.equipped)) {
    SLOTS.forEach((slot) => {
      if (ITEM[pet.equipped[slot]]?.slot === slot) equipped[slot] = pet.equipped[slot];
    });
  }

  return {
    ...base,
    variant: Math.max(0, Math.trunc(num(pet.variant))),
    evolution: ['happy', 'smart', 'adventurous', 'dark'].includes(pet.evolution) ? pet.evolution : null,
    born: timestamp(pet.born) || now,
    stats: Object.fromEntries(STAT_KEYS.map((key) => [key, stat(stats[key], base.stats[key])])),
    health: stat(pet.health, 100),
    sick: bool(pet.sick),
    neglectHours: Math.max(0, num(pet.neglectHours)),
    asleep: bool(pet.asleep),
    mess: clamp(Math.trunc(num(pet.mess)), 0, config.mess.max),
    messHours: Math.max(0, num(pet.messHours)),
    traits: Object.fromEntries(Object.keys(base.traits).map((key) => [key, Math.max(0, num(traits[key]))])),
    careDays: Math.max(0, Math.trunc(num(pet.careDays))),
    lastCareDay: text(pet.lastCareDay, 10),
    equipped,
    room: sanitizeRoom(pet.room),
    cooldowns: isObject(pet.cooldowns) ? pet.cooldowns : {},
    lastInteraction: timestamp(pet.lastInteraction) || now,
    rainbowUntil: timestamp(pet.rainbowUntil),
    affinityTier: Math.max(0, Math.trunc(num(pet.affinityTier))),
    criticalWarned: bool(pet.criticalWarned),
  };
}

function sanitizeDaily(daily) {
  if (!isObject(daily) || typeof daily.key !== 'string') return null;

  return {
    key: daily.key,
    claimed: bool(daily.claimed),
    counters: isObject(daily.counters) ? daily.counters : {},
    arcadeCoins: Math.max(0, num(daily.arcadeCoins)),
    arcadeByGame: isObject(daily.arcadeByGame) ? daily.arcadeByGame : {},
    interactionXp: Math.max(0, num(daily.interactionXp)),
    interactionAffection: Math.max(0, num(daily.interactionAffection)),
    interactionCount: Math.max(0, num(daily.interactionCount)),
    interactionCoins: Math.max(0, num(daily.interactionCoins)),
    goodCare: bool(daily.goodCare),
    kits: Math.max(0, num(daily.kits)),
    missions: list(daily.missions).filter((mission) => isObject(mission) && MISSION[mission.id])
      .map((mission) => ({ id: mission.id, done: bool(mission.done) })),
  };
}

// Devuelve una partida válida a partir de cualquier objeto: lo que no se entienda se descarta
// y lo que falte toma su valor inicial. Nunca lanza por un campo dañado.
function sanitizeSave(raw, now) {
  const base = createSave(now);
  const save = { ...base };

  save.version = SAVE_VERSION;
  save.createdAt = timestamp(raw.createdAt) || now;
  save.lastTick = clamp(timestamp(raw.lastTick) || now, 0, now); // Un reloj futuro no adelanta nada
  save.tz = clamp(Math.trunc(num(raw.tz)), -840, 840);
  save.coins = Math.max(0, Math.floor(num(raw.coins, base.coins)));
  save.level = clamp(Math.trunc(num(raw.level, 1)), 1, config.level.max);
  save.xp = Math.max(0, num(raw.xp));
  save.nextPetId = Math.max(1, Math.trunc(num(raw.nextPetId, 1)));
  save.nextUid = Math.max(1, Math.trunc(num(raw.nextUid, 1)));
  save.dailyClaims = Math.max(0, Math.trunc(num(raw.dailyClaims)));
  save.lastEventAt = timestamp(raw.lastEventAt) || now;
  save.luckUntil = timestamp(raw.luckUntil);

  save.inventory = {};
  if (isObject(raw.inventory)) {
    Object.entries(raw.inventory).forEach(([id, qty]) => {
      const amount = Math.trunc(num(qty));
      if (ITEM[id] && amount > 0) save.inventory[id] = amount;
    });
  }

  save.unlockedSpecies = list(raw.unlockedSpecies).filter((id) => SPECIES_BY_ID[id]);
  save.roomThemes = [...new Set(['basic', ...list(raw.roomThemes).filter((id) => THEME[id])])];
  save.flags = isObject(raw.flags) ? raw.flags : {};
  save.stats = {};
  if (isObject(raw.stats)) {
    Object.entries(raw.stats).forEach(([key, value]) => {
      if (Number.isFinite(value) && value >= 0) save.stats[key] = value;
    });
  }
  save.activities = list(raw.activities).filter((entry) => typeof entry === 'string');
  save.achievements = isObject(raw.achievements) ? raw.achievements : {};
  save.discoveredEvolutions = list(raw.discoveredEvolutions).filter((entry) => typeof entry === 'string');
  save.discoveredSpecies = list(raw.discoveredSpecies).filter((id) => SPECIES_BY_ID[id]);
  save.collectibles = isObject(raw.collectibles) ? raw.collectibles : {};

  save.pets = {};
  if (isObject(raw.pets)) {
    Object.entries(raw.pets).forEach(([id, pet]) => {
      const clean = sanitizePet(pet, id, now);
      if (clean) save.pets[id] = clean;
    });
  }
  save.activePetId = save.pets[raw.activePetId] ? raw.activePetId : (Object.keys(save.pets)[0] ?? null);

  save.graveyard = list(raw.graveyard).filter(isObject);
  save.pendingFuneral = isObject(raw.pendingFuneral) ? raw.pendingFuneral : null;
  save.daily = sanitizeDaily(raw.daily);
  save.records = isObject(raw.records) ? raw.records : {};

  const session = raw.arcadeSession;
  save.arcadeSession = isObject(session) && config.arcade.games[session.game] ? session : null;

  const trip = raw.expedition;
  save.expedition = isObject(trip) && ZONE[trip.zone] && save.pets[trip.petId] ? trip : null;

  save.pendingEvent = isObject(raw.pendingEvent) && EVENT[raw.pendingEvent.id] ? raw.pendingEvent : null;
  save.diary = list(raw.diary, config.limits.diary).filter(isObject);
  save.album = list(raw.album, config.limits.album).filter(isObject);
  save.legacy = isObject(raw.legacy) ? raw.legacy : null;
  save.recovered = bool(raw.recovered);

  const settings = isObject(raw.settings) ? raw.settings : {};
  save.settings = {
    volume: clamp(num(settings.volume, base.settings.volume), 0, 1),
    muted: bool(settings.muted),
    music: bool(settings.music),
    widget: settings.widget !== false,
  };

  return save;
}

function migrate(raw) {
  let current = raw;
  let { version } = current;

  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new SaveError(`Falta la migración desde la versión ${version}`);
    current = step(current);
    version += 1;
    current.version = version;
  }

  return current;
}

const isUsable = (raw) => isObject(raw) && Number.isInteger(raw.version) && raw.version >= 1 && isObject(raw.pets);

// Carga la partida desde lo guardado. Si está dañada, recurre a la copia anterior;
// si tampoco sirve, empieza de cero avisando al jugador.
// Una partida de una versión más nueva que el código no se toca: se rechaza sin escribir,
// para que volver a una versión anterior del código no la destruya.
function loadSave(raw, backup, now) {
  if (isObject(raw) && num(raw.version) > SAVE_VERSION) {
    throw new SaveError('La partida es más nueva que el servidor');
  }

  for (const candidate of [raw, backup]) {
    if (isUsable(candidate) && candidate.version <= SAVE_VERSION) {
      try {
        const save = sanitizeSave(migrate(structuredClone(candidate)), now);
        if (candidate === backup) save.recovered = true;
        return save;
      } catch (error) {
        console.error('Partida no recuperable:', error.message);
      }
    }
  }

  return { ...createSave(now), recovered: isObject(raw) };
}

module.exports = { createSave, createPet, sanitizeSave, loadSave, SaveError, SLOTS, clamp };
