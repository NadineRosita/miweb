// Expediciones: la mascota sale a una zona y vuelve pasado un rato con lo que encuentre.

import { L, fill } from '../dialogos.js';
import { T, esc } from '../textos.js';

const REFRESH_MS = 1000;
const ZONE_COLORS = {
  forest: ['#2f6b4f', '#7bd18a'], beach: ['#3f84c9', '#f2d27a'], city: ['#3a3f7c', '#f4a6c8'],
  mountain: ['#5a5f8f', '#e8e6f7'], underwater: ['#1f4a8c', '#7cf0c8'], space: ['#10143a', '#a79bf0'],
};

let timer = null;

const pad = (value) => String(value).padStart(2, '0');

function formatLeft(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}

function lockText(game, zone) {
  if (zone.level > game.state.level) return T('common.level', { n: zone.level });

  if (zone.achievement && !game.state.achievements[zone.achievement]) {
    const achievement = game.catalog.achievements.find(({ id }) => id === zone.achievement);
    return T('explore.needAch', { name: L(achievement.name) });
  }
  return null;
}

function zoneCard(game, zone) {
  const lock = lockText(game, zone);
  const busy = Boolean(game.state.expedition);
  const [from, to] = ZONE_COLORS[zone.id];
  const tired = game.pet.stats.energy < zone.energy;

  return `
    <article class="zone-card ${lock ? 'is-locked' : ''}">
      <div class="zone-art" style="background:linear-gradient(180deg, ${from}, ${to})"></div>
      <h3>${esc(L(zone.name))}</h3>
      <p>${esc(L(zone.desc))}</p>
      <small>${T('explore.duration', { n: zone.minutes })} · ${T('explore.energy', { n: zone.energy })}</small>
      ${lock
    ? `<span class="item-tag is-lock">${esc(lock)}</span>`
    : `<button type="button" class="pet-button is-primary" data-zone="${zone.id}" ${busy || tired || game.pet.sick ? 'disabled' : ''}>${T('explore.go')}</button>`}
    </article>`;
}

function renderTrip(root, game) {
  const box = root.querySelector('#explore-trip');
  const { expedition, now } = game.state;

  if (!expedition) {
    box.innerHTML = '';
    return;
  }

  const zone = game.catalog.zones.find(({ id }) => id === expedition.zone);
  const left = expedition.endsAt - Date.now();
  const total = expedition.endsAt - expedition.startedAt;
  const done = left <= 0 || (game.state.expeditionReady && now >= expedition.endsAt);
  const percent = done ? 100 : Math.min(100, ((total - left) / total) * 100);

  box.innerHTML = `
    <div class="trip">
      <strong>${esc(T('explore.running', { zone: L(zone.name) }))}</strong>
      <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span class="bar-fill bar-energy" style="width:${percent}%"></span></span>
      ${done
    ? `<button type="button" class="pet-button is-primary" id="explore-claim">${T('explore.claim')}</button>`
    : `<small id="explore-left">${T('explore.left', { time: formatLeft(left) })}</small>`}
    </div>`;
}

function renderZones(root, game) {
  root.querySelector('#explore-zones').innerHTML = game.catalog.zones.map((zone) => zoneCard(game, zone)).join('');
}

function report(game, entry) {
  const zone = game.catalog.zones.find(({ id }) => id === entry.zone);
  const story = fill(L(zone.stories[entry.story]), { pet: game.pet?.name ?? '' });
  const found = entry.items.map((id) => `${game.icon(id, L(game.item(id).name), 32)}`).join('');
  const relic = entry.collectible ? L(game.catalog.collectibles[entry.collectible]) : null;

  game.modal({
    title: T('explore.report', { zone: L(zone.name) }),
    body: `
      <p class="modal-text">${esc(story)}</p>
      <h3 class="pixel-sub">${T('explore.found')}</h3>
      <div class="chips">${found}${relic ? `<span class="chip">${esc(relic)}</span>` : ''}${!found && !relic ? `<p class="modal-text">${T('explore.nothing')}</p>` : ''}</div>
      <p class="modal-text"><strong>${T('explore.reward', { coins: entry.coins, xp: entry.xp })}</strong></p>`,
  });
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <p class="view-intro">${T('explore.intro')}</p>
      <div id="explore-trip"></div>
      <div class="zone-grid" id="explore-zones"></div>
    </div>
  `;
  renderTrip(root, game);
  renderZones(root, game);

  root.querySelector('.view').addEventListener('click', async (event) => {
    const zone = event.target.closest('[data-zone]')?.dataset.zone;

    if (zone) {
      await game.act('exploreStart', { zone }, { silent: true });
      renderTrip(root, game);
      renderZones(root, game);
    }
    if (event.target.closest('#explore-claim')) {
      const result = await game.act('exploreClaim', {}, { silent: true });

      if (result) {
        renderTrip(root, game);
        renderZones(root, game);
        report(game, result.fx.find(({ type }) => type === 'expedition'));
      }
    }
  });

  clearInterval(timer);
  timer = setInterval(() => {
    const trip = game.state?.expedition;
    if (!trip) return;

    const left = root.querySelector('#explore-left');

    if (trip.endsAt <= Date.now() || !left) renderTrip(root, game);
    else left.textContent = T('explore.left', { time: formatLeft(trip.endsAt - Date.now()) });
  }, REFRESH_MS);
}

export function update(game) {
  const root = game.viewRoot;

  if (root.querySelector('#explore-zones')) {
    renderTrip(root, game);
    renderZones(root, game);
  }
}

export function leave() {
  clearInterval(timer);
}
