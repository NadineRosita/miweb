// Iconos de 16×16 para objetos y logros, con el mismo pincel que los sprites.
// iconUrl devuelve una imagen lista para <img>, generada una vez y guardada.

import { Pixels } from './pixel.js';
import { furnitureSprite } from './muebles.js';

const SIZE = 16;
const potion = (color, shine) => (g) => {
  g.rect(6, 1, 4, 2, '#a9744f').rect(7, 3, 2, 3, '#d8dcff');
  g.ellipse(8, 10, 5, 5, color).ellipse(6, 8, 1, 1, shine);
};

const DRAW = {
  // Comida y bebida
  apple: (g) => g.ellipse(8, 9, 5, 5, '#e8505b').rect(8, 2, 1, 3, '#7a5238').ellipse(11, 3, 2, 1, '#7bd18a').px(6, 7, '#ffb3ba'),
  strawberries: (g) => g.triangle(3, 5, 13, 5, 8, 14, '#e8505b').rect(4, 4, 8, 2, '#7bd18a').px(6, 8, '#fbe68b').px(10, 8, '#fbe68b').px(8, 11, '#fbe68b'),
  pizza: (g) => g.triangle(2, 3, 14, 3, 8, 14, '#f2c14e').rect(2, 2, 13, 2, '#c9863f').ellipse(6, 6, 1, 1, '#c9402f').ellipse(10, 7, 1, 1, '#c9402f').px(8, 10, '#c9402f'),
  cake: (g) => g.rect(2, 8, 12, 6, '#f4a6c8').rect(2, 6, 12, 3, '#fdf6e3').rect(2, 11, 12, 1, '#f1efe6').rect(7, 2, 2, 4, '#7cc4f0').px(7, 1, '#f7a64b'),
  candy: (g) => g.ellipse(8, 8, 4, 4, '#f25f8b').triangle(4, 8, 1, 5, 1, 11, '#ffc6d6').triangle(12, 8, 15, 5, 15, 11, '#ffc6d6').px(7, 7, '#ffffff'),
  cookie: (g) => g.ellipse(8, 8, 6, 6, '#c9966d').ellipse(5, 6, 1, 1, '#5a3a26').ellipse(10, 7, 1, 1, '#5a3a26').ellipse(7, 11, 1, 1, '#5a3a26').rect(12, 2, 2, 2, null),
  ramen: (g) => g.rect(2, 8, 12, 2, '#fdf6e3').dome(8, 9, 6, 3, '#f2c14e').ellipse(8, 11, 6, 3, '#d9685e').rect(11, 1, 1, 8, '#a9744f').rect(13, 1, 1, 8, '#a9744f'),
  coffee: (g) => g.rect(3, 5, 8, 9, '#fdf6e3').rect(3, 5, 8, 2, '#6b4530').rect(11, 7, 3, 5, '#fdf6e3').px(5, 2, '#d8dcff').px(8, 3, '#d8dcff').px(7, 1, '#d8dcff'),
  milk: (g) => g.rect(4, 5, 8, 9, '#f1efe6').triangle(4, 5, 12, 5, 8, 1, '#7cc4f0').px(7, 8, '#f7e08a').px(9, 10, '#f7e08a').px(6, 11, '#f7e08a'),
  soda: (g) => g.rect(5, 3, 6, 11, '#7cc4f0').rect(5, 2, 6, 1, '#d8dcff').rect(5, 6, 6, 3, '#f25f8b').px(7, 11, '#ffffff').px(9, 12, '#ffffff'),
  potion: potion('#a06bf0', '#e2cffc'),

  // Medicinas
  medicine: (g) => g.rect(5, 2, 6, 3, '#f1efe6').rect(4, 5, 8, 9, '#e8505b').rect(7, 7, 2, 5, '#ffffff').rect(6, 9, 4, 1, '#ffffff').rect(6, 8, 4, 2, '#ffffff'),
  bandage: (g) => g.rect(2, 6, 12, 5, '#f2d2a9').rect(6, 6, 4, 5, '#e0b98a').px(7, 7, '#a9744f').px(8, 9, '#a9744f'),
  elixir: potion('#7cf0c8', '#dffcf2'),

  // Accesorios
  sunglasses: (g) => g.rect(1, 6, 6, 4, '#15152b').rect(9, 6, 6, 4, '#15152b').rect(7, 7, 2, 1, '#15152b').px(3, 7, '#5d6cc8').px(11, 7, '#5d6cc8'),
  heartGlasses: (g) => g.rect(2, 5, 2, 2, '#f25f8b').rect(5, 5, 2, 2, '#f25f8b').rect(2, 7, 5, 2, '#f25f8b').rect(3, 9, 3, 1, '#f25f8b').rect(9, 5, 2, 2, '#f25f8b').rect(12, 5, 2, 2, '#f25f8b').rect(9, 7, 5, 2, '#f25f8b').rect(10, 9, 3, 1, '#f25f8b').rect(7, 7, 2, 1, '#f25f8b'),
  beanie: (g) => g.dome(8, 10, 6, 6, '#c9694c').rect(2, 10, 12, 3, '#f1efe6').ellipse(8, 3, 2, 2, '#f1efe6'),
  partyHat: (g) => g.triangle(3, 13, 13, 13, 8, 3, '#f4a6c8').ellipse(8, 2, 1, 1, '#f7e08a').px(7, 9, '#f7e08a').px(9, 11, '#7cc4f0'),
  headphones: (g) => g.line(3, 8, 5, 3, '#3a3f7c').line(13, 8, 11, 3, '#3a3f7c').line(5, 3, 11, 3, '#3a3f7c').rect(2, 8, 3, 5, '#ff7a59').rect(11, 8, 3, 5, '#ff7a59'),
  crown: (g) => g.rect(2, 9, 12, 4, '#f7d354').triangle(2, 9, 6, 9, 2, 4, '#f7d354').triangle(14, 9, 10, 9, 14, 4, '#f7d354').triangle(5, 9, 11, 9, 8, 3, '#f7d354').px(8, 11, '#f25f8b'),
  bow: (g) => g.triangle(8, 8, 2, 4, 2, 12, '#f25f8b').triangle(8, 8, 14, 4, 14, 12, '#f25f8b').rect(7, 7, 3, 3, '#ffc6d6'),
  scarf: (g) => g.rect(2, 4, 12, 4, '#6d7cf0').rect(9, 8, 4, 6, '#6d7cf0').rect(9, 12, 4, 1, '#f7e08a'),
  wings: (g) => g.triangle(7, 8, 1, 2, 3, 12, '#fdf6e3').triangle(9, 8, 15, 2, 13, 12, '#fdf6e3'),
  backpack: (g) => g.rect(3, 4, 10, 10, '#c9694c').rect(5, 8, 6, 4, '#a24f37').rect(6, 2, 4, 2, '#7a3a28'),
  costume: (g) => g.dome(8, 13, 5, 10, '#f1efe6').rect(3, 13, 3, 2, '#f1efe6').rect(10, 13, 3, 2, '#f1efe6').px(6, 7, '#20203f').px(10, 7, '#20203f'),

  // Especiales
  growthPotion: potion('#7bd18a', '#d1f7a8'),
  rainbowPotion: (g) => {
    potion('#f4a6c8', '#ffffff')(g);
    g.rect(4, 9, 8, 1, '#fbe68b').rect(4, 11, 8, 1, '#8fd3f7').rect(5, 13, 6, 1, '#b9a4f5');
  },
  personalityCrystal: (g) => g.triangle(8, 1, 3, 7, 13, 7, '#c9a5f2').triangle(3, 7, 13, 7, 8, 15, '#a06bf0').px(7, 5, '#ffffff'),
  timeMachine: (g) => g.ellipse(8, 8, 6, 6, '#f7e08a').ellipse(8, 8, 4, 4, '#fdf6e3').rect(8, 5, 1, 4, '#20203f').rect(8, 8, 3, 1, '#20203f').rect(7, 0, 3, 2, '#c89e4a'),
  mysteryBox: (g) => g.rect(2, 5, 12, 9, '#a79bf0').rect(1, 4, 14, 3, '#7464c8').rect(7, 4, 2, 10, '#f7e08a').rect(6, 8, 1, 1, '#f7e08a'),
  luckyCharm: (g) => g.ellipse(5, 6, 3, 3, '#7bd18a').ellipse(11, 6, 3, 3, '#7bd18a').ellipse(5, 11, 3, 3, '#7bd18a').ellipse(11, 11, 3, 3, '#7bd18a').rect(7, 8, 2, 7, '#4a9c62'),
  goldenTicket: (g) => g.rect(1, 5, 14, 7, '#f7d354').rect(3, 7, 10, 3, '#fbe68b').px(0, 8, null).rect(5, 8, 6, 1, '#c89e4a'),

  // Logros y varios
  heart: (g) => g.ellipse(5, 6, 3, 3, '#f25f8b').ellipse(11, 6, 3, 3, '#f25f8b').triangle(2, 8, 14, 8, 8, 14, '#f25f8b').px(4, 5, '#ffc6d6'),
  food: (g) => DRAW.apple(g),
  calendar: (g) => g.rect(2, 3, 12, 11, '#fdf6e3').rect(2, 3, 12, 3, '#e8505b').rect(5, 1, 1, 3, '#20203f').rect(10, 1, 1, 3, '#20203f').rect(4, 8, 2, 2, '#7886e0').rect(7, 8, 2, 2, '#7886e0').rect(10, 8, 2, 2, '#7886e0').rect(4, 11, 2, 2, '#7886e0'),
  joystick: (g) => g.rect(3, 11, 10, 3, '#5d6cc8').rect(7, 5, 2, 6, '#a9b4ee').ellipse(8, 4, 3, 3, '#e8505b').rect(10, 9, 2, 2, '#f7e08a'),
  star: (g) => g.triangle(8, 1, 5, 7, 11, 7, '#f7d354').triangle(1, 6, 15, 6, 8, 11, '#f7d354').triangle(8, 9, 3, 14, 7, 7, '#f7d354').triangle(8, 9, 13, 14, 9, 7, '#f7d354'),
  bag: (g) => g.rect(3, 5, 10, 9, '#ff9d6e').rect(5, 2, 1, 4, '#a24f37').rect(10, 2, 1, 4, '#a24f37').rect(5, 2, 6, 1, '#a24f37'),
  trophy: (g) => g.rect(4, 2, 8, 6, '#f7d354').ellipse(8, 7, 4, 3, '#f7d354').rect(7, 10, 2, 2, '#c89e4a').rect(5, 12, 6, 2, '#c89e4a').rect(2, 3, 2, 3, '#c89e4a').rect(12, 3, 2, 3, '#c89e4a'),
  melon: (g) => g.ellipse(8, 8, 6, 6, '#c8e68c').line(8, 2, 8, 14, '#8cb85a').line(4, 3, 3, 12, '#8cb85a').line(12, 3, 13, 12, '#8cb85a').px(8, 1, '#7a5238'),
  shield: (g) => g.rect(3, 2, 10, 7, '#7cc4f0').triangle(3, 9, 13, 9, 8, 15, '#7cc4f0').rect(7, 4, 2, 7, '#ffffff').rect(5, 6, 6, 2, '#ffffff'),
  sofa: (g) => g.rect(3, 5, 10, 6, '#5d6cc8').rect(1, 8, 3, 5, '#4a58ad').rect(12, 8, 3, 5, '#4a58ad').rect(4, 9, 8, 3, '#7886e0'),
  compass: (g) => g.ellipse(8, 8, 6, 6, '#f1e7d2').triangle(8, 3, 6, 8, 10, 8, '#e8505b').triangle(8, 13, 6, 8, 10, 8, '#5d6cc8').px(8, 8, '#20203f'),
  moon: (g) => g.ellipse(8, 8, 6, 6, '#f7e08a').ellipse(11, 6, 5, 5, null),
  leaf: (g) => g.ellipse(8, 7, 4, 6, '#7bd18a').line(8, 2, 8, 14, '#4a9c62'),
  wave: (g) => g.rect(1, 8, 14, 6, '#5ab0e8').ellipse(4, 8, 3, 2, '#9ad7f7').ellipse(10, 8, 3, 2, '#9ad7f7'),
  map: (g) => g.rect(2, 3, 12, 10, '#f1e7d2').line(3, 10, 7, 6, '#e8505b').line(7, 6, 12, 8, '#e8505b').px(12, 8, '#20203f').rect(8, 3, 1, 10, '#d9c9a8'),
  fish: (g) => g.ellipse(7, 8, 5, 3, '#ff9d6e').triangle(11, 8, 15, 4, 15, 12, '#f27a4a').px(4, 7, '#20203f'),
  skull: (g) => g.ellipse(8, 6, 5, 5, '#f1efe6').rect(5, 10, 6, 3, '#f1efe6').rect(5, 5, 2, 2, '#20203f').rect(9, 5, 2, 2, '#20203f').px(7, 12, '#20203f').px(9, 12, '#20203f'),
  chip: (g) => g.rect(4, 4, 8, 8, '#3f6fb8').rect(6, 6, 4, 4, '#7cf0c8').px(2, 6, '#a9b4ee').px(2, 9, '#a9b4ee').px(13, 6, '#a9b4ee').px(13, 9, '#a9b4ee').px(6, 2, '#a9b4ee').px(9, 2, '#a9b4ee').px(6, 13, '#a9b4ee').px(9, 13, '#a9b4ee'),
  box: (g) => DRAW.mysteryBox(g),
  flask: (g) => g.rect(6, 1, 4, 5, '#d8dcff').triangle(3, 14, 13, 14, 8, 5, '#9be36b').px(7, 11, '#ffffff'),
  pill: (g) => g.ellipse(5, 8, 3, 3, '#e8505b').ellipse(11, 8, 3, 3, '#f1efe6').rect(5, 5, 6, 7, '#f1efe6').rect(5, 5, 3, 7, '#e8505b'),
  pencil: (g) => g.line(3, 13, 12, 4, '#f7d354').line(4, 13, 13, 4, '#f7d354').px(3, 14, '#20203f'),
  camera: (g) => g.rect(2, 5, 12, 9, '#5a5f8f').rect(5, 3, 5, 2, '#5a5f8f').ellipse(8, 9, 3, 3, '#27305e').px(7, 8, '#7cc4f0'),
  home: (g) => g.triangle(1, 8, 15, 8, 8, 1, '#f25f8b').rect(4, 8, 8, 6, '#fdf6e3').rect(7, 10, 2, 4, '#7a5238'),
  shop: (g) => g.rect(2, 7, 12, 7, '#fdf6e3').rect(1, 3, 14, 4, '#7cc4f0').rect(4, 3, 2, 4, '#fdf6e3').rect(9, 3, 2, 4, '#fdf6e3').rect(6, 10, 3, 4, '#a9744f'),
  book: (g) => g.rect(2, 3, 12, 11, '#a06bf0').rect(4, 4, 8, 9, '#fdf6e3').rect(5, 6, 6, 1, '#7886e0').rect(5, 9, 5, 1, '#7886e0'),
  user: (g) => g.ellipse(8, 5, 3, 3, '#f2d2a9').dome(8, 14, 6, 6, '#7886e0'),
  gift: (g) => g.rect(2, 6, 12, 8, '#f25f8b').rect(1, 5, 14, 3, '#ff8fb0').rect(7, 5, 2, 9, '#f7e08a').px(5, 3, '#f7e08a').px(10, 3, '#f7e08a').px(6, 4, '#f7e08a').px(9, 4, '#f7e08a'),
  tomb: (g) => g.dome(8, 13, 5, 9, '#a9b4d8').rect(2, 13, 12, 2, '#5fae4e').rect(7, 6, 2, 5, '#5a5f8f').rect(5, 7, 6, 2, '#5a5f8f'),
  question: (g) => g.rect(4, 2, 8, 2, '#a9b4ee').rect(10, 3, 2, 4, '#a9b4ee').rect(7, 6, 4, 2, '#a9b4ee').rect(7, 8, 2, 3, '#a9b4ee').rect(7, 12, 2, 2, '#a9b4ee'),
};

