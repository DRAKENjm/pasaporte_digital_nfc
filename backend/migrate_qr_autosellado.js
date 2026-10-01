const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to DB');
    // Check/add qr_respaldo to tarjetas_nfc
    await client.query(`
      ALTER TABLE tarjetas_nfc 
      ADD COLUMN IF NOT EXISTS qr_respaldo VARCHAR(255);
    `);
    console.log('Checked qr_respaldo on tarjetas_nfc');

    // Populate qr_respaldo with codigo_interno if null
    await client.query(`
      UPDATE tarjetas_nfc 
      SET qr_respaldo = codigo_interno 
      WHERE qr_respaldo IS NULL AND codigo_interno IS NOT NULL;
    `);

    // Add unique index on qr_respaldo if not exists
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tarjetas_qr_respaldo ON tarjetas_nfc(qr_respaldo) WHERE qr_respaldo IS NOT NULL;
    `);

    // Check/add autosellado columns to sucursales
    await client.query(`
      ALTER TABLE sucursales
      ADD COLUMN IF NOT EXISTS permite_autosellado SMALLINT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS radio_tolerancia_metros INT NOT NULL DEFAULT 150,
      ADD COLUMN IF NOT EXISTS requiere_foto SMALLINT NOT NULL DEFAULT 0;
    `);
    console.log('Checked autosellado columns on sucursales');

    // Check/add columns to visitas for metodo_registro and foto
    await client.query(`
      ALTER TABLE visitas
      ADD COLUMN IF NOT EXISTS metodo_validacion VARCHAR(20) DEFAULT 'NFC',
      ADD COLUMN IF NOT EXISTS foto_evidencia VARCHAR(255),
      ADD COLUMN IF NOT EXISTS latitud_registro NUMERIC(10,7),
      ADD COLUMN IF NOT EXISTS longitud_registro NUMERIC(10,7);
    `);
    console.log('Checked visitas columns');

    // Make id_tarjeta and id_usuario_validador nullable in visitas if needed for direct autosellado
    await client.query(`
      ALTER TABLE visitas
      ALTER COLUMN id_tarjeta DROP NOT NULL,
      ALTER COLUMN id_usuario_validador DROP NOT NULL;
    `);
    console.log('Visitas foreign keys adapted for autosellado without validator staff');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
