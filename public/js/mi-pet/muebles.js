// Muebles y fondos de habitación. Una celda mide CELL píxeles; el ancho del mueble sale de su
// huella (w × h en data/items.js), pero puede ser más alto que ella: un armario se apoya en
// su fila del suelo y sobresale por delante de la pared.

import { Pixels, OUTLINE, mix } from './pixel.js';

export const CELL = 20;
const WOOD = '#a9744f';
const WOOD_DARK = '#7a5238';
const WOOD_LIGHT = '#c9966d';

const DRAW = {
  bedBasic(g, w, h) {
    g.rect(1, h - 22, 4, 21, WOOD_DARK).rect(w - 5, h - 16, 4, 15, WOOD_DARK);
    g.rect(3, h - 15, w - 6, 11, '#8ea9e0').rect(3, h - 15, 16, 11, '#f1efe6');
    g.rect(5, h - 20, 13, 6, '#fdf6e3').rect(3, h - 5, w - 6, 3, WOOD);
  },
  bedCloud(g, w, h) {
    g.ellipse(w / 2, h - 12, w / 2 - 4, 9, '#f6f4ff');
    g.ellipse(12, h - 16, 10, 7, '#ffffff').ellipse(w - 14, h - 15, 11, 8, '#ffffff').ellipse(w / 2, h - 20, 10, 7, '#ffffff');
    g.rect(8, h - 8, w - 16, 3, '#c8c5ee');
    g.px(14, h - 2, '#7cc4f0').px(30, h - 1, '#7cc4f0').px(45, h - 2, '#7cc4f0');
  },
  rug(g, w, h) {
    g.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 8, '#c96f9f');
    g.ellipse(w / 2, h / 2, w / 2 - 9, h / 2 - 11, '#f4a6c8');
    g.ellipse(w / 2, h / 2, w / 2 - 17, h / 2 - 15, '#a79bf0');
  },
  sofa(g, w, h) {
    g.rect(4, h - 24, w - 8, 15, '#5d6cc8');
    g.rect(1, h - 16, 8, 13, '#4a58ad').rect(w - 9, h - 16, 8, 13, '#4a58ad');
    g.rect(8, h - 13, w - 16, 8, '#7886e0').rect(w / 2, h - 13, 1, 8, '#4a58ad');
    g.rect(4, h - 3, 3, 3, WOOD_DARK).rect(w - 7, h - 3, 3, 3, WOOD_DARK);
  },
  shelf(g, w, h) {
    g.rect(2, h - 46, w - 4, 45, WOOD);
    [h - 42, h - 28, h - 14].forEach((y, row) => {
      g.rect(5, y, w - 10, 11, WOOD_DARK);
      const colors = [['#f25f8b', '#7cc4f0', '#f7e08a', '#9be36b'], ['#a79bf0', '#ff9d6e', '#7cf0c8'], ['#f7e08a', '#f4a6c8', '#7886e0', '#c9694c']][row];
      colors.forEach((color, index) => g.rect(6 + index * 5, y + 3 - (index % 2), 4, 8 + (index % 2), color));
    });
  },
  computer(g, w, h) {
    g.rect(2, h - 12, w - 4, 3, WOOD).rect(4, h - 9, 3, 9, WOOD_DARK).rect(w - 7, h - 9, 3, 9, WOOD_DARK);
    g.rect(7, h - 32, 24, 17, '#27305e').rect(9, h - 30, 20, 13, '#101a3a');
    g.rect(11, h - 28, 9, 1, '#7cf0c8').rect(11, h - 25, 14, 1, '#7cc4f0').rect(11, h - 22, 6, 1, '#f4a6c8');
    g.rect(16, h - 15, 6, 3, '#3a4578');
    g.rect(32, h - 28, 5, 16, '#27305e').rect(33, h - 26, 3, 1, '#f25f8b').rect(33, h - 23, 3, 1, '#7cf0c8');
  },
  aquarium(g, w, h) {
    g.rect(2, h - 4, w - 4, 4, WOOD_DARK).rect(2, h - 30, w - 4, 26, '#3f84c9');
    g.rect(3, h - 30, w - 6, 3, '#9ad7f7').rect(2, h - 7, w - 4, 3, '#e8c98f');
    g.rect(9, h - 13, 2, 7, '#5fae4e').rect(30, h - 15, 2, 9, '#5fae4e');
    g.ellipse(16, h - 19, 3, 2, '#ff9d6e').px(12, h - 19, '#ff9d6e');
    g.ellipse(27, h - 23, 2, 1, '#f7e08a').px(30, h - 23, '#f7e08a');
  },
  arcadeMachine(g, w, h) {
    g.rect(6, h - 46, w - 12, 46, '#5a3fa8');
    g.rect(4, h - 46, w - 8, 7, '#f25f8b');
    g.rect(9, h - 37, w - 18, 14, '#101a3a');
    g.rect(12, h - 33, 3, 3, '#f7e08a').rect(19, h - 30, 4, 2, '#7cf0c8').rect(25, h - 34, 2, 2, '#f4a6c8');
    g.rect(6, h - 22, w - 12, 5, '#3f2d80');
    g.rect(11, h - 24, 2, 3, '#ff7a59').rect(23, h - 21, 3, 2, '#7cc4f0').rect(28, h - 21, 3, 2, '#f7e08a');
  },
  window(g, w, h) {
    g.rect(1, 1, w - 2, h - 2, WOOD_LIGHT).rect(4, 4, w - 8, h - 8, null);
    g.rect(w / 2 - 1, 4, 2, h - 8, WOOD_LIGHT).rect(4, h / 2 - 1, w - 8, 2, WOOD_LIGHT);
  },
  starLamp(g, w, h) {
    g.rect(w / 2 - 1, h - 26, 2, 22, '#5a5f8f').rect(w / 2 - 5, h - 4, 10, 3, '#3a3f7c');
    g.dome(w / 2, h - 27, 8, 7, '#f7e08a');
    g.rect(w / 2 - 8, h - 27, 17, 2, '#c89e4a');
    g.px(w / 2 - 3, h - 30, '#ffffff').px(w / 2 + 3, h - 29, '#ffffff').px(w / 2, h - 32, '#ffffff');
  },
  poster(g, w, h) {
    g.rect(2, 2, w - 4, h - 4, '#27305e').rect(4, 4, w - 8, 24, '#f25f8b');
    g.ellipse(w / 2, 16, 8, 8, '#f7e08a').rect(4, 18, w - 8, 2, '#27305e').rect(4, 22, w - 8, 2, '#27305e');
    g.rect(8, 30, w - 16, 2, '#7cc4f0');
  },
  plant(g, w, h) {
    g.rect(w / 2 - 5, h - 9, 10, 8, '#c9694c').rect(w / 2 - 6, h - 10, 12, 2, '#e08c6e');
    g.ellipse(w / 2 - 4, h - 16, 3, 6, '#5fae4e').ellipse(w / 2 + 4, h - 16, 3, 6, '#4a9c62').ellipse(w / 2, h - 21, 3, 7, '#7bd18a');
  },
};

