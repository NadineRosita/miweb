// Editor de la habitación: colocar, mover y retirar muebles, tema y luz.
// El servidor comprueba cada posición; la vista previa solo orienta al jugador.

import { L } from '../dialogos.js';
import { Scene } from '../escena.js';
import { CELL } from '../muebles.js';
import { T, esc } from '../textos.js';

const ARROWS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

let scene = null;
let placing = null; // id del mueble que se está colocando
let selected = null; // uid del mueble seleccionado
let tab = 'furniture';

const cellAt = ({ x, y }, item) => ({
  x: Math.floor(x / CELL - (item.w - 1) / 2),
  y: Math.floor(y / CELL - (item.h - 1) / 2),
});

function fits(game, item, x, y, ignoreUid) {
  const { cols, rows, wallRows } = game.catalog.config.room;
  const [top, bottom] = item.layer === 'wall' ? [0, wallRows] : [wallRows, rows];

  if (x < 0 || x + item.w > cols || y < top || y + item.h > bottom) return false;

  return !game.pet.room.items.some((entry) => {
    const other = game.item(entry.id);
    if (entry.uid === ignoreUid || other.layer !== item.layer) return false;

    return x < entry.x + other.w && entry.x < x + item.w && y < entry.y + other.h && entry.y < y + item.h;
  });
}

function available(game) {
  return game.catalog.items.filter(({ id, cat }) => (
    cat === 'furniture' && (game.state.inventory[id] ?? 0) > (game.state.placed[id] ?? 0)
  ));
}

function furniturePanel(game) {
  const items = available(game);
  const entry = game.pet.room.items.find(({ uid }) => uid === selected);

  if (entry) {
    const item = game.item(entry.id);

    return `
      <p class="modal-text"><strong>${esc(T('room.selected', { item: L(item.name) }))}</strong></p>
      <p class="modal-text"><small>${T('room.moveHint')}</small></p>
      <div class="move-pad">
        <button type="button" class="pet-button" data-move="0,-1" aria-label="${T('dir.up')}">▲</button>
        <button type="button" class="pet-button" data-move="-1,0" aria-label="${T('dir.left')}">◀</button>
        <button type="button" class="pet-button" data-move="1,0" aria-label="${T('dir.right')}">▶</button>
        <button type="button" class="pet-button" data-move="0,1" aria-label="${T('dir.down')}">▼</button>
      </div>
      <div class="room-buttons">
        <button type="button" class="pet-button" data-remove="${entry.uid}">${T('room.remove')}</button>
        <button type="button" class="pet-button" data-deselect>${T('common.close')}</button>
      </div>`;
  }

  if (placing) {
    return `
      <p class="modal-text">${esc(T('room.placing', { item: L(game.item(placing).name) }))}</p>
      <button type="button" class="pet-button" data-cancel>${T('room.cancel')}</button>`;
  }

  return `
    <p class="modal-text"><small>${T('room.place')}</small></p>
    ${items.length ? `<div class="room-items">${items.map((item) => `
      <button type="button" class="room-item" data-place="${item.id}">
        ${game.icon(item.id, '', 40)}
        <span>${esc(L(item.name))}</span>
        <small>×${game.state.inventory[item.id] - (game.state.placed[item.id] ?? 0)}</small>
      </button>`).join('')}</div>` : `<p class="empty">${T('room.none')}</p>`}`;
}

function themePanel(game) {
  const { roomThemes, level, coins } = game.state;
  const current = game.pet.room.theme;

  return `<div class="theme-list">${game.catalog.roomThemes.map((theme) => {
    const owned = roomThemes.includes(theme.id);
    let button;

    if (theme.id === current) button = `<span class="item-tag is-on">${T('room.current')}</span>`;
    else if (owned) button = `<button type="button" class="pet-button is-small" data-theme="${theme.id}">${T('room.apply')}</button>`;
    else if (theme.level > level) button = `<span class="item-tag is-lock">${T('common.level', { n: theme.level })}</span>`;
    else button = `<button type="button" class="pet-button is-small" data-buy-theme="${theme.id}" ${theme.price > coins ? 'disabled' : ''}>${T('room.unlock', { n: theme.price })}</button>`;

    return `<div class="theme-row"><span>${esc(L(theme.name))}</span>${button}</div>`;
  }).join('')}</div>`;
}

function lightPanel(game) {
  return `<div class="theme-list">${game.catalog.roomLights.map((light) => `
    <button type="button" class="tab" data-light="${light}" aria-pressed="${game.pet.room.light === light}">${T(`light.${light}`)}</button>`).join('')}</div>`;
}

