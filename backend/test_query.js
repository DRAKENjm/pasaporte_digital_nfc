const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query(`
      SELECT 
        TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(d.fecha, 'Dy') AS dia_nombre,
        COUNT(u.id)::int AS nuevos_clientes
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(fecha)
      LEFT JOIN usuarios u ON DATE(u.created_at) = DATE(d.fecha) 
      AND u.rol_id = (SELECT id FROM roles WHERE nombre = 'CLIENTE' LIMIT 1)
      GROUP BY d.fecha
      ORDER BY d.fecha ASC
    `);
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}
test();
