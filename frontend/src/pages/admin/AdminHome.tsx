import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import {
  Users,
  Building2,
  Award,
  Gift,
  CreditCard,
  FileText,
  ArrowRight,
  Clock,
  Nfc,
  QrCode,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface ActividadItem {
  id: string;
  usuario_nombre: string;
  establecimiento_nombre: string;
  puntos_ganados: number;
  metodo_validacion: string;
  fecha_hora: string;
}

interface DashboardStats {
  usuarios?: number;
  establecimientos_activos?: number;
  visitas_totales?: number;
  visitas_hoy?: number;
  canjes_totales?: number;
  publicaciones?: number;
  tarjetas_nfc?: number;
  tarjetas_stock?: number;
  reclamaciones_pendientes?: number;
  actividad_reciente?: ActividadItem[];
}

export const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/dashboard");
        setStats(data?.data ?? data ?? {});
      } catch {
        /* opcional */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const metricCards = [
    {
      label: "Usuarios Totales",
      value: stats.usuarios ?? 0,
      subtext: "Clientes, Comercios y Administradores",
      icon: Users,
      to: "/admin/usuarios",
    },
    {
      label: "Locales Aliados",
      value: stats.establecimientos_activos ?? 0,
      subtext: "Establecimientos activos en red",
      icon: Building2,
      to: "/admin/locales",
    },
    {
      label: "Sellos Validados",
      value: stats.visitas_totales ?? 0,
      subtext: `${stats.visitas_hoy ?? 0} validados hoy`,
      icon: Award,
      to: "/admin/reglas",
    },
    {
      label: "Canjes Realizados",
      value: stats.canjes_totales ?? 0,
      subtext: "Premios y beneficios entregados",
      icon: Gift,
      to: "/admin/recompensas",
    },
    {
      label: "Tarjetas NFC Físicas",
      value: stats.tarjetas_nfc ?? 0,
      subtext: `${stats.tarjetas_stock ?? 0} disponibles en stock`,
      icon: CreditCard,
      to: "/admin/tarjetas",
    },
    {
      label: "Reclamaciones",
      value: stats.reclamaciones_pendientes ?? 0,
      subtext:
        (stats.reclamaciones_pendientes ?? 0) === 0
          ? "Sin expedientes pendientes"
          : `${stats.reclamaciones_pendientes} casos por resolver`,
      icon: FileText,
      to: "/admin/reclamaciones",
    },
  ];

  const modulosGestion = [
    {
      title: "Locales y Puntos de Emisión",
      description: "Alta de sedes comerciales, datos fiscales RUC, geolocalización y asignación de personal de caja/POS.",
      to: "/admin/locales",
      icon: Building2,
      tag: "Infraestructura",
    },
    {
      title: "Reglas de Sellos y Puntuación",
      description: "Parametrización de valor en puntos por sello, límites de frecuencia diaria y campañas de temporada.",
      to: "/admin/reglas",
      icon: Award,
      tag: "Fidelización",
    },
    {
      title: "Inventario de Tarjetas NFC",
      description: "Importación en lote de chips NTAG213/NTAG215, control de almacén y bloqueos de seguridad.",
      to: "/admin/tarjetas",
      icon: CreditCard,
      tag: "Hardware",
    },
    {
      title: "Catálogo de Recompensas",
      description: "Gestión de catálogo de premios, costo en puntos globales, control de stock y modalidades de canje.",
      to: "/admin/recompensas",
      icon: Gift,
      tag: "Beneficios",
    },
    {
      title: "Libro de Reclamaciones",
      description: "Auditoría y resolución legal de quejas y reclamos de clientes con código de expediente INDECOPI.",
      to: "/admin/reclamaciones",
      icon: FileText,
      tag: "Gobernanza",
    },
    {
      title: "Usuarios y Permisos de Acceso",
      description: "Administración del padrón de usuarios, roles de seguridad y suspensión de accesos.",
      to: "/admin/usuarios",
      icon: Users,
      tag: "Seguridad",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado Formal */}
      <div className="border-b border-[rgb(var(--app-border))] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Panel de Administración Central
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Control operativo, analítica transaccional y gobernanza de la red Pasaporte NFC
        </p>
      </div>

      {/* Grid de Indicadores Clave */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {metricCards.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="p-4 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl hover:border-slate-400 dark:hover:border-slate-600 transition shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition">
                  <c.icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
              </div>

              <div>
                <p className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
                  {c.value.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {c.label}
                </p>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  {c.subtext}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Registro de Auditoría / Actividad Reciente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Últimas Validaciones en POS (Auditoría)
          </h2>
          <Link
            to="/admin/reglas"
            className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1"
          >
            Ver reglas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {stats.actividad_reciente && stats.actividad_reciente.length > 0 ? (
          <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/50 text-muted font-bold uppercase">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Establecimiento</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Puntos Otorgados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--app-border))]">
                  {stats.actividad_reciente.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-500/5 transition">
                      <td className="p-3 font-mono text-[11px] text-muted">
                        {new Date(act.fecha_hora).toLocaleDateString()} {new Date(act.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {act.usuario_nombre}
                      </td>
                      <td className="p-3 text-muted">
                        {act.establecimiento_nombre}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {act.metodo_validacion === "NFC" ? (
                            <Nfc className="w-3 h-3" />
                          ) : (
                            <QrCode className="w-3 h-3" />
                          )}
                          {act.metodo_validacion}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        +{act.puntos_ganados} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))] text-xs text-muted">
            No hay registros recientes de validación en terminales.
          </div>
        )}
      </div>

      {/* Módulos de Gestión */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
          Módulos de Configuración y Gestión
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modulosGestion.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className="p-4 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl hover:border-slate-400 dark:hover:border-slate-600 transition shadow-xs flex items-start gap-3.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <m.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {m.title}
                  </p>
                  <span className="text-[10px] font-semibold text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                    {m.tag}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
