// La serpiente de toda la vida, con teclado y botones táctiles.

export const difficulties = ['easy', 'normal', 'hard'];

const SIZE = 18; // Celdas por lado
const CELL = 16;
const STEP_MS = { easy: 170, normal: 125, hard: 85 };
const KEYS = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
};

export function run(box, { T, difficulty, sound, end }) {
  box.innerHTML = `
    <div class="game-hud"><span>${T('g.score')}: <strong id="snake-score">0</strong></span></div>
    <canvas class="game-canvas" id="snake" width="${SIZE * CELL}" height="${SIZE * CELL}" role="img" aria-label="${T('game.snake')}"></canvas>
    <div class="touch-pad">
      <button type="button" data-dir="0,-1" aria-label="${T('g.up')}">▲</button>
      <button type="button" data-dir="-1,0" aria-label="${T('g.left')}">◀</button>
      <button type="button" data-dir="1,0" aria-label="${T('g.right')}">▶</button>
      <button type="button" data-dir="0,1" aria-label="${T('g.down')}">▼</button>
    </div>`;

  const ctx = box.querySelector('#snake').getContext('2d');
  const scoreLabel = box.querySelector('#snake-score');
  let snake = [[9, 9], [8, 9], [7, 9]];
  let direction = [1, 0];
  let queued = [1, 0];
  let score = 0;
  let food = null;

  const placeFood = () => {
    do {
      food = [Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE)];
    } while (snake.some(([x, y]) => x === food[0] && y === food[1]));
  };

  const draw = () => {
    ctx.fillStyle = '#10143a';
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);
    ctx.fillStyle = '#1a2150';
    for (let x = 0; x < SIZE; x += 1) {
      for (let y = 0; y < SIZE; y += 1) {
        if ((x + y) % 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    ctx.fillStyle = '#f7e08a';
    ctx.fillRect(food[0] * CELL + 3, food[1] * CELL + 3, CELL - 6, CELL - 6);
    snake.forEach(([x, y], index) => {
      ctx.fillStyle = index === 0 ? '#7cf0c8' : '#4d8dff';
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    });
  };

  const turn = (next) => {
    if (next[0] !== -direction[0] || next[1] !== -direction[1]) queued = next;
  };

  const step = () => {
    direction = queued;
    const head = [snake[0][0] + direction[0], snake[0][1] + direction[1]];
    const crashed = head[0] < 0 || head[1] < 0 || head[0] >= SIZE || head[1] >= SIZE
      || snake.some(([x, y]) => x === head[0] && y === head[1]);

    if (crashed) {
      clearInterval(timer);
      end(score);
      return;
    }

    snake.unshift(head);
    if (head[0] === food[0] && head[1] === food[1]) {
      score += 1;
      scoreLabel.textContent = score;
      sound('game');
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  };

  const onKey = (event) => {
    const next = KEYS[event.key];

    if (next) {
      event.preventDefault();
      turn(next);
    }
  };

  document.addEventListener('keydown', onKey);
  box.querySelector('.touch-pad').addEventListener('click', (event) => {
    const value = event.target.closest('[data-dir]')?.dataset.dir;
    if (value) turn(value.split(',').map(Number));
  });

  placeFood();
  draw();
  const timer = setInterval(step, STEP_MS[difficulty]);

  return () => {
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
  };
}
