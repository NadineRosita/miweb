// Progresión: monedas, experiencia, logros, misiones, diario y requisitos de evoluciones
// y especies. Todo lo que dé o quite recursos pasa por aquí.

const config = require('./config');
const {
  ACHIEVEMENTS, BRANCHES, MISSION, SPECIES, LEVEL_REWARDS, MISSIONS,
} = require('./catalog');

class GameError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const increment = (save, key, amount = 1) => {
  save.stats[key] = (save.stats[key] ?? 0) + amount;
};

const dayKey = (now, tz) => new Date(now + tz * 60000).toISOString().slice(0, 10);
const localHour = (now, tz) => new Date(now + tz * 60000).getUTCHours();

const isLucky = (save, now) => save.luckUntil > now;

function addCoins(save, amount, fx) {
  const coins = Math.max(0, Math.floor(amount));
  if (!coins) return 0;

  save.coins += coins;
  increment(save, 'coinsEarned', coins);
  save.stats.peakCoins = Math.max(save.stats.peakCoins ?? 0, save.coins);
  fx.push({ type: 'coins', amount: coins });
  return coins;
}

// El único sitio donde se gastan monedas: nunca deja el saldo en negativo
function spendCoins(save, amount) {
  if (!Number.isInteger(amount) || amount < 0) throw new GameError('invalid_request');
  if (save.coins < amount) throw new GameError('not_enough_coins');

  save.coins -= amount;
  increment(save, 'coinsSpent', amount);
}

const addItem = (save, id, qty = 1) => {
  save.inventory[id] = (save.inventory[id] ?? 0) + qty;
};

function removeItem(save, id, qty = 1) {
  if ((save.inventory[id] ?? 0) < qty) throw new GameError('item_missing');

  save.inventory[id] -= qty;
  if (save.inventory[id] <= 0) delete save.inventory[id];
}

// Lo que cuesta pasar del nivel indicado al siguiente
const xpToNext = (level) => Math.round(config.level.base * config.level.growth ** (level - 1));

function addXp(save, amount, fx, now) {
  const pet = save.pets[save.activePetId];
  const bonus = pet?.evolution && BRANCHES[pet.evolution].perk === 'xpBonus' ? 1.15 : 1;
  const gained = Math.round(amount * bonus);

  save.xp += gained;
  if (gained) fx.push({ type: 'xp', amount: gained });

  while (save.level < config.level.max && save.xp >= xpToNext(save.level)) {
    save.xp -= xpToNext(save.level);
    save.level += 1;
    fx.push({ type: 'level', level: save.level });
    writeDiary(save, now, 'star', 'level', { value: save.level });
    addCoins(save, config.level.coinsPerLevel, fx);

    const reward = LEVEL_REWARDS[save.level];
    if (reward?.coins) addCoins(save, reward.coins, fx);
    if (reward?.item) {
      addItem(save, reward.item);
      fx.push({ type: 'item', id: reward.item, qty: 1 });
    }
  }
}

function writeDiary(save, now, icon, key, data = {}) {
  const pet = save.pets[save.activePetId];

  save.diary.push({ t: now, icon, key, data: { pet: pet?.name ?? '', ...data } });
  save.diary = save.diary.slice(-config.limits.diary);
}

// Foto del momento: no es una imagen, sino lo necesario para volver a dibujar la escena.
// Ocupa muy poco en la base de datos y se ve nítida a cualquier tamaño.
function takePhoto(save, pet, now, reason) {
  save.album.push({
    t: now,
    reason,
    name: pet.name,
    species: pet.species,
    variant: pet.variant,
    evolution: pet.evolution,
    equipped: { ...pet.equipped },
    room: { theme: pet.room.theme, light: pet.room.light, items: pet.room.items.map(({ id, x, y }) => ({ id, x, y })) },
    rainbow: pet.rainbowUntil > now,
  });
  save.album = save.album.slice(-config.limits.album);
}

const recordActivity = (save, id) => {
  if (!save.activities.includes(id)) save.activities.push(id);
  save.stats.activitiesTried = save.activities.length;
};

function countDaily(save, key, amount = 1) {
  save.daily.counters[key] = (save.daily.counters[key] ?? 0) + amount;
}

function markCare(save, pet, now) {
  const today = dayKey(now, save.tz);
  if (pet.lastCareDay !== today) {
    pet.lastCareDay = today;
    pet.careDays += 1;
  }

  const hour = localHour(now, save.tz);
  if (hour >= 1 && hour < 6) save.flags.nightVisit = true;
}

