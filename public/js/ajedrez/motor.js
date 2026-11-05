// Motor de ajedrez propio, sin dependencias.
//
// chess.js se usa para las reglas de la partida, pero es demasiado lento para
// analizar: aquí hay una representación compacta del tablero (0x88) que explora
// cientos de miles de posiciones por segundo.
//
// Busca con negamax, poda alfa-beta y profundización iterativa. La evaluación
// suma el valor de las piezas y unas tablas con las mejores casillas para cada una.

// depth: jugadas de profundidad. noise: error aleatorio en centipeones.
// timeMs: tiempo máximo para pensar. quiescence: seguir las capturas al llegar al final.
export const LEVELS = {
  easy: { depth: 1, noise: 150, quiescence: false },
  normal: { depth: 3, noise: 15, quiescence: true, timeMs: 700 },
  hard: { depth: 64, noise: 0, quiescence: true, timeMs: 1500 },
};

const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const WHITE_KINGSIDE = 1;
const WHITE_QUEENSIDE = 2;
const BLACK_KINGSIDE = 4;
const BLACK_QUEENSIDE = 8;
const ALL_CASTLING = 15;

// Tablero 0x88: casilla = 16 * fila + columna, con la fila 0 en la octava.
// Las casillas válidas cumplen (casilla & 0x88) === 0.
const A8 = 0;
const E8 = 4;
const H8 = 7;
const A1 = 112;
const E1 = 116;
const H1 = 119;

const KNIGHT_STEPS = [-33, -31, -18, -14, 14, 18, 31, 33];
const BISHOP_STEPS = [-17, -15, 15, 17];
const ROOK_STEPS = [-16, -1, 1, 16];
const KING_STEPS = [...BISHOP_STEPS, ...ROOK_STEPS];

const FLAG_NONE = 0;
const FLAG_DOUBLE_PUSH = 1;
const FLAG_EN_PASSANT = 2;
const FLAG_CASTLE = 3;

const MATE = 100000;
const MATE_THRESHOLD = MATE - 1000;
const MAX_PLY = 128;
const TIME_CHECK_MASK = 2047; // Mira el reloj cada 2048 posiciones

const PIECE_LETTERS = ' pnbrqk';
const PIECE_VALUES = [0, 100, 320, 330, 500, 900, 0];

// Tablas desde el punto de vista de las blancas: la primera fila es la octava
const POSITION_TABLES = [
  null,
  [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
];

// Puntuación desde las blancas de cada pieza en cada casilla, para no recalcularla.
// Se indexa con PIECE_SQUARE[pieza + 6][casilla]; las piezas negras son negativas.
const PIECE_SQUARE = Array.from({ length: 13 }, (_, index) => {
  const piece = index - 6;
  const table = new Int32Array(128);
  const type = Math.abs(piece);

  if (type === 0) return table;

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const tableIndex = (piece > 0 ? rank : 7 - rank) * 8 + file;
      const value = PIECE_VALUES[type] + POSITION_TABLES[type][tableIndex];

      table[16 * rank + file] = piece > 0 ? value : -value;
    }
  }

  return table;
});

// Qué derechos de enroque sobreviven a que algo salga de una casilla o llegue a ella
const CASTLING_MASK = new Int8Array(128).fill(ALL_CASTLING);
CASTLING_MASK[A8] = ALL_CASTLING & ~BLACK_QUEENSIDE;
CASTLING_MASK[E8] = ALL_CASTLING & ~(BLACK_KINGSIDE | BLACK_QUEENSIDE);
CASTLING_MASK[H8] = ALL_CASTLING & ~BLACK_KINGSIDE;
CASTLING_MASK[A1] = ALL_CASTLING & ~WHITE_QUEENSIDE;
CASTLING_MASK[E1] = ALL_CASTLING & ~(WHITE_KINGSIDE | WHITE_QUEENSIDE);
CASTLING_MASK[H1] = ALL_CASTLING & ~WHITE_KINGSIDE;

