// Pantalla principal: la habitación con la mascota, sus barras, sus cuidados y las misiones.

import { L, fill } from '../dialogos.js';
import { Scene } from '../escena.js';
import { portrait, specOf } from '../retrato.js';
import { playSound, unlockAudio } from '../sonido.js';
import { T, esc } from '../textos.js';

const STATS = [
  ['happiness', '❤️'], ['hunger', '🍖'], ['energy', '⚡'], ['hygiene', '🧼'], ['fun', '🧠'], ['affection', '💕'],
];
const INTERACTIONS = ['pet', 'talk', 'greet', 'tickle', 'hug'];
const SPEECH_MS = 5200;
const CHATTER_MS = [14000, 30000];

// Animación y sonido de cada reacción
const REACTIONS = {
  feed: ['eating', 'heart', 'eat'], play: ['playing', 'spark', 'game'], bath: ['happy', 'bubble', 'click'],
  pet: ['happy', 'heart', 'pet'], hug: ['special', 'heart', 'pet'], tickle: ['playing', 'spark', 'pet'],
  greet: ['happy', null, 'pet'], talk: ['idle', null, 'click'], medicine: ['sad', 'spark', 'eat'],
  clean: ['happy', 'spark', 'click'], gift: ['special', 'spark', 'pet'], evolve: ['special', 'spark', 'evolve'],
  missedYou: ['special', 'heart', 'pet'], back: ['happy', 'spark', 'click'],
};

let scene = null;
let speechTimer = null;
let chatterTimer = null;

function renderStats(root, pet) {
  root.innerHTML = STATS.map(([key, emoji]) => statRow(key, emoji, pet.stats[key])).join('')
    + (pet.sick || pet.health < 100 ? statRow('health', '🩹', pet.health) : '');
}

function statRow(key, emoji, value) {
  const rounded = Math.round(value);
  const level = rounded < 25 ? 'is-low' : rounded < 50 ? 'is-mid' : '';

  return `
    <div class="stat-row">
      <span class="stat-name"><span aria-hidden="true">${emoji}</span> ${T(`stat.${key}`)}</span>
      <span class="bar ${level}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${rounded}" aria-label="${T(`stat.${key}`)}">
        <span class="bar-fill bar-${key}" style="width:${rounded}%"></span>
      </span>
      <span class="stat-value">${rounded}</span>
    </div>`;
}

function missionsHtml(game) {
  const { missions, counters } = game.state.daily;

  return missions.map(({ id, done }) => {
    const data = game.catalog.missions.find((entry) => entry.id === id);

    return `
      <li class="mission ${done ? 'is-done' : ''}">
        <span class="mission-check" aria-hidden="true">${done ? '✓' : ''}</span>
        <span class="mission-text">${esc(L(data.text))} <small>${Math.min(counters[data.stat] ?? 0, data.goal)}/${data.goal}</small></span>
        <span class="mission-coins">+${data.coins} 🍈</span>
      </li>`;
  }).join('');
}

function say(root, text) {
  const bubble = root.querySelector('#pet-speech');
  if (!bubble) return;

  bubble.textContent = text;
  bubble.hidden = false;
  bubble.classList.remove('pop');
  void bubble.offsetWidth;
  bubble.classList.add('pop');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    bubble.hidden = true;
  }, SPEECH_MS);
}

function scheduleChatter(root, game) {
  clearTimeout(chatterTimer);
  const wait = CHATTER_MS[0] + Math.random() * (CHATTER_MS[1] - CHATTER_MS[0]);

  chatterTimer = setTimeout(() => {
    if (game.pet && !game.pet.away && !game.overlayOpen()) say(root, game.lineFor());
    scheduleChatter(root, game);
  }, wait);
}

function feedMenu(game) {
  const edible = game.catalog.items.filter(({ id, cat }) => (cat === 'food' || cat === 'drink') && game.state.inventory[id]);

  if (!edible.length) {
    game.modal({
      title: T('home.feedTitle'),
      body: `<p class="modal-text">${T('home.noFood')}</p>`,
      actions: [{ label: T('home.goShop'), primary: true, run: () => game.go('shop') }],
    });
    return;
  }

  const close = game.modal({
    title: T('home.feedTitle'),
    body: `<div class="feed-grid">${edible.map((item) => `
      <button type="button" class="feed-item" data-item="${item.id}">
        ${game.icon(item.id, '', 40)}
        <span>${esc(L(item.name))}</span>
        <small>×${game.state.inventory[item.id]}</small>
      </button>`).join('')}</div>`,
    onMount: (body) => {
      body.addEventListener('click', (event) => {
        const button = event.target.closest('[data-item]');
        if (button) {
          close();
          game.act('useItem', { itemId: button.dataset.item });
        }
      });
    },
  });
}

