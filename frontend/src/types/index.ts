export type UserRole = "CLIENTE" | "COMERCIO" | "ADMIN" | "USER" | "COMMERCE";

export type NivelNombre = "Bronce" | "Plata" | "Oro" | "Diamante" | string;

export interface User {
  id: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  fullName?: string;
  /** Apodo visible en comunidad */
  username?: string;
  apodo?: string;
  rol?: string;
  role?: string;
  total_sellos?: number;
  puntos_globales?: number;
  nivel?: string;
  nivel_nombre?: NivelNombre;
  nivel_color?: string;
  avatarUrl?: string;
  avatar_url?: string;
  phone?: string;
  telefono?: string;
}

export interface NivelPasaporte {
  id: string;
  nombre_rango: NivelNombre;
  sellos_requeridos: number;
  color_hex?: string;
  insignia_url?: string;
}

export interface CategoriaEstablecimiento {
  id: string;
  nombre: string;
  icono_url?: string | null;
  estado: boolean;
  total_locales?: number;
  created_at?: string;
}

export interface Establecimiento {
  id: string;
  razon_social: string;
  nombre?: string;
  direccion?: string;
  ruc?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  lat?: number;
  lng?: number;
  imagen_url?: string;
  imagenes?: string[];
  descripcion?: string;
  estado?: string;
  telefono?: string;
  horario?: string;
  google_maps_url?: string;
}

export interface ReglaSello {
  id: string;
  establecimiento_id: string;
  establecimiento_nombre?: string;
  nombre_accion: string;
  valor_puntos_por_sello: number;
  limite_diario_por_usuario: number;
  estado: "ACTIVA" | "INACTIVA" | string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  created_at?: string;
}

export interface Publicacion {
  id: string;
  usuario_id: string;
  establecimiento_id?: string;
  texto_contenido?: string;
  url_media?: string;
  tipo_media: "IMAGEN" | "VIDEO" | "image" | "video";
  url_thumbnail?: string;
  duracion_segundos?: number;
  visibilidad?: string;
  estado_moderacion?: string;
  created_at: string;
  autor_nombres?: string;
  autor_apellidos?: string;
  autor_username?: string;
  autor_avatar?: string;
  establecimiento_nombre?: string;
  likes_count?: number;
  has_liked?: boolean;
}

export interface Recompensa {
  id: string;
  nombre_recompensa: string;
  descripcion?: string;
  costo_puntos_globales: number;
  stock_disponible?: number;
  imagen_url?: string;
  tipo_entrega?: string;
  direccion_recojo?: string;
  estado?: string;
}

export interface CanjeHistorial {
  id: string;
  puntos_gastados: number;
  estado_entrega: "PENDIENTE_RECOJO" | "ENTREGADO" | "CANCELADO";
  fecha_canje: string;
  fecha_entrega?: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_avatar?: string;
  recompensa_id: string;
  nombre_recompensa: string;
  recompensa_imagen?: string;
  tipo_entrega?: string;
  direccion_recojo?: string;
}

export interface VisitaHistorial {
  id: string;
  establecimiento_nombre?: string;
  comercio?: string;
  puntos_ganados: number;
  metodo_validacion?: string;
  fecha_hora: string;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion?: string;
  completado: boolean;
  icono?: string;
  sellos_requeridos?: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl: string;
  mediaType: "video" | "image";
  thumbnailUrl?: string;
  durationSeconds?: number;
  likesCount: number;
  hasLiked?: boolean;
  createdAt: string;
}

export interface VisitValidationResponse {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  currentLevel: string;
  commerceName: string;
  message: string;
}
