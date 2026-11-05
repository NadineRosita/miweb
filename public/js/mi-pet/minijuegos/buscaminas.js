// Buscaminas: las minas se reparten tras el primer clic, que nunca explota.

export const difficulties = ['easy', 'normal', 'hard'];

const RULES = {
  easy: { size: 8, mines: 10 },
  normal: { size: 10, mines: 16 },
  hard: { size: 12, mines: 28 },
};
const POINTS_PER_MINE = 3;
const SPEED_BONUS_SECONDS = 120;
const NUMBER_COLORS = ['', '#7cc4f0', '#7cf0c8', '#f4a6c8', '#a79bf0', '#f7e08a', '#ff9d6e', '#f4f0e6', '#f4f0e6'];

export function run(box, { T, sound, difficulty, end }) {
  const { size, mines } = RULES[difficulty];
  const cells = Array.from({ length: size * size }, () => ({ mine: false, open: false, flag: false, around: 0 }));
  const started = Date.now();
  let placed = false;
  let flagMode = false;
  let finished = false;
  let flags = 0;

  box.innerHTML = `
    <div class="game-hud">
      <span>${T('g.mines')}: <strong id="mine-left">${mines}</strong></span>
      <span>${T('g.time')}: <strong id="mine-time">0</strong>s</span>
      <button type="button" class="pet-button is-small" id="mine-flag" aria-pressed="false">🚩 ${T('g.flagMode')}</button>
    </div>
    <div class="mine-grid" style="--size:${size}">
      ${cells.map((cell, index) => `<button type="button" class="mine-cell" data-cell="${index}" aria-label="${T('g.cell', { x: index % size + 1, y: Math.floor(index / size) + 1 })}"></button>`).join('')}
    </div>`;

  const grid = box.querySelector('.mine-grid');
  const nodes = [...grid.children];
  const clock = setInterval(() => {
    box.querySelector('#mine-time').textContent = Math.floor((Date.now() - started) / 1000);
  }, 500);

  const neighbours = (index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    const list = [];

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < size && ny < size) list.push(ny * size + nx);
      }
    }
    return list;
  };

  const placeMines = (safe) => {
    const blocked = new Set([safe, ...neighbours(safe)]);
    let left = mines;

    while (left > 0) {
      const index = Math.floor(Math.random() * cells.length);

      if (!cells[index].mine && !blocked.has(index)) {
        cells[index].mine = true;
        left -= 1;
      }
    }
    cells.forEach((cell, index) => {
      cell.around = neighbours(index).filter((other) => cells[other].mine).length;
    });
    placed = true;
  };

  const finish = (won) => {
    finished = true;
    clearInterval(clock);
    cells.forEach((cell, index) => {
      if (cell.mine) {
        nodes[index].textContent = '✹';
        nodes[index].classList.add('is-mine');
      }
    });

    const seconds = (Date.now() - started) / 1000;
    const bonus = Math.max(0, Math.floor((SPEED_BONUS_SECONDS - seconds) / 6));

    setTimeout(() => end(won ? mines * POINTS_PER_MINE + bonus : 0, T(won ? 'g.won' : 'g.lost')), 900);
  };

  const reveal = (start) => {
    const stack = [start];

    while (stack.length) {
      const index = stack.pop();
      const cell = cells[index];

      if (!cell.open && !cell.flag) {
        cell.open = true;
        nodes[index].classList.add('is-open');
        if (cell.around) {
          nodes[index].textContent = cell.around;
          nodes[index].style.color = NUMBER_COLORS[cell.around];
        } else {
          stack.push(...neighbours(index));
        }
      }
    }
  };

  const toggleFlag = (index) => {
    const cell = cells[index];
    if (cell.open || finished) return;

    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    nodes[index].textContent = cell.flag ? '🚩' : '';
    box.querySelector('#mine-left').textContent = mines - flags;
  };

  const openCell = (index) => {
    const cell = cells[index];
    if (finished || cell.open || cell.flag) return;

    if (!placed) placeMines(index);
    if (cell.mine) {
      sound('lose');
      finish(false);
      return;
    }

    sound('game');
    reveal(index);
    if (cells.every((entry) => entry.mine || entry.open)) finish(true);
  };

  grid.addEventListener('click', (event) => {
    const value = event.target.closest('[data-cell]')?.dataset.cell;
    if (value === undefined) return;

    if (flagMode) toggleFlag(Number(value));
    else openCell(Number(value));
  });
  grid.addEventListener('contextmenu', (event) => {
    const value = event.target.closest('[data-cell]')?.dataset.cell;

    if (value !== undefined) {
      event.preventDefault();
      toggleFlag(Number(value));
    }
  });
  box.querySelector('#mine-flag').addEventListener('click', (event) => {
    flagMode = !flagMode;
    event.currentTarget.setAttribute('aria-pressed', String(flagMode));
  });

  return () => clearInterval(clock);
}
