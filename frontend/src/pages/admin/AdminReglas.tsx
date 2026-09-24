import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ReglaSello, Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useUI } from "../../hooks/useUI";
import { Plus } from "lucide-react";

export const AdminReglas: React.FC = () => {
  const [reglas, setReglas] = useState<ReglaSello[]>([]);
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const [reg, est] = await Promise.all([
        api.get("/admin/reglas-sellos").catch(() => ({ data: { data: [] } })),
        api.get("/establishments").catch(() => ({ data: { data: [] } })),
      ]);
      const r = reg.data?.data ?? reg.data ?? [];
      setReglas(Array.isArray(r) ? r : []);
      const e = est.data?.data ?? est.data ?? [];
      setLocales(Array.isArray(e) ? e : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const crear = async () => {
    if (!form.establecimiento_id) {
      showToast("Selecciona un local", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/reglas-sellos", {
        ...form,
        valor_puntos_por_sello: Number(form.valor_puntos_por_sello),
        limite_diario_por_usuario: Number(form.limite_diario_por_usuario),
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
      });
      showToast("Regla creada", "success");
      setShowForm(false);
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al crear", "error");
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await api.patch(`/admin/reglas-sellos/${id}`, body);
      showToast("Actualizado", "success");
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Reglas de sellos</h1>
          <p className="text-xs text-muted">
            Define cuántos puntos vale cada sello, límite diario y temporada por
            local.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Nueva
        </Button>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <select
            className="input-base"
            value={form.establecimiento_id}
            onChange={(e) =>
              setForm({ ...form, establecimiento_id: e.target.value })
            }
          >
            <option value="">Establecimiento...</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.razon_social || l.nombre}
              </option>
            ))}
          </select>
          <Input
            label="Acción"
            value={form.nombre_accion}
            onChange={(e) =>
              setForm({ ...form, nombre_accion: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Puntos / sello"
              type="number"
              value={form.valor_puntos_por_sello}
              onChange={(e) =>
                setForm({
                  ...form,
                  valor_puntos_por_sello: Number(e.target.value),
                })
              }
            />
            <Input
              label="Límite diario"
              type="number"
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
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>
          <Button fullWidth loading={saving} onClick={crear}>
            Guardar
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {reglas.map((r) => (
          <li key={r.id} className="card space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-sm">{r.nombre_accion}</p>
                <p className="text-[11px] text-muted">
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
            <div className="flex flex-wrap gap-3 items-center text-xs">
              <label className="flex items-center gap-1">
                Pts
                <input
                  type="number"
                  className="w-16 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-elevated))] px-2 py-1 font-semibold"
                  defaultValue={r.valor_puntos_por_sello}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v && v !== r.valor_puntos_por_sello)
                      patch(r.id, { valor_puntos_por_sello: v });
                  }}
                />
              </label>
              <span className="text-muted">
                Máx {r.limite_diario_por_usuario}/día
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  patch(r.id, {
                    estado: r.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA",
                  })
                }
              >
                {r.estado === "ACTIVA" ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {reglas.length === 0 && (
        <p className="text-center text-sm text-muted py-8">
          No hay reglas configuradas.
        </p>
      )}
    </div>
  );
};
