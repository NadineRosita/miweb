// Armazón del juego: carga los datos, mantiene el estado, navega entre secciones y
// muestra lo que devuelve el servidor (monedas, logros, reacciones…).
//
// Las vistas viven en vistas/. Cada una exporta render(root, game) y, opcional:
//   update(game)   refresca sin repintar, para no perder canvas ni foco
//   leave()        limpia al salir

import { L, chooseLine } from './dialogos.js';
import { iconHtml } from './iconos.js';
import { configureSound, playSound, stopAudio, unlockAudio } from './sonido.js';
import { T, esc, hasText } from './textos.js';
import { showAdoption, showFuneral } from './vistas/adopcion.js';
import * as arcade from './vistas/arcade.js';
import * as collection from './vistas/coleccion.js';
import * as explore from './vistas/explorar.js';
import * as home from './vistas/inicio.js';
import * as inventory from './vistas/inventario.js';
import * as journal from './vistas/diario.js';
import * as achievements from './vistas/logros.js';
import * as profile from './vistas/perfil.js';
import * as room from './vistas/habitacion.js';
import * as shop from './vistas/tienda.js';

const POLL_MS = 60000;
const WIDGET_FLAG = 'mipet-widget';
const VIEWS = { home, shop, inventory, room, arcade, explore, collection, achievements, journal, profile };
const NAV = [
  ['home', 'home'], ['shop', 'shop'], ['inventory', 'bag'], ['room', 'sofa'], ['arcade', 'joystick'],
  ['explore', 'compass'], ['collection', 'star'], ['achievements', 'trophy'], ['journal', 'book'], ['profile', 'user'],
];

