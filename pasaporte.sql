-- =================================================================================
-- CONFIGURACIÓN INICIAL DEL MOTOR POSTGRESQL
-- =================================================================================

-- Habilitar extensión nativa para la generación de identificadores únicos universales (UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- MÓDULO 1: CONFIGURACIÓN BASE, ROLES Y GAMIFICACIÓN (NIVELES)
-- =================================================================================

-- Roles del sistema (Administradores, Clientes, Personal de comercios, etc.)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL, 
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorías para agrupar y facilitar el descubrimiento de establecimientos afiliados
CREATE TABLE categorias_establecimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL, 
    icono_url VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sistema de Rangos/Niveles globales
CREATE TABLE niveles_pasaporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rango VARCHAR(50) UNIQUE NOT NULL, 
    sellos_requeridos INT NOT NULL, 
    insignia_url VARCHAR(255), 
    color_hex VARCHAR(7), 
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción automática de los niveles base
INSERT INTO niveles_pasaporte (nombre_rango, sellos_requeridos, color_hex) VALUES 
('Bronce', 0, '#CE8946'),
('Plata', 20, '#C0C0C0'),
('Oro', 50, '#FFD700'),
('Diamante', 150, '#08cef1')
ON CONFLICT (nombre_rango) DO NOTHING;

-- Inserción automática de roles esenciales
INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema con acceso total'),
('CLIENTE', 'Usuario final portador del pasaporte y acumulador de sellos'),
('COMERCIO', 'Personal autorizado de establecimientos aliados')
ON CONFLICT (nombre) DO NOTHING;

-- Inserción de categorías base para establecimientos
INSERT INTO categorias_establecimiento (nombre, icono_url) VALUES
('Cafeterías y Panaderías', 'https://cdn-icons-png.flaticon.com/512/924/924514.png'),
('Restaurantes y Bares', 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'),
('Turismo y Aventura', 'https://cdn-icons-png.flaticon.com/512/201/201623.png'),
('Tiendas y Artesanías', 'https://cdn-icons-png.flaticon.com/512/869/869636.png')
ON CONFLICT (nombre) DO NOTHING;

-- =================================================================================
-- MÓDULO 2: USUARIOS 
-- =================================================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nivel_id UUID REFERENCES niveles_pasaporte(id) ON DELETE SET NULL, -- Rango actual
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    total_sellos INT DEFAULT 0, 
    puntos_globales INT DEFAULT 0, 
    aceptacion_tyc BOOLEAN NOT NULL DEFAULT FALSE, --(para terminos y condiciones)
    email_verificado BOOLEAN DEFAULT FALSE, 
    preferencias_privacidad JSONB DEFAULT '{}'::jsonb, 
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tarjetas_nfc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,   -- UID del chip NTAG213/NTAG215 que actúa como identificador físico del usuario
    uid_nfc VARCHAR(100) UNIQUE NOT NULL, 
    qr_respaldo VARCHAR(150) UNIQUE NOT NULL, -- Código o URL de respaldo por si falla el hardware NFC
    estado VARCHAR(20) DEFAULT 'ASIGNADA' CHECK (estado IN ('EN_STOCK', 'ASIGNADA', 'EXTRAVIADA', 'BLOQUEADA')),
    fecha_asignacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- Nota de seguridad: La tarjeta no almacena datos, todo reside en el servidor
);

-- =================================================================================
-- MÓDULO 3: ESTABLECIMIENTOS ALIADOS
-- =================================================================================

CREATE TABLE establecimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias_establecimiento(id) ON DELETE RESTRICT,
    ruc VARCHAR(11) UNIQUE NOT NULL, 
    razon_social VARCHAR(150) NOT NULL, 
    direccion TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal autorizado de los comercios para validar las visitas
CREATE TABLE personal_establecimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
    pin_validacion VARCHAR(255), -- Código PIN rápido para validar en el punto de venta (POS)
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, establecimiento_id)
);

-- =================================================================================
-- MÓDULO 4: MOTOR TRANSACTIONAL (SELLOS ➔ PUNTOS ➔ RECOMPENSAS)
-- =================================================================================

