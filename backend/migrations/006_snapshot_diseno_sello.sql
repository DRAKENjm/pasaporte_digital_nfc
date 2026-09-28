BEGIN;

ALTER TABLE sellos_digitales
  ADD COLUMN IF NOT EXISTS nombre_sello_snapshot VARCHAR(100),
  ADD COLUMN IF NOT EXISTS imagen_sello_snapshot VARCHAR(255),
  ADD COLUMN IF NOT EXISTS color_sello_snapshot VARCHAR(20),
  ADD COLUMN IF NOT EXISTS meta_sellos_snapshot INT,
  ADD COLUMN IF NOT EXISTS puntos_sello_snapshot NUMERIC(10,2);

-- Para sellos existentes solo se puede inicializar la apariencia con el diseño
-- que aún está asociado al programa; los nuevos sellos guardarán su propio snapshot.
UPDATE sellos_digitales sd
SET nombre_sello_snapshot = COALESCE(sd.nombre_sello_snapshot, ps.nombre_sello),
    imagen_sello_snapshot = COALESCE(sd.imagen_sello_snapshot, ps.imagen_sello),
    color_sello_snapshot = COALESCE(sd.color_sello_snapshot, ps.color_sello),
    meta_sellos_snapshot = COALESCE(sd.meta_sellos_snapshot, ps.meta_sellos),
    puntos_sello_snapshot = COALESCE(
      sd.puntos_sello_snapshot,
      (SELECT mp.cantidad FROM movimientos_puntos mp
       WHERE mp.id_sello = sd.id_sello AND mp.tipo_movimiento = 'GANANCIA_SELLO'
       ORDER BY mp.id_movimiento LIMIT 1),
      ps.puntos_por_visita,
      (SELECT rp.valor FROM reglas_puntos rp
       WHERE rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
       LIMIT 1),
      20
    )
FROM programas_sellos ps
WHERE ps.id_programa = sd.id_programa
  AND (sd.nombre_sello_snapshot IS NULL OR sd.imagen_sello_snapshot IS NULL
       OR sd.color_sello_snapshot IS NULL OR sd.meta_sellos_snapshot IS NULL
       OR sd.puntos_sello_snapshot IS NULL);

COMMIT;
