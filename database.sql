-- =================================================================================
-- PASAPORTE VIRTUAL NFC — ESQUEMA COMPLETO Y BASE DE DATOS LIMPIA (POSTGRESQL)
-- =================================================================================
-- Script 100% autónomo, idempotente y compatible con PostgreSQL 14+.
-- Incluye tablas de autenticación, hardware NFC, POS, gamificación, comunidad,
-- amistades, libro de reclamaciones y datos iniciales de prueba.
-- =================================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- MÓDULO 1: ROLES, CATEGORÍAS Y NIVELES (GAMIFICACIÓN)
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
    nivel_id UUID REFERENCES niveles_pasaporte(id) ON DELETE SET NULL, -- Solo aplica a CLIENTE
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

-- Tokens de verificación de email y recuperación de contraseña
CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Control anti-replay para códigos QR dinámicos consumidos
CREATE TABLE IF NOT EXISTS qr_consumidos (
    jti UUID PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Hardware NFC (NTAG213/NTAG215)
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
-- MÓDULO 3: ESTABLECIMIENTOS Y PERSONAL COMERCIO (POS)
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
-- MÓDULO 4: MOTOR TRANSACCIONAL (REGLAS, RECOMPENSAS, SELLOS Y CANJES)
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
-- MÓDULO 5: COMUNIDAD, HISTORIAS 24H Y RED SOCIAL
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
-- MÓDULO 6: CONEXIONES SOCIALES Y LÍMITE DE AMIGOS (EXCLUSIVIDAD CLIENTE)
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
-- MÓDULO 7: LIBRO DE RECLAMACIONES VIRTUAL (GOBERNANZA & AUDITORÍA ADMIN)
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
-- ÍNDICES DE RENDIMIENTO Y SEGURIDAD
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

-- Limpieza preventiva de duplicados antes de crear índice único de reacciones
DELETE FROM interacciones a USING interacciones b 
WHERE a.tipo_interaccion = 'REACCION' 
  AND b.tipo_interaccion = 'REACCION' 
  AND a.publicacion_id = b.publicacion_id 
  AND a.usuario_id = b.usuario_id 
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS reaccion_unica ON interacciones(publicacion_id, usuario_id) WHERE tipo_interaccion = 'REACCION';

-- =================================================================================
-- DATOS SEMILLA BASE (Niveles, Roles, Categorías)
-- =================================================================================

INSERT INTO niveles_pasaporte (nombre_rango, sellos_requeridos, color_hex) VALUES 
('Bronce', 0, '#CE8946'),
('Plata', 20, '#C0C0C0'),
('Oro', 50, '#FFD700'),
('Diamante', 150, '#08cef1')
ON CONFLICT (nombre_rango) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema con acceso total'),
('CLIENTE', 'Usuario final portador del pasaporte y acumulador de sellos'),
('COMERCIO', 'Personal autorizado de establecimientos aliados')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias_establecimiento (nombre, icono_url) VALUES
('Cafeterías y Panaderías', 'https://cdn-icons-png.flaticon.com/512/924/924514.png'),
('Restaurantes y Bares', 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'),
('Turismo y Aventura', 'https://cdn-icons-png.flaticon.com/512/201/201623.png'),
('Tiendas y Artesanías', 'https://cdn-icons-png.flaticon.com/512/869/869636.png')
ON CONFLICT (nombre) DO NOTHING;

-- =================================================================================
-- BLOQUE DE DATOS DEMO INICIALES (Password para todos los usuarios demo: Password123!)
-- =================================================================================

DO $$
DECLARE
    v_rol_admin UUID;
    v_rol_comercio UUID;
    v_rol_cliente UUID;
    v_nivel_plata UUID;
    
    v_user_admin UUID := 'b0000000-0000-0000-0000-000000000001';
    v_user_comercio UUID := 'b0000000-0000-0000-0000-000000000002';
    v_user_cliente UUID := 'b0000000-0000-0000-0000-000000000003';
    
    v_cat_cafe UUID;
    v_cat_rest UUID;
    v_est_cafe UUID := 'c0000000-0000-0000-0000-000000000001';
    v_est_rest UUID := 'c0000000-0000-0000-0000-000000000002';
    
    v_regla_cafe UUID := 'd0000000-0000-0000-0000-000000000001';
    v_regla_rest UUID := 'd0000000-0000-0000-0000-000000000002';
    v_rec_cafe UUID := 'e0000000-0000-0000-0000-000000000001';
    v_rec_postre UUID := 'e0000000-0000-0000-0000-000000000002';
    
    -- Hash bcrypt de "Password123!"
    v_hash_demo VARCHAR := '$2a$10$BvFWSzKBxQ9dN0DqsrtCfOhc07KKXXufrUsNGqeBSf46kaau2d8vy';
BEGIN
    SELECT id INTO v_rol_admin FROM roles WHERE UPPER(nombre) = 'ADMIN' LIMIT 1;
    SELECT id INTO v_rol_comercio FROM roles WHERE UPPER(nombre) = 'COMERCIO' LIMIT 1;
    SELECT id INTO v_rol_cliente FROM roles WHERE UPPER(nombre) = 'CLIENTE' LIMIT 1;

    SELECT id INTO v_nivel_plata FROM niveles_pasaporte WHERE LOWER(nombre_rango) = 'plata' LIMIT 1;

    SELECT id INTO v_cat_cafe FROM categorias_establecimiento WHERE nombre LIKE 'Cafeter%' LIMIT 1;
    SELECT id INTO v_cat_rest FROM categorias_establecimiento WHERE nombre LIKE 'Restaurante%' LIMIT 1;

    -- 1. Usuario Administrador (sin gamificación: nivel_id = NULL)
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

    -- 2. Usuario Comercio / Validador (sin gamificación: nivel_id = NULL)
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

    -- 3. Usuario Cliente (con gamificación: Nivel Plata, 25 sellos, 250 puntos)
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, username, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, email_verificado, estado)
    VALUES (v_user_cliente, v_rol_cliente, v_nivel_plata, 'Aldair', 'Viajero', 'aldair_travel', 'cliente@demo.com', v_hash_demo, 25, 250, TRUE, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO UPDATE 
      SET rol_id = EXCLUDED.rol_id, 
          username = COALESCE(usuarios.username, EXCLUDED.username),
          password_hash = EXCLUDED.password_hash,
          email_verificado = TRUE,
          estado = 'ACTIVO';

    -- 4. Establecimientos aliados
    INSERT INTO establecimientos (id, categoria_id, ruc, razon_social, nombre, descripcion, direccion, telefono, horario, imagen_url, lat, lng, estado)
    VALUES 
    (
        v_est_cafe, 
        v_cat_cafe, 
        '20100000001', 
        'Café Central Colonial S.A.C.', 
        'Café Central Colonial', 
        'Cafetería de especialidad y repostería artesanal en casona colonial del centro histórico.',
        'Calle del Comercio 101, Centro', 
        '+51 987 654 321', 
        'Lun-Sáb: 08:00 - 21:00',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        -12.046374, 
        -77.042793, 
        'ACTIVO'
    ),
    (
        v_est_rest, 
        v_cat_rest, 
        '20100000002', 
        'Restaurante Fusión Criolla E.I.R.L.', 
        'Restaurante Fusión Criolla', 
        'Gastronomía peruana de vanguardia y coctelería de autor.',
        'Av. Gastronómica 204, Miraflores', 
        '+51 912 345 678', 
        'Mar-Dom: 12:30 - 23:00',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        -12.121589, 
        -77.030514, 
        'ACTIVO'
    )
    ON CONFLICT (ruc) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          descripcion = EXCLUDED.descripcion,
          direccion = EXCLUDED.direccion,
          telefono = EXCLUDED.telefono,
          horario = EXCLUDED.horario,
          imagen_url = EXCLUDED.imagen_url,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng;

    -- 5. Vincular personal al establecimiento
    INSERT INTO personal_establecimiento (usuario_id, establecimiento_id, pin_validacion, estado)
    VALUES (v_user_comercio, v_est_cafe, '1234', TRUE)
    ON CONFLICT (usuario_id, establecimiento_id) DO NOTHING;

    -- 6. Reglas de sellos
    INSERT INTO reglas_sellos (id, establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado)
    VALUES 
    (v_regla_cafe, v_est_cafe, 'Consumo en Cafetería', 10, 1, 'ACTIVA'),
    (v_regla_rest, v_est_rest, 'Almuerzo / Cena Carta', 20, 1, 'ACTIVA')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Tarjeta NFC asignada al cliente
    INSERT INTO tarjetas_nfc (usuario_id, uid_nfc, qr_respaldo, estado, fecha_asignacion)
    VALUES 
    (v_user_cliente, '04:5A:2B:1A:3C:60:80', 'https://pasaporte.nfc/r/045a2b1a3c6080', 'ASIGNADA', CURRENT_TIMESTAMP)
    ON CONFLICT (uid_nfc) DO NOTHING;

    -- 8. Catálogo de recompensas
    INSERT INTO recompensas_plataforma (id, nombre_recompensa, descripcion, costo_puntos_globales, stock_disponible, imagen_url, tipo_entrega, estado)
    VALUES 
    (
        v_rec_cafe,
        'Café Espresso o Americano Doble',
        'Canjea tu café favorito en cualquiera de nuestros locales aliados de Café Central.',
        50,
        150,
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500',
        'LOCAL_ALIADO',
        'ACTIVA'
    ),
    (
        v_rec_postre,
        'Postre Artesanal de la Casa',
        'Elige una porción de postre del día en locales participantes.',
        90,
        80,
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
        'LOCAL_ALIADO',
        'ACTIVA'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 9. Historial de visitas
    INSERT INTO historial_visitas_sellos (usuario_id, establecimiento_id, personal_validador_id, regla_sello_id, puntos_ganados, metodo_validacion, fecha_hora)
    VALUES 
    (v_user_cliente, v_est_cafe, v_user_comercio, v_regla_cafe, 10, 'NFC', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (v_user_cliente, v_est_rest, NULL, v_regla_rest, 20, 'QR', CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    -- 10. Publicación inicial en comunidad
    INSERT INTO publicaciones (usuario_id, establecimiento_id, texto_contenido, url_media, tipo_media, visibilidad, estado_moderacion)
    VALUES 
    (
        v_user_cliente,
        v_est_cafe,
        '¡Excelente café y ambiente en Café Central Colonial! Primer sello del día obtenido ☕✨',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        'IMAGEN',
        'PUBLICA',
        'APROBADA'
    )
    ON CONFLICT DO NOTHING;

    -- 11. Registro Demo de Libro de Reclamaciones
    INSERT INTO libro_reclamaciones (
        codigo_seguimiento,
        usuario_id,
        establecimiento_id,
        nombres_reclamante,
        apellidos_reclamante,
        tipo_documento,
        numero_documento,
        email,
        telefono,
        direccion,
        tipo_bien_contratado,
        tipo_registro,
        monto_reclamado,
        detalle,
        pedido_consumidor,
        estado
    ) VALUES (
        'REC-2026-0001',
        v_user_cliente,
        v_est_cafe,
        'Aldair',
        'Viajero',
        'DNI',
        '72819283',
        'cliente@demo.com',
        '+51 999 888 777',
        'Av. Principal 456, Lima',
        'SERVICIO',
        'RECLAMO',
        18.50,
        'Demora en la validación del sello NFC durante la hora punta de la tarde.',
        'Capacitación al personal sobre el uso del POS NFC para agilizar la atención.',
        'PENDIENTE'
    ) ON CONFLICT (codigo_seguimiento) DO NOTHING;

END $$;
