-- Migración 009: Control de cuál de los hasta 5 sellos distintos del local está en entrega activa
ALTER TABLE programas_sellos
  ADD COLUMN IF NOT EXISTS es_activo_entrega BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mes_asignado VARCHAR(30),
  ADD COLUMN IF NOT EXISTS temporada_nombre VARCHAR(100);

-- Asegurar que al menos un sello por local esté marcado como activo de entrega
WITH primer_sello AS (
  SELECT DISTINCT ON (id_establecimiento) id_programa
  FROM programas_sellos
  WHERE estado = 'ACTIVO'
  ORDER BY id_establecimiento, id_programa ASC
)
UPDATE programas_sellos ps
SET es_activo_entrega = TRUE
FROM primer_sello p
WHERE ps.id_programa = p.id_programa;
