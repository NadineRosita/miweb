-- Estado de la mascota de cada usuario (una por cuenta).
-- Las estadísticas van de 0 a 100; cuanto más alto, mejor está.

CREATE TABLE pets (
  user_id    BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Mi Pet' CHECK (char_length(name) BETWEEN 1 AND 24),
  food       SMALLINT NOT NULL DEFAULT 50 CHECK (food BETWEEN 0 AND 100),
  happiness  SMALLINT NOT NULL DEFAULT 50 CHECK (happiness BETWEEN 0 AND 100),
  energy     SMALLINT NOT NULL DEFAULT 50 CHECK (energy BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
