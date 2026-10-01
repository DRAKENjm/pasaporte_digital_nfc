const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function activateSampleAutosellado() {
  const client = await pool.connect();
  try {
    // Tomar al menos una sucursal con coordenadas y habilitar permite_autosellado para pruebas
    const res = await client.query(`
      SELECT s.id_sucursal, s.nombre, e.nombre_comercial, s.latitud, s.longitud, s.permite_autosellado
      FROM sucursales s
      JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
      LIMIT 5;
    `);
    console.log('Sucursales existentes:', res.rows);

    // Habilitar la primera o una sucursal para auto-sellado turístico de prueba
    if (res.rows.length > 0) {
      const targetId = res.rows[0].id_sucursal;
      await client.query(`
        UPDATE sucursales 
        SET permite_autosellado = 1, radio_tolerancia_metros = 200, requiere_foto = 0 
        WHERE id_sucursal = $1
      `, [targetId]);
      console.log(`Sucursal id ${targetId} (${res.rows[0].nombre}) actualizada con permite_autosellado = 1`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
activateSampleAutosellado().catch(console.error);
