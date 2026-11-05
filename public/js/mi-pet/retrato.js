// Mascota animada en un canvas suelto: tarjetas de adopción, colección y fichas.
// Todos los retratos comparten un solo temporizador.

import { petFrame, SPRITE_SIZE } from './sprites.js';

const FPS = 5;
const portraits = new Set();
let timer = null;
let frame = 0;

function paint({ canvas, spec, pose, catalog }) {
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  ctx.drawImage(petFrame(spec, pose, frame % 4, catalog, { tick: frame }), 0, 0);
}

function tick() {
  frame += 1;
  portraits.forEach((entry) => {
    if (entry.canvas.isConnected) paint(entry);
    else if (entry.seen) portraits.delete(entry);
    else entry.seen = document.contains(entry.canvas);
  });

  if (!portraits.size) {
    clearInterval(timer);
    timer = null;
  }
}

export function portrait(spec, catalog, { pose = 'idle', label = '', still = false } = {}) {
  const canvas = document.createElement('canvas');

  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  canvas.className = 'pet-portrait';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);

  const entry = { canvas, spec, pose, catalog, seen: false };

  paint(entry);
  if (!still && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    portraits.add(entry);
    timer ??= setInterval(tick, 1000 / FPS);
  }
  return canvas;
}

export const specOf = (pet) => ({
  species: pet.species, variant: pet.variant, evolution: pet.evolution, equipped: pet.equipped, rainbow: pet.rainbow,
});
