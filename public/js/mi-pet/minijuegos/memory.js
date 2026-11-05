// Parejas con los iconos pixel art del juego.

import { iconUrl } from '../iconos.js';

export const difficulties = ['easy', 'normal', 'hard'];

const PAIRS = { easy: 6, normal: 8, hard: 10 };
const ART = ['apple', 'strawberries', 'pizza', 'cake', 'candy', 'coffee', 'crown', 'bow', 'mysteryBox', 'fish', 'heart', 'star'];
const FLIP_BACK_MS = 800;
const BASE_POINTS = 15;
const MISS_PENALTY = 3;

const shuffle = (list) => list
  .map((value) => [Math.random(), value])
  .sort((a, b) => a[0] - b[0])
  .map(([, value]) => value);

export function run(box, { T, difficulty, sound, end, game }) {
  const pairs = PAIRS[difficulty];
  const deck = shuffle(shuffle(ART).slice(0, pairs).flatMap((art) => [art, art]));
  const started = Date.now();
  let open = [];
  let found = 0;
  let moves = 0;
  let locked = false;

  box.innerHTML = `
    <div class="game-hud">
      <span>${T('g.moves')}: <strong id="mem-moves">0</strong></span>
      <span>${T('g.pairs')}: <strong id="mem-found">0</strong>/${pairs}</span>
      <span>${T('g.time')}: <strong id="mem-time">0</strong>s</span>
    </div>
    <div class="memory-grid" data-pairs="${pairs}">
      ${deck.map((art, index) => `
        <button type="button" class="memory-card" data-index="${index}" aria-label="${T('g.card', { n: index + 1 })}">
          <span class="memory-face memory-back"></span>
          <span class="memory-face memory-front"><img src="${iconUrl(art, game.catalog)}" alt=""></span>
        </button>`).join('')}
    </div>`;

  const cards = [...box.querySelectorAll('.memory-card')];
  const clock = setInterval(() => {
    box.querySelector('#mem-time').textContent = Math.floor((Date.now() - started) / 1000);
  }, 500);

  const finish = () => {
    clearInterval(clock);
    end(Math.max(BASE_POINTS, pairs * BASE_POINTS - Math.max(0, moves - pairs) * MISS_PENALTY));
  };

  box.querySelector('.memory-grid').addEventListener('click', (event) => {
    const card = event.target.closest('.memory-card');
    if (!card || locked || card.classList.contains('is-open')) return;

    card.classList.add('is-open');
    card.setAttribute('aria-label', deck[card.dataset.index]);
    sound('game');
    open.push(card);
    if (open.length < 2) return;

    moves += 1;
    box.querySelector('#mem-moves').textContent = moves;

    const [first, second] = open;

    open = [];
    if (deck[first.dataset.index] === deck[second.dataset.index]) {
      found += 1;
      box.querySelector('#mem-found').textContent = found;
      first.classList.add('is-found');
      second.classList.add('is-found');
      if (found === pairs) finish();
      return;
    }

    locked = true;
    setTimeout(() => {
      [first, second].forEach((node) => {
        node.classList.remove('is-open');
        node.setAttribute('aria-label', T('g.card', { n: cards.indexOf(node) + 1 }));
      });
      locked = false;
    }, FLIP_BACK_MS);
  });

  return () => clearInterval(clock);
}