// Una jugada es un entero: origen (7 bits), destino (7), promoción (3), marca (2)
const encodeMove = (from, to, promotion = 0, flag = FLAG_NONE) => from | (to << 7) | (promotion << 14) | (flag << 17);
const moveFrom = (move) => move & 127;
const moveTo = (move) => (move >> 7) & 127;
const movePromotion = (move) => (move >> 14) & 7;
const moveFlag = (move) => (move >> 17) & 3;

const squareName = (square) => `${'abcdefgh'[square & 7]}${8 - (square >> 4)}`;

function parseSquare(name) {
  return 16 * (8 - Number(name[1])) + (name.charCodeAt(0) - 97);
}

class Position {
  constructor(fen) {
    const [placement, side, castling, enPassant] = fen.split(' ');

    this.board = new Int8Array(128);
    this.side = side === 'w' ? 1 : -1;
    this.castling = 0;
    this.enPassant = enPassant === '-' ? -1 : parseSquare(enPassant);
    this.kings = [0, 0]; // Blancas, negras
    this.score = 0; // Desde el punto de vista de las blancas

    // Pila para deshacer jugadas
    this.ply = 0;
    this.undoMove = new Int32Array(MAX_PLY * 2);
    this.undoCaptured = new Int8Array(MAX_PLY * 2);
    this.undoCastling = new Int8Array(MAX_PLY * 2);
    this.undoEnPassant = new Int16Array(MAX_PLY * 2);
    this.undoScore = new Int32Array(MAX_PLY * 2);

    placement.split('/').forEach((row, rank) => {
      let file = 0;

      [...row].forEach((character) => {
        const digit = Number(character);

        if (digit) {
          file += digit;
          return;
        }

        const type = PIECE_LETTERS.indexOf(character.toLowerCase());
        const piece = character === character.toLowerCase() ? -type : type;
        const square = 16 * rank + file;

        this.board[square] = piece;
        this.score += PIECE_SQUARE[piece + 6][square];
        if (type === KING) this.kings[piece > 0 ? 0 : 1] = square;
        file += 1;
      });
    });

    if (castling.includes('K')) this.castling |= WHITE_KINGSIDE;
    if (castling.includes('Q')) this.castling |= WHITE_QUEENSIDE;
    if (castling.includes('k')) this.castling |= BLACK_KINGSIDE;
    if (castling.includes('q')) this.castling |= BLACK_QUEENSIDE;
  }

  // ¿Ataca el bando by a esta casilla?
  isAttacked(square, by) {
    const { board } = this;

    const pawnFrom = by > 0 ? [square + 15, square + 17] : [square - 15, square - 17];
    for (const from of pawnFrom) {
      if (!(from & 0x88) && board[from] === by * PAWN) return true;
    }

    for (const step of KNIGHT_STEPS) {
      const from = square + step;
      if (!(from & 0x88) && board[from] === by * KNIGHT) return true;
    }

    for (const step of KING_STEPS) {
      const from = square + step;
      if (!(from & 0x88) && board[from] === by * KING) return true;
    }

    for (const step of BISHOP_STEPS) {
      for (let from = square + step; !(from & 0x88); from += step) {
        const piece = board[from];
        if (piece !== 0) {
          if (piece === by * BISHOP || piece === by * QUEEN) return true;
          break;
        }
      }
    }

    for (const step of ROOK_STEPS) {
      for (let from = square + step; !(from & 0x88); from += step) {
        const piece = board[from];
        if (piece !== 0) {
          if (piece === by * ROOK || piece === by * QUEEN) return true;
          break;
        }
      }
    }

    return false;
  }

  inCheck(side = this.side) {
    return this.isAttacked(this.kings[side > 0 ? 0 : 1], -side);
  }

  addPawnMove(moves, from, to, promotionRank) {
    if ((to >> 4) === promotionRank) {
      moves.push(encodeMove(from, to, QUEEN), encodeMove(from, to, KNIGHT), encodeMove(from, to, ROOK), encodeMove(from, to, BISHOP));
    } else {
      moves.push(encodeMove(from, to));
    }
  }

