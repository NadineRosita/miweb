// La habitación viva: dibuja el fondo, los muebles y a la mascota, y decide qué hace esta
// en cada momento según su especie y su estado.
//
// drawStaticScene pinta una escena fija (fotos del álbum); Scene añade la vida.

import { CELL, furnitureSprite, roomBackground, skyAt } from './muebles.js';
import { motionFor, petFrame, SPRITE_SIZE } from './sprites.js';

const PET_FPS = 6;
const LIGHTS = {
  warm: 'rgba(255, 180, 90, 0.16)',
  cool: 'rgba(90, 170, 255, 0.16)',
  dim: 'rgba(10, 10, 50, 0.4)',
};

const random = (min, max) => min + Math.random() * (max - min);
const itemById = (catalog, id) => catalog.items.find((item) => item.id === id);

function drawWindow(ctx, entry, sprite, hour, frame) {
  const sky = skyAt(hour);
  const x = entry.x * CELL + 4;
  const y = entry.y * CELL + 4;
  const width = sprite.width - 8;
  const height = sprite.height - 8;
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);

  gradient.addColorStop(0, sky.top);
  gradient.addColorStop(1, sky.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  if (sky.stars) {
    ctx.fillStyle = '#fdf6e3';
    for (let index = 0; index < 9; index += 1) {
      if ((index + frame) % 5) ctx.fillRect(x + (index * 13) % width, y + (index * 7) % height, 1, 1);
    }
    ctx.fillRect(x + width - 12, y + 4, 5, 5);
  } else {
    ctx.fillStyle = hour >= 18 ? '#ffd17a' : '#fff5b8';
    ctx.fillRect(x + 6, y + 5, 6, 6);
  }
}

function drawFurniture(ctx, entry, item, hour, frame) {
  const sprite = furnitureSprite(item);

  if (item.id === 'window') drawWindow(ctx, entry, sprite, hour, frame);

  const bottom = (entry.y + item.h) * CELL;
  ctx.drawImage(sprite.canvas, entry.x * CELL, bottom - sprite.height);

  if (item.id === 'aquarium') {
    ctx.fillStyle = '#ffd17a';
    ctx.fillRect(entry.x * CELL + 8 + ((frame >> 1) % 22), bottom - 18, 3, 2);
  }
  if (item.id === 'starLamp') {
    ctx.fillStyle = 'rgba(247, 224, 138, 0.09)';
    ctx.fillRect(entry.x * CELL - 16, bottom - 44, 52, 44);
  }
}

// Coloca los muebles en tres pasadas: pared, alfombras y, por profundidad, el resto
function roomLayers(room, catalog) {
  const withItem = room.items.map((entry) => ({ entry, item: itemById(catalog, entry.id) })).filter(({ item }) => item);

  return {
    wall: withItem.filter(({ item }) => item.layer === 'wall'),
    rug: withItem.filter(({ item }) => item.layer === 'rug'),
    floor: withItem.filter(({ item }) => item.layer === 'floor')
      .sort((a, b) => (a.entry.y + a.item.h) - (b.entry.y + b.item.h)),
  };
}

function applyLight(ctx, width, height, light, hour, frame) {
  const sky = skyAt(hour);
  const tint = light === 'auto' ? sky.tint : LIGHTS[light];

  if (light === 'party') {
    const colors = ['rgba(255,90,200,.16)', 'rgba(90,200,255,.16)', 'rgba(247,224,138,.16)'];
    ctx.fillStyle = colors[(frame >> 2) % colors.length];
    ctx.fillRect(0, 0, width, height);
  } else if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
  }
}

// Una escena sin movimiento, para fotos y miniaturas
export function drawStaticScene(canvas, snapshot, catalog) {
  const { room: config } = catalog.config;
  const ctx = canvas.getContext('2d');
  const width = config.cols * CELL;
  const height = config.rows * CELL;
  const hour = new Date(snapshot.t ?? Date.now()).getHours();

  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(roomBackground(snapshot.room.theme, config), 0, 0);

  const layers = roomLayers(snapshot.room, catalog);

  layers.wall.forEach(({ entry, item }) => drawFurniture(ctx, entry, item, hour, 0));
  layers.rug.forEach(({ entry, item }) => drawFurniture(ctx, entry, item, hour, 0));
  layers.floor.forEach(({ entry, item }) => drawFurniture(ctx, entry, item, hour, 0));
  ctx.drawImage(petFrame(snapshot, 'happy', 0, catalog), 180, 125);
  applyLight(ctx, width, height, snapshot.room.light, hour, 0);
}

