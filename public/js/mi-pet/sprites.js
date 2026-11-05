// Sprites de las mascotas. Cada especie dibuja su cuerpo por poses sobre una rejilla de 40×40;
// la cara, los accesorios y la evolución se añaden encima con los puntos que devuelve.
// Cada combinación se dibuja una vez y queda guardada: es una hoja de sprites generada
// sobre la marcha, y por eso no hay imágenes que descargar.
//
// Para añadir una especie: una entrada en BODIES y otra en MOTION, con el mismo id que
// en server/mi-pet/data/species.js.

import { Pixels, OUTLINE, mix } from './pixel.js';

export const SPRITE_SIZE = 40;

const CX = 20; // Centro horizontal
const GROUND = 35; // Línea del suelo
const INK = '#20203f';
const WHITE = '#ffffff';
const RAINBOW = ['#ff9db0', '#ffc27a', '#fbe68b', '#9be8a8', '#8fd3f7', '#b9a4f5'];

// Expresión y movimiento de cada pose
const POSES = {
  idle: { eyes: 'open', mouth: 'smile', blink: 3 },
  walk: { eyes: 'open', mouth: 'smile' },
  happy: { eyes: 'joy', mouth: 'open' },
  sad: { eyes: 'sad', mouth: 'frown' },
  eating: { eyes: 'joy', mouth: 'chew' },
  sleeping: { eyes: 'shut', mouth: 'none' },
  playing: { eyes: 'wide', mouth: 'open' },
  sick: { eyes: 'dizzy', mouth: 'wavy' },
  special: { eyes: 'heart', mouth: 'open' },
};

// Parámetros de cada fotograma: bob sube o baja, squash aplasta, sway inclina
function motionOf(pose, frame) {
  const wave = [0, 1, 0, -1][frame];

  switch (pose) {
    case 'walk': return { bob: [0, -2, 0, -1][frame], squash: [1, -1, 0, -1][frame], sway: wave };
    case 'happy': return { bob: [0, -3, -4, -2][frame], squash: [1, -1, -1, 0][frame], sway: 0 };
    case 'playing': return { bob: [0, -2, 0, -2][frame], squash: [0, -1, 1, -1][frame], sway: [-1, 1, -1, 1][frame] };
    case 'eating': return { bob: 0, squash: [0, 1, 0, 1][frame], sway: 0 };
    case 'sleeping': return { bob: 0, squash: [1, 1, 0, 0][frame], sway: 0 };
    case 'sad': return { bob: 1, squash: 1, sway: 0 };
    case 'sick': return { bob: 1, squash: [1, 0, 1, 0][frame], sway: [-1, 0, 1, 0][frame] };
    case 'special': return { bob: [0, -1, -2, -1][frame], squash: 0, sway: wave };
    default: return { bob: 0, squash: [0, 0, 1, 1][frame], sway: 0 };
  }
}

// ---------- Cuerpos ----------
// Reciben el lienzo, la paleta, la pose y m (bob, squash, sway, frame, wave).
// Devuelven los puntos de anclaje: eyeY, eyeGap, mouthY, top, neck, faceX.

function slime(g, c, m) {
  const rx = 12 + m.squash;
  const ry = 17 - m.squash * 2;
  const base = GROUND + m.bob;

  g.dome(CX + m.sway, base, rx, ry, c.body);
  g.rect(CX - rx + 1 + m.sway, base - 1, rx * 2 - 1, 1, c.body);
  g.ellipse(CX - 7 + m.sway, base - 1, 2, 1, c.body);
  g.ellipse(CX + 7 + m.sway, base - 1, 2, 1, c.body);
  g.ellipse(CX - 6 + m.sway, base - ry + 4, 2, 1, c.light);

  return { eyeY: base - 9, eyeGap: 5, mouthY: base - 5, top: base - ry - 1, neck: base - 1, faceX: CX + m.sway, big: true };
}

