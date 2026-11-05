// Pulsar todo lo posible en poco tiempo. Llegar al objetivo da puntos extra.

export const difficulties = ['easy', 'normal', 'hard'];

const SECONDS = 15;
const GOALS = { easy: 50, normal: 75, hard: 100 };
const GOAL_BONUS = 20;

export function run(box, { T, difficulty, sound, end }) {
  const goal = GOALS[difficulty];
  const endsAt = Date.now() + SECONDS * 1000;
  let clicks = 0;

  box.innerHTML = `
    <div class="game-hud">
      <span>${T('g.score')}: <strong id="click-score">0</strong></span>
      <span>${T('g.goal')}: <strong>${goal}</strong></span>
      <span>${T('g.time')}: <strong id="click-time">${SECONDS}</strong>s</span>
    </div>
    <button type="button" class="clicker-button" id="click-target">${T('g.click')}</button>`;

  const target = box.querySelector('#click-target');
  const timeLabel = box.querySelector('#click-time');

  target.addEventListener('click', () => {
    clicks += 1;
    box.querySelector('#click-score').textContent = clicks;
    target.classList.remove('is-hit');
    void target.offsetWidth;
    target.classList.add('is-hit');
    if (clicks === goal) sound('win');
    else if (clicks % 5 === 0) sound('game');
  });
  target.focus();

  const clock = setInterval(() => {
    const left = Math.ceil((endsAt - Date.now()) / 1000);

    timeLabel.textContent = Math.max(0, left);
    if (left <= 0) {
      clearInterval(clock);
      end(clicks + (clicks >= goal ? GOAL_BONUS : 0));
    }
  }, 200);

  return () => clearInterval(clock);
}