// ---------- Escena viva ----------
export class Scene {
  constructor(canvas, catalog, { onPetClick, onFurnitureClick, onBubbleMove } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.catalog = catalog;
    this.config = catalog.config.room;
    this.width = this.config.cols * CELL;
    this.height = this.config.rows * CELL;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;

    this.pet = null;
    this.x = this.width / 2;
    this.y = 150;
    this.targetX = this.x;
    this.targetY = this.y;
    this.dir = 1;
    this.restUntil = 0;
    this.action = null; // { pose, until }
    this.particles = [];
    this.ghostAlpha = 1;
    this.tickCount = 0;
    this.selected = null;
    this.preview = null;
    this.running = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onBubbleMove = onBubbleMove;

    canvas.addEventListener('click', (event) => {
      const { x, y } = this.toLogical(event);
      const dx = Math.abs(x - this.x);
      const dy = this.y - y;

      if (dx < 20 && dy > -6 && dy < SPRITE_SIZE) onPetClick?.();
      else {
        const hit = this.furnitureAt(x, y);
        if (hit) onFurnitureClick?.(hit);
      }
    });
  }

  toLogical(event) {
    const box = this.canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - box.left) / box.width) * this.width,
      y: ((event.clientY - box.top) / box.height) * this.height,
    };
  }

  furnitureAt(x, y) {
    const items = this.room?.items ?? [];

    for (let index = items.length - 1; index >= 0; index -= 1) {
      const entry = items[index];
      const item = itemById(this.catalog, entry.id);
      const sprite = furnitureSprite(item);
      const left = entry.x * CELL;
      const bottom = (entry.y + item.h) * CELL;

      if (x >= left && x < left + sprite.width && y <= bottom && y > bottom - sprite.height) return entry;
    }
    return null;
  }

  setPet(pet) {
    const changed = this.pet?.id !== pet?.id;

    this.pet = pet;
    this.room = pet?.room;
    if (changed && pet) {
      this.x = this.width / 2;
      this.y = this.floorY();
      this.targetX = this.x;
      this.targetY = this.y;
    }
  }

  floorY() {
    return motionFor(this.pet?.species).style === 'fly' ? random(100, 130) : random(125, 165);
  }

  // Lanza una animación puntual, como comer o saltar de alegría
  play(pose, seconds = 1.6, particle = null) {
    this.action = { pose, until: performance.now() + seconds * 1000 };
    if (particle) this.burst(particle);
  }

  burst(kind, count = 6) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        kind,
        x: this.x + random(-14, 14),
        y: this.y - random(26, 36),
        vx: random(-5, 5),
        vy: random(-20, -9),
        life: random(1, 1.8),
      });
    }
  }

  start() {
    if (this.running) return;

    this.running = true;
    let last = performance.now();
    const loop = (time) => {
      if (!this.running) return;

      const delta = Math.min((time - last) / 1000, 0.1);
      last = time;
      if (!document.hidden) {
        this.update(delta, time);
        this.draw(time);
      }
      this.frameRequest = requestAnimationFrame(loop);
    };

    this.frameRequest = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameRequest);
  }

  obstacleAt(x, y) {
    return (this.room?.items ?? []).some((entry) => {
      const item = itemById(this.catalog, entry.id);
      if (item?.layer !== 'floor') return false;

      const left = entry.x * CELL - 8;
      const right = (entry.x + item.w) * CELL + 8;
      const top = entry.y * CELL;
      const bottom = (entry.y + item.h) * CELL + 6;
      return x > left && x < right && y > top && y < bottom;
    });
  }

  clearPath(x, y) {
    const steps = 12;

    for (let step = 1; step <= steps; step += 1) {
      const px = this.x + ((x - this.x) * step) / steps;
      const py = this.y + ((y - this.y) * step) / steps;
      if (this.obstacleAt(px, py)) return false;
    }
    return true;
  }

  pickTarget() {
    const motion = motionFor(this.pet.species);
    const passesThrough = motion.style === 'float' || motion.style === 'fly';

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const x = random(24, this.width - 24);
      const y = this.floorY();

      if (passesThrough || this.clearPath(x, y)) {
        this.targetX = x;
        this.targetY = y;
        this.dir = x >= this.x ? 1 : -1;
        return;
      }
    }
  }

  update(delta, time) {
    if (!this.pet) return;

    const motion = motionFor(this.pet.species);
    const { mood } = this.pet;
    const blocked = mood === 'sleeping' || this.pet.away || this.action || mood === 'sick';

    if (this.action && time > this.action.until) this.action = null;

    // El fantasma a veces se desvanece; el experimento aparece en otro sitio de golpe
    if (motion.vanish) {
      const phase = (time / 1000) % 40;
      this.ghostAlpha = phase > 34 ? Math.max(0.12, Math.abs(phase - 37) / 3) : 1;
    }
    if (motion.blink && !blocked && Math.random() < delta * 0.02) {
      this.pickTarget();
      this.x = this.targetX;
      this.y = this.targetY;
      this.burst('spark', 4);
    }

    if (!blocked && !this.reduced) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 1) {
        const step = Math.min(distance, motion.speed * delta);
        this.x += (dx / distance) * step;
        this.y += (dy / distance) * step;
        this.moving = true;
      } else {
        if (this.moving) this.restUntil = time + random(...motion.rest) * 1000;
        this.moving = false;
        if (time > this.restUntil) this.pickTarget();
      }
    } else {
      this.moving = false;
    }

    this.particles.forEach((particle) => {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta;
    });
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (Math.random() < delta * 0.5) this.ambientParticle(mood);
  }

  ambientParticle(mood) {
    if (mood === 'sleeping') this.burst('zzz', 1);
    else if (mood === 'inLove' || mood === 'veryHappy') this.burst('heart', 1);
    else if (mood === 'dirty') this.burst('stink', 1);
  }

  poseNow() {
    const { mood } = this.pet;

    if (this.action) return this.action.pose;
    if (mood === 'sleeping') return 'sleeping';
    if (mood === 'sick') return 'sick';
    if (this.moving) return 'walk';
    if (['hungry', 'tired', 'dirty', 'bored'].includes(mood)) return 'sad';
    if (mood === 'inLove') return 'special';
    if (mood === 'veryHappy') return 'happy';
    return 'idle';
  }

  drawMess(ctx) {
    const count = this.pet?.mess ?? 0;

    for (let index = 0; index < count; index += 1) {
      const x = 40 + (index * 67) % 240;
      const y = 124 + (index * 19) % 44;

      ctx.fillStyle = '#7cf0c8';
      ctx.fillRect(x, y, 7, 3);
      ctx.fillRect(x + 1, y - 2, 5, 2);
      ctx.fillRect(x + 2, y - 4, 3, 2);
      ctx.fillStyle = '#20203f';
      ctx.fillRect(x + 1, y + 3, 5, 1);
      ctx.fillRect(x + 2, y - 2, 1, 1);
      ctx.fillRect(x + 4, y - 2, 1, 1);
    }
  }

  drawPet(ctx, frame) {
    const { pet } = this;
    if (pet.away) return;

    const pose = this.poseNow();
    const sprite = petFrame(this.petSpec(), pose, frame % 4, this.catalog, { flip: this.dir < 0, tick: frame });
    const motion = motionFor(pet.species);
    const left = Math.round(this.x - SPRITE_SIZE / 2);
    const lift = motion.style === 'float' ? 3 : 0;
    const top = Math.round(this.y - SPRITE_SIZE) - lift;

    ctx.fillStyle = 'rgba(10, 10, 40, 0.25)';
    ctx.fillRect(left + 9, Math.round(this.y) - 4, 22, 3);

    ctx.globalAlpha = this.ghostAlpha * (motion.style === 'float' ? 0.92 : 1);
    ctx.drawImage(sprite, left, top);
    ctx.globalAlpha = 1;
    this.onBubbleMove?.(this.x / this.width, (this.y - SPRITE_SIZE) / this.height);
  }

  petSpec() {
    const { species, variant, evolution, equipped, rainbow } = this.pet;
    return { species, variant, evolution, equipped, rainbow };
  }

  drawParticles(ctx) {
    this.particles.forEach(({ kind, x, y, life }) => {
      ctx.globalAlpha = Math.min(1, life * 1.4);
      if (kind === 'heart') {
        ctx.fillStyle = '#f25f8b';
        ctx.fillRect(x - 2, y, 2, 2);
        ctx.fillRect(x + 1, y, 2, 2);
        ctx.fillRect(x - 2, y + 1, 5, 2);
        ctx.fillRect(x - 1, y + 3, 3, 1);
      } else if (kind === 'zzz') {
        ctx.fillStyle = '#d8dcff';
        ctx.fillRect(x, y, 4, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillRect(x, y + 2, 4, 1);
      } else if (kind === 'stink') {
        ctx.fillStyle = '#a8c98c';
        ctx.fillRect(x, y, 1, 3);
        ctx.fillRect(x + 1, y + 2, 1, 2);
      } else if (kind === 'bubble') {
        ctx.fillStyle = '#c8e8fb';
        ctx.fillRect(x, y, 3, 3);
      } else {
        ctx.fillStyle = '#f7e08a';
        ctx.fillRect(x, y, 2, 2);
      }
    });
    ctx.globalAlpha = 1;
  }

  drawEditing(ctx) {
    if (!this.editing) return;

    const { cols, rows } = this.config;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x += 1) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, rows * CELL);
    }
    for (let y = 0; y <= rows; y += 1) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(cols * CELL, y * CELL + 0.5);
    }
    ctx.stroke();

    const mark = (box, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x * CELL + 1, box.y * CELL + 1, box.w * CELL - 2, box.h * CELL - 2);
    };

    if (this.selected) {
      const entry = this.room.items.find(({ uid }) => uid === this.selected);
      const item = entry && itemById(this.catalog, entry.id);
      if (item) mark({ x: entry.x, y: entry.y, w: item.w, h: item.h }, '#f7e08a');
    }
    if (this.preview) {
      ctx.fillStyle = this.preview.valid ? 'rgba(124, 240, 200, 0.3)' : 'rgba(255, 90, 90, 0.3)';
      ctx.fillRect(this.preview.x * CELL, this.preview.y * CELL, this.preview.w * CELL, this.preview.h * CELL);
      mark(this.preview, this.preview.valid ? '#7cf0c8' : '#ff5a5a');
    }
  }

  draw(time) {
    const { ctx } = this;
    const frame = this.reduced ? 0 : Math.floor(time / (1000 / PET_FPS));
    const hour = new Date().getHours();

    if (!this.room) return;

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.drawImage(roomBackground(this.room.theme, this.config), 0, 0);

    const layers = roomLayers(this.room, this.catalog);

    layers.wall.forEach(({ entry, item }) => drawFurniture(ctx, entry, item, hour, frame));
    layers.rug.forEach(({ entry, item }) => drawFurniture(ctx, entry, item, hour, frame));
    this.drawMess(ctx);

    // El orden de dibujo da la profundidad: lo que esté más abajo tapa a lo de arriba
    let petDrawn = false;

    layers.floor.forEach(({ entry, item }) => {
      const bottom = (entry.y + item.h) * CELL;

      if (!petDrawn && this.pet && this.y < bottom) {
        this.drawPet(ctx, frame);
        petDrawn = true;
      }
      drawFurniture(ctx, entry, item, hour, frame);
    });
    if (!petDrawn && this.pet) this.drawPet(ctx, frame);

    this.drawParticles(ctx);
    applyLight(ctx, this.width, this.height, this.room.light, hour, frame);
    this.drawEditing(ctx);
  }
}