function ghost(g, c, m) {
  const float = [0, -1, -2, -1][m.frame];
  const base = GROUND - 2 + float + m.bob;
  const top = base - 21 + m.squash;

  g.ellipse(CX, top + 9, 10, 9, c.body);
  g.rect(CX - 10, top + 9, 21, base - top - 9, c.body);

  for (let index = 0; index < 5; index += 1) {
    const x = CX - 10 + index * 4 + 2;
    const y = base + ((index + m.frame) % 2 === 0 ? 2 : 0);
    g.ellipse(x, y, 2, 2, c.body);
  }

  g.px(CX - 12, base - 6 + m.wave, c.body).px(CX - 11, base - 6 + m.wave, c.body);
  g.px(CX + 12, base - 6 - m.wave, c.body).px(CX + 11, base - 6 - m.wave, c.body);
  g.ellipse(CX - 5, top + 3, 2, 1, c.light);

  return { eyeY: top + 9, eyeGap: 4, mouthY: top + 14, top, neck: top + 16, faceX: CX };
}

function alien(g, c, m) {
  const base = GROUND + m.bob;
  const sway = m.wave;
  const headY = base - 15 + m.squash;

  g.rect(CX - 3, base - 2, 2, 2, c.shade).rect(CX + 2, base - 2, 2, 2, c.shade);
  g.ellipse(CX, base - 6, 6, 4 - m.squash * 0.5, c.body);

  g.line(CX - 6, headY - 7, CX - 9 - sway, headY - 14, c.shade);
  g.line(CX + 6, headY - 7, CX + 9 + sway, headY - 14, c.shade);
  g.ellipse(CX - 9 - sway, headY - 15, 2, 2, c.light);
  g.ellipse(CX + 9 + sway, headY - 15, 2, 2, c.light);

  g.ellipse(CX, headY, 11, 9, c.body);
  g.ellipse(CX - 5, headY - 5, 2, 1, c.light);

  return { eyeY: headY, eyeGap: 5, mouthY: headY + 6, top: headY - 9, neck: base - 8, faceX: CX, tall: true };
}

function robot(g, c, m) {
  const base = GROUND + m.bob;
  const headY = base - 26 + m.squash;
  const step = m.frame % 2;

  g.rect(CX - 6, base - 3 - step, 4, 3 + step, c.shade);
  g.rect(CX + 3, base - 3 - (1 - step), 4, 3 + (1 - step), c.shade);
  g.rect(CX - 8, base - 12, 17, 9, c.body);
  g.rect(CX - 11, base - 11 + m.wave, 3, 6, c.shade);
  g.rect(CX + 9, base - 11 - m.wave, 3, 6, c.shade);
  g.rect(CX - 4, base - 10, 3, 2, '#7cf0c8').rect(CX + 1, base - 10, 3, 2, '#f58fb5');

  g.line(CX, headY - 1, CX, headY - 5, c.shade);
  g.ellipse(CX, headY - 6, 1, 1, m.frame < 2 ? '#ff7a59' : '#ffd17a');

  g.rect(CX - 11, headY, 23, 15, c.body);
  g.rect(CX - 9, headY + 2, 19, 10, '#27305e');

  return { eyeY: headY + 6, eyeGap: 5, mouthY: headY + 10, top: headY, neck: base - 12, faceX: CX, screen: true, eyeColor: '#7cf0c8' };
}

function bat(g, c, m) {
  const flap = [-3, 0, 3, 0][m.frame];
  const base = GROUND - 5 + [0, -1, -2, -1][m.frame] + m.bob;
  const headY = base - 12;

  g.triangle(CX - 8, headY + 2, CX - 22, headY - 3 + flap, CX - 9, headY + 11, c.shade);
  g.triangle(CX + 8, headY + 2, CX + 22, headY - 3 + flap, CX + 9, headY + 11, c.shade);
  g.triangle(CX - 8, headY - 6, CX - 10, headY - 15, CX - 2, headY - 7, c.body);
  g.triangle(CX + 8, headY - 6, CX + 10, headY - 15, CX + 2, headY - 7, c.body);
  g.px(CX - 8, headY - 10, '#f4a6c8').px(CX + 8, headY - 10, '#f4a6c8');
  g.ellipse(CX, headY + 1 + m.squash * 0.5, 10, 9, c.body);
  g.ellipse(CX, headY + 7, 5, 3, c.light);
  g.rect(CX - 4, base + 2, 2, 2, c.shade).rect(CX + 3, base + 2, 2, 2, c.shade);

  return { eyeY: headY, eyeGap: 4, mouthY: headY + 5, top: headY - 8, neck: headY + 7, faceX: CX, fang: true };
}

