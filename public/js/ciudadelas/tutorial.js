// Consejos del tutorial: según lo que pasa en la partida, dicen qué hacer y por qué.
// No guardan nada: el mensaje se calcula en cada momento a partir del estado.

import { tx } from './textos.js';

const isNearEnd = (game) => game.players.some((player) => player.city.length >= game.cityLimit - 2);

// Devuelve el texto del consejo de ahora, o null si no hay
export function coachText(game) {
  if (game.phase === 'over') return tx('tut.over');
  if (game.pending) return game.pending.player === game.seat ? tx('tut.graveyard') : tx('tut.watch');

  const mine = game.actor === game.seat;

  if (game.phase === 'select') {
    if (!mine) return tx('tut.waitSelect');
    return game.sel.kind === 'discard' ? `${tx('tut.select')} ${tx('tut.selectDiscard')}` : tx('tut.select');
  }

  if (!mine) return isNearEnd(game) ? `${tx('tut.watch')} ${tx('tut.endSoon')}` : tx('tut.watch');

  const { stage, char } = game.turn;

  if (stage === 'income') return tx('tut.income');
  if (stage === 'pick') return tx('tut.pick');

  const extra = isNearEnd(game) ? ` ${tx('tut.endSoon')}` : '';

  return `${tx(`tut.main.${char}`)} ${tx('tut.main')} ${tx('tut.mainEnd')}${extra}`;
}

export const introLines = () => [1, 2, 3, 4].map((n) => tx(`tut.intro.${n}`));
