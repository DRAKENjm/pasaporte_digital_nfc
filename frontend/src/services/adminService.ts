import api from "./api";
import { AdminDashboardData, AdminUsuarioItem, AdminTarjetaItem } from "../types/admin";
import { ReglaSello, Recompensa, NivelPasaporte } from "../types";

export const adminService = {
  /** Obtiene las estadísticas y analítica global para el dashboard */
  async getDashboard(): Promise<AdminDashboardData> {
    const { data } = await api.get("/admin/dashboard");
    return data?.data ?? data;
  },

  /** Obtiene usuarios con filtros */
  async getUsuarios(params?: { rol?: string; estado?: string; q?: string }): Promise<AdminUsuarioItem[]> {
    const { data } = await api.get("/admin/usuarios", { params });
    return data?.data ?? data ?? [];
  },

  /** Cambia el estado de un usuario (ACTIVO, BLOQUEADO, etc.) */
  async cambiarEstadoUsuario(id: string, estado: string): Promise<any> {
    const { data } = await api.patch(`/admin/usuarios/${id}/estado`, { estado });
    return data;
  },

  /** Cambia el rol de un usuario */
  async cambiarRolUsuario(id: string, rol_id: string): Promise<any> {
    const { data } = await api.patch(`/admin/usuarios/${id}/rol`, { rol_id });
    return data;
  },

  /** Obtiene tarjetas NFC con filtros */
  async getTarjetas(params?: { estado?: string; q?: string }): Promise<AdminTarjetaItem[]> {
    const { data } = await api.get("/admin/tarjetas", { params });
    return data?.data ?? data ?? [];
  },

  /** Registra lote de tarjetas NFC en stock */
  async registrarTarjetasStock(tarjetas: Array<{ uid_nfc: string; qr_respaldo: string }>): Promise<any> {
    const { data } = await api.post("/admin/tarjetas/stock", { tarjetas });
    return data;
  },

  /** Cambia el estado de una tarjeta NFC */
  async cambiarEstadoTarjeta(id: string, estado: string): Promise<any> {
    const { data } = await api.patch(`/admin/tarjetas/${id}/estado`, { estado });
    return data;
  },

  /** Obtiene reglas de sellos */
  async getReglasSellos(): Promise<ReglaSello[]> {
    const { data } = await api.get("/admin/reglas-sellos");
    return data?.data ?? data ?? [];
  },

  /** Crea una regla de sello */
  async crearReglaSello(payload: Partial<ReglaSello>): Promise<ReglaSello> {
    const { data } = await api.post("/admin/reglas-sellos", payload);
    return data?.data ?? data;
  },

  /** Actualiza una regla de sello */
  async actualizarReglaSello(id: string, payload: Partial<ReglaSello>): Promise<ReglaSello> {
    const { data } = await api.patch(`/admin/reglas-sellos/${id}`, payload);
    return data?.data ?? data;
  },

  /** Obtiene catálogo de recompensas */
  async getRecompensas(): Promise<Recompensa[]> {
    const { data } = await api.get("/admin/recompensas");
    return data?.data ?? data ?? [];
  },

  /** Obtiene niveles de pasaporte */
  async getNiveles(): Promise<NivelPasaporte[]> {
    const { data } = await api.get("/admin/niveles");
    return data?.data ?? data ?? [];
  },

  /** Obtiene roles del sistema */
  async getRoles(): Promise<Array<{ id: string; nombre: string; descripcion?: string }>> {
    const { data } = await api.get("/admin/roles");
    return data?.data ?? data ?? [];
  },
};