function mushling(g, c, m) {
  const base = GROUND + m.bob;
  const capY = base - 13 + m.squash;
  const cap = c.cap ?? c.shade;

  g.rect(CX - 6, base - 1, 4, 2, c.shade).rect(CX + 3, base - 1, 4, 2, c.shade);
  g.ellipse(CX, base - 7, 8, 7, c.body);
  g.dome(CX, capY, 14, 12, cap);
  g.rect(CX - 14, capY, 29, 2, c.capShade ?? cap);
  g.ellipse(CX - 7, capY - 5, 3, 2, c.light);
  g.ellipse(CX + 6, capY - 7, 2, 2, c.light);
  g.ellipse(CX + 1, capY - 3, 2, 1, c.light);

  return { eyeY: base - 8, eyeGap: 4, mouthY: base - 4, top: capY - 12, neck: base - 2, faceX: CX };
}

function frog(g, c, m) {
  const base = GROUND + m.bob;
  const stretch = m.bob < -1 ? 3 : 0;
  const headY = base - 11 + m.squash;

  g.ellipse(CX - 11, base - 2 + stretch, 4, 2, c.shade);
  g.ellipse(CX + 11, base - 2 + stretch, 4, 2, c.shade);
  g.ellipse(CX, base - 7 - stretch * 0.3, 13, 8 - m.squash, c.body);
  g.ellipse(CX, headY, 13, 6, c.body);
  g.ellipse(CX - 8, headY - 6, 4, 4, c.body);
  g.ellipse(CX + 8, headY - 6, 4, 4, c.body);
  g.ellipse(CX, base - 3, 7, 3, c.light);

  return { eyeY: headY - 6, eyeGap: 8, mouthY: headY + 2, top: headY - 10, neck: base - 8, faceX: CX, wide: true };
}

function snail(g, c, m) {
  const base = GROUND;
  const creep = m.frame === 1 || m.frame === 2 ? 1 : 0;
  const shell = c.shell ?? c.shade;
  const shellDark = c.shellShade ?? c.shade;

  g.rect(CX - 15 + creep, base - 4, 30 - creep, 5, c.body);
  g.ellipse(CX + 13, base - 8, 5, 5, c.body);
  g.line(CX + 11, base - 13, CX + 10 + m.wave, base - 19, c.body);
  g.line(CX + 15, base - 13, CX + 16 - m.wave, base - 19, c.body);
  g.ellipse(CX + 10 + m.wave, base - 20, 1, 1, c.light);
  g.ellipse(CX + 16 - m.wave, base - 20, 1, 1, c.light);

  g.ellipse(CX - 4, base - 12, 11, 10, shell);
  [[0, 7], [3, 5], [5, 2], [5, -1], [3, -3], [0, -4], [-3, -2], [-3, 1], [-1, 2], [1, 1]]
    .forEach(([x, y]) => g.px(CX - 4 + x, base - 12 + y, shellDark));
  g.ellipse(CX - 9, base - 18, 2, 1, mix(shell, WHITE, 0.45));

  return { eyeY: base - 9, eyeGap: 2, mouthY: base - 5, top: base - 22, neck: base - 5, faceX: CX + 13, side: true };
}

function cat(g, c, m) {
  const base = GROUND + m.bob;
  const headY = base - 18 + m.squash;
  const star = c.star ?? '#f7e08a';
  const tail = [0, 1, 2, 1][m.frame];

  g.line(CX + 8, base - 2, CX + 15, base - 6 - tail, c.body);
  g.line(CX + 9, base - 2, CX + 16, base - 6 - tail, c.body);
  g.line(CX + 15, base - 6 - tail, CX + 14, base - 12 - tail, c.body);

  g.ellipse(CX, base - 7, 9, 8, c.body);
  g.rect(CX - 6, base - 2, 4, 3, c.body).rect(CX + 2, base - 2, 4, 3, c.body);
  g.triangle(CX - 9, headY - 3, CX - 9, headY - 12, CX - 2, headY - 6, c.body);
  g.triangle(CX + 9, headY - 3, CX + 9, headY - 12, CX + 2, headY - 6, c.body);
  g.px(CX - 8, headY - 8, c.light).px(CX + 8, headY - 8, c.light);
  g.ellipse(CX, headY, 10, 8, c.body);

  return {
    eyeY: headY - 1, eyeGap: 4, mouthY: headY + 3, top: headY - 8, neck: headY + 7, faceX: CX,
    light: true, whisk: true, eyeColor: '#f7e08a',
    after(pixels) {
      [[-5, -8], [5, -9], [-2, -5], [4, -4], [-6, -3], [6, -12]]
        .forEach(([x, y]) => pixels.px(CX + x, base + y, star));
    },
  };
}

