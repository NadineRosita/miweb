// Adivina el número con pistas de mayor o menor.

export const difficulties = ['easy', 'normal', 'hard'];

const RULES = {
  easy: { max: 50, tries: 8 },
  normal: { max: 100, tries: 8 },
  hard: { max: 500, tries: 10 },
};
const POINTS_PER_TRY = 10;
const WIN_POINTS = 15;

export function run(box, { T, sound, difficulty, end }) {
  const { max, tries } = RULES[difficulty];
  const secret = 1 + Math.floor(Math.random() * max);
  let left = tries;

  box.innerHTML = `
    <div class="game-hud"><span>${T('g.tries')}: <strong id="guess-left">${left}</strong></span></div>
    <form class="guess-form">
      <label class="pet-label">${T('g.guessInput', { min: 1, max })}
        <input class="pet-input" id="guess-input" type="number" min="1" max="${max}" required>
      </label>
      <button class="pet-button is-primary">${T('g.guess')}</button>
    </form>
    <ol class="guess-log" id="guess-log" aria-live="polite"></ol>`;

  const input = box.querySelector('#guess-input');
  const log = box.querySelector('#guess-log');

  input.focus();
  box.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    const value = Math.trunc(Number(input.value));
    if (!value || value < 1 || value > max) return;

    input.value = '';
    left -= 1;
    box.querySelector('#guess-left').textContent = left;

    if (value === secret) {
      end(WIN_POINTS + left * POINTS_PER_TRY, T('g.right2', { n: secret }));
      return;
    }
    if (left === 0) {
      end(0, T('g.wrong', { n: secret }));
      return;
    }

    sound('game');
    const row = document.createElement('li');

    row.textContent = T(value < secret ? 'g.higher' : 'g.lower', { n: value });
    log.prepend(row);
  });

  return () => {};
}