function renderPanel(root, game) {
  const panels = { furniture: furniturePanel, theme: themePanel, light: lightPanel };

  root.querySelector('#room-panel').innerHTML = panels[tab](game);
  root.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
  if (scene) {
    scene.selected = selected;
    scene.setPet(game.pet);
  }
}

async function moveSelected(root, game, dx, dy) {
  const entry = game.pet.room.items.find(({ uid }) => uid === selected);
  if (!entry) return;

  await game.act('moveFurniture', { uid: selected, x: entry.x + dx, y: entry.y + dy }, { silent: true });
  renderPanel(root, game);
}

async function onRoomClick(root, game, point) {
  if (placing) {
    const item = game.item(placing);
    const { x, y } = cellAt(point, item);
    const result = await game.act('placeFurniture', { itemId: placing, x, y }, { silent: true });

    if (result) {
      placing = null;
      if (scene) scene.preview = null;
      renderPanel(root, game);
    }
    return;
  }

  if (selected) {
    const entry = game.pet.room.items.find(({ uid }) => uid === selected);
    const hit = scene.furnitureAt(point.x, point.y);

    if (hit && hit.uid !== selected) {
      selected = hit.uid;
      renderPanel(root, game);
      return;
    }
    if (entry && !hit) {
      const { x, y } = cellAt(point, game.item(entry.id));
      await game.act('moveFurniture', { uid: selected, x, y }, { silent: true });
      renderPanel(root, game);
    }
    return;
  }

  const hit = scene.furnitureAt(point.x, point.y);

  if (hit) {
    selected = hit.uid;
    tab = 'furniture';
    renderPanel(root, game);
  }
}

export function render(root, game) {
  placing = null;
  selected = null;

  root.innerHTML = `
    <div class="room-editor">
      <div class="room-frame">
        <canvas id="room-edit" class="room-canvas" tabindex="0" role="application" aria-label="${esc(T('room.canvas', { pet: game.pet.name }))}"></canvas>
      </div>
      <aside class="side-panel room-side">
        <div class="tabs" role="group">
          ${['furniture', 'theme', 'light'].map((id) => `<button type="button" class="tab" data-tab="${id}">${T(`room.${id}`)}</button>`).join('')}
        </div>
        <div id="room-panel"></div>
      </aside>
    </div>
  `;

  const canvas = root.querySelector('#room-edit');

  scene = new Scene(canvas, game.catalog);
  scene.editing = true;
  scene.setPet(game.pet);
  scene.start();
  renderPanel(root, game);

  canvas.addEventListener('pointermove', (event) => {
    if (!placing || !scene) return;

    const item = game.item(placing);
    const { x, y } = cellAt(scene.toLogical(event), item);

    scene.preview = { x, y, w: item.w, h: item.h, valid: fits(game, item, x, y) };
  });
  canvas.addEventListener('pointerleave', () => {
    if (scene) scene.preview = null;
  });
  canvas.addEventListener('click', (event) => onRoomClick(root, game, scene.toLogical(event)));
  canvas.addEventListener('keydown', (event) => {
    const arrow = ARROWS[event.key];

    if (arrow && selected) {
      event.preventDefault();
      moveSelected(root, game, ...arrow);
    }
  });

  root.querySelector('.room-side').addEventListener('click', async (event) => {
    const { target } = event;
    const data = target.closest('button')?.dataset;
    if (!data) return;

    if (data.tab) {
      tab = data.tab;
      placing = null;
      selected = null;
    } else if (data.place) {
      placing = data.place;
    } else if (data.cancel !== undefined) {
      placing = null;
      if (scene) scene.preview = null;
    } else if (data.deselect !== undefined) {
      selected = null;
    } else if (data.remove) {
      await game.act('removeFurniture', { uid: Number(data.remove) }, { silent: true });
      selected = null;
    } else if (data.move) {
      const [dx, dy] = data.move.split(',').map(Number);
      await moveSelected(root, game, dx, dy);
      return;
    } else if (data.theme) {
      await game.act('setRoom', { theme: data.theme }, { silent: true });
    } else if (data.buyTheme) {
      await game.act('buyTheme', { theme: data.buyTheme }, { silent: true });
    } else if (data.light) {
      await game.act('setRoom', { light: data.light }, { silent: true });
    } else {
      return;
    }
    renderPanel(root, game);
  });
}

export function update(game) {
  if (game.viewRoot.querySelector('#room-panel')) renderPanel(game.viewRoot, game);
}

export function leave() {
  scene?.stop();
  scene = null;
}
