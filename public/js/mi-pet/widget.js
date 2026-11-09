// Mascota de las demás páginas: pasea por el borde inferior de la pantalla y reacciona.
//
// layout.js solo carga este archivo si el navegador ya ha jugado (ver WIDGET_FLAG en juego.js),
// así que quien no tiene partida no hace ninguna petición. Su estilo vive en su propio CSS
// para no añadir nada a las páginas que no lo usan.
//
// Reacciona a: el clic (salta y dice algo), el cursor cuando se acerca (se para y lo mira)
// y su propio estado (dormida o enferma no pasea). El botón de la esquina la oculta.

import { fill, L, pick, timeOfDay } from './dialogos.js';
import { motionFor, petFrame, SPRITE_SIZE } from './sprites.js';

const COLLAPSED_KEY = 'mipet-widget-collapsed';
const SPEAK_MS = [25000, 60000];
const BUBBLE_MS = 6000;
const FPS = 5;
const MARGIN = 16;
const SCALE = 3; // La velocidad de la habitación está en píxeles de sprite: aquí se amplía
const CURIOUS_RADIUS = 130; // Distancia del cursor a la que se para a mirarlo
const REACT_MS = 1600;
const WATCH_COOLDOWN_MS = 30000;
const CORNER = 56; // Hueco a la derecha para el botón de ocultar
// En estas páginas hay mucho que pulsar: empieza recogido para no estorbar
const BUSY_PAGES = ['ajedrez'];
const TEXTS = {
  es: { open: 'Ir con', hide: 'Ocultar mascota', show: 'Mostrar mascota', pet: 'Acariciar a' },
  en: { open: 'Go to', hide: 'Hide pet', show: 'Show pet', pet: 'Pet' },
};

const text = (key) => TEXTS[i18n.lang]?.[key] ?? TEXTS.es[key];

function poseFor(mood) {
  if (mood === 'sleeping') return 'sleeping';
  if (mood === 'sick') return 'sick';
  if (['hungry', 'tired', 'dirty', 'bored'].includes(mood)) return 'sad';
  return mood === 'veryHappy' || mood === 'inLove' ? 'happy' : 'idle';
}

// key: una reacción concreta (poke, watch…) o nada para una frase espontánea
function pickLine(pet, catalog, key = null) {
  const { common, species, affinity, branch } = catalog.dialogues;
  const own = species[pet.species] ?? {};
  const page = common[`page_${document.body.dataset.page}`] ?? [];
  let pool;

  if (key) {
    pool = [...(common[key] ?? []), ...(own[key] ?? [])];
  } else if (['sick', 'sleeping', 'hungry', 'tired', 'dirty', 'bored'].includes(pet.mood)) {
    // Si le pasa algo, habla de ello; de vez en cuando también de la web
    pool = [...common[pet.mood], ...(own[pet.mood] ?? []), ...(own[pet.mood] ?? []), ...common.web.slice(0, 4)];
  } else {
    const period = timeOfDay(new Date().getHours(), catalog.config.dayHours);
    const tiers = catalog.config.affinityTiers;

    pool = [...common.idle, ...common.web, ...common.web, ...page, ...page, ...(common[period] ?? []), ...(own[period] ?? [])];
    pool.push(...(own.idle ?? []), ...(own.idle ?? []));
    if (common[pet.mood]) pool.push(...common[pet.mood]);
    tiers.slice(1, (pet.affinityTier ?? 0) + 1).forEach((tier) => pool.push(...(affinity[tier.id] ?? [])));
    if (pet.evolution) pool.push(...(branch[pet.evolution] ?? []));
  }

  // Aquí no se sabe el nombre del jugador: se descartan las frases que lo usan
  const lines = pool.filter(([line]) => !line.includes('{user}'));

  return fill(L(pick(lines.length ? lines : common.web)), { pet: pet.name });
}

async function fetchJson(path) {
  const response = await fetch(path);
  return response.ok ? response.json() : null;
}

function keepAboveFooter(root) {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const place = () => {
    const overlap = window.innerHeight - footer.getBoundingClientRect().top;
    root.style.bottom = `${Math.max(MARGIN, overlap + MARGIN)}px`;
  };

  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
  place();
}

