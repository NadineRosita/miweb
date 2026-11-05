// Logros: desbloqueados, pendientes y progreso.

import { L } from '../dialogos.js';
import { T, esc } from '../textos.js';

const formatDate = (time) => new Date(time).toLocaleDateString(i18n.lang);

export function render(root, game) {
  const { achievements } = game.catalog;
  const { achievements: earned, stats } = game.state;
  const count = achievements.filter(({ id }) => earned[id]).length;

  const cards = achievements.map((achievement) => {
    const date = earned[achievement.id];
    const hidden = achievement.hidden && !date;
    const progress = achievement.stat ? Math.min(stats[achievement.stat] ?? 0, achievement.goal) : null;

    return `
      <article class="ach-card ${date ? 'is-done' : ''}">
        ${game.icon(hidden ? 'question' : achievement.icon, '', 40)}
        <div>
          <h3>${hidden ? T('ach.hidden') : esc(L(achievement.name))}</h3>
          <p>${hidden ? T('col.unknown') : esc(L(achievement.desc))}</p>
          <small>
            ${date ? T('ach.unlockedOn', { date: formatDate(date) }) : T('ach.reward', { n: achievement.coins })}
            ${!date && progress !== null ? ` · ${T('ach.progress', { a: Math.floor(progress), b: achievement.goal })}` : ''}
          </small>
        </div>
      </article>`;
  }).join('');

  root.innerHTML = `
    <div class="view">
      <p class="view-intro">${T('ach.count', { a: count, b: achievements.length })}</p>
      <div class="ach-grid">${cards}</div>
    </div>
  `;
}
