// Página de Ciudadelas: menú, sala de espera y partida.
//
// El servidor decide todo (server/ciudadelas): aquí solo se pinta lo que envía y se
// proponen acciones. Cada mensaje del servidor vuelve a pintar la partida entera.

import {
  RoomConnection, forgetToken, saveName, saveToken, savedName, savedToken,
} from './sala.js';
import {
  characterCard, districtCard, h, miniDistrict,
} from './tarjetas.js';
import { tx } from './textos.js';
import { coachText, introLines } from './tutorial.js';

const $ = (id) => document.getElementById(id);

const INCOME_COLOR = {
  4: 'yellow', 5: 'blue', 6: 'green', 8: 'red',
};
const ICON = { gold: '🪙', cards: '🂠', crown: '♛' };
const MAX_PLAYERS = 7;
const MIN_PLAYERS = 2;
const COPIED_MS = 2000;

const menu = $('cd-menu');
const waiting = $('cd-waiting');
const gameView = $('cd-game');

let connection = null;
let room = null;
let game = null;
let connected = true;
let copied = false;
// mode: null | 'target' | 'swap' | 'discard' | 'attack' | 'lab'
let ui = { mode: null, selected: new Set(), key: '' };

// ---------- Comunicación ----------

async function api(path, body) {
  const response = await fetch(`/api/ciudadelas${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.error ?? 'server_error');
  return data;
}

function showError(code) {
  $('cd-error').textContent = tx(`error.${code}`);
}

const clearError = () => { $('cd-error').textContent = ''; };

function enterRoom(code, token) {
  saveToken(code, token);
  history.replaceState(null, '', `${location.pathname}?sala=${code}`);

  connection?.close();
  connection = new RoomConnection({
    code,
    token,
    onState: handleState,
    onError: (error) => {
      // Sala desconocida (por ejemplo, el servidor se reinició): se vuelve al menú
      if (error === 'room_forbidden' || error === 'room_not_found') leave();
      showError(error);
    },
    onConnection: (value) => {
      connected = value;
      if (room) render();
    },
  });
}

function leave() {
  if (room) forgetToken(room.code);
  connection?.close();
  connection = null;
  room = null;
  game = null;
  ui = { mode: null, selected: new Set(), key: '' };
  history.replaceState(null, '', location.pathname);
  render();
}

function handleState(message) {
  const turnKey = message.game
    ? `${message.game.round}-${message.game.turn?.char}-${message.game.turn?.stage}-${message.game.actor}`
    : '';

  room = message.room;
  game = message.game;

  // Cada paso nuevo de la partida empieza sin ninguna selección a medias
  if (turnKey !== ui.key) ui = { mode: null, selected: new Set(), key: turnKey };

  clearError();
  render();
}

const send = (message) => connection?.send(message);

function play(action) {
  ui = { ...ui, mode: null, selected: new Set() };
  send({ type: 'play', action });
}

// ---------- Utilidades de pintado ----------

const nameOf = (seat) => game.players[seat].name;
const label = (seat) => (seat === game.seat ? tx('you') : nameOf(seat));

function chip(text, extra = '') {
  return h('span', { class: `chip ${extra}`.trim() }, text);
}

function button(text, onclick, options = {}) {
  const { primary, disabled, hint } = options;

  return h('button', {
    class: `cd-button${primary ? ' is-primary' : ''}${hint ? ' is-hint' : ''}`,
    type: 'button',
    onclick,
    disabled,
  }, text);
}

// Monedas que cuesta que el Condotiero destruya ese distrito
function attackCost(target, card) {
  const wall = target.city.some((item) => item.key === 'greatwall') && card.key !== 'greatwall' ? 1 : 0;

  return card.cost - 1 + wall;
}

function isShielded(target) {
  return game.timeline?.some((entry) => entry.char === 5 && entry.status === 'done' && entry.player === target.seat);
}

function canAttack(target, card) {
  return target.seat !== game.seat
    && target.city.length < game.cityLimit
    && card.key !== 'keep'
    && !isShielded(target)
    && attackCost(target, card) <= game.players[game.seat].gold;
}

const mineTurn = () => game.phase === 'turn' && game.actor === game.seat && !game.pending;

// ---------- Menú ----------

function fillBotOptions() {
  const select = $('create-bots');
  const players = Number($('create-players').value);
  const previous = Number(select.value || 0);

  select.replaceChildren(...Array.from({ length: players }, (_, count) => (
    h('option', { value: count }, count === 0 ? tx('create.noBots') : count)
  )));
  select.value = String(Math.min(previous, players - 1));
}

function fillPlayerOptions() {
  const select = $('create-players');
  const previous = select.value || '4';

  select.replaceChildren(...Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, index) => (
    h('option', { value: MIN_PLAYERS + index }, MIN_PLAYERS + index)
  )));
  select.value = previous;
  fillBotOptions();
}

function playerName(formId) {
  const value = $(formId).elements.name.value.trim();

  if (value) saveName(value);
  return value;
}

async function submitCreate(event) {
  event.preventDefault();
  clearError();

  try {
    const form = event.target.elements;
    const { code, token } = await api('/rooms', {
      name: playerName('create-form'),
      maxPlayers: Number(form.players.value),
      bots: Number(form.bots.value),
      cityLimit: Number(form.limit.value),
    });

    enterRoom(code, token);
  } catch (error) {
    showError(error.message);
  }
}

async function joinRoom(code, name) {
  clearError();

  try {
    const joined = await api(`/rooms/${code.toUpperCase()}/join`, { name });

    enterRoom(joined.code, joined.token);
  } catch (error) {
    showError(error.message);
  }
}

async function startTutorial() {
  clearError();

  try {
    const { code, token } = await api('/rooms', { name: playerName('create-form'), tutorial: true });

    sessionStorage.removeItem(`ciudadelas-tutorial-${code}`);
    enterRoom(code, token);
  } catch (error) {
    showError(error.message);
  }
}

// ---------- Sala de espera ----------

async function copyLink() {
  const link = `${location.origin}${location.pathname}?sala=${room.code}`;

  try {
    await navigator.clipboard.writeText(link);
  } catch {
    window.prompt(tx('lobby.copy'), link);
    return;
  }
  copied = true;
  render();
  setTimeout(() => {
    copied = false;
    if (room) render();
  }, COPIED_MS);
}

function limitSelect(value, onchange) {
  return h(
    'select',
    { onchange: (event) => onchange(Number(event.target.value)) },
    [8, 7, 6].map((limit) => h('option', { value: limit, selected: limit === value }, tx(`create.limit.${limit}`))),
  );
}

function renderWaiting() {
  const isHost = room.seat === room.host;
  const members = room.members.map((member, seat) => h(
    'li',
    { class: 'member' },
    h('span', { class: 'member-name' }, member.name),
    seat === room.seat ? chip(tx('lobby.you')) : null,
    seat === room.host ? chip(tx('lobby.host'), 'is-gold') : null,
    member.bot ? chip(tx('lobby.bot')) : null,
    !member.connected ? chip(tx('lobby.offline'), 'is-warn') : null,
    isHost && member.bot
      ? h('button', { class: 'cd-link', type: 'button', onclick: () => send({ type: 'removeBot', seat }) }, tx('lobby.removeBot'))
      : null,
  ));

  const hostControls = isHost ? h(
    'div',
    { class: 'host-controls' },
    h(
      'label',
      { class: 'cd-field' },
      h('span', {}, tx('lobby.max')),
      h(
        'select',
        { onchange: (event) => send({ type: 'setMax', value: Number(event.target.value) }) },
        Array.from({ length: MAX_PLAYERS - Math.max(MIN_PLAYERS, room.members.length) + 1 }, (_, index) => {
          const value = Math.max(MIN_PLAYERS, room.members.length) + index;

          return h('option', { value, selected: value === room.maxPlayers }, value);
        }),
      ),
    ),
    h('label', { class: 'cd-field' }, h('span', {}, tx('create.limit')), limitSelect(room.cityLimit, (value) => send({ type: 'setLimit', value }))),
    h(
      'div',
      { class: 'host-buttons' },
      button(tx('lobby.addBot'), () => send({ type: 'addBot' }), { disabled: room.members.length >= room.maxPlayers }),
      button(tx('lobby.start'), () => send({ type: 'start' }), { primary: true, disabled: room.members.length < MIN_PLAYERS }),
    ),
    room.members.length < MIN_PLAYERS ? h('p', { class: 'cd-note' }, tx('lobby.needTwo')) : null,
  ) : h('p', { class: 'cd-note' }, tx('lobby.waitHost'));

  waiting.replaceChildren(
    h(
      'div',
      { class: 'cd-panel lobby-panel' },
      h(
        'div',
        { class: 'room-code' },
        h('span', { class: 'cd-note' }, tx('lobby.code')),
        h('strong', {}, room.code),
        button(copied ? tx('lobby.copied') : tx('lobby.copy'), copyLink),
      ),
      h('h2', { class: 'cd-title' }, tx('lobby.players'), ' ', h('small', {}, tx('lobby.seats', { n: room.members.length, max: room.maxPlayers }))),
      h('ul', { class: 'member-list' }, members),
      h('p', { class: 'cd-note' }, tx('lobby.rules2')),
      hostControls,
      h('div', { class: 'lobby-footer' }, button(tx('leave'), leave)),
    ),
  );
}

// ---------- Partida: partes ----------

function renderHeader() {
  return h(
    'div',
    { class: 'cd-header' },
    h(
      'div',
      { class: 'cd-stats' },
      chip(tx('round', { n: game.round })),
      chip(`${ICON.cards} ${tx('deck', { n: game.deck })}`),
      chip(`${ICON.crown} ${nameOf(game.crown)}`, 'is-gold'),
      !connected ? chip(tx('connecting'), 'is-warn') : null,
    ),
    h('div', { class: 'cd-header-buttons' }, button(tx('rules'), openRules), button(tx('leave'), leave)),
  );
}

function renderOpponent(player) {
  const isActor = game.actor === player.seat;
  const attacking = ui.mode === 'attack';
  const called = (game.timeline ?? []).filter((entry) => entry.status !== 'waiting' && entry.player === player.seat);
  const shielded = isShielded(player);

  const city = player.city.length === 0
    ? h('span', { class: 'cd-note' }, tx('emptyCityOther'))
    : player.city.map((card) => {
      const allowed = attacking && canAttack(player, card);

      return miniDistrict(card, {
        onClick: allowed ? () => play({ type: 'ability', target: player.seat, card: card.uid }) : null,
        badge: attacking ? tx('ability.attackCost', { n: attackCost(player, card) }) : null,
        protectedCard: attacking && !allowed,
      });
    });

  const chars = game.phase === 'over' && Array.isArray(player.chars)
    ? player.chars.map((number) => characterCard(number, { compact: true }))
    : [
      ...called.map((entry) => characterCard(entry.char, { compact: true, state: entry.status })),
      typeof player.chars === 'number' && game.phase === 'select' && player.chars > 0 ? chip(tx('hiddenChars', { n: player.chars })) : null,
    ];

  return h(
    'section',
    { class: `opponent${isActor ? ' is-actor' : ''}${shielded && attacking ? ' is-shielded' : ''}` },
    h(
      'header',
      { class: 'opponent-head' },
      h('strong', {}, player.name),
      player.bot ? chip(tx('bot')) : null,
      game.crown === player.seat ? h('span', { class: 'crown', title: tx('crown') }, ICON.crown) : null,
    ),
    h(
      'div',
      { class: 'opponent-stats' },
      h('span', { title: tx('gold') }, `${ICON.gold} ${player.gold}`),
      h('span', { title: tx('hand') }, `${ICON.cards} ${player.hand}`),
    ),
    h('div', { class: 'opponent-chars' }, chars),
    h('div', { class: 'city' }, city),
  );
}

function renderOpponents() {
  const others = [];

  for (let step = 1; step < game.players.length; step += 1) {
    others.push(game.players[(game.seat + step) % game.players.length]);
  }
  return h('div', { class: 'opponents' }, others.map(renderOpponent));
}

function renderTimeline() {
  return h(
    'ol',
    { class: 'timeline' },
    game.timeline.map((entry) => h(
      'li',
      { class: `timeline-item is-${entry.status}`, title: entry.player !== undefined ? nameOf(entry.player) : tx(`char.${entry.char}`) },
      characterCard(entry.char, { compact: true, state: entry.status }),
      entry.player !== undefined ? h('span', { class: 'timeline-owner' }, label(entry.player)) : null,
    )),
  );
}

function renderSelection() {
  const { sel } = game;
  const mine = game.actor === game.seat;
  const title = mine
    ? tx(sel.kind === 'discard' ? 'select.titleDiscard' : 'select.title')
    : tx('select.wait', { name: nameOf(game.actor) });
  const hint = room.tutorial && mine;

  return h(
    'div',
    { class: 'cd-panel' },
    h('h2', { class: 'cd-title' }, title),
    mine && sel.kind === 'discard' ? h('p', { class: 'cd-note' }, tx('select.discardHint')) : null,
    mine ? h('div', { class: 'char-pool' }, sel.pool.map((number) => (
      characterCard(number, { hint, onClick: () => play({ type: sel.kind, char: number }) })
    ))) : null,
    h(
      'div',
      { class: 'discards' },
      sel.faceUp.length > 0 ? h('span', { class: 'cd-note' }, tx('select.faceUp')) : null,
      sel.faceUp.map((number) => characterCard(number, { compact: true, state: 'skipped' })),
      h('span', { class: 'cd-note' }, tx('select.faceDown', { n: sel.faceDownCount })),
    ),
  );
}

function abilityControls() {
  const { turn } = game;
  const me = game.players[game.seat];

  if (turn.ability) return [h('span', { class: 'cd-note' }, tx('turn.abilityUsed'))];

  switch (turn.char) {
    case 1:
    case 2:
      return [button(`${tx(`char.${turn.char}`)}: ${tx('turn.ability')}`, () => { ui = { ...ui, mode: 'target' }; render(); }, { primary: true })];
    case 3:
      return [
        button(tx('ability.swap'), () => { ui = { ...ui, mode: 'swap' }; render(); }),
        button(tx('ability.discard'), () => { ui = { ...ui, mode: 'discard', selected: new Set() }; render(); }, { disabled: me.hand.length === 0 }),
      ];
    case 8:
      return [button(tx('ability.attack'), () => { ui = { ...ui, mode: 'attack' }; render(); }, { primary: true })];
    default:
      return [];
  }
}

function modePanel() {
  const { turn } = game;
  const cancel = button(tx('turn.cancel'), () => { ui = { ...ui, mode: null, selected: new Set() }; render(); });

  if (ui.mode === 'target') {
    const first = turn.char === 1 ? 2 : 3;
    const targets = [];

    for (let number = first; number <= 8; number += 1) targets.push(number);

    return h(
      'div',
      { class: 'mode-panel' },
      h('p', { class: 'cd-note' }, tx('ability.target')),
      h('div', { class: 'char-pool' }, targets.map((number) => (
        characterCard(number, { onClick: () => play({ type: 'ability', target: number }) })
      ))),
      cancel,
    );
  }

  if (ui.mode === 'swap') {
    return h(
      'div',
      { class: 'mode-panel' },
      h('p', { class: 'cd-note' }, tx('ability.swapWho')),
      h(
        'div',
        { class: 'swap-list' },
        game.players.filter((player) => player.seat !== game.seat).map((player) => button(
          `${player.name} (${ICON.cards} ${player.hand})`,
          () => play({ type: 'ability', mode: 'swap', target: player.seat }),
        )),
      ),
      cancel,
    );
  }

  if (ui.mode === 'discard') {
    return h(
      'div',
      { class: 'mode-panel' },
      h('p', { class: 'cd-note' }, tx('ability.discardPick')),
      button(`${tx('turn.confirm')} (${ui.selected.size})`, () => play({ type: 'ability', mode: 'discard', cards: [...ui.selected] }), {
        primary: true, disabled: ui.selected.size === 0,
      }),
      cancel,
    );
  }

  if (ui.mode === 'attack') {
    const anyTarget = game.players.some((player) => player.city.some((card) => canAttack(player, card)));

    return h(
      'div',
      { class: 'mode-panel' },
      h('p', { class: 'cd-note' }, anyTarget ? tx('ability.attackPick') : tx('ability.noTarget')),
      cancel,
    );
  }

  if (ui.mode === 'lab') {
    return h('div', { class: 'mode-panel' }, h('p', { class: 'cd-note' }, tx('turn.labPick')), cancel);
  }
  return null;
}

function renderActions() {
  const { turn } = game;
  const me = game.players[game.seat];
  const hint = room.tutorial;

  if (turn.stage === 'income') {
    return h(
      'div',
      { class: 'actions' },
      h('p', { class: 'cd-note' }, tx('turn.income')),
      h(
        'div',
        { class: 'action-row' },
        button(`${ICON.gold} ${tx('turn.takeGold')}`, () => play({ type: 'income', mode: 'gold' }), { primary: true, hint }),
        button(`${ICON.cards} ${tx('turn.takeCards')}`, () => play({ type: 'income', mode: 'cards' }), { disabled: game.deck === 0, hint }),
      ),
    );
  }

  if (turn.stage === 'pick') {
    return h(
      'div',
      { class: 'actions' },
      h('p', { class: 'cd-note' }, tx('turn.pickAll')),
      h('div', { class: 'hand' }, turn.pick.map((card) => districtCard(card, {
        hint, onClick: () => play({ type: 'keep', card: card.uid }),
      }))),
    );
  }

  const incomeColor = INCOME_COLOR[turn.char];
  const owns = (key) => me.city.some((card) => card.key === key);
  const buttons = [];

  if (incomeColor && !turn.collected) {
    buttons.push(button(`${ICON.gold} ${tx('turn.collect', { color: tx(`colorIncome.${incomeColor}`) })}`, () => play({ type: 'collect' }), { primary: true }));
  }
  buttons.push(...abilityControls());
  if (owns('laboratory') && !turn.lab) buttons.push(button(tx('turn.lab'), () => { ui = { ...ui, mode: 'lab' }; render(); }, { disabled: me.hand.length === 0 }));
  if (owns('smithy') && !turn.smithy) buttons.push(button(tx('turn.smithy'), () => play({ type: 'smithy' }), { disabled: me.gold < 2 }));
  buttons.push(button(tx('turn.end'), () => play({ type: 'end' }), { hint: hint && turn.built > 0 }));

  const secret = game.secret.killed ?? game.secret.robbed;
  const secretKey = game.secret.killed ? 'turn.killedHint' : 'turn.robbedHint';

  return h(
    'div',
    { class: 'actions' },
    h(
      'p',
      { class: 'cd-note' },
      tx('turn.build'),
      ' · ',
      tx('turn.built', { n: turn.built, max: turn.buildMax }),
      secret ? ` · ${tx(secretKey, { char: tx(`char.${secret}`) })}` : '',
    ),
    modePanel() ?? h('div', { class: 'action-row' }, buttons),
  );
}

function renderTurn() {
  const { turn } = game;
  const mine = turn.player === game.seat;

  return h(
    'div',
    { class: 'cd-panel' },
    renderTimeline(),
    h(
      'div',
      { class: 'turn-banner' },
      characterCard(turn.char, { compact: true, state: 'current' }),
      h(
        'strong',
        {},
        mine ? tx('yourTurn') : tx('turn.theirTurn', { name: nameOf(turn.player), char: tx(`char.${turn.char}`) }),
      ),
    ),
    mine && !game.pending ? renderActions() : null,
  );
}

function renderGraveyard() {
  const { pending } = game;
  const mine = pending.player === game.seat;

  return h(
    'div',
    { class: 'cd-panel' },
    h('h2', { class: 'cd-title' }, tx('graveyard.title')),
    mine
      ? h(
        'div',
        { class: 'actions' },
        h('p', {}, tx('graveyard.text', { card: tx(`d.${pending.card.key}`) })),
        districtCard(pending.card),
        h(
          'div',
          { class: 'action-row' },
          button(tx('graveyard.yes'), () => play({ type: 'graveyard', take: true }), { primary: true, hint: room.tutorial }),
          button(tx('graveyard.no'), () => play({ type: 'graveyard', take: false })),
        ),
      )
      : h('p', { class: 'cd-note' }, tx('graveyard.wait', { name: nameOf(pending.player) })),
  );
}

function renderOver() {
  const isHost = room.seat === room.host;
  const winners = game.winners.map(nameOf).join(', ');
  const rows = [...game.scores].sort((a, b) => b.total - a.total).map((score) => h(
    'tr',
    { class: game.winners.includes(score.seat) ? 'is-winner' : '' },
    h('th', { scope: 'row' }, label(score.seat)),
    h('td', {}, score.districts),
    h('td', {}, score.colors),
    h('td', {}, score.completion),
    h('td', { class: 'total' }, score.total),
  ));

  return h(
    'div',
    { class: 'cd-panel over' },
    h('h2', { class: 'cd-title' }, tx('over.title')),
    h('p', { class: 'winner' }, tx(game.winners.length > 1 ? 'over.winners' : 'over.winner', { names: winners })),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'scores' },
        h('thead', {}, h('tr', {}, h('th', {}), ...['districts', 'colors', 'completion', 'total'].map((key) => h('th', { scope: 'col' }, tx(`over.${key}`))))),
        h('tbody', {}, rows),
      ),
    ),
    h(
      'div',
      { class: 'action-row' },
      isHost ? button(tx('over.rematch'), () => send({ type: 'rematch' }), { primary: true }) : h('span', { class: 'cd-note' }, tx('over.waitHost')),
      button(tx('over.exit'), leave),
    ),
  );
}

function renderCenter() {
  if (game.phase === 'over') return renderOver();
  if (game.pending) return renderGraveyard();
  if (game.phase === 'select') return renderSelection();
  return renderTurn();
}

function renderMine() {
  const me = game.players[game.seat];
  const turn = mineTurn() && game.turn.stage === 'main' ? game.turn : null;
  const buildable = (card) => Boolean(turn)
    && turn.built < turn.buildMax
    && card.cost <= me.gold
    && !me.city.some((item) => item.key === card.key);

  function handClick(card) {
    if (ui.mode === 'discard') {
      const selected = new Set(ui.selected);

      if (!selected.delete(card.uid)) selected.add(card.uid);
      ui = { ...ui, selected };
      render();
      return null;
    }
    if (ui.mode === 'lab') return play({ type: 'lab', card: card.uid });
    return buildable(card) ? play({ type: 'build', card: card.uid }) : null;
  }

  const handCards = me.hand.length === 0 ? [h('p', { class: 'cd-note' }, tx('emptyHand'))] : game.me.hand.map((card) => {
    const picking = ui.mode === 'discard' || ui.mode === 'lab';
    const usable = picking || buildable(card);

    return districtCard(card, {
      onClick: turn ? () => handClick(card) : null,
      disabled: Boolean(turn) && !usable,
      selected: ui.selected.has(card.uid),
      hint: room.tutorial && !picking && buildable(card),
    });
  });

  const myChars = game.me.chars.map((number) => characterCard(number, {
    compact: true,
    state: game.phase === 'turn' && game.turn.player === game.seat && game.turn.char === number ? 'current' : null,
  }));

  return h(
    'section',
    { class: `mine${mineTurn() ? ' is-actor' : ''}` },
    h(
      'header',
      { class: 'mine-head' },
      h('strong', {}, `${tx('yourCity')} · ${me.name}`),
      h('span', { class: 'mine-gold', title: tx('gold') }, `${ICON.gold} ${me.gold}`),
      game.crown === game.seat ? h('span', { class: 'crown', title: tx('crown') }, ICON.crown) : null,
    ),
    myChars.length > 0 ? h('div', { class: 'mine-chars' }, h('span', { class: 'cd-note' }, tx('yourChars')), myChars) : null,
    h('div', { class: 'city' }, me.city.length === 0 ? h('span', { class: 'cd-note' }, tx('emptyCity')) : me.city.map((card) => miniDistrict(card))),
    h('h3', { class: 'cd-subtitle' }, tx('yourHand')),
    h('div', { class: 'hand' }, handCards),
  );
}

function logLine(entry) {
  const p = (seat) => nameOf(seat); // Con el nombre: «Tú destruye» no se leería bien
  const c = (number) => tx(`char.${number}`);
  const d = (key) => tx(`d.${key}`);

  switch (entry.k) {
    case 'start': return tx('log.start', { crown: nameOf(entry.crown) });
    case 'round': return tx('log.round', {
      round: entry.round,
      faceUp: entry.faceUp.length > 0 ? tx('log.faceUp', { chars: entry.faceUp.map(c).join(', ') }) : '',
    });
    case 'call': return tx('log.call', { player: p(entry.player), char: c(entry.char) });
    case 'killed': return tx('log.killed', { char: c(entry.char) });
    case 'robbed': return tx('log.robbed', { thief: p(entry.thief), victim: p(entry.victim), gold: entry.gold });
    case 'ability': return tx(`log.ability.${entry.char}`, { player: p(entry.player) });
    case 'swap': return tx('log.swap', { player: p(entry.player), target: p(entry.target) });
    case 'destroy': return tx('log.destroy', {
      player: p(entry.player), target: p(entry.target), card: d(entry.card), gold: entry.gold,
    });
    case 'build': return tx('log.build', { player: p(entry.player), card: d(entry.card) });
    case 'income': return tx('log.income', { player: p(entry.player), gold: entry.gold, color: tx(`colorIncome.${entry.color}`) });
    case 'over': return tx('log.over');
    default: return tx(`log.${entry.k}`, {
      player: entry.player === undefined ? '' : p(entry.player), count: entry.count,
    });
  }
}

function renderLog() {
  return h(
    'details',
    { class: 'cd-log', open: true },
    h('summary', {}, tx('log.title')),
    h('ol', {}, [...game.log].reverse().map((entry) => h('li', {}, logLine(entry)))),
  );
}

function renderCoach() {
  if (!room.tutorial) return null;

  const text = coachText(game);

  return text ? h('aside', { class: 'coach', role: 'status' }, h('strong', {}, `${tx('tut.title')}: `), text) : null;
}

function renderGame() {
  gameView.replaceChildren(...[
    renderHeader(),
    renderCoach(),
    renderOpponents(),
    renderCenter(),
    renderMine(),
    renderLog(),
  ].filter(Boolean));
  maybeShowIntro();
}

// ---------- Diálogos ----------

function openRules() {
  const dialog = $('rules-dialog');
  const chars = [1, 2, 3, 4, 5, 6, 7, 8].map((number) => characterCard(number));
  const sections = ['goal', 'round', 'districts', 'score', 'few'].map((key) => h(
    'section',
    {},
    h('h3', { class: 'cd-subtitle' }, tx(`rules.${key}.title`)),
    h('p', {}, tx(`rules.${key}`)),
  ));

  $('rules-body').replaceChildren(
    ...sections,
    h('h3', { class: 'cd-subtitle' }, tx('rules.chars.title')),
    h('div', { class: 'char-pool' }, chars),
  );
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0; // El foco cae en «Cerrar», abajo del todo: se vuelve al principio
}

function maybeShowIntro() {
  if (!room?.tutorial) return;

  const key = `ciudadelas-tutorial-${room.code}`;
  const dialog = $('intro-dialog');

  if (sessionStorage.getItem(key) || dialog.open) return;

  $('intro-body').replaceChildren(...introLines().map((line) => h('p', {}, line)));
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.addEventListener('close', () => sessionStorage.setItem(key, '1'), { once: true });
}

// ---------- Pintado general ----------

function render() {
  const inRoom = Boolean(room);
  const inGame = inRoom && room.status !== 'lobby' && game;

  menu.hidden = inRoom;
  waiting.hidden = !(inRoom && !inGame);
  gameView.hidden = !inGame;
  document.body.classList.toggle('cd-playing', Boolean(inGame));

  if (!inRoom) return;
  if (inGame) renderGame();
  else renderWaiting();
}

// ---------- Arranque ----------

$('create-form').addEventListener('submit', submitCreate);
$('create-players').addEventListener('change', fillBotOptions);
$('tutorial-start').addEventListener('click', startTutorial);
$('rules-open').addEventListener('click', openRules);

$('join-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const { code, name } = event.target.elements;

  if (name.value.trim()) saveName(name.value.trim());
  joinRoom(code.value.trim(), name.value.trim());
});

document.querySelectorAll('[data-close-dialog]').forEach((element) => {
  element.addEventListener('click', () => element.closest('dialog').close());
});

i18n.onChange(() => {
  fillPlayerOptions();
  if (room) render();
});

fillPlayerOptions();
document.querySelectorAll('input[name="name"]').forEach((input) => { input.value = savedName(); });

const params = new URLSearchParams(location.search);
const urlCode = (params.get('sala') ?? '').toUpperCase();

if (urlCode) {
  const token = savedToken(urlCode);

  if (token) {
    enterRoom(urlCode, token);
  } else {
    $('join-form').elements.code.value = urlCode;
    $('join-form').elements.name.focus();
  }
}
