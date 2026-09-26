-- =================================================================================
-- PASAPORTE DIGITAL NFC — ESQUEMA COMPLETO POSTGRESQL (23 TABLAS)
-- Compatible con PostgreSQL 14+ / 17
-- =================================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- BLOQUE 1: BASE ADMINISTRATIVA, LOCALES Y CAPA LEGAL MÍNIMA
-- =================================================================================

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(150),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1))
);

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN_GENERAL', 'Administrador general de Pasaporte Digital'),
('ADMIN_LOCAL', 'Administrador de establecimiento afiliado'),
('TRABAJADOR_LOCAL', 'Trabajador autorizado del establecimiento'),
('CLIENTE', 'Cliente usuario del Pasaporte Digital')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 2. CONFIGURACION_SISTEMA
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id_configuracion SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(150) NOT NULL DEFAULT 'Pasaporte Digital',
    logo_principal VARCHAR(255),
    logo_reducido VARCHAR(255),
    correo_soporte VARCHAR(150),
    telefono_soporte VARCHAR(20),
    color_primario VARCHAR(20) DEFAULT '#9B1B30',
    color_secundario VARCHAR(20) DEFAULT '#D4AF37',
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    foto_perfil VARCHAR(255),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(id_rol);

-- 4. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    codigo_cliente VARCHAR(30) UNIQUE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1))
);

-- 5. ESTABLECIMIENTOS
CREATE TABLE IF NOT EXISTS establecimientos (
    id_establecimiento BIGSERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(150) NOT NULL,
    razon_social VARCHAR(180),
    ruc VARCHAR(11) UNIQUE,
    descripcion TEXT,
    logo VARCHAR(255),
    imagen_portada VARCHAR(255),
    email VARCHAR(150),
    telefono VARCHAR(20),
    fecha_afiliacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO'))
);