function experiment(g, c, m) {
  const base = GROUND + m.bob;
  const jitter = m.frame === 2 ? 1 : 0;

  g.ellipse(CX + jitter, base - 11, 12, 11 - m.squash, c.body);
  g.ellipse(CX - 8, base - 3, 5, 3, c.body);
  g.ellipse(CX + 8, base - 2, 4, 3, c.body);
  g.line(CX + 11, base - 16, CX + 17 + m.wave, base - 22, c.body);
  g.ellipse(CX + 18 + m.wave, base - 23, 2, 2, c.light);
  g.line(CX - 11, base - 12, CX - 16 - m.wave, base - 6, c.body);
  g.ellipse(CX - 5, base - 19, 2, 1, c.light);
  g.px(CX + 3, base - 21, '#9be36b').px(CX - 2, base - 4, '#9be36b').px(CX + 7, base - 7, '#9be36b');

  return { eyeY: base - 12, eyeGap: 6, mouthY: base - 6, top: base - 22, neck: base - 4, faceX: CX + jitter, thirdEye: true };
}

function octopus(g, c, m) {
  const base = GROUND + m.bob;
  const headY = base - 15 + m.squash;

  for (let index = 0; index < 6; index += 1) {
    const x = CX - 12 + index * 5;
    const phase = (index + m.frame) % 4;
    const swing = [0, 1, 0, -1][phase];

    g.line(x, base - 8, x + swing, base - 3, c.body);
    g.line(x + 1, base - 8, x + 1 + swing, base - 3, c.body);
    g.px(x + swing + (index < 3 ? -1 : 2), base - 1, c.body);
    g.line(x + swing, base - 3, x + swing + (index < 3 ? -1 : 2), base - 1, c.body);
  }

  g.ellipse(CX, headY, 12, 10, c.body);
  g.ellipse(CX - 5, headY - 6, 2, 1, c.light);
  g.ellipse(CX + 7, headY + 3, 1, 1, c.shade);
  g.ellipse(CX - 7, headY + 4, 1, 1, c.shade);

  return { eyeY: headY, eyeGap: 5, mouthY: headY + 5, top: headY - 10, neck: base - 7, faceX: CX };
}

const BODIES = { slime, ghost, alien, robot, bat, mushling, frog, snail, cat, experiment, octopus };

// ---------- Cara ----------
function drawEye(g, x, y, type, big, ink = INK) {

  switch (type) {
    case 'shut':
      g.rect(x - 1, y, 3, 1, ink);
      break;
    case 'joy':
      g.px(x - 1, y, ink).px(x, y - 1, ink).px(x + 1, y, ink);
      break;
    case 'sad':
      g.rect(x - 1, y, 3, 2, ink).px(x - 2, y - 2, ink).px(x - 1, y - 2, ink);
      break;
    case 'wide':
      g.rect(x - 1, y - 2, 3, 4, ink).px(x, y - 1, WHITE).px(x, y - 2, WHITE);
      break;
    case 'dizzy':
      g.px(x - 1, y - 1, ink).px(x + 1, y - 1, ink).px(x, y, ink).px(x - 1, y + 1, ink).px(x + 1, y + 1, ink);
      break;
    case 'heart':
      g.px(x - 1, y - 1, '#f25f8b').px(x + 1, y - 1, '#f25f8b').rect(x - 2, y - 1, 5, 2, '#f25f8b')
        .rect(x - 1, y + 1, 3, 1, '#f25f8b').px(x, y + 2, '#f25f8b');
      break;
    default:
      g.rect(x - (big ? 1 : 0), y - 2, big ? 3 : 2, 4, ink);
      g.px(x, y - 2, WHITE);
  }
}