function mount(pet, catalog) {
  const link = document.createElement('link');
  const root = document.createElement('aside');
  const startsCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1'
    || (BUSY_PAGES.includes(document.body.dataset.page) && localStorage.getItem(COLLAPSED_KEY) !== '0');

  link.rel = 'stylesheet';
  link.href = 'css/mi-pet-widget.css';
  document.head.append(link);

  root.className = 'pet-widget';
  root.classList.toggle('is-collapsed', startsCollapsed);
  root.setAttribute('aria-label', pet.name);
  root.innerHTML = `
    <div class="pet-widget-walker">
      <p class="pet-widget-bubble" role="status" hidden></p>
      <button type="button" class="pet-widget-pet"><canvas width="${SPRITE_SIZE}" height="${SPRITE_SIZE}"></canvas></button>
      <a class="pet-widget-home" href="mi-pet.html">↗</a>
    </div>
    <button type="button" class="pet-widget-toggle" aria-expanded="${!startsCollapsed}"></button>
  `;
  document.body.append(root);

  const walker = root.querySelector('.pet-widget-walker');
  const toggle = root.querySelector('.pet-widget-toggle');
  const bubble = root.querySelector('.pet-widget-bubble');
  const body = root.querySelector('.pet-widget-pet');
  const home = root.querySelector('.pet-widget-home');
  const ctx = root.querySelector('canvas').getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = motionFor(pet.species);
  const stays = pet.away || ['sleeping', 'sick'].includes(pet.mood); // Dormida o enferma no pasea
  const lift = { fly: 22, float: 8 }[motion.style] ?? 0;
  const slow = ['hungry', 'tired', 'dirty', 'bored'].includes(pet.mood) ? 0.6 : 1;
  const speed = Math.max(motion.speed * SCALE, 8) * slow;

  const state = {
    x: 0, dir: -1, target: null, restUntil: 0, reactUntil: 0,
    frame: 0, nextFrame: 0, cursor: null, speakUntil: 0,
    lastWatch: 0, lastClick: 0, clicks: 0,
  };
  let bubbleTimer = null;

  const collapsed = () => root.classList.contains('is-collapsed');
  const size = () => body.offsetWidth || 64;
  const bounds = () => [MARGIN, Math.max(MARGIN, window.innerWidth - size() - CORNER)];

  const pose = () => {
    if (performance.now() < state.reactUntil) return 'happy';
    if (state.target !== null || pet.away) return 'walk';
    return poseFor(pet.mood);
  };

  const paint = () => {
    ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    // Los sprites miran a la derecha: se voltean al ir hacia la izquierda
    ctx.drawImage(petFrame(pet, pose(), state.frame % 4, catalog, { flip: state.dir < 0, tick: state.frame }), 0, 0);
  };

  const place = () => {
    walker.style.transform = `translate3d(${Math.round(state.x)}px, ${-lift}px, 0)`;
  };

  const showBubble = (line) => {
    bubble.textContent = line;
    bubble.hidden = false;
    // Se centra sobre la mascota sin salirse de la pantalla (mientras habla no se mueve)
    const width = bubble.offsetWidth;
    const center = state.x + size() / 2;
    const left = Math.min(Math.max(center - width / 2, 8), window.innerWidth - width - 8);

    bubble.style.left = `${Math.round(left - state.x)}px`;
    state.speakUntil = performance.now() + BUBBLE_MS;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.hidden = true;
    }, BUBBLE_MS);
  };

  const speak = (key = null) => {
    if (collapsed() || document.hidden) return;
    if (pet.away && !key) return;
    showBubble(pickLine(pet, catalog, key));
  };

  const scheduleSpeech = () => {
    setTimeout(() => {
      speak();
      scheduleSpeech();
    }, SPEAK_MS[0] + Math.random() * (SPEAK_MS[1] - SPEAK_MS[0]));
  };

  const rest = (now) => {
    const [min, max] = motion.rest;

    state.target = null;
    // Los descansos de la habitación llegan a 30 s: demasiado en una página que se está leyendo
    state.restUntil = now + (Math.min(min, 6) + Math.random() * Math.min(max - min, 8)) * 1000;
  };

  const choose = (now) => {
    const [min, max] = bounds();
    const goRight = Math.random() < (state.x < (min + max) / 2 ? 0.6 : 0.4); // Tiende a cruzar la pantalla
    const distance = 80 + Math.random() * 260;
    const target = Math.min(max, Math.max(min, state.x + (goRight ? distance : -distance)));

    if (Math.abs(target - state.x) < 24) {
      rest(now);
      return;
    }
    state.target = target;
    state.dir = target > state.x ? 1 : -1;
  };

  // Si el cursor anda cerca, se para y lo mira
  const watchCursor = (now) => {
    if (!state.cursor) return false;

    const rect = body.getBoundingClientRect();
    const dx = state.cursor.x - (rect.left + rect.width / 2);
    const dy = state.cursor.y - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) > CURIOUS_RADIUS) return false;

    state.dir = dx >= 0 ? 1 : -1;
    state.target = null;
    state.restUntil = Math.max(state.restUntil, now + 600);
    // Al notar el cursor lo comenta, pero no cada vez que pasa por delante
    if (now - state.lastWatch > WATCH_COOLDOWN_MS && !stays) {
      state.lastWatch = now;
      if (Math.random() < 0.5) speak('watch');
    }
    return true;
  };

  const react = () => {
    const now = performance.now();

    // Varios clics seguidos tienen su propia reacción
    state.clicks = now - state.lastClick < 3000 ? state.clicks + 1 : 1;
    state.lastClick = now;
    state.reactUntil = now + REACT_MS;
    state.target = null;
    state.restUntil = now + REACT_MS + 800;
    speak(state.clicks >= 4 ? 'poked' : 'poke');
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (!collapsed() && !document.hidden) {
      const idle = now < state.speakUntil || now < state.reactUntil || watchCursor(now);

      if (now >= state.nextFrame) {
        state.frame += 1;
        state.nextFrame = now + 1000 / FPS;
      }

      if (!stays && !idle) {
        if (state.target === null && now >= state.restUntil) choose(now);

        if (state.target !== null) {
          state.x += speed * dt * state.dir;
          if ((state.dir > 0 && state.x >= state.target) || (state.dir < 0 && state.x <= state.target)) {
            state.x = state.target;
            rest(now);
          }
        }
      }

      const [min, max] = bounds();
      state.x = Math.min(max, Math.max(min, state.x));
      place();
      paint();
    }

    requestAnimationFrame(loop);
  };

  const label = () => {
    const hidden = collapsed();

    toggle.textContent = hidden ? '🐾' : '×';
    toggle.setAttribute('aria-label', text(hidden ? 'show' : 'hide'));
    toggle.setAttribute('aria-expanded', String(!hidden));
    body.setAttribute('aria-label', `${text('pet')} ${pet.name}`);
    home.setAttribute('aria-label', `${text('open')} ${pet.name}`);
    walker.hidden = hidden;
  };

  toggle.addEventListener('click', () => {
    const hidden = root.classList.toggle('is-collapsed');

    localStorage.setItem(COLLAPSED_KEY, hidden ? '1' : '0');
    if (hidden) bubble.hidden = true;
    label();
    if (!hidden) paint();
  });
  body.addEventListener('click', react);
  window.addEventListener('pointermove', (event) => {
    state.cursor = event.pointerType === 'mouse' ? { x: event.clientX, y: event.clientY } : null;
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    state.cursor = null;
  });
  i18n.onChange(label);

  // Empieza junto al botón de ocultar, donde estaba antes, y desde ahí se pasea
  state.x = bounds()[1];
  state.restUntil = performance.now() + 2000;
  label();
  place();
  paint();
  keepAboveFooter(root);
  setTimeout(speak, 2500);
  scheduleSpeech();

  if (reduced) {
    // Sin movimiento: se queda quieta, solo anima el sitio y responde al clic
    setInterval(() => {
      if (!collapsed() && !document.hidden) {
        state.frame += 1;
        paint();
      }
    }, 1000);
  } else {
    requestAnimationFrame(loop);
  }
}

async function init() {
  const pet = await fetchJson('/api/pet/widget');
  if (!pet?.active) return;

  const catalog = await fetchJson('/api/pet/catalog');
  if (catalog) mount(pet, catalog);
}

init().catch(() => {}); // El widget es un adorno: si falla, la página sigue igual