function dailyModal(game) {
  const { dailyRewards } = game.catalog;
  const { daily, dailyClaims } = game.state;
  const current = dailyClaims % dailyRewards.length;
  const position = daily.claimed ? (current - 1 + dailyRewards.length) % dailyRewards.length : current;

  const cells = dailyRewards.map((reward, index) => {
    const reached = index < position || (index === position && daily.claimed);
    const status = reached ? 'is-claimed' : index === position ? 'is-today' : '';

    return `
      <div class="daily-cell ${status}">
        <small>${T('daily.day', { n: index + 1 })}</small>
        ${reward.item ? game.icon(reward.item, L(game.item(reward.item).name), 32) : game.icon('melon', '', 32)}
        <span>${reward.coins ? `${reward.coins} 🍈` : ''}${reward.item && reward.qty > 1 ? ` ×${reward.qty}` : ''}</span>
      </div>`;
  }).join('');

  game.modal({
    title: T('daily.title'),
    wide: true,
    body: `<div class="daily-grid">${cells}</div>
      <p class="modal-text">${daily.claimed ? T('daily.claimed') : T('daily.note')}</p>`,
    actions: daily.claimed ? [] : [{ label: T('daily.claim'), primary: true, run: () => game.act('dailyClaim') }],
  });
}

function eventModal(game) {
  const event = game.catalog.events.find(({ id }) => id === game.state.pendingEvent.id);

  game.modal({
    title: T('event.title'),
    body: `<div class="event-body">${game.icon(event.icon, '', 56)}
      <p class="modal-text">${esc(fill(L(event.text), { pet: game.pet.name }))}</p></div>`,
    actions: [{ label: T('event.claim'), primary: true, run: () => game.act('eventClaim') }],
  });
}

function requirementText(game, branch, checks) {
  const { evolution } = game.catalog.config;
  const labels = [
    ['level', T('req.level', { n: evolution.level })],
    ['careDays', T('req.careDays', { n: evolution.careDays })],
    ['personality', `${T('req.personality')}: ${T(`trait.${game.catalog.branches[branch].personality}`)}`],
  ];

  if (game.catalog.branches[branch].stat) labels.push(['stat', `${T(`stat.${game.catalog.branches[branch].stat}`)} ≥ ${evolution.statMin}`]);
  return labels.map(([key, text]) => `<li class="${checks[key] ? 'is-met' : ''}">${esc(text)}</li>`).join('');
}

function evolutionHtml(game, pet) {
  const species = game.species(pet.species);

  if (pet.evolution) {
    const branch = game.catalog.branches[pet.evolution];
    return `<p class="modal-text">${esc(T('sheet.evolved', { name: L(species.evolutions[pet.evolution]) }))}<br><small>${esc(L(branch.perkText))}</small></p>`;
  }

  return `<div class="evo-options">${pet.evolutionOptions.map(({ id, checks, ready }) => {
    const known = game.state.discoveredEvolutions.includes(`${pet.species}:${id}`);
    const name = known || ready ? L(species.evolutions[id]) : T('col.unknown');

    return `
      <div class="evo-option ${ready ? 'is-ready' : ''}">
        <strong>${esc(name)}</strong>
        <small>${esc(L(game.catalog.branches[id].hint))}</small>
        <ul>${requirementText(game, id, checks)}</ul>
        <button type="button" class="pet-button" data-evolve="${id}" ${ready ? '' : 'disabled'}>${T('sheet.evolve')}</button>
      </div>`;
  }).join('')}</div>`;
}

