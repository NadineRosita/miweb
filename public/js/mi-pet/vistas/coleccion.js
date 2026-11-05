// Colección: tus mascotas, todas las especies, evoluciones, hallazgos y cementerio.

import { L, fill } from '../dialogos.js';
import { portrait, specOf } from '../retrato.js';
import { T, esc } from '../textos.js';
import { adoptionForm } from './adopcion.js';

const TABS = ['pets', 'species', 'evolutions', 'items', 'grave'];

let tab = 'pets';

const formatDate = (time) => new Date(time).toLocaleDateString(i18n.lang);

function unlockTexts(game, status, species) {
  const parts = status.checks.map((check) => {
    switch (check.type) {
      case 'level': return T('unlock.level', { n: check.level });
      case 'achievement': return T('unlock.achievement', { name: L(game.catalog.achievements.find(({ id }) => id === check.id).name) });
      case 'ticket': return T('unlock.ticket');
      default: return T('unlock.flagOrLevel', { n: check.level });
    }
  });

  if (species.unlock?.coins && !game.state.unlockedSpecies.includes(species.id)) parts.push(T('unlock.coins', { n: species.unlock.coins }));
  return parts;
}

function renderPets(box, game) {
  const pets = Object.values(game.state.pets);

  box.innerHTML = `
    <p class="view-intro">${T('col.nursery')}</p>
    <div class="species-grid">${pets.map((pet) => `
      <article class="species-card" data-card="${pet.id}">
        <div class="species-art"></div>
        <strong>${esc(pet.name)}</strong>
        <small>${esc(L(pet.evolution ? game.species(pet.species).evolutions[pet.evolution] : game.species(pet.species).name))}</small>
        ${pet.id === game.state.activePetId
    ? `<span class="item-tag is-on">${T('col.active')}</span>`
    : `<button type="button" class="pet-button is-small" data-switch="${pet.id}">${T('col.switch')}</button>`}
      </article>`).join('')}</div>`;

  pets.forEach((pet) => {
    box.querySelector(`[data-card="${pet.id}"] .species-art`).append(portrait(specOf(pet), game.catalog, { label: pet.name }));
  });
}

function speciesDetail(game, species, status) {
  const requirements = unlockTexts(game, status, species);
  const actions = [];

  if (status.unlocked && !status.owned) {
    actions.push({
      label: status.price ? T('col.adoptFor', { n: status.price }) : T('col.adopt'),
      primary: true,
      disabled: status.price > game.state.coins,
      run: () => {
        game.modal({
          title: T('col.adopt'),
          wide: true,
          body: '<div id="adopt-box"></div>',
          onMount: (body) => adoptionForm(body.querySelector('#adopt-box'), game, species, { price: status.price }),
        });
        return true;
      },
    });
  }

  game.modal({
    title: L(species.name),
    body: `
      <div class="sheet">
        <div class="sheet-art"></div>
        <div>
          <p class="modal-text">${esc(L(species.desc))}</p>
          <p class="modal-text"><strong>${T('adopt.traits')}:</strong> ${esc(L(species.personality))}</p>
          ${requirements.length ? `<p class="modal-text"><strong>${T('common.locked')}:</strong> ${esc(requirements.join(' · '))}</p>` : ''}
        </div>
      </div>`,
    actions,
    onMount: (body) => body.querySelector('.sheet-art').append(portrait({ species: species.id }, game.catalog, { label: L(species.name) })),
  });
}

function renderSpecies(box, game) {
  const { speciesStatus } = game.state;

  box.innerHTML = `<div class="species-grid">${game.catalog.species.map((species) => {
    const status = speciesStatus.find(({ id }) => id === species.id);

    return `
      <button type="button" class="species-card ${status.unlocked ? '' : 'is-locked'}" data-species="${species.id}">
        <span class="species-art"></span>
        <strong>${esc(L(species.name))}</strong>
        <small>${status.owned ? T('col.owned') : status.unlocked ? T('col.adopt') : T('common.locked')}</small>
      </button>`;
  }).join('')}</div>`;

  game.catalog.species.forEach((species) => {
    box.querySelector(`[data-species="${species.id}"] .species-art`).append(portrait({ species: species.id }, game.catalog, { label: L(species.name), still: true }));
  });
}

function renderEvolutions(box, game) {
  const { discoveredEvolutions } = game.state;
  const branches = Object.keys(game.catalog.branches);
  const total = game.catalog.species.length * branches.length;

  box.innerHTML = `
    <p class="view-intro">${T('col.discovered', { n: discoveredEvolutions.length, max: total })}</p>
    <div class="evo-table">${game.catalog.species.map((species) => `
      <div class="evo-row">
        <strong>${esc(L(species.name))}</strong>
        ${branches.map((branch) => {
    const known = discoveredEvolutions.includes(`${species.id}:${branch}`);

    return `<span class="evo-slot ${known ? 'is-known' : ''}" data-evo="${species.id}:${branch}" title="${esc(L(game.catalog.branches[branch].hint))}">
            <span class="evo-art"></span>
            <small>${known ? esc(L(species.evolutions[branch])) : T('col.unknown')}</small>
          </span>`;
  }).join('')}
      </div>`).join('')}</div>`;

  discoveredEvolutions.forEach((key) => {
    const [species, branch] = key.split(':');
    box.querySelector(`[data-evo="${key}"] .evo-art`)?.append(portrait({ species, evolution: branch }, game.catalog, { still: true, label: key }));
  });
}

function renderItems(box, game) {
  const entries = Object.entries(game.state.collectibles);

  box.innerHTML = entries.length
    ? `<div class="chips">${entries.map(([id, count]) => `<span class="chip">${esc(L(game.catalog.collectibles[id]))} ×${count}</span>`).join('')}</div>`
    : `<p class="empty">${T('col.noItems')}</p>`;
}

function renderGrave(box, game) {
  const { graveyard } = game.state;

  box.innerHTML = graveyard.length
    ? `<div class="species-grid">${graveyard.map((pet, index) => `
      <article class="species-card is-grave" data-grave="${index}">
        <div class="species-art">${game.icon('tomb', '', 56)}</div>
        <strong>${esc(pet.name)}</strong>
        <small>${esc(fill(L(game.catalog.epitaphs[pet.epitaph]), { pet: pet.name }))}</small>
        <small>${T('col.born', { date: formatDate(pet.born) })}<br>${T('col.died', { date: formatDate(pet.died) })}</small>
      </article>`).join('')}</div>`
    : `<p class="empty">${T('col.noGrave')}</p>`;
}

const RENDERERS = { pets: renderPets, species: renderSpecies, evolutions: renderEvolutions, items: renderItems, grave: renderGrave };

function renderTab(root, game) {
  RENDERERS[tab](root.querySelector('#col-box'), game);
  root.querySelectorAll('[data-col]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.col === tab)));
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <div class="tabs" role="group">
        ${TABS.map((id) => `<button type="button" class="tab" data-col="${id}">${T(`col.${id}`)}</button>`).join('')}
      </div>
      <div id="col-box"></div>
    </div>
  `;
  renderTab(root, game);

  root.querySelector('.view').addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { col, switch: petId, species } = button.dataset;

    if (col) {
      tab = col;
      renderTab(root, game);
    }
    if (petId) {
      await game.act('switchPet', { petId }, { silent: true });
      renderTab(root, game);
    }
    if (species) speciesDetail(game, game.species(species), game.state.speciesStatus.find(({ id }) => id === species));
  });
}
