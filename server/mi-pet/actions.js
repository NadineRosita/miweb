// Todo lo que puede hacer el jugador. Cada acción recibe la partida ya actualizada,
// la modifica y anota en fx lo que el navegador debe celebrar (monedas, logros…).
//
// Las reglas viven aquí: el navegador pide una acción y nunca fija un valor por su cuenta.
// Una acción inválida lanza GameError y no se guarda nada.

const config = require('./config');
const {
  ITEM, SPECIES_BY_ID, THEME, ROOM_LIGHTS, ZONE, EVENT, DAILY_REWARDS, MYSTERY_POOL, FISH, TRIVIA, BRANCHES,
} = require('./catalog');
const {
  GameError, increment, isLucky, addCoins, spendCoins, addItem, removeItem, addXp, writeDiary, takePhoto,
  recordActivity, countDaily, markCare, checkProgress, evolutionStatus, speciesStatus,
} = require('./progress');
const { createPet, clamp, SLOTS } = require('./save');
const { checkGoodCare, NEEDS } = require('./sim');

const { HOUR } = config;
const COMPOUND_KEYS = ['happiness', 'hunger', 'energy', 'hygiene', 'fun', 'affection'];

const fail = (code) => {
  throw new GameError(code);
};

function requirePet(save) {
  const pet = save.pets[save.activePetId];
  if (!pet) fail('no_pet');
  return pet;
}

function requireHomePet(save) {
  const pet = requirePet(save);
  if (save.expedition?.petId === pet.id) fail('pet_away');
  return pet;
}

function applyStats(pet, changes) {
  Object.entries(changes).forEach(([key, value]) => {
    if (COMPOUND_KEYS.includes(key)) pet.stats[key] = clamp(pet.stats[key] + value, 0, 100);
  });
}

const cleanName = (value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > config.name.max) fail('pet_name_invalid');
  return name;
};

function onCooldown(pet, key, now) {
  return (pet.cooldowns[key] ?? 0) > now;
}

const setCooldown = (pet, key, now, ms) => {
  pet.cooldowns[key] = now + ms;
};

function adopt(save, { species, name, variant }, { now, fx }) {
  const data = SPECIES_BY_ID[species];
  if (!data) fail('invalid_request');

  const status = speciesStatus(save, data);
  if (status.owned) fail('species_owned');
  if (!status.unlocked) fail('species_locked');

  const petName = cleanName(name);
  const variants = data.variants?.length ?? 0;
  const chosenVariant = Number.isInteger(variant) && variant >= 0 && variant <= variants ? variant : 0;

  spendCoins(save, status.price);
  if (!save.unlockedSpecies.includes(species) && !data.starter) save.unlockedSpecies.push(species);

  // La primera adopción hereda lo que hubiera en la mascota antigua
  const legacy = save.legacy;
  const statsOverride = legacy && !Object.keys(save.pets).length
    ? { hunger: legacy.food, happiness: legacy.happiness, energy: legacy.energy }
    : {};
  save.legacy = null;

  const previous = Object.keys(save.pets).length > 0;
  const id = `p${save.nextPetId}`;
  save.nextPetId += 1;

  const pet = createPet({ id, species, name: petName, variant: chosenVariant, now, statsOverride });
  save.pets[id] = pet;
  save.activePetId = id;
  addItem(save, 'bedBasic'); // Cada mascota llega con su cama
  pet.room.items.push({ uid: save.nextUid, id: 'bedBasic', x: 1, y: 6 });
  save.nextUid += 1;

  if (!save.discoveredSpecies.includes(species)) save.discoveredSpecies.push(species);
  increment(save, 'petsAdopted');
  writeDiary(save, now, 'heart', previous ? 'metPet' : 'adopted', previous ? { value: petName } : {});
  takePhoto(save, pet, now, 'adopted');
  addXp(save, 10, fx, now);
  fx.push({ type: 'react', key: 'greet' });
}

