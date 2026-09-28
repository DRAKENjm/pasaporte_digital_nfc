BEGIN;
-- La base tenía un índice UNIQUE sobre id_establecimiento (no definido en
-- database.sql) que impedía tener más de un diseño de sello por local.
-- Ahora se permiten varios diseños activos por establecimiento y el trabajador
-- elige cuál otorgar al validar la visita. Los sellos ya otorgados conservan su
-- id_programa (FK de sellos_digitales), por lo que el historial no se afecta.
DROP INDEX IF EXISTS idx_programas_sellos_establecimiento;
COMMIT;
