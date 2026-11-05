// Elige qué dice la mascota, sin inteligencia artificial externa: reúne las frases que
// encajan con su especie, estado, nivel, afinidad, hora y acciones recientes, y escoge una.
// Las frases están en server/mi-pet/data/dialogues.js.

const lang = () => (i18n.lang === 'en' ? 1 : 0);

export const L = (pair) => (Array.isArray(pair) ? pair[lang()] ?? pair[0] : pair ?? '');

export function fill(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

export function timeOfDay(hours, config) {
  const { morning, afternoon, night, lateNight } = config;

  if (hours >= lateNight && hours < morning) return 'lateNight';
  if (hours >= night || hours < lateNight) return 'night';
  if (hours >= afternoon) return 'afternoon';
  return 'morning';
}

const recent = [];

// Evita repetir las últimas frases
function pick(pool) {
  const fresh = pool.filter((line) => !recent.includes(line));
  const options = fresh.length ? fresh : pool;
  const line = options[Math.floor(Math.random() * options.length)];

  recent.push(line);
  if (recent.length > 8) recent.shift();
  return line;
}

// key: una reacción concreta (feed, pet…) o nada para una frase espontánea
export function chooseLine(pet, state, catalog, username, key = null) {
  const { common, species, affinity, branch } = catalog.dialogues;
  const own = species[pet.species] ?? {};
  const vars = { pet: pet.name, user: username };
  const tiers = catalog.config.affinityTiers;
  let pool = [];

  if (key) {
    pool = [...(common[key] ?? []), ...(own[key] ?? []), ...(own[key] ?? [])];
  } else {
    const period = timeOfDay(new Date().getHours(), catalog.config.dayHours);

    if (pet.critical) pool = [...common.critical];
    else if (['sick', 'sleeping', 'hungry', 'tired', 'dirty', 'bored'].includes(pet.mood)) {
      pool = [...common[pet.mood], ...(own[pet.mood] ?? []), ...(own[pet.mood] ?? [])];
    } else {
      pool = [...common.idle, ...(common[period] ?? []), ...(own[period] ?? [])];
      pool.push(...own.idle, ...own.idle, ...own.idle); // Más peso a lo propio de la especie
      if (common[pet.mood]) pool.push(...common[pet.mood], ...common[pet.mood]);

      tiers.slice(1, pet.affinityTier + 1).forEach((tier) => pool.push(...(affinity[tier.id] ?? [])));
      if (pet.evolution) pool.push(...branch[pet.evolution], ...branch[pet.evolution]);
    }
  }

  if (!pool.length) pool = common.idle;
  return fill(L(pick(pool)), vars);
}
