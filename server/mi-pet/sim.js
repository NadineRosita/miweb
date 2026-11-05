// El paso del tiempo. No depende de que la página esté abierta: cada vez que llega una
// petición se calcula cuánto ha pasado desde lastTick y se simula ese tramo.

const config = require('./config');
const { BRANCHES, EVENTS, ITEM, SPECIES_BY_ID, EPITAPHS } = require('./catalog');
const { increment, dayKey, localHour, writeDiary, pickMissions } = require('./progress');
const { clamp } = require('./save');

const { HOUR } = config;
const NEEDS = ['hunger', 'energy', 'hygiene', 'fun'];

// Multiplicador de una necesidad según especie y evolución
function decayFactor(pet, need) {
  const species = SPECIES_BY_ID[pet.species];
  let factor = species.mods[need] ?? 1;
  const perk = pet.evolution ? BRANCHES[pet.evolution].perk : null;

  if (perk === 'funDecay' && need === 'fun') factor *= 0.8;
  if (perk === 'hungerDecay' && need === 'hunger') factor *= 0.8;
  if (pet.sick) factor *= config.sickness.decayFactor;
  return factor;
}

function sleepBonus(pet) {
  return pet.room.items.reduce((best, { id }) => Math.max(best, ITEM[id].sleepBonus ?? 1), 1);
}

const needsAverage = (pet) => NEEDS.reduce((sum, need) => sum + pet.stats[need], 0) / NEEDS.length;
const lowNeeds = (pet) => NEEDS.filter((need) => pet.stats[need] < config.sickness.lowNeed).length;

// Estado visible de la mascota. El orden importa: gana el más urgente.
function moodOf(pet) {
  const { stats } = pet;
  const limits = config.states;

  if (pet.asleep) return 'sleeping';
  if (pet.sick) return 'sick';
  if (stats.hunger < limits.hungry) return 'hungry';
  if (stats.energy < limits.tired) return 'tired';
  if (stats.hygiene < limits.dirty) return 'dirty';
  if (stats.fun < limits.bored) return 'bored';
  if (stats.affection >= limits.inLoveAffection && stats.happiness >= limits.inLoveHappiness) return 'inLove';
  if (stats.happiness >= limits.veryHappy) return 'veryHappy';
  if (stats.happiness >= limits.happy) return 'happy';
  return 'neutral';
}

function sleepsNow(pet, hour) {
  const { fromHour, toHour } = config.nightSleep;
  const nocturnal = SPECIES_BY_ID[pet.species].nocturnal;
  const atNight = hour >= fromHour && hour < toHour;
  const atDay = hour >= 10 && hour < 17;

  return nocturnal ? atDay : atNight;
}

function stepPet(pet, hours, floor, hour) {
  const { stats } = pet;
  const lose = (need, amount) => {
    const limit = Math.min(stats[need], floor);
    stats[need] = Math.max(limit, stats[need] - amount);
  };

  NEEDS.forEach((need) => {
    if (need === 'energy' && pet.asleep) return;

    const rate = config.decayPerHour[need] * decayFactor(pet, need);
    lose(need, rate * hours * (pet.asleep ? config.sleepFactor[need] : 1));
  });

  if (pet.asleep) {
    stats.energy = Math.min(100, stats.energy + config.energyPerHourAsleep * sleepBonus(pet) * hours);
    if (stats.energy >= config.nightSleep.wakeAtEnergy && !sleepsNow(pet, hour)) pet.asleep = false;
  } else if (sleepsNow(pet, hour) && stats.energy < config.nightSleep.energyBelow) {
    pet.asleep = true;
  }

  // La felicidad se acerca a lo que dictan las necesidades, sin saltos
  let target = needsAverage(pet) + stats.affection / 10;
  if (stats.hygiene < config.states.dirty) target -= config.statePenalty.dirty;
  if (pet.sick) target -= config.statePenalty.sick;
  const step = config.happinessFollowPerHour * hours;
  stats.happiness = clamp(stats.happiness + clamp(target - stats.happiness, -step, step), 0, 100);
  if (pet.sick) stats.happiness = Math.min(stats.happiness, config.sickness.happinessCap);

  if (lowNeeds(pet) >= config.sickness.lowNeedsRequired) {
    pet.neglectHours += hours;
    pet.traits.neglect += config.personalityPoints.neglect * hours;
  } else {
    pet.neglectHours = Math.max(0, pet.neglectHours - hours);
  }

  pet.messHours += hours;
  if (pet.messHours >= config.mess.perHours) {
    pet.messHours = 0;
    pet.mess = Math.min(config.mess.max, pet.mess + 1);
  }
}