  generatePawnMoves(moves, from, capturesOnly) {
    const { board, side, enPassant } = this;
    const forward = side > 0 ? -16 : 16;
    const startRank = side > 0 ? 6 : 1;
    const promotionRank = side > 0 ? 0 : 7;
    const ahead = from + forward;

    // Coronar sin capturar también cambia mucho la posición: cuenta como táctica
    if (board[ahead] === 0 && (!capturesOnly || (ahead >> 4) === promotionRank)) {
      this.addPawnMove(moves, from, ahead, promotionRank);

      const twoAhead = ahead + forward;
      if ((from >> 4) === startRank && board[twoAhead] === 0) {
        moves.push(encodeMove(from, twoAhead, 0, FLAG_DOUBLE_PUSH));
      }
    }

    for (const to of [ahead - 1, ahead + 1]) {
      if (to & 0x88) continue;

      if (board[to] * side < 0) this.addPawnMove(moves, from, to, promotionRank);
      else if (to === enPassant) moves.push(encodeMove(from, to, 0, FLAG_EN_PASSANT));
    }
  }

  generateStepMoves(moves, from, steps, capturesOnly) {
    const { board, side } = this;

    for (const step of steps) {
      const to = from + step;
      if (to & 0x88) continue;

      const target = board[to];
      if (target * side < 0 || (target === 0 && !capturesOnly)) moves.push(encodeMove(from, to));
    }
  }

  generateSlideMoves(moves, from, steps, capturesOnly) {
    const { board, side } = this;

    for (const step of steps) {
      for (let to = from + step; !(to & 0x88); to += step) {
        const target = board[to];

        if (target === 0) {
          if (!capturesOnly) moves.push(encodeMove(from, to));
        } else {
          if (target * side < 0) moves.push(encodeMove(from, to));
          break;
        }
      }
    }
  }

  generateCastling(moves) {
    const { board, side, castling } = this;
    const home = side > 0 ? E1 : E8;
    const kingside = side > 0 ? WHITE_KINGSIDE : BLACK_KINGSIDE;
    const queenside = side > 0 ? WHITE_QUEENSIDE : BLACK_QUEENSIDE;

    if (!(castling & (kingside | queenside)) || this.isAttacked(home, -side)) return;

    if ((castling & kingside) && board[home + 1] === 0 && board[home + 2] === 0
      && !this.isAttacked(home + 1, -side) && !this.isAttacked(home + 2, -side)) {
      moves.push(encodeMove(home, home + 2, 0, FLAG_CASTLE));
    }

    if ((castling & queenside) && board[home - 1] === 0 && board[home - 2] === 0 && board[home - 3] === 0
      && !this.isAttacked(home - 1, -side) && !this.isAttacked(home - 2, -side)) {
      moves.push(encodeMove(home, home - 2, 0, FLAG_CASTLE));
    }
  }

  // Jugadas pseudolegales: make() descarta las que dejan al rey en jaque
  generateMoves(capturesOnly = false) {
    const { board, side } = this;
    const moves = [];

    for (let square = 0; square < 128; square += 1) {
      if (square & 0x88) {
        square += 7;
        continue;
      }

      const piece = board[square] * side;
      if (piece <= 0) continue;

      if (piece === PAWN) this.generatePawnMoves(moves, square, capturesOnly);
      else if (piece === KNIGHT) this.generateStepMoves(moves, square, KNIGHT_STEPS, capturesOnly);
      else if (piece === BISHOP) this.generateSlideMoves(moves, square, BISHOP_STEPS, capturesOnly);
      else if (piece === ROOK) this.generateSlideMoves(moves, square, ROOK_STEPS, capturesOnly);
      else if (piece === QUEEN) this.generateSlideMoves(moves, square, KING_STEPS, capturesOnly);
      else this.generateStepMoves(moves, square, KING_STEPS, capturesOnly);
    }

    if (!capturesOnly) this.generateCastling(moves);
    return moves;
  }

  movePiece(from, to, piece) {
    const table = PIECE_SQUARE[piece + 6];

    this.score += table[to] - table[from];
    this.board[from] = 0;
    this.board[to] = piece;
  }

  capturePiece(square) {
    const piece = this.board[square];

    if (piece !== 0) {
      this.score -= PIECE_SQUARE[piece + 6][square];
      this.board[square] = 0;
    }
    return piece;
  }

