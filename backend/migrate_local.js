const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/pasaporte_digital'
});

async function migrate() {
  try {
    await client.connect();
    console.log('Conectado a PostgreSQL local (pasaporte_digital)...');
    const sqlPath = path.resolve(__dirname, '../database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Migración ejecutada con éxito.');

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    console.log(`\nTotal de tablas creadas: ${res.rows.length}`);
    console.log(res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('❌ Error en migración:', err);
  } finally {
    await client.end();
  }
}

migrate();
