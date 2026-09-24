-- =================================================================================
-- PASAPORTE VIRTUAL NFC — ESQUEMA COMPLETO + DATOS LIMPIOS + RLS
-- Solo datos: Roles + Usuarios
-- Niveles, categorías y todo lo demás lo crea el Admin
-- =================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- MÓDULO 1: ROLES, CATEGORÍAS Y NIVELES
-- =================================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL, 
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias_establecimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL, 
    icono_url VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS niveles_pasaporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rango VARCHAR(50) UNIQUE NOT NULL, 
    sellos_requeridos INT NOT NULL, 
    insignia_url VARCHAR(255), 
    color_hex VARCHAR(7), 
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================
-- MÓDULO 2: USUARIOS, TOKENS Y HARDWARE NFC
-- =================================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nivel_id UUID REFERENCES niveles_pasaporte(id) ON DELETE SET NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    username VARCHAR(60),
    avatar_url TEXT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    total_sellos INT DEFAULT 0, 
    puntos_globales INT DEFAULT 0, 
    aceptacion_tyc BOOLEAN NOT NULL DEFAULT FALSE,
    email_verificado BOOLEAN DEFAULT FALSE, 
    preferencias_privacidad JSONB DEFAULT '{}'::jsonb, 
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS qr_consumidos (
    jti UUID PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS tarjetas_nfc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    uid_nfc VARCHAR(100) UNIQUE NOT NULL, 
    qr_respaldo VARCHAR(150) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'ASIGNADA' CHECK (estado IN ('EN_STOCK', 'ASIGNADA', 'EXTRAVIADA', 'BLOQUEADA')),
    fecha_asignacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================
-- MÓDULO 3: ESTABLECIMIENTOS Y PERSONAL
-- =================================================================================

CREATE TABLE IF NOT EXISTS establecimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias_establecimiento(id) ON DELETE RESTRICT,
    ruc VARCHAR(11) UNIQUE NOT NULL, 
    razon_social VARCHAR(150) NOT NULL, 
    nombre VARCHAR(150),
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(30),
    horario TEXT,
    imagen_url TEXT,
    lat DOUBLE PRECISION CHECK(lat BETWEEN -90 AND 90),
    lng DOUBLE PRECISION CHECK(lng BETWEEN -180 AND 180),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_establecimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
    pin_validacion VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, establecimiento_id)
);

-- =================================================================================
-- MÓDULO 4: MOTOR TRANSACCIONAL
-- =================================================================================

CREATE TABLE IF NOT EXISTS reglas_sellos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
    nombre_accion VARCHAR(150) NOT NULL, 
    valor_puntos_por_sello INT NOT NULL DEFAULT 0,
    limite_diario_por_usuario INT DEFAULT 1,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recompensas_plataforma (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_recompensa VARCHAR(150) NOT NULL, 
    descripcion TEXT, 
    costo_puntos_globales INT NOT NULL,
    stock_disponible INT, 
    imagen_url VARCHAR(255), 
    tipo_entrega VARCHAR(50) DEFAULT 'OFICINA_CENTRAL' CHECK (tipo_entrega IN ('OFICINA_CENTRAL', 'LOCAL_ALIADO', 'VIRTUAL', 'EN_LOCAL', 'DIGITAL')),
    direccion_recojo TEXT, 
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'AGOTADA', 'FINALIZADA', 'INACTIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_canjes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    recompensa_id UUID NOT NULL REFERENCES recompensas_plataforma(id) ON DELETE RESTRICT,
    puntos_gastados INT NOT NULL,
    estado_entrega VARCHAR(20) DEFAULT 'PENDIENTE_RECOJO' CHECK (estado_entrega IN ('PENDIENTE_RECOJO', 'ENTREGADO', 'CANCELADO')),
    fecha_canje TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP WITH TIME ZONE 
);

CREATE TABLE IF NOT EXISTS historial_visitas_sellos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE RESTRICT,
    personal_validador_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    regla_sello_id UUID REFERENCES reglas_sellos(id) ON DELETE SET NULL,
    puntos_ganados INT NOT NULL,
    metodo_validacion VARCHAR(50) NOT NULL CHECK (metodo_validacion IN ('NFC', 'QR', 'MANUAL_DASHBOARD')),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_registro VARCHAR(45)
);

-- =================================================================================
-- MÓDULO 5: COMUNIDAD
-- =================================================================================

