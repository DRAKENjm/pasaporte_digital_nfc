export type UserRole = 'CLIENTE' | 'COMERCIO' | 'ADMIN' | 'USER' | 'COMMERCE';

export interface User {
  id: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  fullName?: string;
  rol?: string;
  role?: string;
  total_sellos?: number;
  puntos_globales?: number;
  nivel?: string;
  nivel_nombre?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface Publicacion {
  id: string;
  usuario_id: string;
  establecimiento_id?: string;
  texto_contenido?: string;
  url_media?: string;
  tipo_media: 'IMAGEN' | 'VIDEO' | 'image' | 'video';
  url_thumbnail?: string;
  duracion_segundos?: number;
  visibilidad?: string;
  estado_moderacion?: string;
  created_at: string;
  autor_nombres?: string;
  autor_apellidos?: string;
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

export interface VisitaHistorial {
  id: string;
  establecimiento_nombre?: string;
  comercio?: string;
  puntos_ganados: number;
  metodo_validacion?: string;
  fecha_hora: string;
}

export interface Wallet {
  balance: number;
  currentLevel: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
  lifetimePoints: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  imageUrl?: string;
  commerceId?: string;
  isActive: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
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
