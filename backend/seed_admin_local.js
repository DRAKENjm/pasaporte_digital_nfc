const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/pasaporte_digital'
});

async function seedAdminAndLocal() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // 1. Obtener roles
  const roles = await pool.query('SELECT * FROM roles');
  const roleMap = {};
  roles.rows.forEach(r => roleMap[r.nombre] = r.id_rol);
  console.log('Roles disponibles:', roleMap);

  // 2. Administrador General
  const adminRes = await pool.query(
    `INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, estado)
     VALUES ($1, 'admin@pasaportedigital.pe', $2, 'Administrador', 'General', 1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, id_rol = EXCLUDED.id_rol
     RETURNING id_usuario, email`,
    [roleMap['ADMIN_GENERAL'], hash]
  );
  console.log('✅ Admin General listo:', adminRes.rows[0]);

  // 3. Administrador Local (Comercio)
  const localRes = await pool.query(
    `INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, estado)
     VALUES ($1, 'local@aromacafe.pe', $2, 'Encargado', 'Aroma Café', 1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, id_rol = EXCLUDED.id_rol
     RETURNING id_usuario, email`,
    [roleMap['ADMIN_LOCAL'], hash]
  );
  console.log('✅ Admin Local listo:', localRes.rows[0]);

  // 4. Asignar usuario local a sucursal
  const sucursales = await pool.query('SELECT id_sucursal FROM sucursales LIMIT 1');
  if (sucursales.rows[0]) {
    await pool.query(
      `INSERT INTO usuario_sucursal (id_usuario, id_sucursal, fecha_asignacion, estado)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
       ON CONFLICT (id_usuario, id_sucursal) DO NOTHING`,
      [localRes.rows[0].id_usuario, sucursales.rows[0].id_sucursal]
    );
    console.log('✅ Usuario local asignado a sucursal ID:', sucursales.rows[0].id_sucursal);
  }

  await pool.end();
}

seedAdminAndLocal().catch(err => {
  console.error('Error al sembrar:', err);
  process.exit(1);
});
