const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/pasaporte_digital'
});

async function seed() {
  try {
    await client.connect();
    console.log('Sembrando datos base en pasaporte_digital...');

    const pwd = await bcrypt.hash('admin123', 10);

    // 1. Roles
    await client.query(`
      INSERT INTO roles (nombre, descripcion) VALUES
      ('ADMIN_GENERAL', 'Administrador general de Pasaporte Digital'),
      ('ADMIN_LOCAL', 'Administrador de establecimiento afiliado'),
      ('TRABAJADOR_LOCAL', 'Trabajador autorizado del establecimiento'),
      ('CLIENTE', 'Cliente usuario del Pasaporte Digital')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    // 2. Usuario Cliente Demostrativo (José Aldair como en el mockup)
    const clienteRol = (await client.query("SELECT id_rol FROM roles WHERE nombre = 'CLIENTE'")).rows[0].id_rol;
    
    const userRes = await client.query(`
      INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, telefono, estado)
      VALUES ($1, 'josealdair@gmail.com', $2, 'José', 'Aldair', '987654321', 1)
      ON CONFLICT (email) DO UPDATE SET nombres = EXCLUDED.nombres
      RETURNING id_usuario;
    `, [clienteRol, pwd]);
    const idUsuario = userRes.rows[0].id_usuario;

    // Extensión cliente
    const clienteRes = await client.query(`
      INSERT INTO clientes (id_usuario, codigo_cliente, estado)
      VALUES ($1, 'CLI-100234', 1)
      ON CONFLICT (id_usuario) DO UPDATE SET codigo_cliente = EXCLUDED.codigo_cliente
      RETURNING id_cliente;
    `, [idUsuario]);
    const idCliente = clienteRes.rows[0].id_cliente;

    // Tarjeta NFC Activa del mockup (terminación 1234)
    await client.query(`
      INSERT INTO tarjetas_nfc (id_cliente, uid_nfc, codigo_interno, es_principal, estado, fecha_activacion)
      VALUES ($1, '04:A1:B2:C3:D4:E5:1234', 'NFC-101234', 1, 'ACTIVA', CURRENT_TIMESTAMP)
      ON CONFLICT (uid_nfc) DO NOTHING;
    `, [idCliente]);

    // 3. Establecimientos destacados como en el mockup
    const est1 = (await client.query(`
      INSERT INTO establecimientos (nombre_comercial, razon_social, ruc, descripcion, logo, estado)
      VALUES ('Aroma Café', 'Aroma Cafe Gourmet SAC', '20601234567', 'Cafetería de especialidad con granos selectos y repostería artesanal.', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200', 'ACTIVO')
      ON CONFLICT (ruc) DO UPDATE SET nombre_comercial = EXCLUDED.nombre_comercial
      RETURNING id_establecimiento;
    `)).rows[0].id_establecimiento;

    const est2 = (await client.query(`
      INSERT INTO establecimientos (nombre_comercial, razon_social, ruc, descripcion, logo, estado)
      VALUES ('La Esquina', 'Restobar La Esquina EIRL', '20609876543', 'Restaurante con lo mejor de la gastronomía urbana, piqueos y coctelería.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200', 'ACTIVO')
      ON CONFLICT (ruc) DO UPDATE SET nombre_comercial = EXCLUDED.nombre_comercial
      RETURNING id_establecimiento;
    `)).rows[0].id_establecimiento;

    // Sucursales
    const suc1 = (await client.query(`
      INSERT INTO sucursales (id_establecimiento, nombre, direccion, latitud, longitud, es_principal, estado)
      VALUES ($1, 'Aroma Café - Chiclayo Centro', 'Av. Balta 450, Chiclayo', -6.7713700, -79.8408800, 1, 1)
      RETURNING id_sucursal;
    `, [est1])).rows[0].id_sucursal;

    await client.query(`
      INSERT INTO sucursales (id_establecimiento, nombre, direccion, latitud, longitud, es_principal, estado)
      VALUES ($1, 'La Esquina - Santa Victoria', 'Calle Los Sauces 120, Urb. Santa Victoria', -6.7820000, -79.8450000, 1, 1);
    `, [est2]);

    // Programas de sellos
    const prog1 = (await client.query(`
      INSERT INTO programas_sellos (id_establecimiento, nombre, meta_sellos, max_sellos_visita, nombre_sello, imagen_sello, color_sello, fecha_inicio, estado)
      VALUES ($1, 'Pasaporte Cafetero', 5, 1, 'Sello Latte', 'https://cdn-icons-png.flaticon.com/512/924/924514.png', '#9B1B30', CURRENT_TIMESTAMP, 'ACTIVO')
      RETURNING id_programa;
    `, [est1])).rows[0].id_programa;

    await client.query(`
      INSERT INTO reglas_puntos (id_programa, nombre, tipo_regla, valor, estado)
      VALUES ($1, 'Puntos por visita cafetera', 'POR_SELLO', 20.00, 1);
    `, [prog1]);

    // Recompensas
    await client.query(`
      INSERT INTO recompensas (id_establecimiento, nombre, descripcion, puntos_requeridos, stock_ilimitado, fecha_inicio, estado)
      VALUES ($1, 'Café Americano o Latte Gratis', 'Canjea tu bebida caliente favorita en cualquier momento.', 100, 1, CURRENT_TIMESTAMP, 'ACTIVA');
    `, [est1]);

    // 4. Saldo inicial como en el mockup (420 puntos y 8 visitas)
    await client.query(`
      INSERT INTO movimientos_puntos (id_cliente, id_programa, tipo_movimiento, cantidad, saldo_anterior, saldo_posterior, descripcion)
      VALUES ($1, $2, 'BONIFICACION', 420, 0, 420, 'Puntos acumulados de bienvenida y visitas anteriores');
    `, [idCliente, prog1]);

    // Visitas simuladas
    const tarjetaId = (await client.query("SELECT id_tarjeta FROM tarjetas_nfc WHERE id_cliente = $1", [idCliente])).rows[0].id_tarjeta;
    for (let i = 1; i <= 8; i++) {
      const vRes = await client.query(`
        INSERT INTO visitas (id_cliente, id_tarjeta, id_sucursal, id_usuario_validador, estado, fecha_hora)
        VALUES ($1, $2, $3, $4, 'CONFIRMADA', CURRENT_TIMESTAMP - interval '${i * 2} days')
        RETURNING id_visita;
      `, [idCliente, tarjetaId, suc1, idUsuario]);

      await client.query(`
        INSERT INTO sellos_digitales (id_visita, id_programa, numero_sello, cantidad, estado)
        VALUES ($1, $2, $3, 1, 'OTORGADO');
      `, [vRes.rows[0].id_visita, prog1, ((i - 1) % 5) + 1]);
    }

    console.log('✅ Datos base sembrados exitosamente.');
    console.log('Usuario de prueba: josealdair@gmail.com / admin123');
    console.log('Puntos: 420 | Visitas: 8 | Nivel: Explorador');
  } catch (e) {
    console.error('Error sembrando datos:', e);
  } finally {
    await client.end();
  }
}

seed();
