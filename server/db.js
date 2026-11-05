// Conexión a PostgreSQL. Sin DATABASE_URL, pool es null y la web funciona sin Mi Pet.

const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Sin este listener, un corte de una conexión inactiva tumbaría el proceso
pool?.on('error', (error) => console.error('Error en la conexión a PostgreSQL:', error.message));

module.exports = { pool };
