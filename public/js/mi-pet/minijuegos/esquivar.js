// Tu mascota esquiva lo que cae. La velocidad crece con el tiempo.

import { petFrame, SPRITE_SIZE } from '../sprites.js';
import { specOf } from '../retrato.js';

export const difficulties = ['easy', 'normal', 'hard'];

const WIDTH = 320;
const HEIGHT = 260;
const HITBOX = 18;
const PET_SPEED = 170;
const BASE_FALL = { easy: 70, normal: 95, hard: 125 };
const FALL_PER_SECOND = 3;
const SPAWN_MS = { easy: 760, normal: 600, hard: 460 };
const MIN_SPAWN_MS = 180;
const COLORS = ['#f25f8b', '#f7e08a', '#7cc4f0', '#a79bf0'];

export function run(box, { T, difficulty, sound, end, game }) {
  box.innerHTML = `
    <div class="game-hud"><span>${T('g.time')}: <strong id="dodge-time">0</strong>s</span></div>
    <canvas class="game-canvas" id="dodge" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${T('game.dodge')}"></canvas>
    <div class="touch-pad is-row">
      <button type="button" data-side="-1" aria-label="${T('g.left')}">◀</button>
      <button type="button" data-side="1" aria-label="${T('g.right')}">▶</button>
    </div>`;

  const canvas = box.querySelector('#dodge');
  const ctx = canvas.getContext('2d');
  const label = box.querySelector('#dodge-time');
  const spec = specOf(game.pet);
  const started = performance.now();
  let last = started;
  let nextSpawn = started + 400;
  let x = WIDTH / 2;
  let move = 0;
  let blocks = [];
  let running = true;
  let frameId = 0;
  const keys = new Set();

  const spawn = (elapsed) => {
    const size = 12 + Math.random() * 14 + Math.min(elapsed, 30) * 0.3;

    blocks.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      size,
      speed: (BASE_FALL[difficulty] + elapsed * FALL_PER_SECOND) * (0.85 + Math.random() * 0.4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const hit = (block) => {
    const petTop = HEIGHT - 26;

    return block.y + block.size > petTop && block.y < HEIGHT - 4
      && block.x < x + HITBOX / 2 && block.x + block.size > x - HITBOX / 2;
  };

  const loop = (time) => {
    if (!running) return;

    const delta = Math.min((time - last) / 1000, 0.05);
    const elapsed = (time - started) / 1000;
    last = time;

    const keyMove = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);

    x = Math.min(WIDTH - 14, Math.max(14, x + (keyMove || move) * PET_SPEED * delta));

    if (time > nextSpawn) {
      spawn(elapsed);
      nextSpawn = time + Math.max(MIN_SPAWN_MS, SPAWN_MS[difficulty] - elapsed * 8);
    }

    blocks.forEach((block) => {
      block.y += block.speed * delta;
    });
    blocks = blocks.filter((block) => block.y < HEIGHT);
    label.textContent = Math.floor(elapsed);

    ctx.fillStyle = '#10143a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#2a3470';
    ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);
    blocks.forEach(({ x: bx, y, size, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(bx), Math.round(y), Math.round(size), Math.round(size));
    });
    ctx.drawImage(
      petFrame(spec, 'walk', Math.floor(time / 130) % 4, game.catalog),
      Math.round(x - SPRITE_SIZE / 2),
      HEIGHT - SPRITE_SIZE - 2,
    );

    if (blocks.some(hit)) {
      running = false;
      sound('lose');
      end(Math.floor(elapsed));
      return;
    }
    frameId = requestAnimationFrame(loop);
  };

  const onDown = (event) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
      event.preventDefault();
      keys.add(event.key);
    }
  };
  const onUp = (event) => keys.delete(event.key);

  document.addEventListener('keydown', onDown);
  document.addEventListener('keyup', onUp);

  const pad = box.querySelector('.touch-pad');

  pad.addEventListener('pointerdown', (event) => {
    const side = event.target.closest('[data-side]')?.dataset.side;
    if (side) move = Number(side);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => pad.addEventListener(name, () => {
    move = 0;
  }));

  frameId = requestAnimationFrame(loop);

  return () => {
    running = false;
    cancelAnimationFrame(frameId);
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup', onUp);
  };
}
