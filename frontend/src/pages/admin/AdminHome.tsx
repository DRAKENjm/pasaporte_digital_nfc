import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { AdminDashboardData } from "../../types/admin";
import { ProgressBarLoader } from "../../components/common/ProgressBarLoader";
import { AdminKpiCard } from "./components/AdminKpiCard";
import { AdminActivityChart } from "./components/AdminActivityChart";
import { AdminEcosystemDonut } from "./components/AdminEcosystemDonut";
import { AdminBottomRow } from "./components/AdminBottomRow";
import {
  Users,
  Building2,
  Award,
  CreditCard,
  Gift,
  FileText,
  RotateCw,
  Plus,
} from "lucide-react";

export const AdminHome: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await adminService.getDashboard();
      setData(res);
    } catch (error) {
      console.error("Error al cargar dashboard admin:", error);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <ProgressBarLoader text="Conectando al Panel Administrativo..." />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Encabezado del Dashboard con Título y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Panel Administrativo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona y monitorea el ecosistema de Pasaporte NFC
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-60"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin text-teal-600" : ""}`}
            />
            <span>Actualizar</span>
          </button>

          <Link
            to="/admin/tarjetas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#132A38] hover:bg-[#1A384A] text-teal-300 border border-teal-500/30 transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Nuevo lote NFC</span>
          </Link>
        </div>
      </div>

      {/* 2. Grid de 6 Tarjetas KPI (3 columnas x 2 filas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AdminKpiCard
          title="Usuarios"
          value={data?.usuarios ?? 0}
          icon={Users}
          to="/admin/usuarios"
          type="curve"
          colorScheme="teal"
          badgeText="Comunidad"
        />

        <AdminKpiCard
          title="Locales Aliados"
          value={data?.establecimientos_totales ?? 0}
          icon={Building2}
          to="/admin/locales"
          type="bars-green"
          colorScheme="emerald"
          badgeText={`${data?.establecimientos_activos ?? 0} Activos`}
        />

        <AdminKpiCard
          title="Sellos Validados"
          value={data?.visitas_totales ?? 0}
          icon={Award}
          to="/admin/reglas"
          type="bars-amber"
          colorScheme="amber"
          badgeText="Pasaporte"
        />

        <AdminKpiCard
          title="Tarjetas NFC"
          value={data?.tarjetas_nfc ?? 0}
          icon={CreditCard}
          to="/admin/tarjetas"
          type="curve"
          colorScheme="indigo"
          badgeText="Hardware"
        />

        <AdminKpiCard
          title="Recompensas"
          value={data?.canjes_totales ?? 0}
          icon={Gift}
          to="/admin/recompensas"
          type="bars-purple"
          colorScheme="purple"
          badgeText="Premios"
        />

        <AdminKpiCard
          title="Reclamaciones"
          value={data?.reclamaciones_pendientes ?? 0}
          icon={FileText}
          to="/admin/reclamaciones"
          type="curve"
          colorScheme="rose"
          badgeText={Number(data?.reclamaciones_pendientes ?? 0) > 0 ? "Pendientes" : "Al día"}
        />
      </div>

      {/* 3. Fila de Gráficos (Actividad de Sellos + Distribución del Ecosistema) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AdminActivityChart data={data?.tendencia_7_dias ?? []} />
        </div>
        <div className="lg:col-span-1">
          <AdminEcosystemDonut data={data} />
        </div>
      </div>

      {/* 4. Fila Inferior (Estado Red NFC + Recompensas y Canjes + Top Locales) */}
      <AdminBottomRow data={data} />
    </div>
  );
};