function rename(save, { name }, { now, fx }) {
  const pet = requirePet(save);

  pet.name = cleanName(name);
  writeDiary(save, now, 'pencil', 'renamed');
  fx.push({ type: 'react', key: 'renamed' });
}

function switchPet(save, { petId }, { fx }) {
  if (!save.pets[petId]) fail('invalid_request');
  save.activePetId = petId;
  fx.push({ type: 'react', key: 'greet' });
}

function interact(save, { kind }, { now, fx }) {
  const rule = config.interactions[kind];
  if (!rule || !Object.hasOwn(config.interactions, kind)) fail('invalid_request');

  const pet = requireHomePet(save);
  if (onCooldown(pet, kind, now)) fail('on_cooldown');

  setCooldown(pet, kind, now, rule.cooldownSec * 1000);
  const { daily } = save;
  const limits = config.interactionDaily;
  const { xp, affection, cooldownSec, ...stats } = rule;

  applyStats(pet, stats);

  const affectionGain = Math.min(affection, limits.affectionCap - daily.interactionAffection);
  if (affectionGain > 0) {
    pet.stats.affection = Math.min(100, pet.stats.affection + affectionGain);
    daily.interactionAffection += affectionGain;
  }

  const xpGain = Math.min(xp, limits.xpCap - daily.interactionXp);
  if (xpGain > 0) {
    daily.interactionXp += xpGain;
    addXp(save, xpGain, fx, now);
  }

  daily.interactionCount += 1;
  if (daily.interactionCount % limits.coinsEvery === 0 && daily.interactionCoins < limits.coinsCap) {
    daily.interactionCoins += limits.coins;
    addCoins(save, limits.coins, fx);
  }

  pet.traits.care += config.personalityPoints.care * 0.25;
  pet.lastInteraction = now;
  countDaily(save, 'interactions');
  increment(save, 'interactions');
  recordActivity(save, `interact:${kind}`);
  markCare(save, pet, now);
  fx.push({ type: 'react', key: pet.asleep ? 'sleeping' : kind });
}

function toggleSleep(save, _payload, { now, fx }) {
  const pet = requireHomePet(save);

  pet.asleep = !pet.asleep;
  recordActivity(save, 'sleep');
  markCare(save, pet, now);
  fx.push({ type: 'react', key: pet.asleep ? 'sleep' : 'wake' });
}

function bath(save, _payload, { now, fx }) {
  const pet = requireHomePet(save);
  const rule = config.actions.bath;

  if (onCooldown(pet, 'bath', now)) fail('on_cooldown');
  setCooldown(pet, 'bath', now, rule.cooldownMin * 60000);

  pet.asleep = false;
  applyStats(pet, { hygiene: rule.hygiene, happiness: rule.happiness });
  pet.traits.care += config.personalityPoints.care;
  countDaily(save, 'baths');
  recordActivity(save, 'bath');
  markCare(save, pet, now);
  addXp(save, rule.xp, fx, now);
  fx.push({ type: 'react', key: 'bath' });
}

function cleanRoom(save, _payload, { now, fx }) {
  const pet = requireHomePet(save);
  const rule = config.actions.cleanRoom;

  if (!pet.mess) fail('room_already_clean');
  const cleaned = pet.mess;

  pet.mess = 0;
  applyStats(pet, { hygiene: rule.hygiene, happiness: rule.happiness });
  countDaily(save, 'cleans');
  recordActivity(save, 'clean');
  markCare(save, pet, now);
  addCoins(save, rule.coins * cleaned, fx);
  addXp(save, rule.xp, fx, now);
  fx.push({ type: 'react', key: 'clean' });
}

function playWithPet(save, _payload, { now, fx }) {
  const pet = requireHomePet(save);
  const rule = config.actions.petPlay;

  if (pet.stats.energy < -rule.energy) fail('too_tired');
  if (onCooldown(pet, 'play', now)) fail('on_cooldown');
  setCooldown(pet, 'play', now, rule.cooldownMin * 60000);

  pet.asleep = false;
  applyStats(pet, { fun: rule.fun, happiness: rule.happiness, energy: rule.energy, hunger: rule.hunger });
  pet.traits.care += config.personalityPoints.care * 0.5;
  countDaily(save, 'plays');
  recordActivity(save, 'play');
  markCare(save, pet, now);
  addXp(save, rule.xp, fx, now);
  fx.push({ type: 'react', key: 'play' });
}

