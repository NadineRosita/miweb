// Tablero: pinta la posición y convierte clics y arrastres en jugadas.
// No sabe de reglas ni de rivales: recibe una partida de chess.js y avisa con onMove.

const FILES = 'abcdefgh';
const DRAG_THRESHOLD_PX = 6;
const PROMOTIONS = ['q', 'r', 'b', 'n'];

const BASE = '<path d="M11 39.500h23v-3a2 2 0 0 0-2-2H13a2 2 0 0 0-2 2z"/>';

// Piezas dibujadas para esta web
const PIECES = {
  p: `<circle cx="22.500" cy="13" r="5.500"/><path d="M17 19.500h11v2.500H17z"/><path d="M19 22c0 5-2 8-5 12.500h17c-3-4.500-5-7.500-5-12.500z"/>${BASE}`,
  r: `<path d="M13 8.500h4.500v3.500h2.800V8.500h4.400v3.500h2.800V8.500H32V16l-3 3H16l-3-3z"/><path d="M17 19h11l1.500 15.500h-14z"/>${BASE}`,
  b: `<circle cx="22.500" cy="7.500" r="2.300"/><path d="M22.500 9.500c4 3 7.500 7.500 7.500 11.500 0 3-2 5-4.500 6h-6C17 26 15 24 15 21c0-4 3.500-8.500 7.500-11.500z"/><path d="M19.500 27h6c.4 3 2 5.500 4 7.500H15.500c2-2 3.600-4.500 4-7.500z"/>${BASE}`,
  n: `<path d="M13.500 34.500c0-6 3.500-9.500 7.500-12.500 2-1.500 3-3 3-5-1.500 1.800-3.500 2.800-5.500 3l-2.200 3.200-3.800-1.700c-.6-2 .3-3.500 2-5.200l4.500-5.500.8-4.300 3.200 3.200c6.500 1 12.500 7.500 12.500 17.500 0 3-.3 5.300-1 7.800z"/>${BASE}`,
  q: `<circle cx="10.500" cy="13" r="2"/><circle cx="17.500" cy="10" r="2"/><circle cx="27.500" cy="10" r="2"/><circle cx="34.500" cy="13" r="2"/><circle cx="22.500" cy="8.500" r="2"/><path d="M11 15l4.500 10 2-13 5 12.500 5-12.500 2 13L34 15l-2.500 14.500h-18z"/><path d="M13.500 30h18l1 4.500h-20z"/>${BASE}`,
  k: `<path d="M21.300 4.500h2.400v3h3v2.400h-3V14h-2.400V9.900h-3V7.500h3z"/><path d="M22.500 14c3.500-3.500 11.500-2.200 11.500 5 0 5-4.500 7.500-5.500 11h-12C15.500 26.500 11 24 11 19c0-7.200 8-8.500 11.500-5z"/><path d="M15 30.500h15l1 4H14z"/>${BASE}`,
};

const pieceSvg = ({ type, color }) => (
  `<svg class="piece piece-${color}" viewBox="0 0 45 45" aria-hidden="true">${PIECES[type]}</svg>`
);

export class Board {
  constructor(element, { onMove }) {
    this.element = element;
    this.onMove = onMove;
    this.orientation = null;
    this.chess = null;
    this.selected = null;
    this.lastMove = null;
    this.interactive = false;
    this.drag = null;
    this.ignoreClick = false;

    element.addEventListener('click', (event) => this.handleClick(event));
    element.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    element.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    element.addEventListener('pointerup', (event) => this.handlePointerUp(event));
    element.addEventListener('pointercancel', () => this.cancelDrag());
  }

  buildSquares(orientation) {
    const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = orientation === 'white' ? [...FILES] : [...FILES].reverse();

    this.element.replaceChildren();
    this.squares = new Map();

    ranks.forEach((rank, row) => {
      files.forEach((file, column) => {
        const name = `${file}${rank}`;
        const square = document.createElement('button');

        square.type = 'button';
        square.dataset.square = name;
        square.className = `square square-${(FILES.indexOf(file) + rank) % 2 ? 'light' : 'dark'}`;
        if (column === 0) square.dataset.rank = rank;
        if (row === 7) square.dataset.file = file;

        this.element.append(square);
        this.squares.set(name, square);
      });
    });

    this.orientation = orientation;
  }

  // Actualiza el tablero. interactive indica si ahora se puede mover
  render({ chess, orientation, interactive, lastMove }) {
    if (orientation !== this.orientation) this.buildSquares(orientation);

    this.chess = chess;
    this.interactive = interactive;
    this.lastMove = lastMove;
    if (!interactive) this.selected = null;

    this.element.classList.toggle('is-interactive', interactive);
    this.paint();
  }

  ownPiece(square) {
    const piece = this.chess.get(square);
    return piece && piece.color === this.chess.turn() ? piece : null;
  }

  movesFrom(square) {
    return this.interactive ? this.chess.moves({ square, verbose: true }) : [];
  }

