export interface ActividadRecienteItem {
  id: string;
  usuario_nombre: string;
  usuario_avatar?: string;
  establecimiento_nombre: string;
  puntos_ganados: number;
  metodo_validacion: "NFC" | "QR" | "MANUAL_DASHBOARD" | string;
  fecha_hora: string;
}

export interface TendenciaDiaItem {
  fecha: string;
  dia_nombre: string;
  total_visitas: number;
  total_puntos: number;
  visitas_nfc: number;
  visitas_qr: number;
  nuevos_clientes?: number;
}

export interface DistribucionRolItem {
  rol: string;
  total: number;
}

export interface DistribucionNivelItem {
  nivel: string;
  color_hex?: string;
  total: number;
}

export interface DistribucionMetodoItem {
  metodo: string;
  total: number;
}

export interface TopEstablecimientoItem {
  id: string;
  nombre: string;
  imagen_url?: string;
  total_sellos: number;
  total_puntos: number;
}

export interface ResumenNfc {
  total: number;
  en_stock: number;
  asignadas: number;
  extraviadas: number;
  bloqueadas: number;
}

export interface AdminDashboardData {
  usuarios: number;
  establecimientos_activos: number;
  establecimientos_totales: number;
  visitas_totales: number;
  visitas_hoy: number;
  puntos_hoy: number;
  canjes_totales: number;
  canjes_pendientes: number;
  publicaciones: number;
  tarjetas_nfc: number;
  tarjetas_stock: number;
  reclamaciones_pendientes: number;
  denuncias_pendientes: number;
  actividad_reciente: ActividadRecienteItem[];
  tendencia_7_dias: TendenciaDiaItem[];
  distribucion_roles: DistribucionRolItem[];
  distribucion_niveles: DistribucionNivelItem[];
  distribucion_metodos: DistribucionMetodoItem[];
  top_establecimientos: TopEstablecimientoItem[];
  resumen_nfc: ResumenNfc;
}

export interface AdminUsuarioItem {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  total_sellos: number;
  puntos_globales: number;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO" | "PENDIENTE";
  created_at: string;
  rol_nombre: string;
  nivel_nombre?: string;
  avatar_url?: string;
}

export interface AdminTarjetaItem {
  id: string;
  uid_nfc: string;
  qr_respaldo: string;
  estado: "EN_STOCK" | "ASIGNADA" | "EXTRAVIADA" | "BLOQUEADA";
  fecha_asignacion?: string;
  usuario_nombres?: string;
  usuario_email?: string;
  created_at: string;
}