function drawMouth(g, a, type, frame) {
  const { faceX: x, mouthY: y } = a;
  const ink = a.eyeColor ?? INK;
  const red = a.screen ? '#7cf0c8' : '#b43a56';

  switch (type) {
    case 'smile':
      g.px(x - 1, y, ink).px(x, y + 1, ink).px(x + 1, y, ink);
      break;
    case 'open':
      g.rect(x - 1, y, 3, 2, ink).px(x, y + 1, red);
      break;
    case 'chew':
      if (frame % 2) g.rect(x - 2, y, 5, 2, ink);
      else g.rect(x - 1, y + 1, 3, 1, ink);
      break;
    case 'frown':
      g.px(x - 1, y + 1, ink).px(x, y, ink).px(x + 1, y + 1, ink);
      break;
    case 'wavy':
      g.px(x - 2, y, ink).px(x - 1, y + 1, ink).px(x, y, ink).px(x + 1, y + 1, ink).px(x + 2, y, ink);
      break;
    default:
  }
}

function drawFace(g, a, pose, frame, tick) {
  const def = POSES[pose];
  const blinking = def.blink !== undefined && tick % 11 === 0;
  const eyes = blinking ? 'shut' : def.eyes;
  const x = a.faceX;

  if (a.side) {
    drawEye(g, x - 3, a.eyeY, eyes, false, a.eyeColor);
    drawEye(g, x + 2, a.eyeY, eyes, false, a.eyeColor);
    drawMouth(g, a, def.mouth, frame);
    return;
  }

  drawEye(g, x - a.eyeGap, a.eyeY, eyes, a.big, a.eyeColor);
  drawEye(g, x + a.eyeGap, a.eyeY, eyes, a.big, a.eyeColor);
  if (a.thirdEye) drawEye(g, x, a.eyeY - 6, eyes === 'open' ? 'wide' : eyes, false, a.eyeColor);
  if (a.fang && def.mouth !== 'none') g.px(x + 2, a.mouthY + 2, WHITE);
  if (a.whisk) {
    g.line(x - 7, a.mouthY - 1, x - 12, a.mouthY - 2, a.light ? '#a9b4ee' : INK);
    g.line(x + 7, a.mouthY - 1, x + 12, a.mouthY - 2, a.light ? '#a9b4ee' : INK);
    g.px(x, a.mouthY - 1, '#f4a6c8');
  }
  drawMouth(g, a, def.mouth, frame);
  if (!a.screen && (pose === 'happy' || pose === 'special' || pose === 'playing')) {
    g.px(x - a.eyeGap - 2, a.eyeY + 3, '#f6a7bd').px(x - a.eyeGap - 3, a.eyeY + 3, '#f6a7bd');
    g.px(x + a.eyeGap + 2, a.eyeY + 3, '#f6a7bd').px(x + a.eyeGap + 3, a.eyeY + 3, '#f6a7bd');
  }
}

// ---------- Accesorios ----------
// Lo que va detrás del cuerpo
function drawBack(g, equipped, m) {
  const y = GROUND - 14 + m.bob;
  const flap = m.frame % 2;

  if (equipped.back === 'wings') {
    g.triangle(CX - 8, y, CX - 19, y - 8 - flap, CX - 12, y + 7, '#fdf6e3');
    g.triangle(CX + 8, y, CX + 19, y - 8 - flap, CX + 12, y + 7, '#fdf6e3');
  }
  if (equipped.back === 'backpack') {
    g.rect(CX + 8, y - 2, 7, 11, '#c9694c');
    g.rect(CX + 9, y + 3, 5, 3, '#a24f37');
  }
}