-- 6. SUCURSALES
CREATE TABLE IF NOT EXISTS sucursales (
    id_sucursal BIGSERIAL PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL REFERENCES establecimientos(id_establecimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(120) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    telefono VARCHAR(20),
    es_principal SMALLINT NOT NULL DEFAULT 0 CHECK (es_principal IN (0,1)),
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sucursales_establecimiento ON sucursales(id_establecimiento);

-- 7. DOCUMENTOS_LEGALES
CREATE TABLE IF NOT EXISTS documentos_legales (
    id_documento BIGSERIAL PRIMARY KEY,
    tipo_documento VARCHAR(40) NOT NULL CHECK (tipo_documento IN ('POLITICA_PRIVACIDAD', 'TERMINOS_CONDICIONES', 'POLITICA_COOKIES', 'CONSENTIMIENTO_MARKETING')),
    titulo VARCHAR(180) NOT NULL,
    version VARCHAR(20) NOT NULL,
    contenido_url VARCHAR(255) NOT NULL,
    fecha_publicacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vigencia TIMESTAMP WITH TIME ZONE NOT NULL,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    CONSTRAINT uq_documentos_tipo_version UNIQUE (tipo_documento, version)
);

-- 8. ACEPTACIONES_LEGALES
CREATE TABLE IF NOT EXISTS aceptaciones_legales (
    id_aceptacion BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_documento BIGINT NOT NULL REFERENCES documentos_legales(id_documento) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_aceptacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    CONSTRAINT uq_aceptacion_usuario_documento UNIQUE (id_usuario, id_documento)
);

-- 9. SOLICITUDES_DATOS_PERSONALES (ARCO)
CREATE TABLE IF NOT EXISTS solicitudes_datos_personales (
    id_solicitud BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    tipo_solicitud VARCHAR(30) NOT NULL CHECK (tipo_solicitud IN ('ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION')),
    detalle TEXT NOT NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    respuesta TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA' CHECK (estado IN ('REGISTRADA', 'EN_REVISION', 'ATENDIDA', 'RECHAZADA', 'CERRADA'))
);

-- 10. RECLAMACIONES (Libro de Reclamaciones Indecopi)
CREATE TABLE IF NOT EXISTS reclamaciones (
    id_reclamacion BIGSERIAL PRIMARY KEY,
    codigo_reclamacion VARCHAR(40) UNIQUE NOT NULL,
    id_usuario BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_establecimiento BIGINT REFERENCES establecimientos(id_establecimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal BIGINT REFERENCES sucursales(id_sucursal) ON UPDATE CASCADE ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECLAMO', 'QUEJA')),
    nombres_consumidor VARCHAR(120) NOT NULL,
    apellidos_consumidor VARCHAR(120) NOT NULL,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(150) NOT NULL,
    descripcion_bien_servicio TEXT,
    monto_reclamado NUMERIC(10,2) CHECK (monto_reclamado IS NULL OR monto_reclamado >= 0),
    detalle TEXT NOT NULL,
    pedido_consumidor TEXT NOT NULL,
    respuesta_proveedor TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_respuesta DATE,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'EN_REVISION', 'RESPONDIDO', 'CERRADO'))
);

CREATE INDEX IF NOT EXISTS idx_reclamaciones_estado ON reclamaciones(estado);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_fecha ON reclamaciones(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_establecimiento ON reclamaciones(id_establecimiento);

-- =================================================================================
-- BLOQUE 2: PERSONAL POR SEDE, HARDWARE NFC Y PROGRAMAS DE FIDELIZACIÓN
-- =================================================================================

-- 11. USUARIO_SUCURSAL
CREATE TABLE IF NOT EXISTS usuario_sucursal (
    id_usuario_sucursal BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal BIGINT NOT NULL REFERENCES sucursales(id_sucursal) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    CONSTRAINT uq_usuario_sucursal UNIQUE (id_usuario, id_sucursal)
);

CREATE INDEX IF NOT EXISTS idx_usuario_sucursal_usuario ON usuario_sucursal(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_sucursal_sucursal ON usuario_sucursal(id_sucursal);

-- 12. TARJETAS_NFC
CREATE TABLE IF NOT EXISTS tarjetas_nfc (
    id_tarjeta BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    uid_nfc VARCHAR(100) UNIQUE NOT NULL,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    es_principal SMALLINT NOT NULL DEFAULT 0 CHECK (es_principal IN (0,1)),
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'ACTIVA', 'BLOQUEADA', 'PERDIDA', 'DANADA', 'REEMPLAZADA')),
    fecha_activacion TIMESTAMP WITH TIME ZONE,
    fecha_bloqueo TIMESTAMP WITH TIME ZONE,
    motivo_bloqueo VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_cliente ON tarjetas_nfc(id_cliente);
CREATE INDEX IF NOT EXISTS idx_tarjetas_estado ON tarjetas_nfc(estado);

-- 13. HISTORIAL_TARJETA_NFC
CREATE TABLE IF NOT EXISTS historial_tarjeta_nfc (
    id_historial BIGSERIAL PRIMARY KEY,
    id_tarjeta BIGINT NOT NULL REFERENCES tarjetas_nfc(id_tarjeta) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_usuario_accion BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    accion VARCHAR(30) NOT NULL CHECK (accion IN ('REGISTRO', 'ASIGNACION', 'ACTIVACION', 'BLOQUEO', 'PERDIDA', 'DANO', 'REEMPLAZO', 'REACTIVACION')),
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    motivo VARCHAR(255),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_tarjeta_id ON historial_tarjeta_nfc(id_tarjeta);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_tarjeta_nfc(id_usuario_accion);

-- 14. PROGRAMAS_SELLOS
CREATE TABLE IF NOT EXISTS programas_sellos (
    id_programa BIGSERIAL PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL REFERENCES establecimientos(id_establecimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255),
    meta_sellos INT NOT NULL CHECK (meta_sellos > 0),
    max_sellos_visita INT NOT NULL DEFAULT 1 CHECK (max_sellos_visita > 0),
    max_sellos_dia INT,
    nombre_sello VARCHAR(100),
    imagen_sello VARCHAR(255) NOT NULL,
    color_sello VARCHAR(20),
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('BORRADOR', 'ACTIVO', 'INACTIVO', 'FINALIZADO')),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programas_establecimiento ON programas_sellos(id_establecimiento);
CREATE INDEX IF NOT EXISTS idx_programas_estado ON programas_sellos(estado);

-- 15. REGLAS_PUNTOS
CREATE TABLE IF NOT EXISTS reglas_puntos (
    id_regla BIGSERIAL PRIMARY KEY,
    id_programa BIGINT NOT NULL REFERENCES programas_sellos(id_programa) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(120) NOT NULL,
    tipo_regla VARCHAR(30) NOT NULL CHECK (tipo_regla IN ('POR_SELLO', 'POR_VISITA', 'POR_MONTO', 'BONIFICACION')),
    valor NUMERIC(10,2) NOT NULL,
    limite_diario NUMERIC(10,2),
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    prioridad INT NOT NULL DEFAULT 1,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reglas_programa ON reglas_puntos(id_programa);

-- =================================================================================
-- BLOQUE 3: VISITAS, SELLOS DIGITALES Y MOVIMIENTOS DE PUNTOS
-- =================================================================================

-- 16. VISITAS
CREATE TABLE IF NOT EXISTS visitas (
    id_visita BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_tarjeta BIGINT NOT NULL REFERENCES tarjetas_nfc(id_tarjeta) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal BIGINT NOT NULL REFERENCES sucursales(id_sucursal) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_usuario_validador BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA' CHECK (estado IN ('CONFIRMADA', 'ANULADA')),
    observacion VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitas_cliente ON visitas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_visitas_tarjeta ON visitas(id_tarjeta);
CREATE INDEX IF NOT EXISTS idx_visitas_sucursal ON visitas(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_visitas_validador ON visitas(id_usuario_validador);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha_hora ON visitas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_visitas_estado ON visitas(estado);

-- 17. SELLOS_DIGITALES
CREATE TABLE IF NOT EXISTS sellos_digitales (
    id_sello BIGSERIAL PRIMARY KEY,
    id_visita BIGINT NOT NULL REFERENCES visitas(id_visita) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_programa BIGINT NOT NULL REFERENCES programas_sellos(id_programa) ON UPDATE CASCADE ON DELETE RESTRICT,
    numero_sello INT,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_otorgamiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'OTORGADO' CHECK (estado IN ('OTORGADO', 'ANULADO')),
    fecha_anulacion TIMESTAMP WITH TIME ZONE,
    motivo_anulacion VARCHAR(255),
    CONSTRAINT uq_sello_visita_programa UNIQUE (id_visita, id_programa)
);

CREATE INDEX IF NOT EXISTS idx_sellos_visita ON sellos_digitales(id_visita);
CREATE INDEX IF NOT EXISTS idx_sellos_programa ON sellos_digitales(id_programa);
CREATE INDEX IF NOT EXISTS idx_sellos_fecha ON sellos_digitales(fecha_otorgamiento);
CREATE INDEX IF NOT EXISTS idx_sellos_estado ON sellos_digitales(estado);

-- 19. RECOMPENSAS (Declarada antes de movimientos por referencia FK opcional de canjes)
CREATE TABLE IF NOT EXISTS recompensas (
    id_recompensa BIGSERIAL PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL REFERENCES establecimientos(id_establecimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    imagen VARCHAR(255),
    puntos_requeridos INT NOT NULL CHECK (puntos_requeridos > 0),
    stock INT,
    stock_ilimitado SMALLINT NOT NULL DEFAULT 0 CHECK (stock_ilimitado IN (0,1)),
    max_canjes_cliente INT,
    max_canjes_dia INT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('BORRADOR', 'ACTIVA', 'INACTIVA', 'VENCIDA')),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recompensas_establecimiento ON recompensas(id_establecimiento);
CREATE INDEX IF NOT EXISTS idx_recompensas_estado ON recompensas(estado);

-- 20. RECOMPENSA_SUCURSAL
CREATE TABLE IF NOT EXISTS recompensa_sucursal (
    id_recompensa_sucursal BIGSERIAL PRIMARY KEY,
    id_recompensa BIGINT NOT NULL REFERENCES recompensas(id_recompensa) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal BIGINT NOT NULL REFERENCES sucursales(id_sucursal) ON UPDATE CASCADE ON DELETE RESTRICT,
    estado SMALLINT NOT NULL DEFAULT 1 CHECK (estado IN (0,1)),
    CONSTRAINT uq_recompensa_sucursal UNIQUE (id_recompensa, id_sucursal)
);

CREATE INDEX IF NOT EXISTS idx_rec_suc_recompensa ON recompensa_sucursal(id_recompensa);
CREATE INDEX IF NOT EXISTS idx_rec_suc_sucursal ON recompensa_sucursal(id_sucursal);

-- 21. CANJES
CREATE TABLE IF NOT EXISTS canjes (
    id_canje BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_recompensa BIGINT NOT NULL REFERENCES recompensas(id_recompensa) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal BIGINT REFERENCES sucursales(id_sucursal) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_usuario_validador BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    codigo_canje VARCHAR(60) UNIQUE NOT NULL,
    puntos_canje INT NOT NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    fecha_cancelacion TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CANJEADO', 'CANCELADO', 'VENCIDO')),
    motivo_cancelacion VARCHAR(255),
    observacion VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_canjes_cliente ON canjes(id_cliente);
CREATE INDEX IF NOT EXISTS idx_canjes_recompensa ON canjes(id_recompensa);
CREATE INDEX IF NOT EXISTS idx_canjes_sucursal ON canjes(id_sucursal);
CREATE INDEX IF NOT EXISTS idx_canjes_validador ON canjes(id_usuario_validador);
CREATE INDEX IF NOT EXISTS idx_canjes_estado ON canjes(estado);
CREATE INDEX IF NOT EXISTS idx_canjes_fecha_solicitud ON canjes(fecha_solicitud);

-- 18. MOVIMIENTOS_PUNTOS
CREATE TABLE IF NOT EXISTS movimientos_puntos (
    id_movimiento BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_programa BIGINT REFERENCES programas_sellos(id_programa) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_visita BIGINT REFERENCES visitas(id_visita) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sello BIGINT REFERENCES sellos_digitales(id_sello) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_canje BIGINT REFERENCES canjes(id_canje) ON UPDATE CASCADE ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('GANANCIA_VISITA', 'GANANCIA_SELLO', 'BONIFICACION', 'CANJE', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'REVERSO')),
    cantidad INT NOT NULL,
    saldo_anterior INT NOT NULL,
    saldo_posterior INT NOT NULL,
    descripcion VARCHAR(255),
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_accion BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_movimientos_cliente ON movimientos_puntos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_movimientos_programa ON movimientos_puntos(id_programa);
CREATE INDEX IF NOT EXISTS idx_movimientos_visita ON movimientos_puntos(id_visita);
CREATE INDEX IF NOT EXISTS idx_movimientos_sello ON movimientos_puntos(id_sello);
CREATE INDEX IF NOT EXISTS idx_movimientos_canje ON movimientos_puntos(id_canje);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_puntos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_puntos(tipo_movimiento);

-- =================================================================================
-- BLOQUE 5: NOTIFICACIONES Y AUDITORÍA GENERAL
-- =================================================================================

-- 22. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    tipo_notificacion VARCHAR(40) NOT NULL CHECK (tipo_notificacion IN ('SELLO_OBTENIDO', 'PUNTOS_GANADOS', 'CANJE_GENERADO', 'CANJE_UTILIZADO', 'CANJE_VENCIMIENTO', 'RECOMPENSA_DISPONIBLE', 'TARJETA_BLOQUEADA', 'TARJETA_REEMPLAZADA', 'RECLAMACION_RESPONDIDA', 'SISTEMA')),
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    canal VARCHAR(20) NOT NULL DEFAULT 'APP' CHECK (canal IN ('APP', 'EMAIL', 'PUSH')),
    estado_envio VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_envio IN ('PENDIENTE', 'ENVIADA', 'FALLIDA')),
    leida SMALLINT NOT NULL DEFAULT 0 CHECK (leida IN (0,1)),
    fecha_programada TIMESTAMP WITH TIME ZONE,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    referencia_tipo VARCHAR(30),
    referencia_id BIGINT,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado_envio ON notificaciones(estado_envio);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion);

-- 23. AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    modulo VARCHAR(50) NOT NULL CHECK (modulo IN ('USUARIOS', 'CLIENTES', 'ESTABLECIMIENTOS', 'SUCURSALES', 'NFC', 'PROGRAMAS', 'VISITAS', 'SELLOS', 'PUNTOS', 'RECOMPENSAS', 'CANJES', 'RECLAMACIONES', 'DOCUMENTOS_LEGALES', 'CONFIGURACION')),
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('CREAR', 'EDITAR', 'ACTIVAR', 'DESACTIVAR', 'BLOQUEAR', 'REEMPLAZAR', 'CONFIRMAR', 'ANULAR', 'CANJEAR', 'RESPONDER', 'LOGIN', 'LOGIN_FALLIDO', 'CAMBIO_ESTADO', 'AJUSTE_PUNTOS')),
    entidad VARCHAR(50),
    id_entidad BIGINT,
    descripcion VARCHAR(500),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo ON auditoria(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_hora ON auditoria(fecha_hora);