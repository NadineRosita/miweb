// Sala Arcade. Cada minijuego vive en minijuegos/ y exporta:
//   difficulties  lista de dificultades (opcional)
//   run(box, api) arranca la partida y devuelve una función que la limpia.
//     api: { T, L, difficulty, game, sound, end(score, info) }
//     end cierra la partida: el servidor valida la puntuación y paga.

import { L } from '../dialogos.js';
import { playSound } from '../sonido.js';
import { T, esc } from '../textos.js';
import * as snake from '../minijuegos/snake.js';
import * as memory from '../minijuegos/memory.js';
import * as fishing from '../minijuegos/pesca.js';
import * as clicker from '../minijuegos/clicker.js';
import * as dodge from '../minijuegos/esquivar.js';
import * as guess from '../minijuegos/adivina.js';
import * as minesweeper from '../minijuegos/buscaminas.js';

const GAMES = { snake, memory, clicker, guess, fishing, minesweeper, dodge };
const ICONS = { snake: 'leaf', memory: 'heart', clicker: 'star', guess: 'question', fishing: 'fish', minesweeper: 'skull', dodge: 'joystick' };

function lockReason(game, id) {
  const rule = game.catalog.config.arcade.games[id];

  if ((rule.level ?? 1) > game.state.level) return T('arcade.needsLevel', { n: rule.level });
  if (rule.furniture && !game.state.inventory[rule.furniture]) {
    return T('arcade.needsFurniture', { item: L(game.item(rule.furniture).name) });
  }
  return null;
}

function renderGrid(root, game) {
  const { arcade } = game.catalog.config;
  const { daily, records } = game.state;

  root.querySelector('#arcade-today').textContent = T('arcade.today', { n: daily.arcadeCoins, max: arcade.dailyCoinsCap });
  root.querySelector('#arcade-grid').innerHTML = Object.keys(GAMES).map((id) => {
    const lock = lockReason(game, id);
    const rule = arcade.games[id];

    return `
      <article class="arcade-card ${lock ? 'is-locked' : ''}">
        ${game.icon(ICONS[id], '', 48)}
        <h3>${T(`game.${id}`)}</h3>
        <p>${T(`game.${id}.help`)}</p>
        <small>${T('arcade.record', { n: records[id] ?? 0 })} · ${daily.arcadeByGame[id] ?? 0}/${rule.dailyCap} 🍈</small>
        ${lock
    ? `<span class="item-tag is-lock">${esc(lock)}</span>`
    : `<button type="button" class="pet-button is-primary" data-game="${id}">${T('arcade.play')}</button>`}
      </article>`;
  }).join('');
}

function openGame(root, game, id) {
  const module = GAMES[id];
  let cleanup = null;
  let difficulty = module.difficulties ? 'normal' : undefined;

  const close = game.modal({
    title: T(`game.${id}`),
    wide: true,
    body: '<div class="game-box" id="game-box"></div>',
    onClose: () => {
      cleanup?.();
      cleanup = null;
      if (root.isConnected && root.querySelector('#arcade-grid')) renderGrid(root, game);
    },
    onMount: (body) => {
      const box = body.querySelector('#game-box');

      const showStart = () => {
        cleanup?.();
        cleanup = null;
        box.innerHTML = `
          <div class="game-screen">
            ${game.icon(ICONS[id], '', 64)}
            <p class="modal-text">${T(`game.${id}.help`)}</p>
            ${module.difficulties ? `
              <div class="tabs" role="group" aria-label="${T('arcade.difficulty')}">
                ${module.difficulties.map((level) => `<button type="button" class="tab" data-level="${level}" aria-pressed="${level === difficulty}">${T(`diff.${level}`)}</button>`).join('')}
              </div>` : ''}
            <button type="button" class="pet-button is-primary" id="game-start">${T('common.start')}</button>
          </div>`;
        box.querySelector('.tabs')?.addEventListener('click', (event) => {
          const level = event.target.closest('[data-level]')?.dataset.level;
          if (!level) return;

          difficulty = level;
          box.querySelectorAll('[data-level]').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.level === level)));
        });
        box.querySelector('#game-start').addEventListener('click', start);
        box.querySelector('#game-start').focus();
      };

      const showResult = async (score, info) => {
        cleanup?.();
        cleanup = null;

        const payload = { game: id, score, ...(difficulty ? { difficulty } : {}) };
        const result = await game.act('arcadeFinish', payload, { silent: true });
        const entry = result?.fx.find((fx) => fx.type === 'arcade');
        const fish = result?.fx.find((fx) => fx.type === 'fish');
        const caught = fish && game.catalog.fish.find((row) => row.id === fish.id);

        if (!box.isConnected) return;

        const shown = entry?.score ?? 0;

        playSound(entry?.coins ? 'win' : 'lose');
        box.innerHTML = `
          <div class="game-screen">
            <h3 class="pixel-title">${T('arcade.result')}</h3>
            ${info ? `<p class="modal-text">${esc(info)}</p>` : ''}
            ${caught ? `<p class="modal-text"><strong>${esc(T('g.caught', { fish: L(caught.name) }))}</strong> · ${T(`rarity.${caught.rarity}`)}</p>` : ''}
            <p class="modal-text">${T('arcade.score', { n: shown })}</p>
            ${entry?.newRecord ? `<p class="modal-text"><strong>${T('arcade.record.new')}</strong></p>` : ''}
            <p class="game-coins">${T('arcade.earned', { n: entry?.coins ?? 0 })}</p>
            ${entry?.capped ? `<p class="modal-text"><small>${T('arcade.capped')}</small></p>` : ''}
            ${entry?.rejected ? `<p class="modal-text"><small>${T('arcade.rejected')}</small></p>` : ''}
            <div class="pet-modal-actions">
              <button type="button" class="pet-button" id="game-close">${T('common.close')}</button>
              <button type="button" class="pet-button is-primary" id="game-again">${T('common.retry')}</button>
            </div>
          </div>`;
        box.querySelector('#game-close').addEventListener('click', close);
        box.querySelector('#game-again').addEventListener('click', showStart);
        box.querySelector('#game-again').focus();
      };

      async function start() {
        const session = await game.act('arcadeStart', { game: id }, { silent: true });
        if (!session || !box.isConnected) return;

        box.replaceChildren();
        cleanup = module.run(box, {
          T, L, game, difficulty, sound: playSound,
          end: (score, info) => showResult(score, info),
        });
      }

      showStart();
    },
  });
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <div class="arcade-head">
        <p>${T('arcade.intro')}</p>
        <strong id="arcade-today"></strong>
      </div>
      <div class="arcade-grid" id="arcade-grid"></div>
    </div>
  `;
  renderGrid(root, game);
  root.querySelector('#arcade-grid').addEventListener('click', (event) => {
    const id = event.target.closest('[data-game]')?.dataset.game;

    if (id) {
      playSound('click');
      openGame(root, game, id);
    }
  });
}

export function update(game) {
  if (game.viewRoot.querySelector('#arcade-grid')) renderGrid(game.viewRoot, game);
}