// Lista de iconos sin outline adicional: ya tienen el color de fondo recortado
const urls = new Map();

function furnitureIcon(item) {
  const sprite = furnitureSprite(item);
  const canvas = document.createElement('canvas');
  const side = Math.max(sprite.width, sprite.height);

  canvas.width = side;
  canvas.height = side;
  canvas.getContext('2d').drawImage(sprite.canvas, (side - sprite.width) / 2, side - sprite.height);
  return canvas.toDataURL();
}

export function iconUrl(id, catalog) {
  if (urls.has(id)) return urls.get(id);

  const item = catalog?.items.find((entry) => entry.id === id);
  let url;

  if (item?.cat === 'furniture') {
    url = furnitureIcon(item);
  } else {
    const g = new Pixels(SIZE + 2, SIZE + 2);
    const inner = new Pixels(SIZE, SIZE);

    (DRAW[id] ?? DRAW.question)(inner);
    g.blit(inner, 1, 1);
    g.outline();
    url = g.toCanvas().toDataURL();
  }

  urls.set(id, url);
  return url;
}

export function iconHtml(id, catalog, alt = '', size = 32) {
  return `<img class="pixel-icon" src="${iconUrl(id, catalog)}" alt="${alt}" width="${size}" height="${size}" loading="lazy">`;
}