function buy(save, { itemId, qty = 1 }, { now, fx }) {
  const item = ITEM[itemId];
  if (!item || !Number.isInteger(qty) || qty < 1 || qty > config.limits.cart) fail('invalid_request');
  if (item.price === null) fail('not_for_sale');
  if ((item.level ?? 1) > save.level) fail('level_too_low');
  if (item.cat === 'accessory' && (save.inventory[itemId] || qty > 1)) fail('already_owned');

  spendCoins(save, item.price * qty);
  addItem(save, itemId, qty);
  increment(save, 'itemsBought', qty);
  recordActivity(save, 'shop');

  if (item.cat === 'furniture' || item.cat === 'accessory' || item.cat === 'special') {
    writeDiary(save, now, 'bag', item.cat === 'furniture' ? 'furniture' : 'item', { item: itemId });
  }
  fx.push({ type: 'bought', id: itemId, qty });
}

function pickWeighted(pool, rng) {
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;

  return pool.find((entry) => {
    roll -= entry.weight;
    return roll < 0;
  }) ?? pool[0];
}

function useSpecial(save, pet, item, { now, rng, fx }) {
  switch (item.action) {
    case 'rainbow':
      pet.rainbowUntil = now + config.rainbow.hours * HOUR;
      break;
    case 'personality': {
      const keys = Object.keys(pet.traits);
      const top = Math.max(...Object.values(pet.traits));
      const current = keys.reduce((best, key) => (pet.traits[key] > pet.traits[best] ? key : best), keys[0]);
      const next = keys[(keys.indexOf(current) + 1) % keys.length];
      pet.traits[next] = top + 1;
      fx.push({ type: 'personality', value: next });
      break;
    }
    case 'timeMachine': {
      const lowest = NEEDS.reduce((best, need) => (pet.stats[need] < pet.stats[best] ? need : best), NEEDS[0]);
      pet.stats[lowest] = 100;
      fx.push({ type: 'restored', stat: lowest });
      break;
    }
    case 'mystery': {
      const { id } = pickWeighted(MYSTERY_POOL, rng);
      addItem(save, id);
      fx.push({ type: 'item', id, qty: 1 });
      writeDiary(save, now, 'box', 'item', { item: id });
      break;
    }
    case 'luck':
      save.luckUntil = Math.max(save.luckUntil, now) + config.luck.hours * HOUR;
      break;
    case 'ticket':
      if (!save.unlockedSpecies.includes('cat')) save.unlockedSpecies.push('cat');
      fx.push({ type: 'unlockedSpecies', id: 'cat' });
      break;
    default:
      fail('item_not_usable');
  }
}

function useItem(save, { itemId }, context) {
  const { now, fx } = context;
  const item = ITEM[itemId];
  if (!item || !save.inventory[itemId]) fail('item_missing');
  const pet = requireHomePet(save);

  if (item.cat === 'accessory' || item.cat === 'furniture') fail('item_not_usable');
  if (item.action === 'evolve') fail('use_evolution_panel');
  if (item.effect?.cure && !item.effect.health && !pet.sick) fail('pet_not_sick');

  removeItem(save, itemId);
  pet.asleep = false;

  if (item.cat === 'special') {
    useSpecial(save, pet, item, context);
    recordActivity(save, 'special');
  } else {
    const { cure, health, ...stats } = item.effect;

    applyStats(pet, stats);
    if (health) pet.health = Math.min(100, pet.health + health);
    if (cure && pet.sick) {
      pet.sick = false;
      pet.neglectHours = 0;
      writeDiary(save, now, 'pill', 'cured');
    }

    const isMeal = item.cat === 'food' || item.cat === 'drink';
    if (isMeal) {
      countDaily(save, 'consumed');
      increment(save, 'itemsConsumed');
      recordActivity(save, 'feed');
    }
    pet.traits.care += config.personalityPoints.care;
    pet.lastInteraction = now;
    applyStats(pet, { affection: 0.5 });
    markCare(save, pet, now);
    addXp(save, 3, fx, now);
    fx.push({ type: 'react', key: isMeal ? 'feed' : 'medicine' });
  }

  fx.push({ type: 'used', id: itemId });
}