// Comprueba logros y misiones; se llama tras cada acción
function checkProgress(save, fx, now) {
  ACHIEVEMENTS.forEach((achievement) => {
    if (save.achievements[achievement.id]) return;

    const met = achievement.flag
      ? save.flags[achievement.flag] === true
      : (save.stats[achievement.stat] ?? 0) >= achievement.goal;
    if (!met) return;

    save.achievements[achievement.id] = now;
    fx.push({ type: 'achievement', id: achievement.id });
    writeDiary(save, now, achievement.icon, 'achievement', { achievement: achievement.id });
    addCoins(save, achievement.coins, fx);
    addXp(save, 20, fx, now);
  });

  save.daily?.missions.forEach((entry) => {
    const mission = MISSION[entry.id];
    if (entry.done || (save.daily.counters[mission.stat] ?? 0) < mission.goal) return;

    entry.done = true;
    fx.push({ type: 'mission', id: entry.id });
    addCoins(save, mission.coins, fx);
    addXp(save, mission.xp, fx, now);
  });

  const pet = save.pets[save.activePetId];
  if (pet) {
    const tier = config.affinityTiers.reduce((best, entry, index) => (pet.stats.affection >= entry.min ? index : best), 0);

    if (tier > pet.affinityTier) {
      pet.affinityTier = tier;
      fx.push({ type: 'affinity', tier });
      writeDiary(save, now, 'heart', 'affinity');
      addCoins(save, config.affinityGift.coins, fx);
      addItem(save, config.affinityGift.item);
      if (config.affinityTiers[tier].id === 'soulmate') save.flags.soulmate = true;
    }
  }
}

function pickMissions(rng) {
  const pool = [...MISSIONS.pool];
  const picked = [];

  while (picked.length < MISSIONS.count && pool.length) {
    const [mission] = pool.splice(Math.floor(rng() * pool.length), 1);
    picked.push({ id: mission.id, done: false });
  }

  return picked;
}

const dominantTrait = (pet) => Object.entries(pet.traits)
  .reduce((best, entry) => (entry[1] > best[1] ? entry : best), ['care', 0])[0];

// Requisitos de cada rama para esta mascota, para mostrarlos y para comprobarlos
function evolutionStatus(save, pet) {
  const { level, careDays, statMin } = config.evolution;
  const personality = dominantTrait(pet);

  return Object.entries(BRANCHES).map(([id, branch]) => {
    const statOk = !branch.stat || pet.stats[branch.stat] >= statMin;
    const checks = {
      level: save.level >= level,
      careDays: pet.careDays >= careDays,
      personality: personality === branch.personality,
      stat: statOk,
    };

    return { id, checks, ready: !pet.evolution && Object.values(checks).every(Boolean) };
  });
}

// Por qué se puede (o no) adoptar cada especie
function speciesStatus(save, species) {
  const { unlock = {} } = species;
  const owned = Object.values(save.pets).some((pet) => pet.species === species.id);
  const isFree = species.starter || save.unlockedSpecies.includes(species.id);

  const checks = [];
  if (!species.starter && !save.unlockedSpecies.includes(species.id)) {
    if (unlock.flag) {
      checks.push({ type: 'flagOrLevel', flag: unlock.flag, level: unlock.level, met: save.flags[unlock.flag] === true || save.level >= unlock.level });
    } else if (unlock.level) {
      checks.push({ type: 'level', level: unlock.level, met: save.level >= unlock.level });
    }
    if (unlock.achievement) checks.push({ type: 'achievement', id: unlock.achievement, met: Boolean(save.achievements[unlock.achievement]) });
    if (unlock.ticket) checks.push({ type: 'ticket', met: false });
  }

  // La primera mascota inicial es gratis; una especie ya pagada no se cobra dos veces
  const hasPets = Object.keys(save.pets).length > 0;
  const paid = save.unlockedSpecies.includes(species.id);
  const starterPrice = hasPets ? config.adoption.starterPrice : 0;
  const price = species.starter ? starterPrice : (paid ? 0 : unlock.coins ?? 0);

  return { id: species.id, owned, price, checks, unlocked: isFree || checks.every((check) => check.met) };
}

const allSpeciesStatus = (save) => SPECIES.map((species) => speciesStatus(save, species));

module.exports = {
  GameError, increment, dayKey, localHour, isLucky, addCoins, spendCoins, addItem, removeItem,
  xpToNext, addXp, writeDiary, takePhoto, recordActivity, countDaily, markCare, checkProgress,
  pickMissions, dominantTrait, evolutionStatus, speciesStatus, allSpeciesStatus,
};
