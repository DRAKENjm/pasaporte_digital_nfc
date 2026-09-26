const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/pasaporte_digital'
});

async function cleanOnlyUsers() {
  try {
    await client.connect();
    console.log('Iniciando limpieza TOTAL de inserts (quedan solo roles y los 3 usuarios base)...');

    // 1. Truncar todas las tablas con cascade
    await client.query(`
      TRUNCATE TABLE 
        sellos_digitales,
        visitas,
        movimientos_puntos,
        canjes,
        recompensa_sucursal,
        recompensas,
        reglas_puntos,
        programas_sellos,
        usuario_sucursal,
        sucursales,
        establecimientos,
        historial_tarjeta_nfc,
        tarjetas_nfc,
        notificaciones,
        reclamaciones,
        solicitudes_datos_personales,
        aceptaciones_legales,
        auditoria,
        clientes,
        usuarios
      CASCADE;
    `);

    console.log('Tablas limpiadas.');

    // 2. Roles
    await client.query(`
      INSERT INTO roles (nombre, descripcion) VALUES
      ('ADMIN_GENERAL', 'Administrador general de la plataforma Pasaporte Digital'),
      ('ADMIN_LOCAL', 'Administrador de establecimiento afiliado'),
      ('TRABAJADOR_LOCAL', 'Trabajador autorizado del establecimiento'),
      ('CLIENTE', 'Cliente usuario del Pasaporte Digital')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    const rolesRes = await client.query("SELECT id_rol, nombre FROM roles");
    const roleMap = {};
    rolesRes.rows.forEach(r => { roleMap[r.nombre] = r.id_rol; });

    const pwd = await bcrypt.hash('admin123', 10);

    // 3. Exactamente 3 usuarios
    // Usuario 1: Admin General
    const adminUser = (await client.query(`
      INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, telefono, estado)
      VALUES ($1, 'admin@pasaportedigital.pe', $2, 'Administrador', 'General', '999888777', 1)
      RETURNING id_usuario;
    `, [roleMap['ADMIN_GENERAL'], pwd])).rows[0];

    // Usuario 2: Encargado Local
    const localUser = (await client.query(`
      INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, telefono, estado)
      VALUES ($1, 'local@aromacafe.pe', $2, 'Encargado', 'Aroma Café', '977665544', 1)
      RETURNING id_usuario;
    `, [roleMap['ADMIN_LOCAL'], pwd])).rows[0];

    // Usuario 3: Cliente
    const clienteUser = (await client.query(`
      INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, telefono, estado)
      VALUES ($1, 'josealdair@gmail.com', $2, 'José', 'Aldair', '987654321', 1)
      RETURNING id_usuario;
    `, [roleMap['CLIENTE'], pwd])).rows[0];

    // 4. Extensión para el Cliente
    const clienteRes = await client.query(`
      INSERT INTO clientes (id_usuario, codigo_cliente, estado)
      VALUES ($1, 'CLI-100234', 1)
      RETURNING id_cliente;
    `, [clienteUser.id_usuario]);
    const idCliente = clienteRes.rows[0].id_cliente;

    // Tarjeta NFC del Cliente (terminación 1234)
    await client.query(`
      INSERT INTO tarjetas_nfc (id_cliente, uid_nfc, codigo_interno, es_principal, estado, fecha_activacion)
      VALUES ($1, '04:A1:B2:C3:D4:E5:1234', 'NFC-101234', 1, 'ACTIVA', CURRENT_TIMESTAMP);
    `, [idCliente]);

    console.log('✅ Base de datos 100% limpia. Registros existentes:');
    const uRes = await client.query('SELECT u.id_usuario, u.email, r.nombre as rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol');
    console.table(uRes.rows);

  } catch (err) {
    console.error('Error durante la limpieza:', err);
  } finally {
    await client.end();
  }
}

cleanOnlyUsers();
