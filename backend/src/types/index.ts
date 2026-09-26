import { Request } from "express";

export type UserRole =
  | "ADMIN_GENERAL"
  | "ADMIN_LOCAL"
  | "TRABAJADOR_LOCAL"
  | "CLIENTE";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole | string;
  nombres: string;
  apellidos: string;
  id_cliente?: number | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export type AuthRequest = AuthenticatedRequest;

export interface UsuarioDB {
  id_usuario: number;
  id_rol: number;
  email: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  foto_perfil: string | null;
  estado: number;
  ultimo_acceso: Date | null;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  rol_nombre?: string;
  id_cliente?: number;
  codigo_cliente?: string;
}

export interface ClienteDB {
  id_cliente: number;
  id_usuario: number;
  codigo_cliente: string;
  fecha_registro: Date;
  estado: number;
}

export interface EstablecimientoDB {
  id_establecimiento: number;
  nombre_comercial: string;
  razon_social: string | null;
  ruc: string | null;
  descripcion: string | null;
  logo: string | null;
  imagen_portada: string | null;
  email: string | null;
  telefono: string | null;
  fecha_afiliacion: Date;
  estado: "PENDIENTE" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";
}

export interface SucursalDB {
  id_sucursal: number;
  id_establecimiento: number;
  nombre: string;
  direccion: string;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  es_principal: number;
  estado: number;
  fecha_creacion: Date;
}

export interface TarjetaNfcDB {
  id_tarjeta: number;
  id_cliente: number | null;
  uid_nfc: string;
  codigo_interno: string;
  es_principal: number;
  estado:
    | "DISPONIBLE"
    | "ACTIVA"
    | "BLOQUEADA"
    | "PERDIDA"
    | "DANADA"
    | "REEMPLAZADA";
  fecha_activacion: Date | null;
  fecha_bloqueo: Date | null;
  motivo_bloqueo: string | null;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface ProgramaSellosDB {
  id_programa: number;
  id_establecimiento: number;
  nombre: string;
  descripcion: string | null;
  meta_sellos: number;
  max_sellos_visita: number;
  max_sellos_dia: number | null;
  nombre_sello: string | null;
  imagen_sello: string;
  color_sello: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  estado: "BORRADOR" | "ACTIVO" | "INACTIVO" | "FINALIZADO";
  fecha_creacion: Date;
}

export interface ReglaPuntosDB {
  id_regla: number;
  id_programa: number;
  nombre: string;
  tipo_regla: "POR_SELLO" | "POR_VISITA" | "POR_MONTO" | "BONIFICACION";
  valor: number;
  limite_diario: number | null;
  prioridad: number;
  estado: number;
}

export interface VisitaDB {
  id_visita: number;
  id_cliente: number;
  id_tarjeta: number;
  id_sucursal: number;
  id_usuario_validador: number;
  fecha_hora: Date;
  estado: "CONFIRMADA" | "ANULADA";
  observacion: string | null;
  fecha_creacion: Date;
}

export interface SelloDigitalDB {
  id_sello: number;
  id_visita: number;
  id_programa: number;
  numero_sello: number | null;
  cantidad: number;
  fecha_otorgamiento: Date;
  estado: "OTORGADO" | "ANULADO";
}

export interface MovimientoPuntosDB {
  id_movimiento: number;
  id_cliente: number;
  id_programa: number | null;
  id_visita: number | null;
  id_sello: number | null;
  id_canje: number | null;
  tipo_movimiento:
    | "GANANCIA_VISITA"
    | "GANANCIA_SELLO"
    | "BONIFICACION"
    | "CANJE"
    | "AJUSTE_POSITIVO"
    | "AJUSTE_NEGATIVO"
    | "REVERSO";
  cantidad: number;
  saldo_anterior: number;
  saldo_posterior: number;
  descripcion: string | null;
  fecha_movimiento: Date;
  id_usuario_accion: number | null;
}

export interface RecompensaDB {
  id_recompensa: number;
  id_establecimiento: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  puntos_requeridos: number;
  stock: number | null;
  stock_ilimitado: number;
  max_canjes_cliente: number | null;
  max_canjes_dia: number | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  estado: "BORRADOR" | "ACTIVA" | "INACTIVA" | "VENCIDA";
  fecha_creacion: Date;
}

export interface CanjeDB {
  id_canje: number;
  id_cliente: number;
  id_recompensa: number;
  id_sucursal: number | null;
  id_usuario_validador: number | null;
  codigo_canje: string;
  puntos_canje: number;
  fecha_solicitud: Date;
  fecha_expiracion: Date | null;
  fecha_validacion: Date | null;
  fecha_cancelacion: Date | null;
  estado: "PENDIENTE" | "CANJEADO" | "CANCELADO" | "VENCIDO";
  motivo_cancelacion: string | null;
  observacion: string | null;
}
