// Tienda: categorías, buscador, filtros y confirmación de compra.

import { L } from '../dialogos.js';
import { T, esc } from '../textos.js';

export const CATEGORIES = ['food', 'drink', 'medicine', 'furniture', 'accessory', 'special'];
const FILTERS = ['all', 'afford', 'new'];

const filters = { category: 'food', search: '', mode: 'all' };

const isOwned = (game, item) => item.cat === 'accessory' && Boolean(game.state.inventory[item.id]);

function effectText(item) {
  return item.effect
    ? Object.entries(item.effect)
      .filter(([key]) => key !== 'cure')
      .map(([key, value]) => `+${value} ${T(`stat.${key}`)}`)
      .join(' · ')
    : '';
}

function visibleItems(game) {
  const term = filters.search.trim().toLowerCase();
  const { coins } = game.state;

  return game.catalog.items.filter((item) => {
    if (item.price === null) return false;
    if (term) {
      if (![L(item.name), L(item.desc)].some((text) => text.toLowerCase().includes(term))) return false;
    } else if (item.cat !== filters.category) {
      return false;
    }
    if (filters.mode === 'afford' && item.price > coins) return false;
    if (filters.mode === 'new' && (game.state.inventory[item.id] ?? 0) > 0) return false;
    return true;
  });
}

function cardHtml(game, item) {
  const lockedByLevel = (item.level ?? 1) > game.state.level;
  const owned = isOwned(game, item);
  const qty = game.state.inventory[item.id] ?? 0;
  const tooExpensive = item.price > game.state.coins;

  return `
    <button type="button" class="item-card ${lockedByLevel ? 'is-locked' : ''}" data-item="${item.id}">
      ${game.icon(item.id, '', 48)}
      <strong>${esc(L(item.name))}</strong>
      <small>${esc(effectText(item) || L(item.desc))}</small>
      <span class="item-price ${tooExpensive ? 'is-poor' : ''}">${item.price} 🍈</span>
      ${owned ? `<span class="item-tag">${T('common.owned')}</span>` : ''}
      ${!owned && qty ? `<span class="item-tag">×${qty}</span>` : ''}
      ${lockedByLevel ? `<span class="item-tag is-lock">${T('common.level', { n: item.level })}</span>` : ''}
    </button>`;
}

function renderGrid(root, game) {
  const items = visibleItems(game);

  root.querySelector('#shop-grid').innerHTML = items.length
    ? items.map((item) => cardHtml(game, item)).join('')
    : `<p class="empty">${T('shop.empty')}</p>`;
}

function detail(game, item, root) {
  const { coins, level } = game.state;
  const lockedByLevel = (item.level ?? 1) > level;
  const owned = isOwned(game, item);
  const single = item.cat === 'accessory';
  let qty = 1;

  const close = game.modal({
    title: L(item.name),
    body: `
      <div class="item-detail">
        ${game.icon(item.id, '', 72)}
        <div>
          <p class="modal-text">${esc(L(item.desc))}</p>
          ${effectText(item) ? `<p class="modal-text"><strong>${esc(effectText(item))}</strong></p>` : ''}
          <p class="modal-text">${T('common.have', { n: game.state.inventory[item.id] ?? 0 })}</p>
        </div>
      </div>
      ${single ? '' : `
        <label class="pet-label">${T('shop.qty')}
          <input class="pet-input" id="buy-qty" type="number" min="1" max="${game.catalog.config.limits.cart}" value="1">
        </label>`}
      <p class="modal-text" id="buy-note"></p>
      <div class="pet-modal-actions">
        <button type="button" class="pet-button is-primary" id="buy-now"></button>
      </div>
    `,
    onMount: (body) => {
      const button = body.querySelector('#buy-now');
      const note = body.querySelector('#buy-note');
      const refresh = () => {
        const total = item.price * qty;
        const poor = total > coins;

        button.textContent = T('shop.confirm', { n: total });
        button.disabled = poor || lockedByLevel || owned;
        note.textContent = owned ? T('common.owned')
          : lockedByLevel ? T('shop.needLevel', { n: item.level })
            : poor ? T('shop.poor') : '';
      };

      body.querySelector('#buy-qty')?.addEventListener('input', (event) => {
        qty = Math.min(game.catalog.config.limits.cart, Math.max(1, Math.trunc(Number(event.target.value)) || 1));
        refresh();
      });
      button.addEventListener('click', async () => {
        const result = await game.act('buy', { itemId: item.id, qty }, { silent: true });

        if (result) {
          close();
          game.toast(T('shop.bought'), item.id);
          renderGrid(root, game);
        }
      });
      refresh();
    },
  });
}

export function render(root, game) {
  root.innerHTML = `
    <div class="view">
      <div class="tabs" role="group">
        ${CATEGORIES.map((id) => `<button type="button" class="tab" data-cat="${id}" aria-pressed="${filters.category === id}">${T(`cat.${id}`)}</button>`).join('')}
      </div>
      <div class="shop-tools">
        <input class="pet-input" id="shop-search" type="search" placeholder="${T('shop.search')}" aria-label="${T('shop.search')}" value="${esc(filters.search)}">
        <label class="pet-label is-inline">${T('shop.filter')}
          <select class="pet-input" id="shop-filter">
            ${FILTERS.map((id) => `<option value="${id}" ${filters.mode === id ? 'selected' : ''}>${T(`shop.filter.${id}`)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="item-grid" id="shop-grid"></div>
    </div>
  `;

  renderGrid(root, game);

  root.querySelector('.tabs').addEventListener('click', (event) => {
    const tab = event.target.closest('[data-cat]');
    if (!tab) return;

    filters.category = tab.dataset.cat;
    filters.search = '';
    root.querySelector('#shop-search').value = '';
    root.querySelectorAll('[data-cat]').forEach((other) => other.setAttribute('aria-pressed', String(other === tab)));
    renderGrid(root, game);
  });
  root.querySelector('#shop-search').addEventListener('input', (event) => {
    filters.search = event.target.value;
    renderGrid(root, game);
  });
  root.querySelector('#shop-filter').addEventListener('change', (event) => {
    filters.mode = event.target.value;
    renderGrid(root, game);
  });
  root.querySelector('#shop-grid').addEventListener('click', (event) => {
    const id = event.target.closest('[data-item]')?.dataset.item;
    if (id) detail(game, game.item(id), root);
  });
}

export function update(game) {
  if (game.viewRoot.querySelector('#shop-grid')) renderGrid(game.viewRoot, game);
}

export { effectText };
