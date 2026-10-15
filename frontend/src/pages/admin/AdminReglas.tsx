import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { ReglaSello, Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Coins,
  Award,
  Plus,
  Search,
  Building2,
  Calendar,
  Zap,
  SquarePen,
  Trash,
  Eye,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Sparkles,
  Info,
  Gift,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export const AdminReglas: React.FC = () => {
  const [reglas, setReglas] = useState<ReglaSello[]>([]);
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Tab principal para no mezclar Locales Comerciales con Lugares Turísticos
  const [tabTipo, setTabTipo] = useState<"TODOS" | "LOCAL" | "LUGAR_TURISTICO">("LOCAL");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVA" | "INACTIVA">("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [selectedRegla, setSelectedRegla] = useState<ReglaSello | null>(null);

  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();

  // Form State
  const [form, setForm] = useState({
    establecimiento_id: "",
    nombre_accion: "Visita y consumo con sello",
    valor_puntos_por_sello: 20,
    meta_sellos: 5,
    tipo_reinicio: "MENSUAL",
    puntos_completado_meta: 50,
    limite_diario_por_usuario: 1,
    estado: "ACTIVA",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [reg, est] = await Promise.all([
        api.get("/admin/reglas-sellos").catch(() => ({ data: { data: [] } })),
        api.get("/admin/locales").catch(() => ({ data: { data: [] } })),
      ]);
      const r = reg.data?.data ?? reg.data ?? [];
      setReglas(Array.isArray(r) ? r : []);
      const e = est.data?.data ?? est.data ?? [];
      const normLocales = (Array.isArray(e) ? e : []).map((x: any) => ({
        ...x,
        id: String(x.id ?? x.id_establecimiento),
        nombre: x.nombre_comercial || x.razon_social || x.nombre,
        tipo: x.tipo || "LOCAL",
      }));
      setLocales(normLocales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Determinar si el establecimiento seleccionado en el formulario es LUGAR_TURISTICO
  const selectedEstablecimiento = useMemo(() => {
    if (isEditing && selectedRegla) {
      const match = locales.find((l) => String(l.id) === String(selectedRegla.establecimiento_id));
      if (match) return match;
      return {
        tipo: selectedRegla.establecimiento_tipo || "LOCAL",
        nombre: selectedRegla.establecimiento_nombre,
      } as any;
    }
    return locales.find((l) => String(l.id) === String(form.establecimiento_id));
  }, [form.establecimiento_id, isEditing, selectedRegla, locales]);

  const esLugarTuristico =
    selectedEstablecimiento?.tipo === "LUGAR_TURISTICO" ||
    selectedEstablecimiento?.tipo === "LUGAR";

  const openCrear = (presetTipo?: "LOCAL" | "LUGAR_TURISTICO") => {
    setIsEditing(false);
    setSelectedRegla(null);
    
    // Filtrar locales disponibles según el tab actual o preset
    const targetTipo = presetTipo || (tabTipo === "LUGAR_TURISTICO" ? "LUGAR_TURISTICO" : "LOCAL");
    const candidato = locales.find((l) => (l.tipo === targetTipo) || (targetTipo === "LOCAL" && l.tipo !== "LUGAR_TURISTICO")) || locales[0];

    const esLugar = candidato?.tipo === "LUGAR_TURISTICO" || candidato?.tipo === "LUGAR";

    setForm({
      establecimiento_id: candidato?.id || "",
      nombre_accion: esLugar ? "Visita y exploración cultural" : "Visita y consumo con sello",
      valor_puntos_por_sello: esLugar ? 30 : 20,
      limite_diario_por_usuario: 1,
      estado: "ACTIVA",
      tipo_reinicio: "MENSUAL",
      meta_sellos: 5,
      puntos_completado_meta: esLugar ? 0 : 50,
      fecha_inicio: "",
      fecha_fin: "",
    });
    setErrors({});
    setModalForm(true);
  };

  const openEditar = (r: ReglaSello) => {
    setIsEditing(true);
    setSelectedRegla(r);
    setForm({
      establecimiento_id: String(r.establecimiento_id || (r as any).id_establecimiento || ""),
      nombre_accion: r.nombre_accion || "Visita estándar",
      valor_puntos_por_sello: r.valor_puntos_por_sello || 20,
      limite_diario_por_usuario: r.limite_diario_por_usuario || 1,
      estado: r.estado || "ACTIVA",
      tipo_reinicio: r.tipo_reinicio || "MENSUAL",
      meta_sellos: r.meta_sellos ? Math.max(1, Math.min(28, Number(r.meta_sellos))) : 5,
      puntos_completado_meta: r.puntos_completado_meta ?? 50,
      fecha_inicio: r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : "",
      fecha_fin: r.fecha_fin ? r.fecha_fin.slice(0, 10) : "",
    });
    setErrors({});
    setModalForm(true);
  };

  const openVer = (r: ReglaSello) => {
    setSelectedRegla(r);
    setModalVer(true);
  };

  const openEliminar = (r: ReglaSello) => {
    setSelectedRegla(r);
    setModalEliminar(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !form.establecimiento_id) {
      setErrors({ establecimiento_id: "Selecciona un establecimiento" });
      return;
    }
    if (!form.nombre_accion.trim()) {
      setErrors({ nombre_accion: "El nombre de la acción es obligatorio" });
      return;
    }

    if (!esLugarTuristico && form.tipo_reinicio === "TEMPORADA") {
      if (!form.fecha_inicio || !form.fecha_fin) {
        setErrors({ fecha_inicio: "Para modalidad por temporada debes indicar fecha de inicio y fin" });
        return;
      }
      if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
        setErrors({ fecha_fin: "La fecha de fin debe ser posterior a la de inicio" });
        return;
      }
    }

    setSaving(true);
    setErrors({});
    try {
      const payload = {
        nombre_accion: form.nombre_accion.trim(),
        valor_puntos_por_sello: Number(form.valor_puntos_por_sello),
        limite_diario_por_usuario: Number(form.limite_diario_por_usuario),
        estado: form.estado,
        tipo_reinicio: esLugarTuristico ? "MENSUAL" : (form.tipo_reinicio || "MENSUAL"),
        meta_sellos: esLugarTuristico ? 1 : Math.max(1, Math.min(28, Number(form.meta_sellos) || 5)),
        puntos_completado_meta: esLugarTuristico ? 0 : (Number(form.puntos_completado_meta) || 0),
        fecha_inicio: (!esLugarTuristico && form.tipo_reinicio === "TEMPORADA") ? (form.fecha_inicio || null) : null,
        fecha_fin: (!esLugarTuristico && form.tipo_reinicio === "TEMPORADA") ? (form.fecha_fin || null) : null,
      };

      if (isEditing && selectedRegla) {
        await api.patch(`/admin/reglas-sellos/${selectedRegla.id}`, payload);
        showToast("Regla de puntos actualizada con éxito", "success");
      } else {
        await api.post("/admin/reglas-sellos", {
          ...payload,
          establecimiento_id: form.establecimiento_id,
        });
        showToast("Regla de puntos configurada con éxito", "success");
      }
      setModalForm(false);
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo guardar la regla de puntos", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedRegla) return;
    setSaving(true);
    try {
      await api.delete(`/admin/reglas-sellos/${selectedRegla.id}`);
      showToast("Regla de puntos eliminada", "success");
      setModalEliminar(false);
      setSelectedRegla(null);
      await load();
    } catch {
      showToast("Error al eliminar la regla de puntos", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (r: ReglaSello) => {
    const nuevo = r.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    try {
      await api.patch(`/admin/reglas-sellos/${r.id}`, { estado: nuevo });
      showToast(nuevo === "ACTIVA" ? "Regla activada" : "Regla desactivada", "success");
      setReglas((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, estado: nuevo } : item)),
      );
    } catch {
      showToast("Error al cambiar estado", "error");
    }
  };

  // Filtrado por Tipo (Locales vs Lugares) + Estado + Búsqueda
  const filteredReglas = useMemo(() => {
    let result = reglas;

    // Filtro por tipo de establecimiento
    if (tabTipo === "LOCAL") {
      result = result.filter(
        (r) => r.establecimiento_tipo !== "LUGAR_TURISTICO" && r.establecimiento_tipo !== "LUGAR",
      );
    } else if (tabTipo === "LUGAR_TURISTICO") {
      result = result.filter(
        (r) => r.establecimiento_tipo === "LUGAR_TURISTICO" || r.establecimiento_tipo === "LUGAR",
      );
    }

    // Filtro por estado
    if (filtroEstado === "ACTIVA") {
      result = result.filter((r) => r.estado === "ACTIVA");
    } else if (filtroEstado === "INACTIVA") {
      result = result.filter((r) => r.estado !== "ACTIVA");
    }

    // Filtro por texto
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.nombre_accion.toLowerCase().includes(q) ||
          (r.establecimiento_nombre || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [reglas, search, filtroEstado, tabTipo]);

  const totalPaginas = Math.max(1, Math.ceil(filteredReglas.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const reglasPaginadas = filteredReglas.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado, tabTipo]);

  // Contadores para métricas
  const totalLocalesCount = reglas.filter(
    (r) => r.establecimiento_tipo !== "LUGAR_TURISTICO" && r.establecimiento_tipo !== "LUGAR",
  ).length;

  const totalLugaresCount = reglas.filter(
    (r) => r.establecimiento_tipo === "LUGAR_TURISTICO" || r.establecimiento_tipo === "LUGAR",
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7C0A1E] font-bold text-xs tracking-wider uppercase">
            <Coins className="w-4 h-4" />
            <span>Fidelización & Gamificación</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#2D1A1E] mt-1">
            Gestión de Puntos
          </h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Configura los puntos por sello, puntos por visita, bonos por llenar cartilla y límites diarios diferenciados por tipo de local.
          </p>
        </div>

        <Button
          onClick={() => openCrear()}
          className="bg-[#7C0A1E] hover:bg-[#630818] text-white rounded-xl shadow-xs text-xs font-bold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla de Puntos
        </Button>
      </div>

      {/* Tabs Principales: Separación entre Locales Comerciales y Lugares Turísticos */}
      <div className="bg-white border border-[#EFE7DE] p-2 rounded-2xl shadow-2xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTabTipo("LOCAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              tabTipo === "LOCAL"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Locales Comerciales</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                tabTipo === "LOCAL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {totalLocalesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabTipo("LUGAR_TURISTICO")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              tabTipo === "LUGAR_TURISTICO"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Lugares Turísticos / Patrimonios</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                tabTipo === "LUGAR_TURISTICO" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {totalLugaresCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabTipo("TODOS")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tabTipo === "TODOS"
                ? "bg-[#2D1A1E] text-white"
                : "text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            Todos ({reglas.length})
          </button>
        </div>

        {/* Indicador o Recordatorio de Diferenciación */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#8E7D7D] px-3 py-1 bg-[#FAF8F5] rounded-xl border border-[#EFE7DE]">
          <Info className="w-3.5 h-3.5 text-[#7C0A1E] shrink-0" />
          <span>
            {tabTipo === "LOCAL"
              ? "Locales comerciales: fidelizan con puntos por consumo y bono al llenar cartilla."
              : tabTipo === "LUGAR_TURISTICO"
              ? "Lugares turísticos: otorgan puntos de exploración cultural sin consumo comercial."
              : "Vista general consolidada de todas las reglas del pasaporte."}
          </span>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros de Estado */}
      <div className="bg-white border border-[#EFE7DE] rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por local o nombre de acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] focus:outline-none focus:border-[#7C0A1E] text-[#2D1A1E] placeholder:text-[#8E7D7D]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["TODOS", "ACTIVA", "INACTIVA"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltroEstado(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                filtroEstado === tab
                  ? "bg-[#7C0A1E]/15 text-[#7C0A1E] border border-[#7C0A1E]/30"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
              }`}
            >
              {tab === "TODOS" ? "Todas" : tab === "ACTIVA" ? "Activas" : "Inactivas"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Reglas de Puntos */}
      <div className="table-card-container">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D] mt-3 font-semibold">Cargando gestión de puntos...</p>
          </div>
        ) : filteredReglas.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Coins}
              title={
                tabTipo === "LUGAR_TURISTICO"
                  ? "No hay reglas de puntos para Lugares Turísticos"
                  : tabTipo === "LOCAL"
                  ? "No hay reglas de puntos para Locales Comerciales"
                  : "No se encontraron reglas de puntos"
              }
              description={
                search || filtroEstado !== "TODOS"
                  ? "Prueba ajustando los filtros de búsqueda"
                  : "Configura la primera regla de puntos para definir cuánto gana el usuario por visita o sello"
              }
              actionLabel={!search && filtroEstado === "TODOS" ? "Nueva Regla de Puntos" : undefined}
              onAction={!search && filtroEstado === "TODOS" ? () => openCrear() : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] border-b border-[#EFE7DE] text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Acción / Beneficio</th>
                  <th className="py-3.5 px-4">Establecimiento</th>
                  {tabTipo !== "LUGAR_TURISTICO" && (
                    <>
                      <th className="py-3.5 px-4 text-center">Cartilla (Meta)</th>
                      <th className="py-3.5 px-4 text-center">Bono Cartilla Llena</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 text-center">
                    {tabTipo === "LUGAR_TURISTICO" ? "Puntos Exploración" : "Puntos / Sello"}
                  </th>
                  <th className="py-3.5 px-4 text-center">Límite Diario</th>
                  {tabTipo !== "LUGAR_TURISTICO" && (
                    <th className="py-3.5 px-4 text-center">Ciclo de Cartilla</th>
                  )}
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]">
                {reglasPaginadas.map((r) => {
                  const esLugar =
                    r.establecimiento_tipo === "LUGAR_TURISTICO" ||
                    r.establecimiento_tipo === "LUGAR";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#FAF8F5]/80 transition group"
                    >
                      {/* Acción */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            esLugar
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {esLugar ? <Landmark className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D1A1E] text-xs">
                              {r.nombre_accion}
                            </p>
                            <span className="text-[10px] text-[#8E7D7D] font-mono">
                              ID: #{r.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Establecimiento con Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-[#2D1A1E]">
                            {r.establecimiento_nombre || "Todos los locales"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                              esLugar
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {esLugar ? "🏛️ Lugar Turístico" : "🏪 Local Comercial"}
                          </span>
                        </div>
                      </td>

                      {/* Cartilla & Meta (solo para Locales Comerciales o vista general) */}
                      {tabTipo !== "LUGAR_TURISTICO" && (
                        <>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {esLugar ? (
                              <span className="text-[11px] text-[#8E7D7D] italic">
                                Sin cartilla comercial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-xs text-[#7C0A1E] bg-[#7C0A1E]/10 px-2 py-0.5 rounded-lg border border-[#7C0A1E]/20">
                                {r.meta_sellos || 5} sellos
                              </span>
                            )}
                          </td>

                          {/* Bono Cartilla Llena */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {esLugar ? (
                              <span className="text-[11px] text-[#8E7D7D]">—</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <Gift className="w-3 h-3" />
                                +{r.puntos_completado_meta || 50} pts bono
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Puntos por sello / visita */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          esLugar
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          <Zap className="w-3.5 h-3.5 fill-current opacity-70" />
                          +{r.valor_puntos_por_sello} pts
                        </span>
                      </td>

                      {/* Límite diario */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#2D1A1E]">
                          {r.limite_diario_por_usuario} {r.limite_diario_por_usuario === 1 ? "visita/día" : "visitas/día"}
                        </span>
                      </td>

                      {/* Ciclo / Reinicio (solo para locales o vista general) */}
                      {tabTipo !== "LUGAR_TURISTICO" && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {esLugar ? (
                            <span className="text-[10px] text-[#8E7D7D]">Continuo</span>
                          ) : r.tipo_reinicio === "TEMPORADA" ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                Temporada
                              </span>
                              <span className="text-[10px] text-[#8E7D7D] mt-0.5">
                                {r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString() : "—"} al{" "}
                                {r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString() : "—"}
                              </span>
                            </div>
                          ) : r.tipo_reinicio === "CICLICO" ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                              Cíclico Continuo
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                                Mensual
                              </span>
                              <span className="text-[9px] text-[#8E7D7D] mt-0.5">Día 1 de cada mes</span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(r)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            r.estado === "ACTIVA"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          }`}
                          title="Clic para alternar estado"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.estado === "ACTIVA" ? "bg-emerald-600" : "bg-slate-400"
                            }`}
                          />
                          {r.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openVer(r)}
                            className="p-1.5 rounded-lg text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5] transition"
                            title="Ver detalles de la regla"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditar(r)}
                            className="p-1.5 rounded-lg text-[#8E7D7D] hover:text-[#7C0A1E] hover:bg-[#FAF8F5] transition"
                            title="Editar regla de puntos"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEliminar(r)}
                            className="p-1.5 rounded-lg text-[#8E7D7D] hover:text-red-700 hover:bg-red-50 transition"
                            title="Eliminar regla de puntos"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="p-3.5 border-t border-[#EFE7DE] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#8E7D7D]">
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, filteredReglas.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, filteredReglas.length)} de{" "}
                <strong className="text-[#2D1A1E]">{filteredReglas.length}</strong> reglas de puntos
              </span>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={paginaActual <= 1}
                    onClick={() => setPagina((p) => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Button>
                  <span className="px-2 text-xs font-bold text-[#2D1A1E]">
                    Pág. {paginaActual} / {totalPaginas}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => setPagina((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Regla de Puntos */}
      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title={
          isEditing
            ? `Editar Regla de Puntos · ${esLugarTuristico ? "Lugar Turístico" : "Local Comercial"}`
            : `Nueva Regla de Puntos · ${esLugarTuristico ? "Lugar Turístico" : "Local Comercial"}`
        }
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Banner identificador de tipo de entidad */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              esLugarTuristico
                ? "bg-blue-50/80 border-blue-200 text-blue-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                esLugarTuristico
                  ? "bg-white text-blue-700 border-blue-200"
                  : "bg-white text-amber-800 border-amber-200"
              }`}
            >
              {esLugarTuristico ? <Landmark className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider block">
                {esLugarTuristico ? "🏛️ Lugar Turístico / Patrimonio" : "🏪 Local Comercial Afiliado"}
              </span>
              <p className="text-xs font-medium leading-snug mt-0.5">
                {esLugarTuristico
                  ? "Otorga puntos de exploración cultural y experiencia para subir de nivel en el pasaporte digital, sin compras ni bonos de cartilla."
                  : "Otorga sellos por consumo, puntos por visita y bonificación especial al completar la cartilla de cliente."}
              </p>
            </div>
          </div>

          {/* Selección de Establecimiento */}
          {isEditing ? (
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EFE7DE]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D] block">
                Establecimiento Asociado
              </span>
              <h4 className="text-xs font-bold text-[#2D1A1E] truncate mt-0.5">
                {selectedRegla?.establecimiento_nombre || (selectedRegla as any)?.razon_social || "Establecimiento"}
              </h4>
            </div>
          ) : (
            <label className="block space-y-1 w-full text-left">
              <span className="block text-xs font-bold text-[#2D1A1E]">
                Establecimiento *
              </span>
              <select
                className="input-base w-full text-xs font-semibold"
                required
                value={form.establecimiento_id}
                onChange={(e) => {
                  const targetId = e.target.value;
                  const found = locales.find((l) => String(l.id) === targetId);
                  const isTourist = found?.tipo === "LUGAR_TURISTICO" || found?.tipo === "LUGAR";
                  setForm({
                    ...form,
                    establecimiento_id: targetId,
                    nombre_accion: isTourist
                      ? "Visita y exploración cultural"
                      : "Visita y consumo con sello",
                    puntos_completado_meta: isTourist ? 0 : 50,
                  });
                }}
              >
                <option value="">Selecciona un establecimiento...</option>
                <optgroup label="🏪 Locales Comerciales">
                  {locales
                    .filter((l) => l.tipo !== "LUGAR_TURISTICO" && l.tipo !== "LUGAR")
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre || l.razon_social}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🏛️ Lugares Turísticos / Patrimonios">
                  {locales
                    .filter((l) => l.tipo === "LUGAR_TURISTICO" || l.tipo === "LUGAR")
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre || l.razon_social}
                      </option>
                    ))}
                </optgroup>
              </select>
            </label>
          )}

          <Input
            label="Nombre de la acción o beneficio *"
            placeholder={
              esLugarTuristico
                ? "Ej: Exploración de monumento, Visita a Museo..."
                : "Ej: Visita y consumo estándar, Fidelización de la Casa..."
            }
            value={form.nombre_accion}
            required
            error={errors.nombre_accion}
            onChange={(e) => setForm({ ...form, nombre_accion: e.target.value })}
          />

          {/* Configuración específica para LOCALES COMERCIALES */}
          {!esLugarTuristico && (
            <>
              {/* Selector de Meta de la Cartilla (1 a 28 sellos) */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE7DE] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2D1A1E]">
                    Meta de Sellos de la Cartilla *
                  </label>
                  <span className="text-xs font-bold text-[#7C0A1E] bg-[#7C0A1E]/10 px-2 py-0.5 rounded-md">
                    {form.meta_sellos} sellos para llenar
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[5, 8, 10, 12, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm({ ...form, meta_sellos: num })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                        form.meta_sellos === num
                          ? "bg-[#7C0A1E] text-white border-[#7C0A1E] shadow-2xs"
                          : "bg-white text-[#2D1A1E] border-[#EFE7DE] hover:bg-[#F3ECE4]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-medium text-[#8E7D7D] whitespace-nowrap">
                    O valor exacto (1 a 28):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.meta_sellos}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(28, Number(e.target.value) || 1));
                      setForm({ ...form, meta_sellos: val });
                    }}
                    className="input-base text-xs font-bold text-center w-20 py-1"
                  />
                  <span className="text-[11px] text-[#8E7D7D]">sellos</span>
                </div>
              </div>

              {/* Modalidad de Reinicio de Cartilla */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2D1A1E]">
                  Ciclo de Reinicio de Cartilla *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "MENSUAL", label: "Mensual", desc: "Día 1 de cada mes" },
                    { id: "TEMPORADA", label: "Temporada", desc: "Rango de fechas" },
                    { id: "CICLICO", label: "Cíclico", desc: "Al llenar cartilla" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_reinicio: m.id })}
                      className={`p-2.5 rounded-xl text-left transition border ${
                        form.tipo_reinicio === m.id
                          ? "bg-[#7C0A1E]/10 border-[#7C0A1E] text-[#7C0A1E] font-bold"
                          : "bg-[#FAF8F5] border-[#EFE7DE] text-[#2D1A1E] hover:bg-white"
                      }`}
                    >
                      <span className="block text-xs font-bold">{m.label}</span>
                      <span className="block text-[10px] text-[#8E7D7D] mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas de Temporada */}
              {form.tipo_reinicio === "TEMPORADA" && (
                <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 animate-fadeIn">
                  <Input
                    label="Inicio de temporada *"
                    type="date"
                    required
                    value={form.fecha_inicio}
                    error={errors.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  />
                  <Input
                    label="Fin de temporada *"
                    type="date"
                    required
                    value={form.fecha_fin}
                    error={errors.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          {/* Asignación de Puntos */}
          <div className={`grid gap-3 ${esLugarTuristico ? "grid-cols-2" : "grid-cols-3"}`}>
            <Input
              label={esLugarTuristico ? "Puntos por Visita Cultural *" : "Puntos por Sello *"}
              type="number"
              min={1}
              value={form.valor_puntos_por_sello}
              onChange={(e) =>
                setForm({
                  ...form,
                  valor_puntos_por_sello: Math.max(1, Number(e.target.value)),
                })
              }
            />

            {!esLugarTuristico && (
              <Input
                label="Bono por Llenar Cartilla *"
                type="number"
                min={0}
                value={form.puntos_completado_meta}
                onChange={(e) =>
                  setForm({
                    ...form,
                    puntos_completado_meta: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            )}

            <Input
              label="Límite Diario por Cliente *"
              type="number"
              min={1}
              value={form.limite_diario_por_usuario}
              onChange={(e) =>
                setForm({
                  ...form,
                  limite_diario_por_usuario: Math.max(1, Number(e.target.value)),
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE7DE]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalForm(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#7C0A1E] hover:bg-[#630818] text-white text-xs font-bold"
            >
              {saving ? <Spinner size={16} /> : isEditing ? "Actualizar Regla" : "Guardar Regla"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Detalles de Regla de Puntos"
        size="md"
      >
        {selectedRegla && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E] shrink-0 border border-[#7C0A1E]/20">
                <Coins className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#2D1A1E]">
                    {selectedRegla.nombre_accion}
                  </h3>
                  <span
                    className={`px-2 py-0.2 rounded-md text-[9px] font-bold ${
                      selectedRegla.establecimiento_tipo === "LUGAR_TURISTICO" ||
                      selectedRegla.establecimiento_tipo === "LUGAR"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {selectedRegla.establecimiento_tipo === "LUGAR_TURISTICO" ||
                    selectedRegla.establecimiento_tipo === "LUGAR"
                      ? "🏛️ Lugar Turístico"
                      : "🏪 Local Comercial"}
                  </span>
                </div>
                <p className="text-xs text-[#8E7D7D] flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8E7D7D]" />
                  {selectedRegla.establecimiento_nombre || "Todos los locales"}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedRegla.estado === "ACTIVA"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {selectedRegla.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#EFE7DE]">
                <p className="text-[10px] uppercase font-bold text-[#8E7D7D]">Puntos por Sello / Visita</p>
                <p className="text-base font-black text-[#7C0A1E] mt-0.5">
                  +{selectedRegla.valor_puntos_por_sello} pts
                </p>
              </div>

              {selectedRegla.establecimiento_tipo !== "LUGAR_TURISTICO" &&
                selectedRegla.establecimiento_tipo !== "LUGAR" && (
                  <div className="p-3 bg-white rounded-xl border border-[#EFE7DE]">
                    <p className="text-[10px] uppercase font-bold text-[#8E7D7D]">Meta & Bono de Cartilla</p>
                    <p className="text-sm font-bold text-[#2D1A1E] mt-0.5">
                      {selectedRegla.meta_sellos || 5} sellos
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold">
                      +{selectedRegla.puntos_completado_meta || 50} pts bono al llenar
                    </p>
                  </div>
                )}

              <div className="p-3 bg-white rounded-xl border border-[#EFE7DE]">
                <p className="text-[10px] uppercase font-bold text-[#8E7D7D]">Límite Diario</p>
                <p className="text-sm font-bold text-[#2D1A1E] mt-0.5">
                  {selectedRegla.limite_diario_por_usuario} por cliente al día
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#EFE7DE]">
                <p className="text-[10px] uppercase font-bold text-[#8E7D7D]">Modalidad</p>
                <p className="text-xs font-bold text-[#2D1A1E] mt-1">
                  {selectedRegla.tipo_reinicio === "TEMPORADA"
                    ? "Por Temporada"
                    : selectedRegla.tipo_reinicio === "CICLICO"
                    ? "Cíclico Continuo"
                    : "Mensual"}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setModalVer(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Regla de Puntos"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#2D1A1E]">
            ¿Estás seguro de que deseas eliminar la regla de puntos{" "}
            <strong className="text-[#7C0A1E]">
              {selectedRegla?.nombre_accion}
            </strong>
            ? Esta acción es irreversible.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE7DE]">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {saving ? <Spinner size={16} /> : "Eliminar Definitivamente"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