// Filas que un mueble sobresale por encima de su huella
const EXTRA_HEIGHT = { bedBasic: 0, shelf: 30, computer: 16, aquarium: 14, arcadeMachine: 30, starLamp: 18, plant: 8, sofa: 8, bedCloud: 0 };

const cache = new Map();

// Devuelve el dibujo del mueble y su altura total en píxeles
export function furnitureSprite(item) {
  if (cache.has(item.id)) return cache.get(item.id);

  const width = item.w * CELL;
  const height = item.h * CELL + (EXTRA_HEIGHT[item.id] ?? 0);
  const g = new Pixels(width, height);

  DRAW[item.id]?.(g, width, height);
  g.outline(item.layer === 'rug' ? mix(OUTLINE, '#8e4f7c', 0.5) : OUTLINE);

  const sprite = { canvas: g.toCanvas(), width, height };

  cache.set(item.id, sprite);
  return sprite;
}

// ---------- Fondos ----------
const THEMES = {
  basic: { wall: '#8a86c9', wall2: '#7f7bbd', floor: '#a9744f', floor2: '#946343', trim: '#f1e7d2', pattern: 'stripes' },
  gamer: { wall: '#232a52', wall2: '#1c2245', floor: '#2f3560', floor2: '#272c54', trim: '#ff5ac8', pattern: 'neon' },
  nature: { wall: '#7fc49a', wall2: '#74b98e', floor: '#7a9a55', floor2: '#6b8a49', trim: '#a9744f', pattern: 'leaves' },
  night: { wall: '#28315f', wall2: '#232b56', floor: '#3b4478', floor2: '#333c6c', trim: '#a9b4ee', pattern: 'stars' },
  magic: { wall: '#5e3f9e', wall2: '#533790', floor: '#46307c', floor2: '#3d2a6e', trim: '#f7e08a', pattern: 'moons' },
  space: { wall: '#10143a', wall2: '#10143a', floor: '#30375f', floor2: '#272d52', trim: '#7cc4f0', pattern: 'space' },
};