  // Hace la jugada. Si deja al propio rey en jaque, la deshace y devuelve false.
  make(move) {
    const { board, side, ply } = this;
    const from = moveFrom(move);
    const to = moveTo(move);
    const flag = moveFlag(move);
    const promotion = movePromotion(move);
    const piece = board[from];

    this.undoMove[ply] = move;
    this.undoCastling[ply] = this.castling;
    this.undoEnPassant[ply] = this.enPassant;
    this.undoScore[ply] = this.score;
    this.undoCaptured[ply] = flag === FLAG_EN_PASSANT
      ? this.capturePiece(to + (side > 0 ? 16 : -16))
      : this.capturePiece(to);

    this.movePiece(from, to, piece);

    if (promotion) {
      const promoted = side * promotion;

      this.score += PIECE_SQUARE[promoted + 6][to] - PIECE_SQUARE[piece + 6][to];
      board[to] = promoted;
    }

    if (Math.abs(piece) === KING) this.kings[side > 0 ? 0 : 1] = to;

    if (flag === FLAG_CASTLE) {
      const isKingside = to > from;
      const rookFrom = isKingside ? to + 1 : to - 2;
      const rookTo = isKingside ? to - 1 : to + 1;

      this.movePiece(rookFrom, rookTo, side * ROOK);
    }

    this.castling &= CASTLING_MASK[from] & CASTLING_MASK[to];
    this.enPassant = flag === FLAG_DOUBLE_PUSH ? (from + to) >> 1 : -1;
    this.side = -side;
    this.ply = ply + 1;

    if (this.inCheck(side)) {
      this.unmake();
      return false;
    }

    return true;
  }

  unmake() {
    this.ply -= 1;

    const { board, ply } = this;
    const move = this.undoMove[ply];
    const from = moveFrom(move);
    const to = moveTo(move);
    const flag = moveFlag(move);
    const side = -this.side;
    const piece = movePromotion(move) ? side * PAWN : board[to];

    this.side = side;
    this.castling = this.undoCastling[ply];
    this.enPassant = this.undoEnPassant[ply];
    this.score = this.undoScore[ply];

    board[from] = piece;
    board[to] = 0;

    if (Math.abs(piece) === KING) this.kings[side > 0 ? 0 : 1] = from;

    const captured = this.undoCaptured[ply];
    if (flag === FLAG_EN_PASSANT) board[to + (side > 0 ? 16 : -16)] = captured;
    else board[to] = captured;

    if (flag === FLAG_CASTLE) {
      const isKingside = to > from;
      const rookFrom = isKingside ? to + 1 : to - 2;
      const rookTo = isKingside ? to - 1 : to + 1;

      board[rookTo] = 0;
      board[rookFrom] = side * ROOK;
    }
  }

  legalMoves() {
    return this.generateMoves().filter((move) => {
      if (!this.make(move)) return false;
      this.unmake();
      return true;
    });
  }
}

class OutOfTime extends Error {}

class Search {
  constructor(position, settings, deadline) {
    this.position = position;
    this.settings = settings;
    this.deadline = deadline;
    this.nodes = 0;
    this.killers = Array.from({ length: MAX_PLY * 2 }, () => [0, 0]);
  }

  tick() {
    this.nodes += 1;
    if ((this.nodes & TIME_CHECK_MASK) === 0 && Date.now() > this.deadline) throw new OutOfTime();
  }

  // Primero las capturas de pieza valiosa con pieza barata: la poda corta mucho más
  moveScore(move, ply) {
    const { board } = this.position;
    const victim = Math.abs(board[moveTo(move)]);
    const attacker = Math.abs(board[moveFrom(move)]);
    const promotion = movePromotion(move);

    if (victim || promotion) return 10000 + 10 * PIECE_VALUES[victim] - PIECE_VALUES[attacker] + PIECE_VALUES[promotion];
    if (moveFlag(move) === FLAG_EN_PASSANT) return 10090;

    const [first, second] = this.killers[ply];
    if (move === first) return 9000;
    if (move === second) return 8000;
    return 0;
  }

  sortMoves(moves, ply) {
    const scored = moves.map((move) => [this.moveScore(move, ply), move]);

    scored.sort((a, b) => b[0] - a[0]);
    return scored.map(([, move]) => move);
  }

