// Aplica en orden los archivos de db/migrations que aún no se hayan ejecutado.
//
// El servidor lo llama al arrancar, así que en Railway no hay que hacer nada.
// También se puede lanzar a mano con: npm run migrate
//
// Para cambiar la base de datos, añade un archivo nuevo (003_...sql).
// No edites uno ya aplicado: no se volvería a ejecutar.

const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Evita que dos arranques simultáneos apliquen la misma migración
const LOCK_ID = 727274;

async function applyMigration(client, name) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Falló la migración ${name}: ${error.message}`, { cause: error });
  }
}

async function runMigrations(pool) {
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));
    const pending = fs.readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql') && !applied.has(file))
      .sort();

    for (const name of pending) {
      await applyMigration(client, name);
      console.log(`Migración aplicada: ${name}`);
    }
  } finally {
    // Cerrar la conexión también libera el bloqueo
    client.release(true);
  }
}

module.exports = { runMigrations };

// Ejecución directa: npm run migrate
if (require.main === module) {
  const { pool } = require('../server/db');

  if (!pool) {
    console.error('Falta la variable DATABASE_URL.');
    process.exit(1);
  }

  runMigrations(pool)
    .then(() => console.log('Base de datos al día.'))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