// Si la mascota enferma y no te llega para la medicina, una vez al día hay botiquín gratis:
// nadie debería perder una mascota por no tener monedas.
function emergencyKit(save, _payload, { fx }) {
  const pet = requirePet(save);

  if (!pet.sick) fail('pet_not_sick');
  if (save.coins >= ITEM.medicine.price || save.inventory.medicine) fail('kit_not_needed');
  if (save.daily.kits >= config.sickness.emergencyKitPerDay) fail('kit_used_today');

  save.daily.kits += 1;
  addItem(save, 'medicine');
  fx.push({ type: 'item', id: 'medicine', qty: 1 });
}

function equip(save, { itemId }, { now, fx }) {
  const item = ITEM[itemId];
  if (item?.cat !== 'accessory' || !save.inventory[itemId]) fail('item_missing');

  const pet = requirePet(save);
  pet.equipped[item.slot] = itemId;
  recordActivity(save, 'dress');
  writeDiary(save, now, 'bag', 'accessory', { item: itemId });
  fx.push({ type: 'react', key: 'gift' });
}

function unequip(save, { slot }) {
  if (!SLOTS.includes(slot)) fail('invalid_request');
  delete requirePet(save).equipped[slot];
}

// ---------- Habitación ----------
function placedCount(save, itemId) {
  return Object.values(save.pets)
    .reduce((sum, pet) => sum + pet.room.items.filter((entry) => entry.id === itemId).length, 0);
}

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function assertFits(pet, item, x, y, ignoreUid) {
  const { cols, rows, wallRows } = config.room;
  const box = { x, y, w: item.w, h: item.h };

  if (!Number.isInteger(x) || !Number.isInteger(y)) fail('invalid_request');

  const [top, bottom] = item.layer === 'wall' ? [0, wallRows] : [wallRows, rows];
  if (x < 0 || x + item.w > cols || y < top || y + item.h > bottom) fail('position_invalid');

  // Las alfombras van bajo los muebles: cada capa solo choca consigo misma
  pet.room.items.forEach((entry) => {
    const other = ITEM[entry.id];
    if (entry.uid === ignoreUid || other.layer !== item.layer) return;
    if (overlaps(box, { x: entry.x, y: entry.y, w: other.w, h: other.h })) fail('position_taken');
  });
}

function placeFurniture(save, { itemId, x, y }, { now, fx }) {
  const item = ITEM[itemId];
  if (item?.cat !== 'furniture') fail('invalid_request');
  if ((save.inventory[itemId] ?? 0) <= placedCount(save, itemId)) fail('item_missing');

  const pet = requirePet(save);
  assertFits(pet, item, x, y);
  pet.room.items.push({ uid: save.nextUid, id: itemId, x, y });
  save.nextUid += 1;
  increment(save, 'furniturePlaced');
  recordActivity(save, 'decorate');
  markCare(save, pet, now);
  fx.push({ type: 'placed' });
}

function findPlaced(pet, uid) {
  const entry = pet.room.items.find((candidate) => candidate.uid === uid);
  if (!entry) fail('invalid_request');
  return entry;
}

function moveFurniture(save, { uid, x, y }) {
  const pet = requirePet(save);
  const entry = findPlaced(pet, uid);

  assertFits(pet, ITEM[entry.id], x, y, uid);
  entry.x = x;
  entry.y = y;
}

function removeFurniture(save, { uid }) {
  const pet = requirePet(save);

  findPlaced(pet, uid);
  pet.room.items = pet.room.items.filter((entry) => entry.uid !== uid);
}

