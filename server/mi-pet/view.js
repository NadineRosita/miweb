// Lo que el navegador recibe de la partida: el estado más los valores calculados,
// para que no tenga que repetir ninguna regla del servidor.

const config = require('./config');
const {
  dominantTrait, evolutionStatus, allSpeciesStatus, xpToNext, isLucky,
} = require('./progress');
const { ITEM } = require('./catalog');
const { moodOf } = require('./sim');

function placedCounts(save) {
  const counts = {};

  Object.values(save.pets).forEach((pet) => pet.room.items.forEach(({ id }) => {
    counts[id] = (counts[id] ?? 0) + 1;
  }));
  return counts;
}

function petView(save, pet, now) {
  return {
    ...pet,
    mood: moodOf(pet),
    personality: dominantTrait(pet),
    critical: pet.sick && pet.health <= config.sickness.criticalHealth,
    rainbow: pet.rainbowUntil > now,
    away: save.expedition?.petId === pet.id,
    evolutionOptions: evolutionStatus(save, pet),
  };
}

function view(save, now, { journal = false } = {}) {
  const { diary, album, ...rest } = save;
  const pets = Object.fromEntries(Object.entries(save.pets).map(([id, pet]) => [id, petView(save, pet, now)]));
  const trip = save.expedition;
  const kitAvailable = Boolean(save.pets[save.activePetId]?.sick)
    && save.coins < ITEM.medicine.price && !save.inventory.medicine
    && save.daily.kits < config.sickness.emergencyKitPerDay;

  return {
    ...rest,
    now,
    pets,
    xpNeeded: xpToNext(save.level),
    lucky: isLucky(save, now),
    placed: placedCounts(save),
    speciesStatus: allSpeciesStatus(save),
    expeditionReady: Boolean(trip && now >= trip.endsAt),
    kitAvailable,
    ...(journal ? { diary, album } : {}),
  };
}

// Versión mínima para el widget de las demás páginas
function widgetView(save, now) {
  const pet = save.pets[save.activePetId];
  if (!pet || !save.settings.widget) return { active: false };

  const { name, species, variant, evolution, equipped, affinityTier } = pet;

  return {
    active: true, name, species, variant, evolution, equipped, affinityTier, mood: moodOf(pet),
    rainbow: pet.rainbowUntil > now,
    away: save.expedition?.petId === pet.id,
  };
}

module.exports = { view, widgetView };