CREATE TABLE reglas_sellos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
    nombre_accion VARCHAR(150) NOT NULL, 
    valor_puntos_por_sello INT NOT NULL DEFAULT 10, -- Equivalencia (Ej: 1 sello = 10 puntos)
    limite_diario_por_usuario INT DEFAULT 1, -- Restricción antifraude para limitar acreditaciones
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recompensas_plataforma (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_recompensa VARCHAR(150) NOT NULL, 
    descripcion TEXT, 
    costo_puntos_globales INT NOT NULL, -- Puntos que la WebApp restará de la billetera del usuario
    stock_disponible INT, 
    imagen_url VARCHAR(255), 
    tipo_entrega VARCHAR(50) DEFAULT 'OFICINA_CENTRAL' CHECK (tipo_entrega IN ('OFICINA_CENTRAL', 'LOCAL_ALIADO', 'VIRTUAL')),
    direccion_recojo TEXT, 
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'AGOTADA', 'FINALIZADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE historial_canjes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    recompensa_id UUID NOT NULL REFERENCES recompensas_plataforma(id) ON DELETE RESTRICT,
    puntos_gastados INT NOT NULL, -- Cuántos puntos exactos se le descontaron en el momento del canje
    estado_entrega VARCHAR(20) DEFAULT 'PENDIENTE_RECOJO' CHECK (estado_entrega IN ('PENDIENTE_RECOJO', 'ENTREGADO', 'CANCELADO')),
    fecha_canje TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP WITH TIME ZONE 
);


CREATE TABLE historial_visitas_sellos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE RESTRICT,
    personal_validador_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,  -- El empleado del comercio que validó la visita para evitar fraudes
    regla_sello_id UUID REFERENCES reglas_sellos(id) ON DELETE SET NULL,  -- El empleado del comercio que validó la visita para evitar fraudes
    puntos_ganados INT NOT NULL, -- Evita asumir que el simple acercamiento prueba una compra
    metodo_validacion VARCHAR(50) NOT NULL CHECK (metodo_validacion IN ('NFC', 'QR', 'MANUAL_DASHBOARD')),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_registro VARCHAR(45)
);


-- =================================================================================
-- MÓDULO 5: COMUNIDAD, RED SOCIAL Y MULTIMEDIA (FOTOS / VIDEOS CORTOS)
-- =================================================================================

-- Los usuarios pueden publicar experiencias en la comunidad interna[cite: 1]
CREATE TABLE publicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
    texto_contenido TEXT,
    url_media VARCHAR(255),      -- Soporte para fotos WebP y videos cortos soportados por almacenamiento como Cloudflare R2[cite: 1]
    tipo_media VARCHAR(20) DEFAULT 'IMAGEN' CHECK (tipo_media IN ('IMAGEN', 'VIDEO')),
    url_thumbnail VARCHAR(255), -- Miniatura obligatoria para videos (optimiza el feed)
    duracion_segundos INT DEFAULT 0, -- Validación en BD para limitar la duración de los videos (5-7s)
    visibilidad VARCHAR(20) DEFAULT 'PUBLICA' CHECK (visibilidad IN ('PUBLICA', 'PRIVADA', 'AMIGOS')), -- Controles de privacidad[cite: 1]
    estado_moderacion VARCHAR(20) DEFAULT 'APROBADA' CHECK (estado_moderacion IN ('APROBADA', 'REVISION', 'OCULTA', 'ELIMINADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Soporte para comentarios y reacciones[cite: 1]
CREATE TABLE interacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_interaccion VARCHAR(20) NOT NULL CHECK (tipo_interaccion IN ('REACCION', 'COMENTARIO')),
    comentario TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Herramienta de moderación para denunciar contenido inadecuado[cite: 1]
CREATE TABLE denuncias_moderacion (
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
-- ÍNDICES DE OPTIMIZACIÓN (RENDIMIENTO Y PREVENCIÓN DE FRAUDES)
-- =================================================================================

-- 1. Búsquedas rápidas y validaciones (Login y Hardware)
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_tarjetas_uid ON tarjetas_nfc(uid_nfc);

-- 2. Rankings y gamificación (Top de usuarios con más experiencia/sellos)
CREATE INDEX idx_usuarios_sellos_historicos ON usuarios(total_sellos DESC);

-- 3. Exploración de locales y recompensas
CREATE INDEX idx_establecimientos_categoria ON establecimientos(categoria_id);
CREATE INDEX idx_recompensas_plataforma_estado ON recompensas_plataforma(estado);

-- 4. Motor Antifraude: Crucial para limitar el uso de la tarjeta (Ej. 1 sello por día)
CREATE INDEX idx_visitas_antifraude ON historial_visitas_sellos(usuario_id, establecimiento_id, fecha_hora);

-- 5. Rendimiento de la Red Social: Acelera la carga de videos y fotos en el feed general
CREATE INDEX idx_publicaciones_feed ON publicaciones(estado_moderacion, visibilidad, created_at DESC);
CREATE INDEX idx_publicaciones_tipo_media ON publicaciones(tipo_media);