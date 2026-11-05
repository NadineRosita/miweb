// Animaciones del final de la partida: ganar, perder, tablas y rey ahogado.
//
// Quien prefiere reducir el movimiento solo ve el mensaje, sin efectos.

const ENDING_MS = 3800;
const CONFETTI_PIECES = 90;
const KING_FALL_MS = 900;
const CONFETTI_COLORS = ['var(--accent)', 'var(--accent2)', 'var(--sky-sun)', '#fff8f0', '#b5694f'];

let cleanup = null;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const randomBetween = (min, max) => min + Math.random() * (max - min);

function launchConfetti() {
  const layer = document.createElement('div');

  layer.className = 'chess-confetti';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < CONFETTI_PIECES; i += 1) {
    const piece = document.createElement('i');
    const drift = randomBetween(-18, 18);

    piece.style.left = `${randomBetween(0, 100)}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.animate([
      { transform: 'translate(0, -5vh) rotate(0deg)', opacity: 1 },
      { transform: `translate(${drift}vw, 75vh) rotate(${randomBetween(180, 540)}deg)`, opacity: 1, offset: 0.75 },
      { transform: `translate(${drift * 1.2}vw, 105vh) rotate(${randomBetween(540, 900)}deg)`, opacity: 0 },
    ], {
      duration: randomBetween(1800, 3300),
      delay: randomBetween(0, 700),
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'both',
    });
    layer.append(piece);
  }

  document.body.append(layer);
  return () => layer.remove();
}

// El rey cae de lado, igual que al rendirse en una partida real
function toppleKing(piece, duration) {
  piece?.animate([
    { transform: 'none' },
    { transform: 'rotate(84deg)', offset: 0.7 },
    { transform: 'rotate(72deg)', offset: 0.85 },
    { transform: 'rotate(78deg)' },
  ], { duration, easing: 'ease-in' });
}

function hopKing(piece) {
  piece?.animate([
    { transform: 'none' },
    { transform: 'translateY(-22%) scale(1.08)', offset: 0.45 },
    { transform: 'none', offset: 0.75 },
    { transform: 'translateY(-6%)', offset: 0.88 },
    { transform: 'none' },
  ], { duration: 620, iterations: 3, easing: 'ease-in-out' });
}

function swayKing(piece, direction) {
  piece?.animate([
    { transform: 'none' },
    { transform: `rotate(${direction * 9}deg)` },
    { transform: 'none' },
    { transform: `rotate(${-direction * 9}deg)` },
    { transform: 'none' },
  ], { duration: 1500, iterations: 2, easing: 'ease-in-out' });
}

function shakeKing(piece) {
  piece?.animate([
    { transform: 'none' },
    { transform: 'translateX(-5%)' },
    { transform: 'translateX(5%)' },
    { transform: 'none' },
  ], { duration: 240, iterations: 9, delay: 500, easing: 'linear' });
}

function resultCard(title, subtitle) {
  const card = document.createElement('div');
  const heading = document.createElement('strong');
  const detail = document.createElement('span');

  card.className = 'chess-result';
  card.setAttribute('aria-hidden', 'true'); // El texto bajo el tablero ya lo anuncia
  heading.textContent = title;
  detail.textContent = subtitle;
  card.append(heading, detail);
  return card;
}

export function clearEnding() {
  cleanup?.();
  cleanup = null;
}

// kind: 'won', 'lost', 'draw' o 'stalemate'
export function playEnding(board, { kind, title, subtitle, winner, loser, stuck }) {
  clearEnding();

  const boardElement = board.element;
  const card = resultCard(title, subtitle);
  const removeConfetti = !reducedMotion() && kind === 'won' ? launchConfetti() : () => {};

  if (loser) board.setFallen(loser);

  boardElement.classList.add(`ending-${kind}`);
  boardElement.append(card);

  if (!reducedMotion()) {
    if (loser) toppleKing(board.kingPiece(loser), kind === 'lost' ? KING_FALL_MS * 1.5 : KING_FALL_MS);
    if (kind === 'won') hopKing(board.kingPiece(winner));
    if (kind === 'draw') {
      swayKing(board.kingPiece('white'), 1);
      swayKing(board.kingPiece('black'), -1);
    }
    if (kind === 'stalemate') shakeKing(board.kingPiece(stuck));
  }

  const stuckSquare = kind === 'stalemate' ? board.kingSquare(stuck) : null;
  stuckSquare?.classList.add('is-stuck');

  const finish = () => {
    boardElement.classList.remove(`ending-${kind}`);
    stuckSquare?.classList.remove('is-stuck');
    card.remove();
    removeConfetti();
  };

  const timer = setTimeout(() => {
    clearEnding();
  }, ENDING_MS);

  cleanup = () => {
    clearTimeout(timer);
    finish();
  };
}
