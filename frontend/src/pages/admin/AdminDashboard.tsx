import React, { useEffect, useState } from "react";
import { Settings2, Plus, RefreshCw } from "lucide-react";
import api from "../../services/api";
import { ReglaSello, Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useUI } from "../../hooks/useUI";

interface Stats {
  usuarios?: number;
  establecimientos_activos?: number;
  visitas_totales?: number;
  canjes_totales?: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reglas, setReglas] = useState<ReglaSello[]>([]);
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useUI();

  const [form, setForm] = useState({
    establecimiento_id: "",
    nombre_accion: "Visita estándar",
    valor_puntos_por_sello: 10,
    limite_diario_por_usuario: 1,
    estado: "ACTIVA",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [dash, reg, est] = await Promise.all([
        api.get("/admin/dashboard").catch(() => ({ data: {} })),
        api.get("/admin/reglas-sellos").catch(() => ({ data: { data: [] } })),
        api.get("/establishments").catch(() => ({ data: { data: [] } })),
      ]);
      setStats(dash.data?.data ?? dash.data ?? {});
      const r = reg.data?.data ?? reg.data ?? [];
      setReglas(Array.isArray(r) ? r : []);
      const e = est.data?.data ?? est.data ?? [];
      setLocales(Array.isArray(e) ? e : []);
    } catch {
      showToast("Error cargando panel admin", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const crearRegla = async () => {
    if (!form.establecimiento_id || !form.nombre_accion) {
      showToast("Completa local y nombre de la acción", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/reglas-sellos", {
        establecimiento_id: form.establecimiento_id,
        nombre_accion: form.nombre_accion,
        valor_puntos_por_sello: Number(form.valor_puntos_por_sello),
        limite_diario_por_usuario: Number(form.limite_diario_por_usuario),
        estado: form.estado,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
      });
      showToast("Regla de sello creada", "success");
      setShowForm(false);
      await load();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "No se pudo crear la regla",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (regla: ReglaSello) => {
    const nuevo = regla.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    try {
      await api.patch(`/admin/reglas-sellos/${regla.id}`, { estado: nuevo });
      showToast(`Regla ${nuevo.toLowerCase()}`, "success");
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar", "error");
    }
  };

  const actualizarPuntos = async (regla: ReglaSello, valor: number) => {
    try {
      await api.patch(`/admin/reglas-sellos/${regla.id}`, {
        valor_puntos_por_sello: valor,
      });
      showToast("Puntos por sello actualizados", "success");
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto animate-fadeIn pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Administración</h1>
          <p className="text-xs text-muted">
            Reglas de sellos, puntos y temporada
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          ["Usuarios", stats?.usuarios],
          ["Locales", stats?.establecimientos_activos],
          ["Visitas", stats?.visitas_totales],
          ["Canjes", stats?.canjes_totales],
        ].map(([label, val]) => (
          <div key={String(label)} className="card !py-3">
            <p className="text-[11px] text-muted">{label}</p>
            <p className="text-xl font-bold tabular-nums">{val ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Reglas de sellos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-sky-500" />
            <h2 className="font-bold text-sm">Reglas de sellos / puntos</h2>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>

        <p className="text-[11px] text-muted leading-relaxed">
          Define cuántos puntos vale cada sello por local, límite diario y
          vigencia (temporada). El comercio solo valida; el valor lo fija admin.
        </p>

        {showForm && (
          <div className="card space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted">
                Local
              </label>
              <select
                className="input-base mt-1"
                value={form.establecimiento_id}
                onChange={(e) =>
                  setForm({ ...form, establecimiento_id: e.target.value })
                }
              >
                <option value="">Seleccionar establecimiento</option>
                {locales.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.razon_social || l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Nombre de la acción"
              value={form.nombre_accion}
              onChange={(e) =>
                setForm({ ...form, nombre_accion: e.target.value })
              }
              placeholder="Ej. Visita, Happy hour, Promo verano"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Puntos por sello"
                type="number"
                min={1}
                value={form.valor_puntos_por_sello}
                onChange={(e) =>
                  setForm({
                    ...form,
                    valor_puntos_por_sello: Number(e.target.value),
                  })
                }
              />
              <Input
                label="Límite diario / usuario"
                type="number"
                min={1}
                value={form.limite_diario_por_usuario}
                onChange={(e) =>
                  setForm({
                    ...form,
                    limite_diario_por_usuario: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Inicio temporada"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
              />
              <Input
                label="Fin temporada"
                type="date"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
              />
            </div>
            <Button fullWidth loading={saving} onClick={crearRegla}>
              Guardar regla
            </Button>
          </div>
        )}

        {reglas.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No hay reglas. Crea una para cada local o promoción.
          </p>
        ) : (
          <ul className="space-y-2">
            {reglas.map((r) => (
              <li key={r.id} className="card space-y-2 !p-3.5">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {r.nombre_accion}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {r.establecimiento_nombre || r.establecimiento_id}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full h-fit ${
                      r.estado === "ACTIVA"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-slate-500/15 text-slate-500"
                    }`}
                  >
                    {r.estado}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5">
                    <span className="text-muted">Pts/sello</span>
                    <input
                      type="number"
                      className="w-16 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-elevated))] px-2 py-1 text-sm font-semibold"
                      defaultValue={r.valor_puntos_por_sello}
                      min={1}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v && v !== r.valor_puntos_por_sello)
                          actualizarPuntos(r, v);
                      }}
                    />
                  </label>
                  <span className="text-muted">
                    Límite: {r.limite_diario_por_usuario}/día
                  </span>
                  {(r.fecha_inicio || r.fecha_fin) && (
                    <span className="text-muted">
                      Temporada:{" "}
                      {r.fecha_inicio
                        ? new Date(r.fecha_inicio).toLocaleDateString("es-PE")
                        : "—"}{" "}
                      →{" "}
                      {r.fecha_fin
                        ? new Date(r.fecha_fin).toLocaleDateString("es-PE")
                        : "—"}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleEstado(r)}
                >
                  {r.estado === "ACTIVA" ? "Desactivar" : "Activar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
