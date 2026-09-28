BEGIN;
-- El código de Comercio, Admin y NFC asume esta columna en programas_sellos
-- (puntos configurados por visita con fallback a reglas_puntos.valor).
ALTER TABLE programas_sellos ADD COLUMN IF NOT EXISTS puntos_por_visita NUMERIC(10,2);
COMMIT;
