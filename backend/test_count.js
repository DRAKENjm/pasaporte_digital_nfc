const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios');
    console.log("Total Usuarios en DB:", res.rows[0].total);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