function drawFront(g, a, equipped) {
  const x = a.faceX;
  const top = a.top;
  const { eyeY, eyeGap, neck } = a;

  switch (equipped.eyes) {
    case 'sunglasses':
      g.rect(x - eyeGap - 3, eyeY - 2, 7, 4, '#15152b').rect(x + eyeGap - 3, eyeY - 2, 7, 4, '#15152b');
      g.rect(x - eyeGap + 3, eyeY - 1, eyeGap * 2 - 5, 1, '#15152b');
      g.px(x - eyeGap - 2, eyeY - 1, '#5d6cc8').px(x + eyeGap - 2, eyeY - 1, '#5d6cc8');
      break;
    case 'heartGlasses':
      [x - eyeGap, x + eyeGap].forEach((ex) => {
        g.rect(ex - 3, eyeY - 2, 3, 2, '#f25f8b').rect(ex + 1, eyeY - 2, 3, 2, '#f25f8b');
        g.rect(ex - 3, eyeY, 7, 1, '#f25f8b').rect(ex - 2, eyeY + 1, 5, 1, '#f25f8b').rect(ex - 1, eyeY + 2, 3, 1, '#f25f8b');
      });
      break;
    default:
  }

  switch (equipped.neck) {
    case 'bow':
      g.triangle(x, neck, x - 5, neck - 3, x - 5, neck + 3, '#f25f8b');
      g.triangle(x, neck, x + 5, neck - 3, x + 5, neck + 3, '#f25f8b');
      g.rect(x - 1, neck - 1, 3, 3, '#ffc6d6');
      break;
    case 'scarf':
      g.rect(x - 9, neck - 1, 19, 3, '#6d7cf0');
      g.rect(x + 3, neck + 2, 4, 5, '#6d7cf0');
      g.rect(x + 3, neck + 5, 4, 1, '#f7e08a');
      break;
    default:
  }

  if (equipped.body === 'costume') {
    g.rect(x - 8, neck - 1, 17, 2, '#f1efe6');
    for (let index = 0; index < 5; index += 1) g.rect(x - 8 + index * 4, neck + 1, 3, 2 + (index % 2) * 2, '#f1efe6');
  }

  switch (equipped.head) {
    case 'beanie':
      g.dome(x, top + 3, 8, 6, '#c9694c');
      g.rect(x - 8, top + 2, 17, 3, '#f1efe6');
      g.ellipse(x, top - 4, 2, 2, '#f1efe6');
      break;
    case 'partyHat':
      g.triangle(x - 6, top + 3, x + 6, top + 3, x, top - 9, '#f4a6c8');
      g.px(x - 2, top, '#f7e08a').px(x + 2, top + 1, '#7cc4f0').px(x, top - 3, '#f7e08a');
      g.ellipse(x, top - 10, 1, 1, '#f7e08a');
      break;
    case 'headphones':
      g.line(x - 11, top + 8, x - 7, top + 1, '#3a3f7c');
      g.line(x + 11, top + 8, x + 7, top + 1, '#3a3f7c');
      g.line(x - 7, top + 1, x + 7, top + 1, '#3a3f7c');
      g.rect(x - 13, top + 7, 4, 7, '#ff7a59').rect(x + 10, top + 7, 4, 7, '#ff7a59');
      break;
    case 'crown':
      g.rect(x - 6, top - 1, 13, 4, '#f7d354');
      g.triangle(x - 6, top - 1, x - 2, top - 1, x - 5, top - 6, '#f7d354');
      g.triangle(x + 6, top - 1, x + 2, top - 1, x + 5, top - 6, '#f7d354');
      g.triangle(x - 2, top - 1, x + 2, top - 1, x, top - 7, '#f7d354');
      g.px(x, top + 1, '#f25f8b').px(x - 4, top + 1, '#7cc4f0').px(x + 4, top + 1, '#7cc4f0');
      break;
    default:
  }

}

// Lo que añade cada rama de evolución
function drawEvolution(g, a, branch, frame) {
  const x = a.faceX;

  switch (branch) {
    case 'happy':
      [[-13, -2], [13, 3], [-10, 9]].forEach(([dx, dy], index) => {
        if ((frame + index) % 2 === 0) g.px(x + dx, a.eyeY + dy, '#fff5b8');
      });
      g.ellipse(x, a.top - 3, 6, 1, '#f7e08a');
      g.ellipse(x, a.top - 3, 4, 0, '#fff5b8');
      break;
    case 'smart':
      g.rect(x - a.eyeGap - 3, a.eyeY - 3, a.eyeGap * 2 + 7, 1, '#7cf0c8');
      g.px(x - a.eyeGap - 4, a.eyeY - 2, '#7cf0c8').px(x + a.eyeGap + 4, a.eyeY - 2, '#7cf0c8');
      g.line(x + 6, a.top, x + 9, a.top - 5, '#7cf0c8');
      g.px(x + 9, a.top - 6, frame < 2 ? '#ff7a59' : '#7cf0c8');
      break;
    case 'adventurous':
      g.dome(x, a.top + 1, 7, 4, '#7a5230');
      g.rect(x - 10, a.top + 1, 21, 2, '#7a5230');
      g.rect(x - 7, a.top, 15, 1, '#c9694c');
      break;
    case 'dark':
      g.triangle(x - 8, a.top + 3, x - 4, a.top + 2, x - 8, a.top - 5, '#d5cdfb');
      g.triangle(x + 8, a.top + 3, x + 4, a.top + 2, x + 8, a.top - 5, '#d5cdfb');
      break;
    default:
  }
}