CREATE TABLE IF NOT EXISTS publicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
    texto_contenido TEXT,
    url_media TEXT,
    tipo_media VARCHAR(20) DEFAULT 'IMAGEN' CHECK (tipo_media IN ('IMAGEN', 'VIDEO')),
    url_thumbnail VARCHAR(255),
    duracion_segundos INT DEFAULT 0,
    visibilidad VARCHAR(20) DEFAULT 'PUBLICA' CHECK (visibilidad IN ('PUBLICA', 'PRIVADA', 'AMIGOS')),
    estado_moderacion VARCHAR(20) DEFAULT 'APROBADA' CHECK (estado_moderacion IN ('APROBADA', 'REVISION', 'OCULTA', 'ELIMINADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video', 'IMAGEN', 'VIDEO')),
    caption VARCHAR(500) NOT NULL DEFAULT '',
    filtro VARCHAR(40) NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS interacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_interaccion VARCHAR(20) NOT NULL CHECK (tipo_interaccion IN ('REACCION', 'COMENTARIO')),
    comentario TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS denuncias_moderacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_reportador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    motivo_denuncia VARCHAR(100) NOT NULL, 
    detalle_denuncia TEXT,
    estado_revision VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_revision IN ('PENDIENTE', 'REVISADO', 'DESCARTADO')),
    admin_revisor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP WITH TIME ZONE
);

-- =================================================================================
-- MÓDULO 6: AMISTADES
-- =================================================================================

CREATE TABLE IF NOT EXISTS amistades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_solicitante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_receptor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'BLOQUEADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_no_autoamistad CHECK (usuario_solicitante_id <> usuario_receptor_id),
    UNIQUE(usuario_solicitante_id, usuario_receptor_id)
);

-- =================================================================================
-- MÓDULO 7: LIBRO DE RECLAMACIONES
-- =================================================================================

CREATE TABLE IF NOT EXISTS libro_reclamaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_seguimiento VARCHAR(30) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
    nombres_reclamante VARCHAR(100) NOT NULL,
    apellidos_reclamante VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(20) DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI', 'CE', 'PASAPORTE', 'RUC')),
    numero_documento VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    direccion TEXT,
    tipo_bien_contratado VARCHAR(20) DEFAULT 'SERVICIO' CHECK (tipo_bien_contratado IN ('PRODUCTO', 'SERVICIO')),
    tipo_registro VARCHAR(20) NOT NULL CHECK (tipo_registro IN ('RECLAMO', 'QUEJA')),
    monto_reclamado NUMERIC(10, 2) DEFAULT 0.00,
    detalle TEXT NOT NULL,
    pedido_consumidor TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'ATENDIDO', 'RECHAZADO')),
    respuesta_admin TEXT,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    admin_responsable_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================