function petSheet(game) {
  const { pet } = game;
  const species = game.species(pet.species);
  const tier = game.catalog.config.affinityTiers[pet.affinityTier];
  const days = Math.floor((game.state.now - pet.born) / 86400000);
  const worn = Object.entries(pet.equipped).map(([slot, id]) => `
    <button type="button" class="chip" data-unequip="${slot}">${game.icon(id, '', 20)} ${esc(L(game.item(id).name))} ×</button>`).join('');

  game.modal({
    title: pet.name,
    wide: true,
    body: `
      <div class="sheet">
        <div class="sheet-art"></div>
        <dl class="sheet-data">
          <dt>${T('sheet.species')}</dt><dd>${esc(L(pet.evolution ? species.evolutions[pet.evolution] : species.name))}</dd>
          <dt>${T('sheet.personality')}</dt><dd>${T(`trait.${pet.personality}`)}</dd>
          <dt>${T('sheet.affinity')}</dt><dd>${T(`tier.${tier.id}`)}</dd>
          <dt>${T('sheet.age')}</dt><dd>${T('sheet.days', { n: days })}</dd>
          <dt>${T('sheet.careDays')}</dt><dd>${pet.careDays}</dd>
        </dl>
      </div>
      <form class="rename-form">
        <label class="pet-label">${T('sheet.rename')}
          <input class="pet-input" name="name" value="${esc(pet.name)}" maxlength="${game.catalog.config.name.max}" required>
        </label>
        <button class="pet-button">${T('common.save')}</button>
      </form>
      <h3 class="pixel-sub">${T('sheet.equipped')}</h3>
      <div class="chips">${worn || `<p class="modal-text">${T('sheet.nothing')}</p>`}</div>
      <h3 class="pixel-sub">${T('sheet.evolutions')}</h3>
      ${evolutionHtml(game, pet)}
      ${!pet.evolution && !game.state.inventory.growthPotion ? `<p class="modal-text"><small>${T('req.potion')}</small></p>` : ''}
    `,
    onMount: (body, close) => {
      body.querySelector('.sheet-art').append(portrait(specOf(pet), game.catalog, { label: pet.name }));
      body.querySelector('.rename-form').addEventListener('submit', (event) => {
        event.preventDefault();
        game.act('rename', { name: new FormData(event.target).get('name') });
        close();
      });
      body.addEventListener('click', async (event) => {
        const slot = event.target.closest('[data-unequip]')?.dataset.unequip;
        const branch = event.target.closest('[data-evolve]')?.dataset.evolve;

        if (slot) {
          close();
          await game.act('unequip', { slot });
        }
        if (branch) {
          close();
          const result = await game.act('evolve', { branch });

          if (result) {
            game.modal({
              title: T('evo.title'),
              body: `<div class="event-body evo-reveal"></div><p class="modal-text">${esc(T('evo.text', { pet: game.pet.name, name: L(game.species(game.pet.species).evolutions[branch]) }))}</p>`,
              onMount: (reveal) => reveal.querySelector('.evo-reveal').append(portrait(specOf(game.pet), game.catalog, { pose: 'special', label: game.pet.name })),
            });
          }
        }
      });
    },
  });
}

function actionButtons(pet) {
  return [
    ['feed', 'food', T('act.feed')], ['play', 'joystick', T('act.play')], ['bath', 'wave', T('act.bath')],
    ['sleep', 'moon', pet.asleep ? T('act.wake') : T('act.sleep')], ['clean', 'leaf', T('act.clean')], ['photo', 'camera', T('act.photo')],
  ];
}

function renderAlerts(root, game) {
  const { pet, state } = game;
  const box = root.querySelector('#pet-alerts');
  const parts = [];

  if (pet.sick) {
    const hasMedicine = state.inventory.medicine || state.inventory.elixir;

    parts.push(`
      <div class="alert ${pet.critical ? 'is-critical' : ''}">
        ${game.icon('pill', '', 24)}
        <span>${esc(T(pet.critical ? 'home.critical' : 'home.sick', { pet: pet.name }))}</span>
        <button type="button" class="pet-button is-small" data-alert="${hasMedicine ? 'medicine' : state.kitAvailable ? 'kit' : 'shop'}">
          ${hasMedicine ? T('home.useMedicine') : state.kitAvailable ? T('home.kit') : T('home.buyMedicine')}
        </button>
      </div>`);
  }

  if (state.pendingEvent) {
    parts.push(`<button type="button" class="alert is-event" data-alert="event">${game.icon('box', '', 24)}<span>${T('act.event')}</span></button>`);
  }

  if (pet.away) {
    const zone = game.catalog.zones.find(({ id }) => id === state.expedition.zone);

    parts.push(`
      <div class="alert">
        ${game.icon('compass', '', 24)}<span>${esc(T('home.away', { pet: pet.name, zone: L(zone.name) }))}</span>
        <button type="button" class="pet-button is-small" data-alert="explore">${T('home.back')}</button>
      </div>`);
  }

  box.innerHTML = parts.join('');
}

function renderPanels(root, game) {
  const { pet, state } = game;
  const tier = game.catalog.config.affinityTiers[pet.affinityTier];

  root.querySelector('#pet-name-line').innerHTML = `
    <strong>${esc(pet.name)}</strong>
    <small>${esc(L(pet.evolution ? game.species(pet.species).evolutions[pet.evolution] : game.species(pet.species).name))} · ${T(`mood.${pet.mood}`)} · ${T(`tier.${tier.id}`)}</small>
  `;
  renderStats(root.querySelector('#pet-stats'), pet);
  root.querySelector('#pet-missions').innerHTML = missionsHtml(game);
  renderAlerts(root, game);

  const daily = root.querySelector('#pet-daily');

  daily.textContent = state.daily.claimed ? T('act.dailyDone') : T('act.daily');
  daily.classList.toggle('is-primary', !state.daily.claimed);

  const sleepButton = root.querySelector('[data-care="sleep"] span');
  if (sleepButton) sleepButton.textContent = pet.asleep ? T('act.wake') : T('act.sleep');

  root.querySelector('#pet-room').setAttribute('aria-label', T('a11y.pet', { pet: pet.name, mood: T(`mood.${pet.mood}`) }));
  scene?.setPet(pet);
}