function buyTheme(save, { theme }, { fx }) {
  const data = THEME[theme];
  if (!data) fail('invalid_request');
  if (save.roomThemes.includes(theme)) fail('already_owned');
  if (data.level > save.level) fail('level_too_low');

  spendCoins(save, data.price);
  save.roomThemes.push(theme);
  fx.push({ type: 'bought', theme });
}

function setRoom(save, { theme, light }) {
  const pet = requirePet(save);

  if (theme !== undefined) {
    if (!save.roomThemes.includes(theme)) fail('theme_locked');
    pet.room.theme = theme;
  }
  if (light !== undefined) {
    if (!ROOM_LIGHTS.includes(light)) fail('invalid_request');
    pet.room.light = light;
  }
}

function useFurniture(save, { uid }, { now, rng, fx }) {
  const pet = requireHomePet(save);
  const entry = findPlaced(pet, uid);
  const item = ITEM[entry.id];
  const rule = config.actions.furniture;
  const ready = !onCooldown(pet, `use:${entry.id}`, now);

  if (item.use === 'trivia') fx.push({ type: 'trivia', index: Math.floor(rng() * TRIVIA.length) });
  if (!ready) return;

  setCooldown(pet, `use:${entry.id}`, now, rule.cooldownMin * 60000);

  if (item.use === 'aquarium') applyStats(pet, { fun: 18 });
  else if (item.use === 'sofa') applyStats(pet, { fun: 8, energy: 5 });
  else if (item.use === 'trivia') pet.traits.smart += config.personalityPoints.smart;
  else return;

  recordActivity(save, `furniture:${item.use}`);
  addXp(save, rule.xp, fx, now);
}

// ---------- Arcade ----------
function gameRule(save, game) {
  const rule = config.arcade.games[game];
  if (!rule || !Object.hasOwn(config.arcade.games, game)) fail('invalid_request');
  if ((rule.level ?? 1) > save.level) fail('level_too_low');
  if (rule.furniture && !save.inventory[rule.furniture]) fail('needs_furniture');
  return rule;
}

function arcadeStart(save, { game }, { now }) {
  gameRule(save, game);
  save.arcadeSession = { game, startedAt: now };
}

function fishCatch(save, rng, fx) {
  const fish = pickWeighted(FISH, rng);

  if (fish.rarity === 'legendary') save.flags.legendaryCatch = true;
  fx.push({ type: 'fish', id: fish.id });
  return fish.score;
}

// Los minijuegos corren en el navegador, así que la puntuación no es de fiar del todo:
// se rechaza la imposible por duración y los topes diarios limitan lo que se puede ganar.
function arcadeFinish(save, { game, score, difficulty = 'normal' }, { now, rng, fx }) {
  const rule = gameRule(save, game);
  const session = save.arcadeSession;
  if (session?.game !== game) fail('no_game_session');
  save.arcadeSession = null;

  const seconds = (now - session.startedAt) / 1000;
  const expired = seconds > config.arcade.sessionMaxHours * 3600;
  let points = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;

  if (game === 'fishing' && points > 0) points = fishCatch(save, rng, fx);

  const plausible = !expired && seconds >= rule.minSeconds && points <= seconds * rule.maxScorePerSecond;

  if (!plausible) {
    fx.push({ type: 'arcade', game, score: 0, coins: 0, rejected: points > 0 });
    return;
  }

  const multiplier = config.arcade.difficulty[difficulty] ?? 1;
  const earned = Math.min(rule.maxCoins, Math.floor(points * rule.coinsPerPoint * multiplier));
  const { daily } = save;
  const gameLeft = rule.dailyCap - (daily.arcadeByGame[game] ?? 0);
  const totalLeft = config.arcade.dailyCoinsCap - daily.arcadeCoins;
  const coins = Math.max(0, Math.min(earned, gameLeft, totalLeft));
  const paid = Math.floor(coins * (isLucky(save, now) ? config.luck.multiplier : 1));

  daily.arcadeByGame[game] = (daily.arcadeByGame[game] ?? 0) + coins;
  daily.arcadeCoins += coins;

  const newRecord = points > (save.records[game] ?? 0);
  if (newRecord) save.records[game] = points;

  increment(save, 'gamesPlayed');
  countDaily(save, 'games');
  recordActivity(save, `arcade:${game}`);

  const pet = save.pets[save.activePetId];
  if (pet) {
    if (save.expedition?.petId !== pet.id) applyStats(pet, config.arcade.needs);
    pet.traits.smart += config.personalityPoints.smart;
  }

  addCoins(save, paid, fx);
  addXp(save, rule.xpPerGame, fx, now);
  fx.push({ type: 'arcade', game, score: points, coins: paid, capped: coins < earned, newRecord });
}

