// Mascota flotante para las demás páginas de la web.
//
// layout.js solo carga este archivo si el navegador ya ha jugado (ver WIDGET_FLAG en juego.js),
// así que quien no tiene partida no hace ninguna petición. Su estilo vive en su propio CSS
// para no añadir nada a las páginas que no lo usan.

import { fill, L } from './dialogos.js';
import { petFrame, SPRITE_SIZE } from './sprites.js';

const COLLAPSED_KEY = 'mipet-widget-collapsed';
const SPEAK_MS = [25000, 60000];
const BUBBLE_MS = 6000;
const FPS = 5;
const MARGIN = 16;
// En estas páginas hay mucho que pulsar: empieza recogido para no estorbar
const BUSY_PAGES = ['ajedrez'];
const TEXTS = {
  es: { open: 'Ir con', hide: 'Ocultar mascota', show: 'Mostrar mascota' },
  en: { open: 'Go to', hide: 'Hide pet', show: 'Show pet' },
};

const text = (key) => TEXTS[i18n.lang]?.[key] ?? TEXTS.es[key];

function poseFor(mood) {
  if (mood === 'sleeping') return 'sleeping';
  if (mood === 'sick') return 'sick';
  if (['hungry', 'tired', 'dirty', 'bored'].includes(mood)) return 'sad';
  return mood === 'veryHappy' || mood === 'inLove' ? 'happy' : 'idle';
}

function pickLine(pet, catalog) {
  const { common, species } = catalog.dialogues;
  const own = species[pet.species] ?? {};
  const pool = common[pet.mood] ? [...common[pet.mood], ...(own[pet.mood] ?? [])] : [...own.idle, ...common.idle];
  const lines = pool.filter(([line]) => !line.includes('{user}')); // Aquí no se sabe el nombre

  return fill(L(lines[Math.floor(Math.random() * lines.length)]), { pet: pet.name });
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
    <p class="pet-widget-bubble" role="status" hidden></p>
    <button type="button" class="pet-widget-toggle" aria-expanded="${!startsCollapsed}"></button>
    <a class="pet-widget-pet" href="mi-pet.html"><canvas width="${SPRITE_SIZE}" height="${SPRITE_SIZE}"></canvas></a>
  `;
  document.body.append(root);

  const toggle = root.querySelector('.pet-widget-toggle');
  const bubble = root.querySelector('.pet-widget-bubble');
  const anchor = root.querySelector('.pet-widget-pet');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const pose = pet.away ? 'walk' : poseFor(pet.mood);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let bubbleTimer = null;

  const paint = () => {
    ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    ctx.drawImage(petFrame(pet, pose, frame % 4, catalog, { tick: frame }), 0, 0);
    frame += 1;
  };

  const label = () => {
    const collapsed = root.classList.contains('is-collapsed');

    toggle.textContent = collapsed ? '🐾' : '×';
    toggle.setAttribute('aria-label', text(collapsed ? 'show' : 'hide'));
    toggle.setAttribute('aria-expanded', String(!collapsed));
    anchor.setAttribute('aria-label', `${text('open')} ${pet.name}`);
    anchor.hidden = collapsed;
  };

  const speak = () => {
    if (root.classList.contains('is-collapsed') || document.hidden || pet.away) return;

    bubble.textContent = pickLine(pet, catalog);
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.hidden = true;
    }, BUBBLE_MS);
  };

  const scheduleSpeech = () => {
    setTimeout(() => {
      speak();
      scheduleSpeech();
    }, SPEAK_MS[0] + Math.random() * (SPEAK_MS[1] - SPEAK_MS[0]));
  };

  toggle.addEventListener('click', () => {
    const collapsed = root.classList.toggle('is-collapsed');

    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    if (collapsed) bubble.hidden = true;
    label();
  });
  i18n.onChange(label);

  label();
  paint();
  if (!reduced) setInterval(paint, 1000 / FPS);
  keepAboveFooter(root);
  setTimeout(speak, 2500);
  scheduleSpeech();
}

async function init() {
  const pet = await fetchJson('/api/pet/widget');
  if (!pet?.active) return;

  const catalog = await fetchJson('/api/pet/catalog');
  if (catalog) mount(pet, catalog);
}

init().catch(() => {}); // El widget es un adorno: si falla, la página sigue igual