async function request(path, { method = 'GET', body } = {}) {
  const tz = String(-new Date().getTimezoneOffset());
  const response = await fetch(`/api/pet${path}`, {
    method,
    headers: { 'X-Pet-Tz': tz, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error);
    error.status = response.status;
    throw error;
  }
  return data;
}

class Game {
  constructor({ root, username, onSignedOut, onLogout }) {
    this.root = root;
    this.username = username;
    this.onSignedOut = onSignedOut;
    this.onLogout = onLogout;
    this.state = null;
    this.catalog = null;
    this.viewName = 'home';
    this.view = null;
  }

  get pet() {
    return this.state?.pets[this.state.activePetId] ?? null;
  }

  item(id) {
    return this.catalog.items.find((item) => item.id === id);
  }

  species(id) {
    return this.catalog.species.find((entry) => entry.id === id);
  }

  icon(id, alt = '', size = 32) {
    return iconHtml(id, this.catalog, esc(alt), size);
  }

  // ---------- Servidor ----------
  async load() {
    this.catalog = await request('/catalog');
    const { state, fx } = await request('/state');

    this.state = state;
    configureSound(state.settings);
    localStorage.setItem(WIDGET_FLAG, '1');
    this.mountShell();
    this.route(fx);
    this.poll = setInterval(() => this.refresh(), POLL_MS);
    document.addEventListener('visibilitychange', this.onVisible = () => {
      if (!document.hidden) this.refresh();
    });
    i18n.onChange(this.onLanguage = () => {
      if (this.state) {
        this.mountShell();
        this.route([]);
      }
    });
  }

  async refresh() {
    if (document.hidden) return;

    try {
      const { state, fx } = await request('/state');
      const previousPet = this.state.activePetId;

      this.state = state;
      this.updateHud();
      if (!state.activePetId || state.activePetId !== previousPet || state.pendingFuneral) this.route(fx);
      else {
        this.view?.update?.(this);
        this.handleFx(fx);
      }
    } catch (error) {
      if (error.status === 401) this.signedOut();
    }
  }

  // Ejecuta una acción. Devuelve el resultado, o null si el servidor la rechaza.
  async act(type, payload = {}, { silent = false } = {}) {
    try {
      const { state, fx } = await request('/action', { method: 'POST', body: { type, ...payload } });

      this.state = state;
      configureSound(state.settings);
      this.updateHud();
      if (!silent) this.view?.update?.(this);
      this.handleFx(fx);
      return { state, fx };
    } catch (error) {
      if (error.status === 401) {
        this.signedOut();
        return null;
      }
      // Si la mascota ha muerto, la acción se revierte: hay que releer para ver la despedida
      if (error.message === 'no_pet') this.refresh();
      else this.toastError(error);
      return null;
    }
  }

  signedOut() {
    this.destroy();
    this.onSignedOut();
  }

  destroy() {
    clearInterval(this.poll);
    clearInterval(this.clockTimer);
    document.removeEventListener('visibilitychange', this.onVisible);
    this.state = null;
    this.view?.leave?.();
    stopAudio();
    this.root.replaceChildren();
    document.querySelector('.pet-overlay')?.remove();
  }

  async logout() {
    localStorage.removeItem(WIDGET_FLAG);
    this.destroy();
    await this.onLogout();
  }

  // ---------- Pantallas ----------
  mountShell() {
    const buttons = NAV.map(([id, icon]) => `
      <button type="button" class="pet-nav-button" data-view="${id}">
        ${this.icon(icon, '', 24)}<span>${T(`nav.${id}`)}</span>
      </button>`).join('');

    this.root.innerHTML = `
      <div class="pet-window">
        <div class="pet-titlebar">
          <span class="pet-titlebar-name">mipet.exe</span>
          <span class="pet-titlebar-clock" id="pet-clock"></span>
        </div>
        <div class="pet-hud" id="pet-hud"></div>
        <div class="pet-body">
          <nav class="pet-nav" aria-label="${T('nav.label')}">${buttons}</nav>
          <div class="pet-main" id="pet-view" tabindex="-1"></div>
        </div>
      </div>
      <div class="pet-toasts" id="pet-toasts" role="status" aria-live="polite"></div>
    `;

    this.viewRoot = this.root.querySelector('#pet-view');
    this.root.querySelector('.pet-nav').addEventListener('click', (event) => {
      const button = event.target.closest('[data-view]');
      if (!button) return;

      unlockAudio();
      playSound('click');
      this.go(button.dataset.view);
    });
    this.root.addEventListener('pointerdown', unlockAudio, { once: true });
    this.updateHud();
    this.tickClock();
    clearInterval(this.clockTimer);
    this.clockTimer = setInterval(() => this.tickClock(), 20000);
  }

  tickClock() {
    const clock = this.root.querySelector('#pet-clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString(i18n.lang, { hour: '2-digit', minute: '2-digit' });
  }

  updateHud() {
    const hud = this.root.querySelector('#pet-hud');
    if (!hud || !this.state) return;

    const { coins, level, xp, xpNeeded, lucky, settings } = this.state;

    hud.innerHTML = `
      <div class="hud-coins" aria-label="${T('a11y.coins', { n: coins })}"><span aria-hidden="true">🍈</span> <strong>${coins}</strong></div>
      <div class="hud-level">
        <span class="hud-level-label">LV ${level}</span>
        <span class="bar bar-xp" role="progressbar" aria-valuemin="0" aria-valuemax="${xpNeeded}" aria-valuenow="${Math.floor(xp)}" aria-label="${T('prof.xp', { a: Math.floor(xp), b: xpNeeded })}">
          <span class="bar-fill" style="width:${Math.min(100, (xp / xpNeeded) * 100)}%"></span>
        </span>
      </div>
      ${lucky ? `<div class="hud-luck">${this.icon('luckyCharm', '', 20)}</div>` : ''}
      <button class="hud-sound" type="button" id="hud-sound" aria-label="${T('a11y.sound')}" aria-pressed="${settings.muted}">${settings.muted ? '🔇' : '🔊'}</button>
    `;
    hud.querySelector('#hud-sound').addEventListener('click', () => {
      unlockAudio();
      this.act('settings', { muted: !this.state.settings.muted }, { silent: true });
    });
  }

  // Decide qué pantalla toca según el estado de la partida
  route(fx) {
    const { state } = this;

    if (state.recovered) {
      this.toast(T('adopt.recovered'), 'star');
      this.act('dismissRecovered', {}, { silent: true });
    }

    if (state.pendingFuneral) {
      this.view?.leave?.();
      this.view = null;
      showFuneral(this.viewRoot, this);
      this.root.querySelector('.pet-nav').hidden = true;
      return;
    }

    if (!this.pet) {
      this.view?.leave?.();
      this.view = null;
      showAdoption(this.viewRoot, this);
      this.root.querySelector('.pet-nav').hidden = true;
      return;
    }

    this.root.querySelector('.pet-nav').hidden = false;
    this.go(this.viewName);
    this.handleFx(fx);
  }

  go(name) {
    if (!this.pet && name !== 'profile') return;

    this.view?.leave?.();
    this.viewName = name;
    this.view = VIEWS[name];
    this.root.querySelectorAll('.pet-nav-button').forEach((button) => {
      const active = button.dataset.view === name;

      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    this.viewRoot.classList.remove('view-enter');
    void this.viewRoot.offsetWidth; // Reinicia la animación de entrada
    this.viewRoot.classList.add('view-enter');
    this.view.render(this.viewRoot, this);
  }

  // ---------- Respuestas del servidor ----------
  handleFx(fx) {
    fx.forEach((entry) => {
      switch (entry.type) {
        case 'coins':
          this.floatCoins(entry.amount);
          playSound('coin');
          break;
        case 'level':
          playSound('level');
          this.toast(T('toast.level', { n: entry.level }), 'star', 'big');
          break;
        case 'achievement':
          playSound('achievement');
          this.toast(T('toast.achievement', { name: L(this.catalog.achievements.find(({ id }) => id === entry.id).name) }), 'trophy', 'big');
          break;
        case 'mission':
          this.toast(T('toast.mission', { name: L(this.catalog.missions.find(({ id }) => id === entry.id).text) }), 'calendar');
          break;
        case 'item':
          this.toast(T('toast.item', { item: L(this.item(entry.id).name) }), entry.id);
          break;
        case 'affinity':
          playSound('achievement');
          this.toast(T('toast.affinity', { tier: T(`tier.${this.catalog.config.affinityTiers[entry.tier].id}`) }), 'heart', 'big');
          break;
        case 'sick':
          playSound('error');
          this.toast(T('toast.sick', { pet: this.pet?.name ?? '' }), 'pill');
          break;
        case 'critical':
          playSound('error');
          this.toast(T('toast.critical', { pet: this.pet?.name ?? '' }), 'skull', 'big');
          break;
        case 'photo':
          this.toast(T('toast.photo'), 'camera');
          break;
        case 'personality':
          this.toast(T('toast.personality', { trait: T(`trait.${entry.value}`) }), 'personalityCrystal');
          break;
        case 'restored':
          this.toast(T('toast.restored', { stat: T(`stat.${entry.stat}`) }), 'timeMachine');
          break;
        case 'unlockedSpecies':
          this.toast(T('toast.species', { name: L(this.species(entry.id).name) }), 'goldenTicket', 'big');
          break;
        case 'bought':
          playSound('buy');
          break;
        case 'trivia':
          this.modal({
            title: T('trivia.title'),
            body: `<p class="modal-text">${esc(L(this.catalog.trivia[entry.index]))}</p>`,
          });
          break;
        case 'react':
          this.view?.react?.(entry.key, this);
          break;
        case 'evolved':
          playSound('evolve');
          break;
        case 'missedYou':
          this.view?.react?.('missedYou', this);
          break;
        case 'death':
          this.route([]);
          break;
        default:
      }
    });
  }

  lineFor(key) {
    return chooseLine(this.pet, this.state, this.catalog, this.username, key);
  }

  // ---------- Avisos ----------
  toast(text, icon = 'star', kind = '') {
    const box = this.root.querySelector('#pet-toasts');
    if (!box) return;

    const toast = document.createElement('div');

    toast.className = `pet-toast ${kind}`;
    toast.innerHTML = `${this.icon(icon, '', 24)}<span>${esc(text)}</span>`;
    box.append(toast);
    setTimeout(() => toast.remove(), kind ? 4800 : 3200);
  }

  toastError(error) {
    const code = error.status ? error.message : 'connection';
    const key = hasText(`err.${code}`) ? `err.${code}` : 'err.generic';

    playSound('error');
    this.toast(T(key), 'skull');
  }

  floatCoins(amount) {
    const hud = this.root.querySelector('.hud-coins');
    if (!hud) return;

    const float = document.createElement('span');

    float.className = 'coin-float';
    float.textContent = `+${amount}`;
    hud.append(float);
    setTimeout(() => float.remove(), 1000);
  }

  overlayOpen() {
    return Boolean(document.querySelector('.pet-overlay'));
  }

  // Ventana modal. Va por debajo del cursor personalizado de la web, y por eso no usa <dialog>.
  modal({ title, body, actions = [], onClose, wide = false, onMount }) {
    document.querySelector('.pet-overlay')?.remove();

    const overlay = document.createElement('div');
    const previous = document.activeElement;
    const buttons = actions.map((action, index) => (
      `<button type="button" class="pet-button ${action.primary ? 'is-primary' : ''}" data-action="${index}" ${action.disabled ? 'disabled' : ''}>${esc(action.label)}</button>`
    )).join('');

    overlay.className = 'pet-overlay';
    overlay.innerHTML = `
      <div class="pet-modal ${wide ? 'is-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="pet-modal-bar">
          <h2>${esc(title)}</h2>
          <button type="button" class="pet-modal-close" aria-label="${T('common.close')}">×</button>
        </div>
        <div class="pet-modal-body">${body}</div>
        ${buttons ? `<div class="pet-modal-actions">${buttons}</div>` : ''}
      </div>`;

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      onClose?.();
      previous?.focus?.();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'Tab') {
        const focusable = [...overlay.querySelectorAll('button, input, select, [tabindex="0"]')].filter((node) => !node.disabled);
        const first = focusable[0];
        const last = focusable.at(-1);

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
      if (event.target.closest('.pet-modal-close')) close();

      const index = event.target.closest('[data-action]')?.dataset.action;
      if (index !== undefined) {
        const keep = actions[index].run?.();
        if (keep !== true) close();
      }
    });
    document.addEventListener('keydown', onKey);
    this.root.append(overlay);
    (overlay.querySelector('.pet-modal-actions .is-primary') ?? overlay.querySelector('.pet-modal-close')).focus();
    onMount?.(overlay.querySelector('.pet-modal-body'), close);
    return close;
  }

  confirm(text, onYes) {
    this.modal({
      title: T('common.confirm'),
      body: `<p class="modal-text">${esc(text)}</p>`,
      actions: [{ label: T('common.cancel') }, { label: T('common.confirm'), primary: true, run: onYes }],
    });
  }
}

export async function startGame(options) {
  const game = new Game(options);

  await game.load();
  return game;
}