function drawPattern(g, theme, wallHeight, width) {
  const { pattern, wall2 } = theme;

  if (pattern === 'stripes') {
    for (let x = 0; x < width; x += 20) g.rect(x, 0, 10, wallHeight, wall2);
  } else if (pattern === 'neon') {
    g.rect(0, 12, width, 1, '#5ac8ff').rect(0, 14, width, 1, '#3a4b9c');
    for (let x = 12; x < width; x += 32) g.rect(x, 26, 2, wallHeight - 34, wall2);
  } else if (pattern === 'leaves') {
    for (let y = 8; y < wallHeight - 6; y += 18) {
      for (let x = (y % 36 ? 10 : 22); x < width; x += 26) g.ellipse(x, y, 3, 1, '#5fae7a').px(x + 3, y + 1, '#4a9c6a');
    }
  } else {
    const color = pattern === 'moons' ? '#d5b8f7' : '#d8dcff';
    for (let index = 0; index < 54; index += 1) {
      const x = (index * 97 + 13) % width;
      const y = (index * 53 + 7) % (wallHeight - 6);
      g.px(x, y, index % 3 ? color : '#ffffff');
      if (pattern === 'moons' && index % 9 === 0) g.ellipse(x, y, 3, 3, '#f7e08a').ellipse(x + 2, y - 1, 3, 3, theme.wall);
      if (pattern === 'space' && index % 13 === 0) g.ellipse(x, y, 2, 2, '#f4a6c8');
    }
  }
}

// Detalles fijos para que ninguna habitación empiece con la pared vacía
function drawWallDecor(g, theme) {
  const frame = mix(theme.trim, '#000000', 0.25);

  g.rect(36, 26, 30, 24, frame).rect(38, 28, 26, 20, '#27305e');
  g.ellipse(51, 38, 6, 6, '#f7e08a').rect(38, 41, 26, 7, '#4a58ad');

  g.ellipse(265, 34, 11, 11, frame).ellipse(265, 34, 9, 9, '#f4f0e6');
  g.rect(265, 27, 1, 8, '#20203f').rect(265, 34, 6, 1, '#20203f');

  g.rect(150, 60, 44, 3, frame);
  g.rect(154, 50, 4, 10, '#f25f8b').rect(159, 48, 4, 12, '#7cc4f0').rect(164, 51, 4, 9, '#f7e08a');
  g.ellipse(182, 56, 4, 4, '#7bd18a').rect(179, 56, 7, 4, '#c9694c');
}

const roomCache = new Map();

export function roomBackground(themeId, config) {
  if (roomCache.has(themeId)) return roomCache.get(themeId);

  const theme = THEMES[themeId] ?? THEMES.basic;
  const width = config.cols * CELL;
  const height = config.rows * CELL;
  const wallHeight = config.wallRows * CELL;
  const g = new Pixels(width, height);

  g.rect(0, 0, width, wallHeight, theme.wall);
  drawPattern(g, theme, wallHeight, width);
  drawWallDecor(g, theme);
  g.rect(0, wallHeight, width, height - wallHeight, theme.floor);

  for (let y = wallHeight; y < height; y += 10) {
    const offset = (y / 10) % 2 ? 0 : 20;
    g.rect(0, y, width, 1, theme.floor2);
    for (let x = offset; x < width; x += 40) g.rect(x, y, 1, 10, theme.floor2);
  }

  g.rect(0, wallHeight - 3, width, 3, theme.trim);
  g.rect(0, wallHeight, width, 2, mix(theme.floor, '#000000', 0.25));

  const canvas = g.toCanvas();

  roomCache.set(themeId, canvas);
  return canvas;
}

// Color del cielo según la hora local, para ventanas y luz ambiente
export function skyAt(hour) {
  if (hour >= 7 && hour < 11) return { top: '#8fd3f7', bottom: '#fbe6c8', tint: 'rgba(255, 220, 170, 0.05)', stars: false };
  if (hour >= 11 && hour < 18) return { top: '#6db8ee', bottom: '#bfe4fb', tint: null, stars: false };
  if (hour >= 18 && hour < 21) return { top: '#7a5fb8', bottom: '#f4a06e', tint: 'rgba(255, 130, 80, 0.12)', stars: false };
  return { top: '#10143a', bottom: '#2a2f6b', tint: 'rgba(20, 22, 80, 0.32)', stars: true };
}