-- ÍNDICES
-- =================================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_tarjetas_uid ON tarjetas_nfc(uid_nfc);
CREATE INDEX IF NOT EXISTS idx_usuarios_sellos_historicos ON usuarios(total_sellos DESC);
CREATE INDEX IF NOT EXISTS idx_establecimientos_categoria ON establecimientos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_recompensas_plataforma_estado ON recompensas_plataforma(estado);
CREATE INDEX IF NOT EXISTS idx_visitas_antifraude ON historial_visitas_sellos(usuario_id, establecimiento_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_publicaciones_feed ON publicaciones(estado_moderacion, visibilidad, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publicaciones_tipo_media ON publicaciones(tipo_media);
CREATE INDEX IF NOT EXISTS idx_historias_expiry ON historias(expires_at);
CREATE INDEX IF NOT EXISTS idx_amistades_usuarios ON amistades(usuario_solicitante_id, usuario_receptor_id, estado);
CREATE INDEX IF NOT EXISTS idx_libro_reclamaciones_estado ON libro_reclamaciones(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_libro_reclamaciones_codigo ON libro_reclamaciones(codigo_seguimiento);

DELETE FROM interacciones a USING interacciones b 
WHERE a.tipo_interaccion = 'REACCION' 
  AND b.tipo_interaccion = 'REACCION' 
  AND a.publicacion_id = b.publicacion_id 
  AND a.usuario_id = b.usuario_id 
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS reaccion_unica ON interacciones(publicacion_id, usuario_id) WHERE tipo_interaccion = 'REACCION';

-- =================================================================================
-- DATOS SEMILLA — SOLO ROLES + USUARIOS
-- =================================================================================

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema con acceso total'),
('CLIENTE', 'Usuario final portador del pasaporte y acumulador de sellos'),
('COMERCIO', 'Personal autorizado de establecimientos aliados')
ON CONFLICT (nombre) DO NOTHING;

DO $$
DECLARE
    v_rol_admin UUID;
    v_rol_comercio UUID;
    v_rol_cliente UUID;
    
    v_user_admin UUID := 'b0000000-0000-0000-0000-000000000001';
    v_user_comercio UUID := 'b0000000-0000-0000-0000-000000000002';
    v_user_cliente UUID := 'b0000000-0000-0000-0000-000000000003';
    
    -- Hash de "Password123!"
    v_hash_demo VARCHAR := '$2a$10$BvFWSzKBxQ9dN0DqsrtCfOhc07KKXXufrUsNGqeBSf46kaau2d8vy';
BEGIN
    SELECT id INTO v_rol_admin FROM roles WHERE UPPER(nombre) = 'ADMIN' LIMIT 1;
    SELECT id INTO v_rol_comercio FROM roles WHERE UPPER(nombre) = 'COMERCIO' LIMIT 1;
    SELECT id INTO v_rol_cliente FROM roles WHERE UPPER(nombre) = 'CLIENTE' LIMIT 1;

    -- 1. Admin
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, username, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, email_verificado, estado)
    VALUES (v_user_admin, v_rol_admin, NULL, 'Administrador', 'Principal', 'admin_master', 'cuentaunicaapk@gmail.com', v_hash_demo, 0, 0, TRUE, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO UPDATE 
      SET rol_id = EXCLUDED.rol_id, 
          nivel_id = NULL,
          total_sellos = 0,
          puntos_globales = 0,
          username = COALESCE(usuarios.username, EXCLUDED.username),
          password_hash = EXCLUDED.password_hash,
          email_verificado = TRUE,
          estado = 'ACTIVO';

    -- 2. Comercio
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, username, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, email_verificado, estado)
    VALUES (v_user_comercio, v_rol_comercio, NULL, 'María', 'Validadora', 'comercio_cafe', 'comercio@cafecentral.com', v_hash_demo, 0, 0, TRUE, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO UPDATE 
      SET rol_id = EXCLUDED.rol_id, 
          nivel_id = NULL,
          total_sellos = 0,
          puntos_globales = 0,
          username = COALESCE(usuarios.username, EXCLUDED.username),
          password_hash = EXCLUDED.password_hash,
          email_verificado = TRUE,
          estado = 'ACTIVO';

    -- 3. Cliente
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, username, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, email_verificado, estado)
    VALUES (v_user_cliente, v_rol_cliente, NULL, 'Aldair', 'Viajero', 'aldair_travel', 'cliente@demo.com', v_hash_demo, 0, 0, TRUE, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO UPDATE 
      SET rol_id = EXCLUDED.rol_id, 
          nivel_id = NULL,
          username = COALESCE(usuarios.username, EXCLUDED.username),
          password_hash = EXCLUDED.password_hash,
          email_verificado = TRUE,
          estado = 'ACTIVO';
END $$;

-- =================================================================================
-- ROW LEVEL SECURITY
-- =================================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = auth.uid()
      AND UPPER(r.nombre) = 'ADMIN'
      AND u.estado = 'ACTIVO'
  );
$$;

-- Habilitar RLS en todas las tablas
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles_pasaporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_consumidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas_nfc ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_sellos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_canjes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_visitas_sellos ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historias ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias_moderacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE amistades ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_reclamaciones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN → acceso total
-- =====================================================
CREATE POLICY "Admin full access on roles" ON roles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on categorias" ON categorias_establecimiento FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on niveles" ON niveles_pasaporte FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on usuarios" ON usuarios FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on auth_tokens" ON auth_tokens FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on qr_consumidos" ON qr_consumidos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on tarjetas_nfc" ON tarjetas_nfc FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on establecimientos" ON establecimientos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on personal" ON personal_establecimiento FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on reglas_sellos" ON reglas_sellos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on recompensas" ON recompensas_plataforma FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on historial_canjes" ON historial_canjes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on historial_visitas" ON historial_visitas_sellos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on publicaciones" ON publicaciones FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on historias" ON historias FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on interacciones" ON interacciones FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on denuncias" ON denuncias_moderacion FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on amistades" ON amistades FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access on libro_reclamaciones" ON libro_reclamaciones FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- CLIENTE → solo lo necesario
-- =====================================================

-- 1. Ver y editar su propio perfil
CREATE POLICY "Cliente ve su perfil"
ON usuarios FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Cliente edita sus datos personales"
ON usuarios FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Ver y gestionar su propia tarjeta NFC (vincular + diseño)
CREATE POLICY "Cliente ve su tarjeta NFC"
ON tarjetas_nfc FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Cliente actualiza su tarjeta NFC"
ON tarjetas_nfc FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Cliente vincula tarjeta NFC"
ON tarjetas_nfc FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- 3. Ver recompensas disponibles
CREATE POLICY "Cliente ve recompensas"
ON recompensas_plataforma FOR SELECT
USING (estado = 'ACTIVA');

-- 4. Reclamar regalos
CREATE POLICY "Cliente ve sus canjes"
ON historial_canjes FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Cliente reclama regalos"
ON historial_canjes FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- 5. Ver niveles (para mostrar su rango)
CREATE POLICY "Cliente ve niveles"
ON niveles_pasaporte FOR SELECT
USING (true);