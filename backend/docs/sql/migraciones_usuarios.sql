-- =================================================================================
-- MIGRACIONES ADICIONALES — PASAPORTE DIGITAL NFC (panel usuario)
-- Seguro de re-ejecutar: IF NOT EXISTS / ALTER condicional
-- =================================================================================

-- 1. Categorías de establecimientos
CREATE TABLE IF NOT EXISTS categorias_establecimiento (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Columnas que pueden faltar si la tabla ya existía
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categorias_establecimiento' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categorias_establecimiento ADD COLUMN slug VARCHAR(80);
    UPDATE categorias_establecimiento
    SET slug = lower(regexp_replace(coalesce(nombre, 'cat'), '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE slug IS NULL;
    BEGIN
      ALTER TABLE categorias_establecimiento ALTER COLUMN slug SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_slug ON categorias_establecimiento(slug);
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categorias_establecimiento' AND column_name = 'icono'
  ) THEN
    ALTER TABLE categorias_establecimiento ADD COLUMN icono VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categorias_establecimiento' AND column_name = 'orden'
  ) THEN
    ALTER TABLE categorias_establecimiento ADD COLUMN orden INT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categorias_establecimiento' AND column_name = 'estado'
  ) THEN
    ALTER TABLE categorias_establecimiento ADD COLUMN estado SMALLINT NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Insertar categorías base (solo si no existen por nombre)
INSERT INTO categorias_establecimiento (nombre, slug, icono, orden)
SELECT v.nombre, v.slug, v.icono, v.orden
FROM (VALUES
  ('Todos', 'todos', 'compass', 0),
  ('Café', 'cafe', 'coffee', 1),
  ('Restaurante', 'restaurante', 'utensils', 2),
  ('Postres', 'postres', 'cake', 3),
  ('Otros', 'otros', 'map-pin', 4)
) AS v(nombre, slug, icono, orden)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_establecimiento c WHERE c.nombre = v.nombre
);

-- id_categoria en establecimientos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'id_categoria'
  ) THEN
    ALTER TABLE establecimientos
      ADD COLUMN id_categoria INT REFERENCES categorias_establecimiento(id_categoria);
  END IF;
END $$;

-- Redes, horario, banner
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'horario_atencion') THEN
    ALTER TABLE establecimientos ADD COLUMN horario_atencion VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'redes_whatsapp') THEN
    ALTER TABLE establecimientos ADD COLUMN redes_whatsapp VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'redes_facebook') THEN
    ALTER TABLE establecimientos ADD COLUMN redes_facebook VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'redes_instagram') THEN
    ALTER TABLE establecimientos ADD COLUMN redes_instagram VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'redes_x') THEN
    ALTER TABLE establecimientos ADD COLUMN redes_x VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'establecimientos' AND column_name = 'banner_url') THEN
    ALTER TABLE establecimientos ADD COLUMN banner_url VARCHAR(500);
  END IF;
END $$;

-- 2. Preferencias de usuario
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id_preferencia BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    idioma VARCHAR(10) NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en', 'pt', 'ru', 'qu')),
    ocultar_fechas_sellos SMALLINT NOT NULL DEFAULT 0 CHECK (ocultar_fechas_sellos IN (0,1)),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Locales favoritos
CREATE TABLE IF NOT EXISTS locales_favoritos (
    id_favorito BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE CASCADE,
    id_establecimiento BIGINT NOT NULL REFERENCES establecimientos(id_establecimiento) ON UPDATE CASCADE ON DELETE CASCADE,
    fecha_agregado TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_favorito_cliente_est UNIQUE (id_cliente, id_establecimiento)
);
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente ON locales_favoritos(id_cliente);

-- 4. Invitaciones
CREATE TABLE IF NOT EXISTS invitaciones (
    id_invitacion BIGSERIAL PRIMARY KEY,
    id_usuario_invitador BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    codigo VARCHAR(32) UNIQUE NOT NULL,
    link_completo VARCHAR(255),
    usos_maximos INT DEFAULT 50,
    usos_actuales INT NOT NULL DEFAULT 0,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_invitaciones_codigo ON invitaciones(codigo);
CREATE INDEX IF NOT EXISTS idx_invitaciones_usuario ON invitaciones(id_usuario_invitador);

CREATE TABLE IF NOT EXISTS invitaciones_uso (
    id_uso BIGSERIAL PRIMARY KEY,
    id_invitacion BIGINT NOT NULL REFERENCES invitaciones(id_invitacion) ON UPDATE CASCADE ON DELETE CASCADE,
    id_usuario_invitado BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    fecha_uso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Personalización tarjeta NFC
CREATE TABLE IF NOT EXISTS tarjeta_nfc_personalizacion (
    id_personalizacion BIGSERIAL PRIMARY KEY,
    id_tarjeta BIGINT UNIQUE NOT NULL REFERENCES tarjetas_nfc(id_tarjeta) ON UPDATE CASCADE ON DELETE CASCADE,
    imagen_fondo VARCHAR(500),
    color_tema VARCHAR(20) DEFAULT '#7C0A1E',
    qr_data TEXT,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documentos legales: contenido HTML
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documentos_legales' AND column_name = 'contenido_html'
  ) THEN
    ALTER TABLE documentos_legales ADD COLUMN contenido_html TEXT;
  END IF;
END $$;

UPDATE documentos_legales
SET contenido_html = COALESCE(contenido_html, '<p>Contenido de Política de Privacidad. Actualizar desde el panel admin.</p>')
WHERE tipo_documento = 'POLITICA_PRIVACIDAD' AND contenido_html IS NULL;

UPDATE documentos_legales
SET contenido_html = COALESCE(contenido_html, '<p>Contenido de Términos y Condiciones. Actualizar desde el panel admin.</p>')
WHERE tipo_documento = 'TERMINOS_CONDICIONES' AND contenido_html IS NULL;

-- 7. Sellos festivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sellos_digitales' AND column_name = 'es_festivo'
  ) THEN
    ALTER TABLE sellos_digitales ADD COLUMN es_festivo SMALLINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sellos_digitales' AND column_name = 'imagen_sello_url'
  ) THEN
    ALTER TABLE sellos_digitales ADD COLUMN imagen_sello_url VARCHAR(500);
  END IF;
END $$;

-- 8. Código de invitación
CREATE OR REPLACE FUNCTION generar_codigo_invitacion()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;