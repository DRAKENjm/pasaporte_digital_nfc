const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  try {
    await pool.query(`
      ALTER TABLE establecimientos
      ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'LOCAL';
    `);
    console.log('Column tipo added or verified on establecimientos');
    
    // Set Catedral Chiclayo to LUGAR_TURISTICO as example
    await pool.query(`
      UPDATE establecimientos
      SET tipo = 'LUGAR_TURISTICO'
      WHERE id_establecimiento = '2';
    `);
    console.log('Updated sample to LUGAR_TURISTICO');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