// ---------- Eventos, recompensa diaria y expediciones ----------
const rangeRoll = ([min, max], rng) => min + Math.floor(rng() * (max - min + 1));

function eventClaim(save, _payload, { now, rng, fx }) {
  if (!save.pendingEvent) fail('no_event');

  const event = EVENT[save.pendingEvent.id];
  const { reward } = event;
  const pet = save.pets[save.activePetId];
  save.pendingEvent = null;

  if (reward.coins) addCoins(save, rangeRoll(reward.coins, rng) * (isLucky(save, now) ? config.luck.multiplier : 1), fx);
  if (reward.item) {
    addItem(save, reward.item);
    fx.push({ type: 'item', id: reward.item, qty: 1 });
  }
  if (reward.randomItem) {
    const id = reward.randomItem[Math.floor(rng() * reward.randomItem.length)];
    addItem(save, id);
    fx.push({ type: 'item', id, qty: 1 });
  }
  if (reward.stats && pet) applyStats(pet, reward.stats);
  if (reward.flag) save.flags[reward.flag] = true;
  if (reward.xp) addXp(save, reward.xp, fx, now);

  increment(save, 'eventsSeen');
  recordActivity(save, 'event');
  writeDiary(save, now, event.icon, 'event', { event: event.id });
}

function dailyClaim(save, _payload, { now, fx }) {
  if (save.daily.claimed) fail('daily_claimed');

  const reward = DAILY_REWARDS[save.dailyClaims % DAILY_REWARDS.length];
  save.daily.claimed = true;
  save.dailyClaims += 1;
  increment(save, 'dailyClaims');

  if (reward.coins) addCoins(save, reward.coins, fx);
  if (reward.item) {
    addItem(save, reward.item, reward.qty);
    fx.push({ type: 'item', id: reward.item, qty: reward.qty });
  }
  addXp(save, 8, fx, now);
}

function exploreStart(save, { zone }, { now, fx }) {
  const data = ZONE[zone];
  if (!data) fail('invalid_request');
  if (save.expedition) fail('expedition_running');

  const pet = requireHomePet(save);
  if (data.level > save.level) fail('level_too_low');
  if (data.achievement && !save.achievements[data.achievement]) fail('zone_locked');
  if (pet.sick) fail('pet_is_sick');
  if (pet.stats.energy < data.energy) fail('too_tired');

  const fast = pet.evolution && BRANCHES[pet.evolution].perk === 'fastExplore';
  const minutes = data.minutes * (fast ? 1 - config.explorationBoostPercent / 100 : 1);

  pet.asleep = false;
  applyStats(pet, { energy: -data.energy });
  markCare(save, pet, now);
  save.expedition = { petId: pet.id, zone, startedAt: now, endsAt: now + minutes * 60000 };
  fx.push({ type: 'react', key: 'expedition' });
}

