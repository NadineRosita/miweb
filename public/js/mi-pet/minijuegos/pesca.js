// Pesca: lanzar, esperar y recoger a tiempo. Lo que sale del agua lo decide el servidor.

import { portrait, specOf } from '../retrato.js';

const WAIT_MS = [1800, 5500];
const BITE_WINDOW_MS = 1300;
const HOOKED = 1; // Cualquier valor positivo: la captura real la decide el servidor

export function run(box, { T, sound, end, game }) {
  box.innerHTML = `
    <div class="fishing">
      <div class="fishing-sky"></div>
      <div class="fishing-dock"></div>
      <div class="fishing-line" id="fish-line"></div>
      <div class="fishing-bobber" id="fish-bobber"></div>
      <div class="fishing-water"></div>
    </div>
    <p class="game-status" id="fish-status" role="status">&nbsp;</p>
    <button type="button" class="pet-button is-primary game-action" id="fish-action">${T('g.cast')}</button>`;

  box.querySelector('.fishing-dock').append(portrait(specOf(game.pet), game.catalog, { label: game.pet.name }));

  const scene = box.querySelector('.fishing');
  const status = box.querySelector('#fish-status');
  const button = box.querySelector('#fish-action');
  let phase = 'ready';
  let timer = null;

  const say = (text) => {
    status.textContent = text;
  };

  const bite = () => {
    phase = 'bite';
    scene.classList.add('is-bite');
    say(T('g.bite'));
    sound('win');
    button.textContent = T('g.reel');
    timer = setTimeout(() => {
      phase = 'over';
      end(0, T('g.tooLate'));
    }, BITE_WINDOW_MS);
  };

  button.addEventListener('click', () => {
    if (phase === 'ready') {
      phase = 'wait';
      scene.classList.add('is-cast');
      button.textContent = T('g.reel');
      say(T('g.waiting'));
      sound('click');
      timer = setTimeout(bite, WAIT_MS[0] + Math.random() * (WAIT_MS[1] - WAIT_MS[0]));
    } else if (phase === 'wait') {
      clearTimeout(timer);
      phase = 'over';
      end(0, T('g.tooSoon'));
    } else if (phase === 'bite') {
      clearTimeout(timer);
      phase = 'over';
      end(HOOKED);
    }
  });

  return () => clearTimeout(timer);
}
