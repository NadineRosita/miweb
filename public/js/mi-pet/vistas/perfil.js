// Perfil: nivel y recompensas, estadísticas generales, ajustes y cierre de sesión.

import { L } from '../dialogos.js';
import { unlockAudio } from '../sonido.js';
import { T, esc } from '../textos.js';

const STATS = ['daysPlayed', 'playMs', 'coinsEarned', 'coinsSpent', 'gamesPlayed', 'itemsBought', 'petsAdopted', 'expeditions'];

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function nextReward(game) {
  const { level } = game.state;
  return Object.keys(game.catalog.levelRewards).map(Number).find((value) => value > level);
}

export function render(root, game) {
  const { state, catalog } = game;
  const { stats, settings, level, xp, xpNeeded, discoveredEvolutions } = state;
  const next = nextReward(game);

  const rows = STATS.map((key) => `
    <dt>${T(`s.${key}`)}</dt>
    <dd>${key === 'playMs' ? formatDuration(stats.playMs ?? 0) : Math.floor(stats[key] ?? 0)}</dd>`).join('');

  const rewards = Object.entries(catalog.levelRewards).map(([value, reward]) => `
    <li class="${Number(value) <= level ? 'is-done' : ''}">
      <strong>${T('common.level', { n: value })}</strong>
      <span>${esc(L(reward.text))}</span>
    </li>`).join('');

  root.innerHTML = `
    <div class="view profile">
      <section class="side-panel">
        <h2 class="pixel-title">${esc(T('prof.title', { user: game.username }))}</h2>
        <p class="profile-level">${T('common.level', { n: level })} · ${T('prof.xp', { a: Math.floor(xp), b: xpNeeded })}</p>
        <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${xpNeeded}" aria-valuenow="${Math.floor(xp)}"><span class="bar-fill bar-xp-fill" style="width:${Math.min(100, (xp / xpNeeded) * 100)}%"></span></span>
        <p class="modal-text"><small>${next ? T('prof.next', { n: next }) : T('prof.max')}</small></p>
        <h3 class="pixel-sub">${T('prof.stats')}</h3>
        <dl class="stat-table">${rows}
          <dt>${T('s.discovered')}</dt><dd>${discoveredEvolutions.length}</dd>
        </dl>
      </section>
      <section class="side-panel">
        <h3 class="pixel-sub">${T('prof.levels')}</h3>
        <ol class="reward-list">${rewards}</ol>
      </section>
      <section class="side-panel">
        <h3 class="pixel-sub">${T('prof.settings')}</h3>
        <label class="pet-label">${T('prof.volume')}
          <input type="range" id="set-volume" min="0" max="1" step="0.05" value="${settings.volume}">
        </label>
        <label class="pet-check"><input type="checkbox" id="set-muted" ${settings.muted ? 'checked' : ''}> ${T('prof.mute')}</label>
        <label class="pet-check"><input type="checkbox" id="set-music" ${settings.music ? 'checked' : ''}> ${T('prof.music')}</label>
        <label class="pet-check"><input type="checkbox" id="set-widget" ${settings.widget ? 'checked' : ''}> ${T('prof.widget')}</label>
        <button type="button" class="pet-button" id="set-logout">${T('prof.logout')}</button>
      </section>
    </div>
  `;

  const save = (values) => {
    unlockAudio();
    game.act('settings', values, { silent: true });
  };

  root.querySelector('#set-volume').addEventListener('change', (event) => save({ volume: Number(event.target.value) }));
  root.querySelector('#set-muted').addEventListener('change', (event) => save({ muted: event.target.checked }));
  root.querySelector('#set-music').addEventListener('change', (event) => save({ music: event.target.checked }));
  root.querySelector('#set-widget').addEventListener('change', (event) => save({ widget: event.target.checked }));
  root.querySelector('#set-logout').addEventListener('click', () => game.logout());
}