  paint() {
    const targets = new Map(this.selected ? this.movesFrom(this.selected).map((move) => [move.to, move]) : []);
    const inCheck = this.chess.inCheck();
    const turn = this.chess.turn();

    this.squares.forEach((square, name) => {
      const piece = this.chess.get(name);
      const target = targets.get(name);

      square.innerHTML = piece ? pieceSvg(piece) : '';
      square.classList.toggle('is-selected', name === this.selected);
      square.classList.toggle('is-last', name === this.lastMove?.from || name === this.lastMove?.to);
      square.classList.toggle('is-target', Boolean(target));
      square.classList.toggle('is-capture', Boolean(target?.captured));
      square.classList.toggle('is-check', Boolean(inCheck && piece?.type === 'k' && piece.color === turn));

      const pieceName = piece ? i18n.t(`chess.piece.${piece.color}${piece.type}`) : i18n.t('chess.piece.empty');
      square.setAttribute('aria-label', `${name}: ${pieceName}`);
    });
  }

  select(square) {
    this.selected = square;
    this.paint();
  }

  // Intenta mover la pieza seleccionada a target. Devuelve si había jugada.
  async tryMove(target) {
    const from = this.selected;
    const candidates = this.movesFrom(from).filter((move) => move.to === target);

    if (candidates.length === 0) return false;

    const promotion = candidates[0].promotion ? await this.choosePromotion(target) : undefined;

    this.selected = null;
    if (candidates[0].promotion && !promotion) {
      this.paint();
      return true;
    }

    this.onMove({ from, to: target, promotion });
    return true;
  }

  choosePromotion(square) {
    const color = this.chess.turn();
    const chooser = document.createElement('div');

    chooser.className = 'promotion';
    chooser.setAttribute('role', 'dialog');
    chooser.setAttribute('aria-label', i18n.t('chess.promotion'));

    return new Promise((resolve) => {
      const close = (type) => {
        chooser.remove();
        resolve(type);
      };

      PROMOTIONS.forEach((type) => {
        const option = document.createElement('button');

        option.type = 'button';
        option.innerHTML = pieceSvg({ type, color });
        option.setAttribute('aria-label', i18n.t(`chess.piece.${color}${type}`));
        option.addEventListener('click', () => close(type));
        chooser.append(option);
      });

      chooser.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close(null);
      });

      this.element.append(chooser);
      chooser.querySelector('button').focus();
      this.squares.get(square).scrollIntoView({ block: 'nearest' });
    });
  }

  handleClick(event) {
    if (this.ignoreClick) {
      this.ignoreClick = false;
      return;
    }

    const name = event.target.closest('[data-square]')?.dataset.square;
    if (!name || !this.interactive) return;

    if (name === this.selected) {
      this.select(null);
    } else if (this.ownPiece(name)) {
      this.select(name);
    } else if (this.selected) {
      this.tryMove(name).then((moved) => {
        if (!moved) this.select(null);
      });
    }
  }

  // ---------- Arrastrar ----------

  handlePointerDown(event) {
    const square = event.target.closest('[data-square]');

    if (!this.interactive || event.button !== 0 || !square || !this.ownPiece(square.dataset.square)) return;

    const wasSelected = this.selected === square.dataset.square;

    this.select(square.dataset.square);
    this.drag = {
      id: event.pointerId,
      wasSelected,
      startX: event.clientX,
      startY: event.clientY,
      piece: square.querySelector('.piece'),
      moved: false,
    };
    this.element.setPointerCapture(event.pointerId);
  }

  handlePointerMove(event) {
    const { drag } = this;
    if (!drag || event.pointerId !== drag.id) return;

    const x = event.clientX - drag.startX;
    const y = event.clientY - drag.startY;

    if (!drag.moved && Math.hypot(x, y) < DRAG_THRESHOLD_PX) return;

    drag.moved = true;
    drag.piece.classList.add('is-dragging');
    drag.piece.style.transform = `translate(${x}px, ${y}px)`;
  }

  handlePointerUp(event) {
    const { drag } = this;
    if (!drag || event.pointerId !== drag.id) return;

    this.drag = null;

    // El pulsar ya seleccionó la pieza: el clic que viene detrás no debe repetirlo
    this.ignoreClick = true;
    setTimeout(() => { this.ignoreClick = false; }, 0);

    if (!drag.moved) {
      if (drag.wasSelected) this.select(null);
      return;
    }

    drag.piece.style.transform = '';
    drag.piece.classList.remove('is-dragging');

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-square]');
    const name = target?.dataset.square;

    if (name && name !== this.selected) {
      this.tryMove(name).then((moved) => {
        if (!moved) this.select(null);
      });
    }
  }

  cancelDrag() {
    if (!this.drag) return;

    this.drag.piece.style.transform = '';
    this.drag.piece.classList.remove('is-dragging');
    this.drag = null;
  }
}
