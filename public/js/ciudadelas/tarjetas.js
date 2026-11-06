// Piezas visuales de Ciudadelas: cartas de distrito y de personaje.
// Todo se crea con el DOM (nunca con innerHTML) porque los nombres los escriben los jugadores.

import { tx } from './textos.js';

export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  Object.entries(props).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (name === 'class') element.className = value;
    else if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
    else if (value === true) element.setAttribute(name, '');
    else element.setAttribute(name, value);
  });

  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    element.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return element;
}

// Carta de distrito. options: { onClick, disabled, selected, hint, badge }
export function districtCard(card, options = {}) {
  const { onClick, disabled, selected, hint, badge } = options;
  const text = card.color === 'purple' ? tx(`dText.${card.key}`) : null;
  const classes = [
    'dcard', `dcard-${card.color}`,
    onClick ? 'is-clickable' : '',
    disabled ? 'is-disabled' : '',
    selected ? 'is-selected' : '',
    hint ? 'is-hint' : '',
  ].filter(Boolean).join(' ');
  const tag = onClick ? 'button' : 'div';

  return h(
    tag,
    {
      class: classes,
      type: onClick ? 'button' : null,
      onclick: onClick,
      'aria-disabled': disabled ? 'true' : null,
      'aria-pressed': selected ? 'true' : null,
      title: text ?? `${tx(`d.${card.key}`)} (${tx(`color.${card.color}`)})`,
    },
    h('span', { class: 'dcard-cost' }, card.cost),
    h('span', { class: 'dcard-name' }, tx(`d.${card.key}`)),
    text ? h('span', { class: 'dcard-text' }, text) : null,
    h('span', { class: 'dcard-kind' }, tx(`color.${card.color}`)),
    badge ? h('span', { class: 'dcard-badge' }, badge) : null,
  );
}

// Distrito pequeño, para las ciudades
export function miniDistrict(card, options = {}) {
  const { onClick, badge, protectedCard } = options;

  return h(
    onClick ? 'button' : 'span',
    {
      class: `mini mini-${card.color}${onClick ? ' is-clickable' : ''}${protectedCard ? ' is-protected' : ''}`,
      type: onClick ? 'button' : null,
      onclick: onClick,
      title: card.color === 'purple' ? `${tx(`d.${card.key}`)}: ${tx(`dText.${card.key}`)}` : tx(`d.${card.key}`),
    },
    h('span', { class: 'mini-cost' }, card.cost),
    h('span', { class: 'mini-name' }, tx(`d.${card.key}`)),
    badge ? h('span', { class: 'mini-badge' }, badge) : null,
  );
}

// Carta de personaje. options: { onClick, disabled, hint, compact, state }
export function characterCard(number, options = {}) {
  const { onClick, disabled, hint, compact, state } = options;
  const classes = [
    'ccard', `ccard-${number}`,
    compact ? 'is-compact' : '',
    onClick ? 'is-clickable' : '',
    disabled ? 'is-disabled' : '',
    hint ? 'is-hint' : '',
    state ? `is-${state}` : '',
  ].filter(Boolean).join(' ');

  return h(
    onClick ? 'button' : 'div',
    {
      class: classes, type: onClick ? 'button' : null, onclick: onClick, title: tx(`charText.${number}`),
    },
    h('span', { class: 'ccard-number' }, number),
    h('span', { class: 'ccard-name' }, tx(`char.${number}`)),
    compact ? null : h('span', { class: 'ccard-text' }, tx(`charText.${number}`)),
  );
}
