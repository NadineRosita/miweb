-- Partida completa de Mi Pet: una por cuenta.
--
-- El estado va en JSONB porque cambia a menudo y siempre se lee y escribe entero.
-- version indica el formato de data: las migraciones de formato están en
-- server/mi-pet/save.js, y al subir de versión la partida antigua se convierte.
-- backup guarda la última copia válida, por si data llegara a corromperse.
--
-- La tabla pets se conserva: auth.js crea ahí una fila al registrarse, y sus datos
-- (nombre y estadísticas) se heredan al adoptar en cuentas ya existentes.

CREATE TABLE pet_saves (
  user_id    BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  version    INTEGER NOT NULL,
  data       JSONB NOT NULL,
  backup     JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
