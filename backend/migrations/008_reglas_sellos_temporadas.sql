BEGIN;

-- 1. Agregar columnas de configuración de ciclo, temporada y meta a programas_sellos
ALTER TABLE programas_sellos
  ADD COLUMN IF NOT EXISTS tipo_reinicio VARCHAR(20) DEFAULT 'MENSUAL',
  ADD COLUMN IF NOT EXISTS puntos_completado_meta NUMERIC(10,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS sello_especial_icono VARCHAR(255) DEFAULT 'trophy';

-- 2. Columnas en reglas_sellos para mantener sincronía con administración de reglas
ALTER TABLE reglas_sellos
  ADD COLUMN IF NOT EXISTS tipo_reinicio VARCHAR(20) DEFAULT 'MENSUAL',
  ADD COLUMN IF NOT EXISTS meta_sellos INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS puntos_completado_meta NUMERIC(10,2) DEFAULT 50.00;

-- 3. Columnas en sellos_digitales para rastrear sello especial y período (mes o temporada)
ALTER TABLE sellos_digitales
  ADD COLUMN IF NOT EXISTS es_sello_especial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ciclo_numero INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS periodo_referencia VARCHAR(30);

COMMIT;
