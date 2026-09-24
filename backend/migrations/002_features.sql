BEGIN;
CREATE TABLE IF NOT EXISTS historias (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 media_url TEXT NOT NULL, media_type VARCHAR(5) NOT NULL CHECK(media_type IN ('image','video')),
 caption VARCHAR(500) NOT NULL DEFAULT '', filtro VARCHAR(40) NOT NULL DEFAULT 'none',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours');
CREATE INDEX IF NOT EXISTS historias_expiry ON historias(expires_at);
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION CHECK(lat BETWEEN -90 AND 90);
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION CHECK(lng BETWEEN -180 AND 180);
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS horario TEXT;
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
CREATE TABLE IF NOT EXISTS auth_tokens (token_hash TEXT PRIMARY KEY, usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, purpose TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS qr_consumidos (jti UUID PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL);
DELETE FROM interacciones a USING interacciones b WHERE a.tipo_interaccion='REACCION' AND b.tipo_interaccion='REACCION' AND a.publicacion_id=b.publicacion_id AND a.usuario_id=b.usuario_id AND a.id>b.id;
CREATE UNIQUE INDEX IF NOT EXISTS reaccion_unica ON interacciones(publicacion_id,usuario_id) WHERE tipo_interaccion='REACCION';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS username VARCHAR(60);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE reglas_sellos ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ;
ALTER TABLE reglas_sellos ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMPTZ;
ALTER TABLE publicaciones ALTER COLUMN url_media TYPE TEXT;
COMMIT;