function stepSickness(save, pet, hours, rng, fx, now) {
  const { sickness } = config;

  if (!pet.sick && pet.neglectHours >= sickness.neglectHours && rng() < 1 - (1 - sickness.chancePerHour) ** hours) {
    pet.sick = true;
    fx.push({ type: 'sick' });
    writeDiary(save, now, 'pill', 'sick');
  }

  if (pet.sick) pet.health = Math.max(0, pet.health - sickness.healthLossPerHour * hours);
  else pet.health = Math.min(100, pet.health + sickness.healthRegenPerHour * hours);

  if (pet.health <= sickness.criticalHealth && pet.sick) {
    if (!pet.criticalWarned) fx.push({ type: 'critical' });
    pet.criticalWarned = true;
  } else {
    pet.criticalWarned = false;
  }
}

function killPet(save, pet, now, rng) {
  const epitaph = Math.floor(rng() * EPITAPHS.length);

  save.graveyard.push({
    name: pet.name, species: pet.species, variant: pet.variant, evolution: pet.evolution, born: pet.born, died: now, epitaph,
  });
  save.pendingFuneral = { name: pet.name, species: pet.species, evolution: pet.evolution, variant: pet.variant, epitaph };
  save.flags.funeral = true;

  if (save.expedition?.petId === pet.id) save.expedition = null;
  delete save.pets[pet.id];
  save.activePetId = Object.keys(save.pets)[0] ?? null;
}

// Lo que cambia al empezar un día nuevo en la hora local del jugador
function rollDay(save, now, rng) {
  const key = dayKey(now, save.tz);
  if (save.daily?.key === key) return;

  save.daily = {
    key,
    claimed: false,
    counters: {},
    arcadeCoins: 0,
    arcadeByGame: {},
    interactionXp: 0,
    interactionAffection: 0,
    interactionCount: 0,
    interactionCoins: 0,
    goodCare: false,
    kits: 0,
    missions: pickMissions(rng),
  };
  increment(save, 'daysPlayed');
}

function checkGoodCare(save) {
  const pet = save.pets[save.activePetId];
  if (!pet || save.daily.goodCare) return;

  if (NEEDS.every((need) => pet.stats[need] >= 80)) {
    save.daily.goodCare = true;
    increment(save, 'goodCareDays');
  }
}

function rollEvent(save, hours, now, rng) {
  const { events } = config;

  if (save.pendingEvent && now - save.pendingEvent.at > events.expiresHours * HOUR) save.pendingEvent = null;
  if (save.pendingEvent || !save.activePetId || save.expedition) return;
  if (now - save.lastEventAt < events.cooldownHours * HOUR) return;
  if (rng() >= 1 - (1 - events.chancePerHour) ** hours) return;

  const total = EVENTS.reduce((sum, event) => sum + event.weight, 0);
  let roll = rng() * total;
  const event = EVENTS.find((entry) => {
    roll -= entry.weight;
    return roll < 0;
  }) ?? EVENTS[0];

  save.pendingEvent = { id: event.id, at: now };
  save.lastEventAt = now;
}

// Avanza la partida hasta now. Con varias mascotas, solo la activa pasa el tiempo:
// las demás están en la guardería, y la que está de expedición no pierde necesidades.
function tick(save, now, rng, fx = []) {
  const elapsedMs = Math.max(0, now - save.lastTick);
  const elapsedHours = elapsedMs / HOUR;
  const { maxOfflineHours, offlineFloor, missYouHours, stepMinutes } = config.time;

  rollDay(save, now, rng);

  // Tiempo de juego: solo tramos cortos, que son los de tener la página abierta
  if (elapsedMs < 5 * 60 * 1000) increment(save, 'playMs', elapsedMs);

  const pet = save.pets[save.activePetId];
  const away = save.expedition?.petId === pet?.id;

  if (pet && !away && elapsedHours > 0) {
    const simulated = Math.min(elapsedHours, maxOfflineHours);
    const stepHours = stepMinutes / 60;
    const steps = Math.ceil(simulated / stepHours);
    const hoursPerStep = simulated / steps;
    const floor = elapsedHours > 0.5 ? offlineFloor : 0; // Una ausencia nunca vacía las barras
    const start = now - simulated * HOUR;

    for (let index = 0; index < steps; index += 1) {
      const moment = start + index * hoursPerStep * HOUR;

      stepPet(pet, hoursPerStep, floor, localHour(moment, save.tz));
      stepSickness(save, pet, hoursPerStep, rng, fx, now);

      if (pet.health <= 0) {
        killPet(save, pet, now, rng);
        fx.push({ type: 'death' });
        break;
      }
    }

    if (elapsedHours >= missYouHours && save.pets[pet.id]) {
      fx.push({ type: 'missedYou', hours: Math.round(elapsedHours) });
      writeDiary(save, now, 'heart', 'absence');
    }
  }

  rollEvent(save, Math.min(elapsedHours, maxOfflineHours), now, rng);
  checkGoodCare(save);

  save.lastTick = now;
  return fx;
}

module.exports = { tick, moodOf, checkGoodCare, NEEDS };
