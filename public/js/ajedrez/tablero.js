// Tablero: pinta la posición y convierte clics y arrastres en jugadas.
// No sabe de reglas ni de rivales: recibe una partida de chess.js y avisa con onMove.

const FILES = 'abcdefgh';
const DRAG_THRESHOLD_PX = 6;
const MOVE_MS = 240;
const MOVE_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
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
    this.moveCount = null;
    this.draggedMove = false;
    this.fallen = null;
    this.preview = false;
    this.free = false; // Partida acabada: las piezas se pueden sacar del tablero
    this.floating = new Map(); // casilla -> pieza flotante

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
  // preview indica que se está mirando una posición anterior
  render({ chess, orientation, interactive, lastMove, preview = false, free = false }) {
    if (orientation !== this.orientation) this.buildSquares(orientation);

    // Solo se anima una jugada nueva: ni al recargar ni al recuperar varias de golpe
    const moveCount = chess.history().length;
    const isNewMove = this.moveCount !== null && moveCount === this.moveCount + 1;

    this.moveCount = moveCount;
    this.chess = chess;
    this.interactive = interactive;
    this.lastMove = lastMove;
    this.preview = preview;
    this.free = free;
    if (!interactive) this.selected = null;
    if (!free) this.clearFloating();
    this.floating.forEach((floater) => { floater.hidden = preview; });

    this.element.classList.toggle('is-interactive', interactive);
    this.element.classList.toggle('is-preview', preview);
    this.element.classList.toggle('is-free', free && !preview);
    this.paint();

    if (isNewMove && lastMove) this.animateMove(lastMove);
    this.draggedMove = false;
  }

  // Olvida la partida anterior, para que la siguiente empiece sin animar nada
  reset() {
    this.moveCount = null;
    this.fallen = null;
    this.free = false;
    this.clearFloating();
  }

  // ---------- Piezas flotantes (solo con la partida acabada) ----------

  clearFloating() {
    this.floating.forEach((floater) => floater.remove());
    this.floating.clear();
  }

  // Saca la pieza de la casilla y la deja en la página, donde se pueda mover libremente
  float(squareName, event) {
    const square = this.squares.get(squareName);
    const piece = this.chess.get(squareName);
    const rect = square.getBoundingClientRect();
    const floater = document.createElement('div');

    floater.className = 'floating-piece';
    floater.innerHTML = pieceSvg(piece);
    floater.style.width = `${rect.width}px`;
    floater.style.height = `${rect.height}px`;
    floater.style.left = `${rect.left + window.scrollX}px`;
    floater.style.top = `${rect.top + window.scrollY}px`;
    document.body.append(floater);

    floater.addEventListener('pointerdown', (down) => {
      if (down.button !== 0) return;
      down.preventDefault();
      document.body.append(floater); // Queda por encima de las demás
      this.dragFloater(floater, down);
    });

    this.floating.set(squareName, floater);
    this.paint();
    this.dragFloater(floater, event);
  }

  // Arrastra una pieza ya flotante; se queda donde se suelte
  dragFloater(floater, startEvent) {
    const left = parseFloat(floater.style.left);
    const top = parseFloat(floater.style.top);
    const { clientX: startX, clientY: startY, pointerId } = startEvent;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    floater.classList.add('is-dragging');
    floater.setPointerCapture(pointerId);

    const move = (event) => {
      if (event.pointerId !== pointerId) return;

      const maxX = document.documentElement.scrollWidth - floater.offsetWidth;
      const maxY = document.documentElement.scrollHeight - floater.offsetHeight;
      const x = left + (event.clientX - startX) + (window.scrollX - scrollX);
      const y = top + (event.clientY - startY) + (window.scrollY - scrollY);

      floater.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
      floater.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    };

    const end = (event) => {
      if (event.pointerId !== pointerId) return;

      floater.classList.remove('is-dragging');
      floater.removeEventListener('pointermove', move);
      floater.removeEventListener('pointerup', end);
      floater.removeEventListener('pointercancel', end);
    };

    floater.addEventListener('pointermove', move);
    floater.addEventListener('pointerup', end);
    floater.addEventListener('pointercancel', end);
  }

  // Tumba el rey de ese color y lo deja así
  setFallen(color) {
    this.fallen = color;
    this.paint();
  }

  kingSquare(color) {
    const code = color === 'white' ? 'w' : 'b';

    for (const [name, square] of this.squares) {
      const piece = this.chess.get(name);
      if (piece?.type === 'k' && piece.color === code) return square;
    }
    return null;
  }

  kingPiece(color) {
    return this.kingSquare(color)?.querySelector('.piece');
  }

  animateMove(move) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Lo arrastrado ya está en su sitio
    if (!this.draggedMove) this.slide(move.from, move.to);

    const rank = move.to[1];
    if (move.flags.includes('k')) this.slide(`h${rank}`, `f${rank}`);
    if (move.flags.includes('q')) this.slide(`a${rank}`, `d${rank}`);

    if (move.captured) {
      const square = move.flags.includes('e') ? `${move.to[0]}${move.from[1]}` : move.to;
      this.fadeCaptured(square, { type: move.captured, color: move.color === 'w' ? 'b' : 'w' });
    }
  }

  // Desliza la pieza que ya está en destino desde la casilla de origen
  slide(from, to) {
    const piece = this.squares.get(to).querySelector('.piece');
    const start = this.squares.get(from).getBoundingClientRect();
    const end = this.squares.get(to).getBoundingClientRect();
    const animation = piece.animate([
      { transform: `translate(${start.left - end.left}px, ${start.top - end.top}px)` },
      { transform: 'none' },
    ], { duration: MOVE_MS, easing: MOVE_EASING });

    piece.classList.add('is-moving');
    animation.onfinish = () => piece.classList.remove('is-moving');
  }

  fadeCaptured(square, piece) {
    const element = this.squares.get(square);
    const ghost = document.createElement('span');

    ghost.className = 'piece-ghost';
    ghost.innerHTML = pieceSvg(piece);
    element.prepend(ghost);

    ghost.animate([
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'scale(0.6)' },
    ], { duration: MOVE_MS, easing: 'ease-in' }).onfinish = () => ghost.remove();
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
      const piece = this.floating.has(name) && !this.preview ? null : this.chess.get(name);
      const target = targets.get(name);

      square.innerHTML = piece ? pieceSvg(piece) : '';
      square.classList.toggle('is-selected', name === this.selected);
      square.classList.toggle('is-last', name === this.lastMove?.from || name === this.lastMove?.to);
      square.classList.toggle('is-target', Boolean(target));
      square.classList.toggle('is-capture', Boolean(target?.captured));
      square.classList.toggle('is-check', Boolean(inCheck && piece?.type === 'k' && piece.color === turn));
      square.classList.toggle('is-fallen', Boolean(
        !this.preview && piece?.type === 'k' && this.fallen && piece.color === this.fallen[0],
      ));

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

    if (this.free && !this.preview) {
      const name = square?.dataset.square;

      if (event.button === 0 && name && !this.floating.has(name) && this.chess.get(name)) {
        event.preventDefault();
        this.ignoreClick = true;
        setTimeout(() => { this.ignoreClick = false; }, 0);
        this.float(name, event);
      }
      return;
    }

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
      this.draggedMove = true;
      this.tryMove(name).then((moved) => {
        if (!moved) {
          this.draggedMove = false;
          this.select(null);
        }
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
