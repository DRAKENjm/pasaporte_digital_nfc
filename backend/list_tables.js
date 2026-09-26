const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/pasaporte_digital'
});

async function list() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(res.rows.map(r => r.table_name));
  await client.end();
}

list();
