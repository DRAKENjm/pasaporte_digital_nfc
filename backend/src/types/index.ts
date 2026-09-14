import { Request } from 'express';
export type UserRole = 'CLIENTE' | 'COMERCIO' | 'ADMIN';

// 1. AuthUser (lo que viaja dentro del token JWT)
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

// 2. Interfaz del Usuario
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
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  created_at: Date;
  rol_nombre?: string; 
}

// 3. Nueva interfaz para la tarjeta NFC del usuario :)
export interface TarjetaNfcDB {
  id: string;
  usuario_id: string;
  uid_nfc: string;
  qr_respaldo: string;
  estado: 'EN_STOCK' | 'ASIGNADA' | 'EXTRAVIADA' | 'BLOQUEADA';
  fecha_asignacion?: Date;
  created_at: Date;
}

// 4. Interfaz para las reglas que el comercio define para dar puntos :)
export interface ReglaSelloDB {
  id: string;
  establecimiento_id: string;
  nombre_accion: string;
  valor_puntos_por_sello: number;
  limite_diario_por_usuario: number;
  estado: 'ACTIVA' | 'INACTIVA';
  created_at: Date;
}