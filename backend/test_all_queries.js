const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  return pool.query(text, params);
}

async function testAll() {
  try {
    const results = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM usuarios`),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END)::int AS activos,
                COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END)::int AS inactivos
         FROM establecimientos`,
      ),
      query(`SELECT COUNT(*)::int AS total FROM historial_visitas_sellos`),
      query(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM(puntos_ganados), 0)::int AS puntos_hoy 
         FROM historial_visitas_sellos WHERE fecha_hora >= CURRENT_DATE`,
      ),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(CASE WHEN estado_entrega = 'PENDIENTE_RECOJO' THEN 1 END)::int AS pendientes
         FROM historial_canjes`,
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM publicaciones WHERE estado_moderacion = 'APROBADA'`,
      ),
      query(`SELECT COUNT(*)::int AS total FROM tarjetas_nfc`),
      query(
        `SELECT COUNT(*)::int AS total FROM tarjetas_nfc WHERE estado = 'EN_STOCK'`,
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM libro_reclamaciones WHERE estado = 'PENDIENTE'`,
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM denuncias_moderacion WHERE estado_revision = 'PENDIENTE'`,
      ),
      query(
        `SELECT h.id, h.puntos_ganados, h.metodo_validacion, h.fecha_hora,
                u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
                u.avatar_url AS usuario_avatar,
                e.nombre AS establecimiento_nombre
         FROM historial_visitas_sellos h
         JOIN usuarios u ON u.id = h.usuario_id
         JOIN establecimientos e ON e.id = h.establecimiento_id
         ORDER BY h.fecha_hora DESC
         LIMIT 8`,
      ),
      query(
        `SELECT 
           TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
           TO_CHAR(d.fecha, 'Dy') AS dia_nombre,
           COUNT(u.id)::int AS nuevos_clientes
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(fecha)
         LEFT JOIN usuarios u ON DATE(u.created_at) = DATE(d.fecha) 
         AND u.rol_id = (SELECT id FROM roles WHERE nombre = 'CLIENTE' LIMIT 1)
         GROUP BY d.fecha
         ORDER BY d.fecha ASC`,
      ),
      query(
        `SELECT r.nombre AS rol, COUNT(u.id)::int AS total
         FROM roles r
         LEFT JOIN usuarios u ON u.rol_id = r.id
         GROUP BY r.nombre`,
      ),
      query(
        `SELECT n.nombre_rango AS nivel, n.color_hex, COUNT(u.id)::int AS total
         FROM niveles_pasaporte n
         LEFT JOIN usuarios u ON u.nivel_id = n.id
         GROUP BY n.id, n.nombre_rango, n.color_hex, n.sellos_requeridos
         ORDER BY n.sellos_requeridos ASC`,
      ),
      query(
        `SELECT 
           COALESCE(metodo_validacion, 'NFC') AS metodo,
           COUNT(*)::int AS total
         FROM historial_visitas_sellos
         GROUP BY metodo_validacion`,
      ),
      query(
        `SELECT 
           e.id, 
           e.nombre, 
           e.imagen_url,
           COUNT(h.id)::int AS total_sellos,
           COALESCE(SUM(h.puntos_ganados), 0)::int AS total_puntos
         FROM establecimientos e
         JOIN historial_visitas_sellos h ON h.establecimiento_id = e.id
         GROUP BY e.id, e.nombre, e.imagen_url
         ORDER BY total_sellos DESC
         LIMIT 5`,
      ),
      query(
        `SELECT 
           COUNT(*)::int AS total,
           COUNT(CASE WHEN estado = 'EN_STOCK' THEN 1 END)::int AS en_stock,
           COUNT(CASE WHEN estado = 'ASIGNADA' THEN 1 END)::int AS asignadas,
           COUNT(CASE WHEN estado = 'EXTRAVIADA' THEN 1 END)::int AS extraviadas,
           COUNT(CASE WHEN estado = 'BLOQUEADA' THEN 1 END)::int AS bloqueadas
         FROM tarjetas_nfc`,
      ),
    ]);
    console.log("All 17 queries succeeded.");
  } catch (err) {
    console.error("Error in query:", err.message);
  } finally {
    pool.end();
  }
}
testAll();
