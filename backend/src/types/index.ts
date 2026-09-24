import { Request } from "express";

export type UserRole = "CLIENTE" | "COMERCIO" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole | string;
  nombres: string;
  apellidos: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export type AuthRequest = AuthenticatedRequest;

export interface UserDB {
  id: string;
  rol_id: string;
  nivel_id?: string | null;
  nombres: string;
  apellidos: string;
  email: string;
  password_hash: string;
  total_sellos: number;
  puntos_globales: number;
  aceptacion_tyc: boolean;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  created_at: Date;
  rol_nombre?: string;
  nivel_nombre?: string;
}

export interface TarjetaNfcDB {
  id: string;
  usuario_id: string | null;
  uid_nfc: string;
  qr_respaldo: string;
  estado: "EN_STOCK" | "ASIGNADA" | "EXTRAVIADA" | "BLOQUEADA";
  fecha_asignacion?: Date;
  created_at: Date;
}

export interface EstablecimientoDB {
  id: string;
  categoria_id: string | null;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  estado: "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
  created_at: Date;
  categoria_nombre?: string;
}

export interface ReglaSelloDB {
  id: string;
  establecimiento_id: string;
  nombre_accion: string;
  valor_puntos_por_sello: number;
  limite_diario_por_usuario: number;
  estado: "ACTIVA" | "INACTIVA";
  created_at: Date;
}

export interface PublicacionDB {
  id: string;
  usuario_id: string;
  establecimiento_id: string | null;
  texto_contenido: string | null;
  url_media: string | null;
  tipo_media: "IMAGEN" | "VIDEO";
  url_thumbnail: string | null;
  duracion_segundos: number;
  visibilidad: "PUBLICA" | "PRIVADA" | "AMIGOS";
  estado_moderacion: "APROBADA" | "REVISION" | "OCULTA" | "ELIMINADA";
  created_at: Date;
  autor_nombres?: string;
  autor_apellidos?: string;
  establecimiento_nombre?: string;
}

export interface RecompensaDB {
  id: string;
  nombre_recompensa: string;
  descripcion: string | null;
  costo_puntos_globales: number;
  stock_disponible: number | null;
  imagen_url: string | null;
  tipo_entrega: "OFICINA_CENTRAL" | "LOCAL_ALIADO" | "VIRTUAL";
  estado: "ACTIVA" | "AGOTADA" | "FINALIZADA";
  created_at: Date;
}