  // Sigue las capturas al llegar al final, para no parar a mitad de un intercambio
  quiescence(alpha, beta, ply) {
    this.tick();

    const { position } = this;
    const standPat = position.side * position.score;

    if (standPat >= beta || ply >= MAX_PLY - 1) return standPat;

    let best = Math.max(alpha, standPat);

    for (const move of this.sortMoves(position.generateMoves(true), ply)) {
      if (!position.make(move)) continue;

      const score = -this.quiescence(-beta, -best, ply + 1);
      position.unmake();

      if (score >= beta) return score;
      best = Math.max(best, score);
    }

    return best;
  }

  negamax(depth, alpha, beta, ply) {
    this.tick();

    const { position, settings } = this;
    const inCheck = position.inCheck();
    const remaining = inCheck ? depth + 1 : depth; // Los jaques no consumen profundidad

    if (remaining <= 0 || ply >= MAX_PLY - 1) {
      return settings.quiescence ? this.quiescence(alpha, beta, ply) : position.side * position.score;
    }

    let best = -Infinity;
    let bound = alpha;
    let hasLegalMove = false;

    for (const move of this.sortMoves(position.generateMoves(), ply)) {
      if (!position.make(move)) continue;
      hasLegalMove = true;

      const score = -this.negamax(remaining - 1, -beta, -bound, ply + 1);
      position.unmake();

      best = Math.max(best, score);
      bound = Math.max(bound, score);

      if (bound >= beta) {
        if (!this.position.board[moveTo(move)] && !movePromotion(move)) {
          const killers = this.killers[ply];
          if (killers[0] !== move) [killers[0], killers[1]] = [move, killers[0]];
        }
        break;
      }
    }

    if (!hasLegalMove) return inCheck ? ply - MATE : 0;
    return best;
  }

  // Busca a una profundidad y devuelve la mejor jugada. moves viene ordenado.
  searchRoot(moves, depth) {
    const { position, settings } = this;
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      position.make(move);

      // Con ruido hay que conocer el valor exacto de todas: sin poda en la raíz
      const beta = settings.noise ? Infinity : -bestScore;
      let score;

      try {
        score = -this.negamax(depth - 1, -Infinity, beta, 1);
      } finally {
        position.unmake();
      }

      if (settings.noise) score += (Math.random() - 0.5) * 2 * settings.noise;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return { move: bestMove, score: bestScore };
  }
}

function unwind(position, ply) {
  while (position.ply > ply) position.unmake();
}

// Devuelve la jugada elegida como { from, to, promotion }
export function chooseMove(fen, level) {
  const settings = LEVELS[level];
  const position = new Position(fen);
  const deadline = settings.timeMs ? Date.now() + settings.timeMs : Infinity;
  const search = new Search(position, settings, deadline);

  let moves = search.sortMoves(position.legalMoves(), 0);
  let best = moves[0];
  let reachedDepth = 0;

  // Si el tiempo se acaba a mitad de una vuelta, vale la última vuelta completa
  try {
    for (let depth = 1; depth <= settings.depth; depth += 1) {
      const result = search.searchRoot(moves, depth);

      best = result.move;
      reachedDepth = depth;
      moves = [best, ...moves.filter((move) => move !== best)];

      if (Math.abs(result.score) > MATE_THRESHOLD) break;
    }
  } catch (error) {
    if (!(error instanceof OutOfTime)) throw error;
    unwind(position, 0);
  }

  const promotion = movePromotion(best);

  return {
    from: squareName(moveFrom(best)),
    to: squareName(moveTo(best)),
    promotion: promotion ? PIECE_LETTERS[promotion] : undefined,
    depth: reachedDepth,
    nodes: search.nodes,
  };
}

// Cuenta las posiciones alcanzables: comparándolo con las cifras publicadas
// se comprueba que el generador de jugadas es correcto
export function perft(fen, depth) {
  const position = new Position(fen);

  const count = (remaining) => {
    if (remaining === 0) return 1;

    let total = 0;
    for (const move of position.generateMoves()) {
      if (!position.make(move)) continue;
      total += count(remaining - 1);
      position.unmake();
    }
    return total;
  };

  return count(depth);
}
