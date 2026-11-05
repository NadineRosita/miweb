-- Salas de ajedrez contra otra persona. No requieren cuenta: cada jugador tiene
-- un token secreto, del que solo se guarda el hash.

CREATE TABLE chess_rooms (
  code             TEXT PRIMARY KEY,
  white_token_hash TEXT,
  black_token_hash TEXT,
  -- Jugadas en orden: [{ "from": "e2", "to": "e4", "promotion": "q" }]
  moves            JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  result           TEXT CHECK (result IN ('white', 'black', 'draw')),
  reason           TEXT,
  draw_offer       TEXT CHECK (draw_offer IN ('white', 'black')),
  -- Reloj: sin valores, la partida no tiene límite de tiempo
  clock_initial_ms   INTEGER,
  clock_increment_ms INTEGER,
  white_ms           INTEGER,
  black_ms           INTEGER,
  last_move_at       TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chess_rooms_updated_at_idx ON chess_rooms (updated_at);
