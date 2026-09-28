BEGIN;

CREATE TABLE IF NOT EXISTS insignias_sello (
  id_insignia BIGSERIAL PRIMARY KEY,
  id_establecimiento BIGINT NOT NULL REFERENCES establecimientos(id_establecimiento)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  nombre VARCHAR(80) NOT NULL,
  imagen_url VARCHAR(255) NOT NULL,
  estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO'
    CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_insignia_establecimiento_imagen UNIQUE (id_establecimiento, imagen_url)
);

CREATE INDEX IF NOT EXISTS idx_insignias_sello_establecimiento
  ON insignias_sello(id_establecimiento, estado);

-- Migra las imágenes personalizadas ya usadas en diseños para que queden
-- disponibles como opciones reutilizables del local.
INSERT INTO insignias_sello (id_establecimiento, nombre, imagen_url)
SELECT DISTINCT ON (id_establecimiento, imagen_sello)
       id_establecimiento,
       LEFT(COALESCE(NULLIF(nombre_sello, ''), 'Insignia personalizada'), 80),
       imagen_sello
FROM programas_sellos
WHERE imagen_sello ~* '^https?://'
ORDER BY id_establecimiento, imagen_sello, fecha_actualizacion DESC
ON CONFLICT (id_establecimiento, imagen_url) DO NOTHING;

COMMIT;