async function care(game, kind) {
  unlockAudio();

  switch (kind) {
    case 'feed': feedMenu(game); break;
    case 'play': await game.act('playWithPet'); break;
    case 'bath': await game.act('bath'); break;
    case 'sleep': await game.act('toggleSleep'); break;
    case 'clean': await game.act('cleanRoom'); break;
    case 'photo': await game.act('photo'); break;
    default: await game.act('interact', { kind });
  }
}

export function render(root, game) {
  root.innerHTML = `
    <div class="home">
      <section class="home-stage">
        <div class="room-frame">
          <canvas id="pet-room" class="room-canvas" role="img"></canvas>
          <p class="speech" id="pet-speech" role="status" hidden></p>
        </div>
        <div id="pet-alerts" class="alerts"></div>
        <div class="care-group">
          <h3 class="pixel-sub">${T('care.title')}</h3>
          <div class="care-row">
            ${actionButtons(game.pet).map(([id, icon, label]) => `
              <button type="button" class="care-button" data-care="${id}">${game.icon(icon, '', 24)}<span>${label}</span></button>`).join('')}
          </div>
          <h3 class="pixel-sub">${T('love.title')}</h3>
          <div class="care-row">
            ${INTERACTIONS.map((id) => `<button type="button" class="care-button is-soft" data-care="${id}"><span>${T(`act.${id}`)}</span></button>`).join('')}
          </div>
        </div>
      </section>
      <aside class="home-side">
        <div class="side-panel">
          <div class="pet-line">
            <div id="pet-name-line" class="pet-name-line"></div>
            <button type="button" class="pet-button is-small" id="pet-sheet">${T('act.sheet')}</button>
          </div>
          <div id="pet-stats" class="stat-list"></div>
        </div>
        <div class="side-panel">
          <h3 class="pixel-sub">${T('home.missions')}</h3>
          <ul id="pet-missions" class="mission-list"></ul>
          <button type="button" class="pet-button" id="pet-daily"></button>
        </div>
      </aside>
    </div>
  `;

  const canvas = root.querySelector('#pet-room');
  const frame = root.querySelector('.room-frame');
  const bubble = root.querySelector('#pet-speech');

  scene = new Scene(canvas, game.catalog, {
    onPetClick: () => {
      unlockAudio();
      game.act('interact', { kind: 'pet' });
    },
    onFurnitureClick: (entry) => {
      const item = game.item(entry.id);

      if (item.use === 'computer' || item.use === 'arcade') game.go('arcade');
      else if (item.use) game.act('useFurniture', { uid: entry.uid });
    },
    onBubbleMove: (x, y) => {
      bubble.style.left = `${Math.min(78, Math.max(22, x * 100))}%`;
      bubble.style.top = `${Math.max(2, y * 100)}%`;
    },
  });

  renderPanels(root, game);
  scene.setPet(game.pet);
  scene.start();
  frame.dataset.ready = '1';

  root.querySelector('.care-group').addEventListener('click', (event) => {
    const button = event.target.closest('[data-care]');
    if (button) care(game, button.dataset.care);
  });
  root.querySelector('#pet-sheet').addEventListener('click', () => petSheet(game));
  root.querySelector('#pet-daily').addEventListener('click', () => dailyModal(game));
  root.querySelector('#pet-alerts').addEventListener('click', async (event) => {
    const kind = event.target.closest('[data-alert]')?.dataset.alert;

    if (kind === 'event') eventModal(game);
    if (kind === 'explore') game.go('explore');
    if (kind === 'shop') game.go('shop');
    if (kind === 'kit') await game.act('emergencyKit');
    if (kind === 'medicine') {
      await game.act('useItem', { itemId: game.state.inventory.medicine ? 'medicine' : 'elixir' });
    }
  });

  if (!game.pet.away) say(root, game.lineFor());
  scheduleChatter(root, game);
}

export function update(game) {
  const root = game.viewRoot;

  if (game.pet && root.querySelector('#pet-room')) renderPanels(root, game);
}

export function react(key, game) {
  const root = game.viewRoot;
  const [pose, particle, sound] = REACTIONS[key] ?? ['happy', null, null];

  if (sound) playSound(sound);
  scene?.play(pose, 1.8, particle);
  if (root.querySelector('#pet-speech') && game.pet) say(root, game.lineFor(key));
}

export function leave() {
  scene?.stop();
  scene = null;
  clearTimeout(speechTimer);
  clearTimeout(chatterTimer);
}