function exploreClaim(save, _payload, { now, rng, fx }) {
  const trip = save.expedition;
  if (!trip) fail('no_expedition');
  if (now < trip.endsAt) fail('expedition_running');

  const zone = ZONE[trip.zone];
  const pet = save.pets[trip.petId];
  const found = zone.items.filter((entry) => rng() < entry.chance).map((entry) => entry.id);
  const collectible = rng() < 0.5 ? zone.collectibles[Math.floor(rng() * zone.collectibles.length)] : null;
  const story = Math.floor(rng() * zone.stories.length);
  const coins = rangeRoll(zone.coins, rng) * (isLucky(save, now) ? config.luck.multiplier : 1);

  save.expedition = null;
  found.forEach((id) => addItem(save, id));
  if (collectible) save.collectibles[collectible] = (save.collectibles[collectible] ?? 0) + 1;

  const earned = addCoins(save, coins, fx);
  addXp(save, zone.xp, fx, now);

  if (pet) {
    pet.traits.adventure += config.personalityPoints.adventure;
    applyStats(pet, { fun: 15, happiness: 6, hygiene: -10, hunger: -10 });
  }

  increment(save, `zone_${zone.id}`);
  if (save.stats[`zone_${zone.id}`] === 1) increment(save, 'zonesVisited');
  increment(save, 'expeditions');
  countDaily(save, 'expeditions');
  recordActivity(save, 'explore');
  writeDiary(save, now, 'compass', 'expedition', { zone: zone.id });
  fx.push({ type: 'expedition', zone: zone.id, story, items: found, collectible, coins: earned, xp: zone.xp });
  fx.push({ type: 'react', key: 'back' });
}

// ---------- Evolución y otros ----------
function evolve(save, { branch }, { now, fx }) {
  const pet = requireHomePet(save);
  const status = evolutionStatus(save, pet).find((entry) => entry.id === branch);

  if (!status) fail('invalid_request');
  if (!status.ready) fail('evolution_not_ready');
  if (!save.inventory.growthPotion) fail('needs_growth_potion');

  removeItem(save, 'growthPotion');
  pet.evolution = branch;
  applyStats(pet, { happiness: 30, hunger: 30, energy: 30, hygiene: 30, fun: 30 });

  const key = `${pet.species}:${branch}`;
  if (!save.discoveredEvolutions.includes(key)) save.discoveredEvolutions.push(key);

  increment(save, 'evolutions');
  writeDiary(save, now, 'star', 'evolved', { species: pet.species, branch });
  takePhoto(save, pet, now, 'evolved');
  addXp(save, 50, fx, now);
  fx.push({ type: 'evolved', branch });
  fx.push({ type: 'react', key: 'evolve' });
}

function photo(save, _payload, { now, fx }) {
  const pet = requireHomePet(save);

  takePhoto(save, pet, now, 'photo');
  writeDiary(save, now, 'camera', 'photo');
  recordActivity(save, 'photo');
  fx.push({ type: 'photo' });
}

function ackFuneral(save) {
  save.pendingFuneral = null;
}

function settings(save, payload) {
  const { volume, muted, music, widget } = payload;

  if (Number.isFinite(volume)) save.settings.volume = clamp(volume, 0, 1);
  if (typeof muted === 'boolean') save.settings.muted = muted;
  if (typeof music === 'boolean') save.settings.music = music;
  if (typeof widget === 'boolean') save.settings.widget = widget;
}

function dismissRecovered(save) {
  save.recovered = false;
}

const ACTIONS = {
  adopt, rename, switchPet, interact, toggleSleep, bath, cleanRoom, playWithPet, buy, useItem, emergencyKit,
  equip, unequip, placeFurniture, moveFurniture, removeFurniture, buyTheme, setRoom, useFurniture,
  arcadeStart, arcadeFinish, eventClaim, dailyClaim, exploreStart, exploreClaim, evolve, photo,
  ackFuneral, settings, dismissRecovered,
};

// Punto de entrada: aplica la acción y revisa logros y misiones
function applyAction(save, type, payload, context) {
  if (!Object.hasOwn(ACTIONS, type)) fail('invalid_request');

  const body = typeof payload === 'object' && payload !== null ? payload : {};

  ACTIONS[type](save, body, context);
  checkGoodCare(save);
  checkProgress(save, context.fx, context.now);
  return context.fx;
}

module.exports = { applyAction };
