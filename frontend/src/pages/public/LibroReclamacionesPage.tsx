import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  ShieldCheck,
  Send,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";

interface ReclamoStatus {
  id: string;
  codigo_seguimiento: string;
  tipo_registro: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "ATENDIDO" | "RECHAZADO";
  detalle: string;
  pedido_consumidor: string;
  respuesta_admin?: string;
  fecha_respuesta?: string;
  created_at: string;
  establecimiento_nombre?: string;
}

export const LibroReclamacionesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();

  const [tab, setTab] = useState<"registrar" | "consultar">("registrar");
  const [locales, setLocales] = useState<Array<{ id: string; razon_social: string; nombre?: string }>>([]);

  // Formulario
  const [establecimientoId, setEstablecimientoId] = useState("");
  const [nombres, setNombres] = useState(user?.nombres || "");
  const [apellidos, setApellidos] = useState(user?.apellidos || "");
  const [tipoDocumento, setTipoDocumento] = useState("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoBien, setTipoBien] = useState<"SERVICIO" | "PRODUCTO">("SERVICIO");
  const [tipoRegistro, setTipoRegistro] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
  const [montoReclamado, setMontoReclamado] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedidoConsumidor, setPedidoConsumidor] = useState("");

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState<string | null>(null);

  // Consulta por código
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [reclamoEncontrado, setReclamoEncontrado] = useState<ReclamoStatus | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  useEffect(() => {
    // Cargar locales activos para asociar reclamo
    (async () => {
      try {
        const { data } = await api.get("/establishments");
        const list = data?.data ?? data ?? [];
        setLocales(Array.isArray(list) ? list : []);
      } catch {
        /* opcional */
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres || !apellidos || !numeroDocumento || !email || !detalle || !pedidoConsumidor) {
      showToast("Por favor complete todos los campos obligatorios.", "error");
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        establecimiento_id: establecimientoId || null,
        nombres_reclamante: nombres.trim(),
        apellidos_reclamante: apellidos.trim(),
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
        email: email.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        tipo_bien_contratado: tipoBien,
        tipo_registro: tipoRegistro,
        monto_reclamado: montoReclamado ? parseFloat(montoReclamado) : 0,
        detalle: detalle.trim(),
        pedido_consumidor: pedidoConsumidor.trim(),
      };

      const res = await api.post("/claims", payload);
      const codigo = res.data?.data?.codigo_seguimiento;
      setTicketGenerado(codigo);
      showToast("Reclamo registrado exitosamente", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar el reclamo", "error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleBuscarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBusqueda.trim()) return;

    setLoadingBusqueda(true);
    setErrorBusqueda(null);
    setReclamoEncontrado(null);

    try {
      const res = await api.get(`/claims/track/${codigoBusqueda.trim()}`);
      setReclamoEncontrado(res.data?.data);
    } catch (err: any) {
      setErrorBusqueda(err?.response?.data?.message || "No se encontró el código ingresado.");
    } finally {
      setLoadingBusqueda(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-text))] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl border border-[rgb(var(--app-border))] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-600" />
                Libro de Reclamaciones Virtual
              </h1>
              <p className="text-xs text-muted">
                Conforme a lo establecido en el Código de Protección y Defensa del Consumidor
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Canal Oficial
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgb(var(--app-border))] gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("registrar");
              setTicketGenerado(null);
            }}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              tab === "registrar"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-muted hover:text-[rgb(var(--app-text))]"
            }`}
          >
            Registrar Reclamo / Queja
          </button>
          <button
            type="button"
            onClick={() => setTab("consultar")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              tab === "consultar"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-muted hover:text-[rgb(var(--app-text))]"
            }`}
          >
            Consultar Estado de Reclamo
          </button>
        </div>

        {/* TAB 1: REGISTRAR */}
        {tab === "registrar" && (
          <div>
            {ticketGenerado ? (
              <div className="p-8 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                    ¡Reclamo Registrado Exitosamente!
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    Guarda tu código de seguimiento para consultar el estado de atención:
                  </p>
                </div>
                <div className="inline-block px-6 py-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl font-mono text-xl font-black text-emerald-600 tracking-wider select-all shadow-sm">
                  {ticketGenerado}
                </div>
                <p className="text-xs text-muted max-w-md mx-auto">
                  De acuerdo a la normativa vigente, la administración brindará respuesta formal en un plazo máximo legal.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTicketGenerado(null);
                      setDetalle("");
                      setPedidoConsumidor("");
                    }}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Registrar otro reclamo
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-[rgb(var(--app-surface))] p-6 rounded-2xl border border-[rgb(var(--app-border))] shadow-sm">
                {/* Tipo de Registro */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoRegistro("RECLAMO")}
                    className={`p-4 rounded-xl border text-left transition ${
                      tipoRegistro === "RECLAMO"
                        ? "border-sky-600 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                        : "border-[rgb(var(--app-border))] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <p className="font-bold text-sm">RECLAMO</p>
                    <p className="text-xs text-muted mt-0.5">Disconformidad relacionada a los productos o servicios ofrecidos.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoRegistro("QUEJA")}
                    className={`p-4 rounded-xl border text-left transition ${
                      tipoRegistro === "QUEJA"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-[rgb(var(--app-border))] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <p className="font-bold text-sm">QUEJA</p>
                    <p className="text-xs text-muted mt-0.5">Disconformidad frente a la mala atención o trato del personal.</p>
                  </button>
                </div>

                {/* Local Afectado */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Establecimiento Aliado o Plataforma Global
                  </label>
                  <select
                    value={establecimientoId}
                    onChange={(e) => setEstablecimientoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Plataforma General Pasaporte Digital NFC</option>
                    {locales.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombre || loc.razon_social}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Datos del Reclamante */}
                <div className="space-y-4 pt-2 border-t border-[rgb(var(--app-border))]">
                  <h3 className="text-sm font-bold">1. Identificación del Consumidor Reclamante</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="Ej. Juan Carlos"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="Ej. Pérez Quispe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Tipo y N° Documento *</label>
                      <div className="flex gap-2">
                        <select
                          value={tipoDocumento}
                          onChange={(e) => setTipoDocumento(e.target.value)}
                          className="w-24 px-2 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">Pasaporte</option>
                          <option value="RUC">RUC</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                          placeholder="Número de documento"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="para recibir la respuesta formal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="+51 987 654 321"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Dirección Domiciliaria</label>
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="Calle, Distrito, Ciudad"
                      />
                    </div>
                  </div>
                </div>

                {/* Detalle del Reclamo */}
                <div className="space-y-4 pt-2 border-t border-[rgb(var(--app-border))]">
                  <h3 className="text-sm font-bold">2. Detalle de la Reclamación</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Tipo de Bien Contratado</label>
                      <select
                        value={tipoBien}
                        onChange={(e: any) => setTipoBien(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                      >
                        <option value="SERVICIO">Servicio (NFC, Membresía, Atención)</option>
                        <option value="PRODUCTO">Producto (Tarjeta física, Recompensa)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Monto Reclamado (S/. Opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={montoReclamado}
                        onChange={(e) => setMontoReclamado(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Detalle y Hechos *</label>
                    <textarea
                      required
                      rows={4}
                      value={detalle}
                      onChange={(e) => setDetalle(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                      placeholder="Describa de manera clara y precisa los acontecimientos ocurridos..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Pedido Concreto del Consumidor *</label>
                    <textarea
                      required
                      rows={3}
                      value={pedidoConsumidor}
                      onChange={(e) => setPedidoConsumidor(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                      placeholder="Indique qué solicita para resolver su disconformidad..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Send className="w-4 h-4" />
                    {loadingSubmit ? "Enviando registro..." : "Enviar Reclamo / Queja"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: CONSULTAR ESTADO */}
        {tab === "consultar" && (
          <div className="space-y-6">
            <form onSubmit={handleBuscarCodigo} className="bg-[rgb(var(--app-surface))] p-6 rounded-2xl border border-[rgb(var(--app-border))] shadow-sm space-y-4">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Ingrese su Código de Seguimiento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value.toUpperCase())}
                  placeholder="Ej. REC-2026-0001"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[rgb(var(--app-border))] bg-transparent font-mono uppercase text-sm"
                />
                <button
                  type="submit"
                  disabled={loadingBusqueda}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center gap-2 transition"
                >
                  <Search className="w-4 h-4" />
                  {loadingBusqueda ? "Buscando..." : "Consultar"}
                </button>
              </div>
            </form>

            {errorBusqueda && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errorBusqueda}
              </div>
            )}

            {reclamoEncontrado && (
              <div className="bg-[rgb(var(--app-surface))] p-6 rounded-2xl border border-[rgb(var(--app-border))] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-3">
                  <div>
                    <span className="font-mono text-sm font-bold text-sky-600">
                      {reclamoEncontrado.codigo_seguimiento}
                    </span>
                    <p className="text-xs text-muted">
                      Registrado el {new Date(reclamoEncontrado.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      reclamoEncontrado.estado === "ATENDIDO"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : reclamoEncontrado.estado === "EN_PROCESO"
                        ? "bg-sky-500/15 text-sky-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {reclamoEncontrado.estado}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted uppercase font-semibold">Local / Destino</p>
                    <p className="font-medium">{reclamoEncontrado.establecimiento_nombre || "Plataforma General"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-semibold">Detalle presentado</p>
                    <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-[rgb(var(--app-border))]">
                      {reclamoEncontrado.detalle}
                    </p>
                  </div>

                  {reclamoEncontrado.respuesta_admin ? (
                    <div className="mt-4 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Respuesta Oficial de la Administración
                      </p>
                      <p className="text-xs">{reclamoEncontrado.respuesta_admin}</p>
                      {reclamoEncontrado.fecha_respuesta && (
                        <p className="text-[10px] text-muted">
                          Atendido el: {new Date(reclamoEncontrado.fecha_respuesta).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 p-4 border border-amber-500/30 bg-amber-500/5 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      Su caso se encuentra en revisión por el equipo administrativo. Le notificaremos por correo electrónico.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
