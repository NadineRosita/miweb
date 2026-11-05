// Diario de la mascota y álbum de momentos. El servidor guarda claves y datos: el texto se
// compone aquí para que cambie con el idioma.

import { L, fill } from '../dialogos.js';
import { drawStaticScene } from '../escena.js';
import { T, esc } from '../textos.js';

let tab = 'diary';
let journal = null;

const formatTime = (time) => new Date(time).toLocaleString(i18n.lang, { dateStyle: 'short', timeStyle: 'short' });

// Convierte los datos de una entrada en los valores de su plantilla
function diaryVars(game, data) {
  const vars = { ...data, user: game.username };

  if (data.item) vars.item = L(game.item(data.item)?.name ?? '');
  if (data.achievement) vars.value = L(game.catalog.achievements.find(({ id }) => id === data.achievement)?.name ?? '');
  if (data.zone) vars.value = L(game.catalog.zones.find(({ id }) => id === data.zone)?.name ?? '');
  if (data.event) {
    const event = game.catalog.events.find(({ id }) => id === data.event);
    vars.value = fill(L(event?.text ?? ''), { pet: data.pet });
  }
  if (data.branch) vars.value = L(game.species(data.species)?.evolutions[data.branch] ?? '');
  return vars;
}

function renderDiary(box, game) {
  const entries = [...journal.diary].reverse();

  box.innerHTML = entries.length
    ? `<ol class="diary">${entries.map((entry) => {
      const lines = game.catalog.diary[entry.key] ?? [];
      const line = lines[entry.t % Math.max(lines.length, 1)];
      const text = line ? fill(L(line), diaryVars(game, entry.data)) : '';

      return `
        <li class="diary-entry">
          ${game.icon(entry.icon, '', 28)}
          <div><p>${esc(text)}</p><time>${formatTime(entry.t)}</time></div>
        </li>`;
    }).join('')}</ol>`
    : `<p class="empty">${T('journal.empty')}</p>`;
}

function renderAlbum(box, game) {
  const photos = [...journal.album].reverse();

  box.innerHTML = photos.length
    ? `<div class="album">${photos.map((photo, index) => `
      <figure class="photo">
        <canvas data-photo="${index}" role="img" aria-label="${esc(photo.name)}"></canvas>
        <figcaption><strong>${esc(photo.name)}</strong> · ${T(`photo.${photo.reason}`)}<br><time>${formatTime(photo.t)}</time></figcaption>
      </figure>`).join('')}</div>`
    : `<p class="empty">${T('journal.noPhotos')}</p>`;

  box.querySelectorAll('[data-photo]').forEach((canvas) => {
    drawStaticScene(canvas, photos[Number(canvas.dataset.photo)], game.catalog);
  });
}

function renderTab(root, game) {
  const box = root.querySelector('#journal-box');

  if (journal) (tab === 'diary' ? renderDiary : renderAlbum)(box, game);
  root.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <div class="tabs" role="group">
        <button type="button" class="tab" data-tab="diary">${T('journal.diary')}</button>
        <button type="button" class="tab" data-tab="album">${T('journal.album')}</button>
      </div>
      <div id="journal-box"><p class="empty">${T('common.loading')}</p></div>
    </div>
  `;

  root.querySelector('.tabs').addEventListener('click', (event) => {
    const next = event.target.closest('[data-tab]')?.dataset.tab;

    if (next) {
      tab = next;
      renderTab(root, game);
    }
  });

  renderTab(root, game);
  fetch('/api/pet/journal')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('journal'))))
    .then((data) => {
      journal = data.state;
      if (root.querySelector('#journal-box')) renderTab(root, game);
    })
    .catch(() => game.toast(T('err.connection'), 'skull'));
}
