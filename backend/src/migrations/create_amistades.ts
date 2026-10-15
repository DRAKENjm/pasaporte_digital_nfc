import { pool } from "../config/database";

export async function up() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS amistades (
      id BIGSERIAL PRIMARY KEY,
      usuario_solicitante_id BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      usuario_receptor_id BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADO')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_amistad_par UNIQUE (usuario_solicitante_id, usuario_receptor_id)
    );
    CREATE INDEX IF NOT EXISTS idx_amistades_solicitante ON amistades(usuario_solicitante_id);
    CREATE INDEX IF NOT EXISTS idx_amistades_receptor ON amistades(usuario_receptor_id);
    CREATE INDEX IF NOT EXISTS idx_amistades_estado ON amistades(estado);
  `;

  await pool.query(ddl);
  console.log("Tabla 'amistades' verificada y creada correctamente.");
}

up()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Error al crear tabla 'amistades':", err);
    pool.end();
  });