// ---------- Fotogramas ----------
const cache = new Map();

export function paletteFor(spec, catalog) {
  const species = catalog.species.find((entry) => entry.id === spec.species);
  const variant = spec.variant ? species.variants?.[spec.variant - 1] : null;
  const evolution = spec.evolution ? catalog.evolutionLook[spec.evolution] : null;
  const palette = { ...species.palette, ...(variant ?? {}) };

  if (evolution && !evolution.rainbow) Object.assign(palette, evolution);
  return palette;
}

function buildFrame(spec, pose, frame, tick, catalog) {
  const g = new Pixels(SPRITE_SIZE, SPRITE_SIZE);
  const c = paletteFor(spec, catalog);
  const look = pose === 'sick' ? { ...c, body: mix(c.body, '#a8c98c', 0.4), shade: mix(c.shade, '#7a9a68', 0.4), light: mix(c.light, '#d5e8b8', 0.4) } : c;
  const base = motionOf(pose, frame);
  const m = { ...base, frame, wave: [0, 1, 0, -1][frame] };
  const equipped = spec.equipped ?? {};

  drawBack(g, equipped, m);
  const draw = BODIES[spec.species] ?? slime;
  const anchors = draw(g, look, m);

  g.shade(look.body, look.shade, null);
  if (look.cap) g.shade(look.cap, look.capShade ?? look.cap, null);

  const rainbow = spec.rainbow || (spec.evolution === 'happy');
  if (rainbow) {
    g.recolor(look.body, (x, y) => RAINBOW[(Math.floor((y + x * 0.4) / 3) + frame) % RAINBOW.length]);
  }

  anchors.after?.(g);
  drawFace(g, anchors, pose, frame, tick);
  drawFront(g, anchors, equipped);
  if (spec.evolution) drawEvolution(g, anchors, spec.evolution, frame);
  if (spec.evolution === 'dark') g.recolor(INK, () => '#ff5a5a');

  g.outline(OUTLINE);
  return g;
}

// Devuelve el canvas de un fotograma. tick evita que todos los parpadeos coincidan.
export function petFrame(spec, pose, frame, catalog, { flip = false, tick = 0 } = {}) {
  const blink = pose === 'idle' && tick % 11 === 0 ? 1 : 0;
  const key = [
    spec.species, spec.variant ?? 0, spec.evolution ?? '', spec.rainbow ? 1 : 0,
    JSON.stringify(spec.equipped ?? {}), pose, frame, blink, flip ? 1 : 0,
  ].join('|');

  if (!cache.has(key)) {
    cache.set(key, buildFrame(spec, pose, frame, blink ? 0 : 1, catalog).toCanvas(flip));
  }
  return cache.get(key);
}

// Forma de moverse de cada especie por la habitación (ver escena.js).
// speed en píxeles/s, rest en segundos de pausa entre paseos, y estilo:
//   hop     avanza a saltos         float   flota y atraviesa muebles
//   fly     vuela a media altura    glide   se desliza sin pasos
export const MOTION = {
  slime: { speed: 16, rest: [2, 6], style: 'hop' },
  ghost: { speed: 10, rest: [3, 8], style: 'float', vanish: true },
  alien: { speed: 14, rest: [2, 5], style: 'walk' },
  robot: { speed: 18, rest: [3, 5], style: 'walk' },
  bat: { speed: 24, rest: [1, 4], style: 'fly' },
  mushling: { speed: 5, rest: [10, 20], style: 'walk' },
  frog: { speed: 30, rest: [2, 7], style: 'hop' },
  snail: { speed: 1.5, rest: [15, 30], style: 'glide' },
  cat: { speed: 14, rest: [8, 16], style: 'walk' },
  experiment: { speed: 22, rest: [1, 4], style: 'hop', blink: true },
  octopus: { speed: 11, rest: [3, 7], style: 'glide' },
};

export const motionFor = (species) => MOTION[species] ?? MOTION.slime;
