// Inventario: lo que posee el jugador, separado de la tienda. Desde aquí se usa, equipa o coloca.

import { L } from '../dialogos.js';
import { T, esc } from '../textos.js';
import { CATEGORIES, effectText } from './tienda.js';

let category = 'all';

function ownedItems(game) {
  return game.catalog.items.filter((item) => (
    game.state.inventory[item.id] && (category === 'all' || item.cat === category)
  ));
}

function cardHtml(game, item) {
  const qty = game.state.inventory[item.id];
  const worn = Object.values(game.pet.equipped).includes(item.id);
  const placed = game.state.placed[item.id] ?? 0;

  return `
    <button type="button" class="item-card" data-item="${item.id}">
      ${game.icon(item.id, '', 48)}
      <strong>${esc(L(item.name))}</strong>
      <small>${esc(T(`cat.${item.cat}`))}</small>
      <span class="item-tag">×${qty}</span>
      ${worn ? `<span class="item-tag is-on">${T('inv.worn')}</span>` : ''}
      ${item.cat === 'furniture' && placed ? `<small>${T('inv.placed', { n: placed })}</small>` : ''}
    </button>`;
}

function renderGrid(root, game) {
  const items = ownedItems(game);

  root.querySelector('#inv-grid').innerHTML = items.length
    ? items.map((item) => cardHtml(game, item)).join('')
    : `<p class="empty">${T('inv.empty')}</p>`;
}

function actionsFor(game, item) {
  const { pet } = game;

  if (item.cat === 'accessory') {
    const worn = pet.equipped[item.slot] === item.id;

    return [{
      label: worn ? T('common.unequip') : T('common.equip'),
      primary: true,
      run: () => game.act(worn ? 'unequip' : 'equip', worn ? { slot: item.slot } : { itemId: item.id }),
    }];
  }

  if (item.cat === 'furniture') {
    return [{ label: T('inv.goRoom'), primary: true, run: () => game.go('room') }];
  }

  if (item.action === 'evolve') return [];

  const use = () => game.act('useItem', { itemId: item.id });

  return [{
    label: T('common.use'),
    primary: true,
    // Los objetos especiales piden confirmación: son caros y no se recuperan
    run: item.cat === 'special'
      ? () => game.confirm(T('inv.confirmUse', { item: L(item.name) }), use)
      : use,
  }];
}

function detail(game, item) {
  game.modal({
    title: L(item.name),
    body: `
      <div class="item-detail">
        ${game.icon(item.id, '', 72)}
        <div>
          <p class="modal-text">${esc(L(item.desc))}</p>
          ${effectText(item) ? `<p class="modal-text"><strong>${esc(effectText(item))}</strong></p>` : ''}
          <p class="modal-text">${T('common.have', { n: game.state.inventory[item.id] })} · ${T(`cat.${item.cat}`)}</p>
          ${item.action === 'evolve' ? `<p class="modal-text"><small>${T('inv.notUsable')}</small></p>` : ''}
          ${item.cat === 'special' && item.action !== 'evolve' ? `<p class="modal-text"><small>${T('inv.ticket')}</small></p>` : ''}
        </div>
      </div>`,
    actions: actionsFor(game, item),
  });
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <div class="tabs" role="group">
        ${['all', ...CATEGORIES].map((id) => `<button type="button" class="tab" data-cat="${id}" aria-pressed="${category === id}">${T(`cat.${id}`)}</button>`).join('')}
      </div>
      <div class="item-grid" id="inv-grid"></div>
    </div>
  `;
  renderGrid(root, game);

  root.querySelector('.tabs').addEventListener('click', (event) => {
    const tab = event.target.closest('[data-cat]');
    if (!tab) return;

    category = tab.dataset.cat;
    root.querySelectorAll('[data-cat]').forEach((other) => other.setAttribute('aria-pressed', String(other === tab)));
    renderGrid(root, game);
  });
  root.querySelector('#inv-grid').addEventListener('click', (event) => {
    const id = event.target.closest('[data-item]')?.dataset.item;
    if (id) detail(game, game.item(id));
  });
}

export function update(game) {
  if (game.viewRoot.querySelector('#inv-grid')) renderGrid(game.viewRoot, game);
}
