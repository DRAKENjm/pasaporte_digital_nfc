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
  Copy,
  Check,
  Calendar,
  User,
  Scale,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";

interface ReclamoStatus {
  id?: string;
  id_reclamacion?: string | number;
  codigo_reclamacion: string;
  codigo_seguimiento?: string;
  tipo: string;
  tipo_registro?: string;
  estado: string;
  detalle: string;
  pedido_consumidor: string;
  respuesta_proveedor?: string;
  respuesta_admin?: string;
  fecha_respuesta?: string;
  fecha_registro: string;
  created_at?: string;
  fecha_limite_respuesta?: string;
  establecimiento_nombre?: string;
  sucursal_nombre?: string;
}

export const LibroReclamacionesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"registrar" | "mis-reclamaciones" | "consultar">("registrar");
  const [locales, setLocales] = useState<Array<{ id_establecimiento?: number | string; id?: string; nombre_comercial?: string; razon_social?: string }>>([]);

  // Campos del formulario con autollenado de usuario logueado
  const [establecimientoId, setEstablecimientoId] = useState("");
  const [nombres, setNombres] = useState(user?.nombres || "");
  const [apellidos, setApellidos] = useState(user?.apellidos || "");
  const [tipoDocumento, setTipoDocumento] = useState("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState(user?.telefono || user?.phone || "");
  const [tipoBien, setTipoBien] = useState<"SERVICIO" | "PRODUCTO">("SERVICIO");
  const [tipoRegistro, setTipoRegistro] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
  const [montoReclamado, setMontoReclamado] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedidoConsumidor, setPedidoConsumidor] = useState("");

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState<{
    codigo: string;
    fecha_limite?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Consulta por código
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [reclamoEncontrado, setReclamoEncontrado] = useState<ReclamoStatus | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  // Mis reclamaciones (historial del usuario)
  const [misReclamos, setMisReclamos] = useState<ReclamoStatus[]>([]);
  const [loadingMisReclamos, setLoadingMisReclamos] = useState(false);

  // Autollenado cuando cambie o cargue el usuario
  useEffect(() => {
    if (user) {
      if (!nombres && user.nombres) setNombres(user.nombres);
      if (!apellidos && user.apellidos) setApellidos(user.apellidos);
      if (!email && user.email) setEmail(user.email);
      if (!telefono && (user.telefono || user.phone)) {
        setTelefono(String(user.telefono || user.phone).replace(/\D/g, "").slice(0, 9));
      }
    }
  }, [user]);

  // Cargar mis reclamaciones si el usuario está autenticado
  const fetchMisReclamaciones = async () => {
    if (!user) return;
    setLoadingMisReclamos(true);
    try {
      const res = await api.get("/claims/mis-reclamaciones");
      const list = res.data?.data || res.data || [];
      setMisReclamos(Array.isArray(list) ? list : []);
    } catch {
      /* Silencioso */
    } finally {
      setLoadingMisReclamos(false);
    }
  };

  useEffect(() => {
    if (user && tab === "mis-reclamaciones") {
      fetchMisReclamaciones();
    }
  }, [user, tab]);

  useEffect(() => {
    // Cargar locales afiliados para asociar el reclamo si aplica
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

  // Manejo restringido de documento según tipo
  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (tipoDocumento === "DNI") {
      // Solo números y máximo 8 dígitos
      const numeric = val.replace(/\D/g, "").slice(0, 8);
      setNumeroDocumento(numeric);
    } else if (tipoDocumento === "CE") {
      // Extranjería: hasta 9 alfanumérico
      setNumeroDocumento(val.slice(0, 12).trim());
    } else if (tipoDocumento === "RUC") {
      // RUC: 11 dígitos
      const numeric = val.replace(/\D/g, "").slice(0, 11);
      setNumeroDocumento(numeric);
    } else {
      setNumeroDocumento(val.slice(0, 15));
    }
  };

  // Manejo restringido de celular/teléfono (9 dígitos numéricos en Perú)
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 9);
    setTelefono(numeric);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim() || !numeroDocumento.trim() || !email.trim() || !detalle.trim() || !pedidoConsumidor.trim()) {
      showToast("Por favor completa todos los campos obligatorios.", "error");
      return;
    }

    if (tipoDocumento === "DNI" && numeroDocumento.trim().length !== 8) {
      showToast("El DNI debe tener exactamente 8 dígitos numéricos.", "error");
      return;
    }

    if (telefono.trim() && telefono.trim().length < 9) {
      showToast("El número de celular debe tener 9 dígitos.", "error");
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        id_establecimiento: establecimientoId ? Number(establecimientoId) : null,
        establecimiento_id: establecimientoId ? Number(establecimientoId) : null,
        nombres_consumidor: nombres.trim(),
        nombres_reclamante: nombres.trim(),
        apellidos_consumidor: apellidos.trim(),
        apellidos_reclamante: apellidos.trim(),
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
        email: email.trim(),
        telefono: telefono.trim() || null,
        tipo: tipoRegistro,
        tipo_registro: tipoRegistro,
        tipo_bien_contratado: tipoBien,
        descripcion_bien_servicio:
          tipoBien === "SERVICIO"
            ? "Servicio de Pasaporte Digital / Fidelización"
            : "Producto adquirido en comercio afiliado",
        monto_reclamado: montoReclamado ? parseFloat(montoReclamado) : null,
        detalle: detalle.trim(),
        pedido_consumidor: pedidoConsumidor.trim(),
      };

      const res = await api.post("/claims", payload);
      const data = res.data?.data || res.data;
      const codigo = data?.codigo_reclamacion || data?.codigo_seguimiento || `LR-${new Date().getFullYear()}-000000`;
      const fechaLimite = data?.fecha_limite_respuesta;

      setTicketGenerado({
        codigo,
        fecha_limite: fechaLimite,
      });
      showToast("Hoja de reclamación registrada exitosamente", "success");
      if (user) {
        fetchMisReclamaciones();
      }
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
      const res = await api.get(`/claims/track/${encodeURIComponent(codigoBusqueda.trim())}`);
      setReclamoEncontrado(res.data?.data || res.data);
    } catch (err: any) {
      setErrorBusqueda(err?.response?.data?.message || "No se encontró ninguna reclamación con el código ingresado.");
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const copiarCodigo = () => {
    if (!ticketGenerado?.codigo) return;
    navigator.clipboard.writeText(ticketGenerado.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D1A1E] p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Encabezado formal del Libro de Reclamaciones */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DACD] shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] flex items-center justify-center hover:bg-[#F2ECE4] active:scale-95 transition-all text-[#2D1A1E] shrink-0"
              title="Volver"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Scale size={16} className="text-[#7C0A1E]" />
                <h1 className="text-base sm:text-lg font-bold text-[#2D1A1E] leading-tight">
                  Libro de Reclamaciones Virtual
                </h1>
              </div>
              <p className="text-[11px] text-[#6E5D53] mt-0.5">
                Conforme a la Ley N° 29571 (Código de Protección y Defensa del Consumidor del Perú)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] text-[#7C0A1E] border border-[#E5DACD] rounded-xl text-xs font-bold shrink-0">
            <ShieldCheck size={14} />
            <span>Oficial</span>
          </div>
        </div>

        {/* Selector de Pestañas (3 Pestañas si está logueado o 2 si es anónimo) */}
        <div className="bg-white rounded-2xl border border-[#E5DACD] p-1 flex gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setTab("registrar");
              setTicketGenerado(null);
            }}
            className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === "registrar"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            Registrar Reclamo
          </button>

          {user && (
            <button
              type="button"
              onClick={() => setTab("mis-reclamaciones")}
              className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition-all relative ${
                tab === "mis-reclamaciones"
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
              }`}
            >
              Mis Reclamaciones
              {misReclamos.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-[#C5A059] text-white rounded-full text-[10px] font-black">
                  {misReclamos.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab("consultar")}
            className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === "consultar"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            Consultar por Código
          </button>
        </div>

        {/* PESTAÑA 1: REGISTRAR RECLAMO */}
        {tab === "registrar" && (
          <div>
            {ticketGenerado ? (
              <div className="bg-white border border-[#E5DACD] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={30} />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block">
                    Hoja de Reclamación Registrada
                  </span>
                  <h2 className="text-lg font-bold text-[#2D1A1E] mt-0.5">
                    ¡Tu reclamación ha sido enviada a la Administración!
                  </h2>
                  <p className="text-xs text-[#6E5D53] mt-1 max-w-md mx-auto">
                    Conforme al Art. 24 de la Ley N° 29571, la administración tiene un plazo legal máximo de hasta 15 días hábiles para emitir respuesta formal.
                  </p>
                </div>

                {/* Código de Seguimiento */}
                <div className="bg-[#FAF8F5] border border-[#E5DACD] rounded-2xl p-4 max-w-sm mx-auto">
                  <span className="text-[10px] uppercase font-bold text-[#8E7D7D] block mb-1">
                    Código oficial de seguimiento
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xl font-black text-[#7C0A1E] tracking-wider select-all">
                      {ticketGenerado.codigo}
                    </span>
                    <button
                      type="button"
                      onClick={copiarCodigo}
                      className="p-1.5 rounded-lg border border-[#E5DACD] text-[#6E5D53] hover:text-[#7C0A1E] bg-white transition-all cursor-pointer"
                      title="Copiar código"
                    >
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                  {ticketGenerado.fecha_limite && (
                    <span className="text-[10px] text-[#8E7D7D] mt-2 block font-mono">
                      Fecha límite de atención: {new Date(ticketGenerado.fecha_limite).toLocaleDateString("es-PE")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCodigoBusqueda(ticketGenerado.codigo);
                      setTab("consultar");
                    }}
                    className="px-4 py-2 bg-[#7C0A1E] text-white rounded-xl text-xs font-bold hover:bg-[#650818] transition shadow-xs cursor-pointer"
                  >
                    Hacer seguimiento de este reclamo
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setTab("mis-reclamaciones")}
                      className="px-4 py-2 bg-[#C5A059] text-white rounded-xl text-xs font-bold hover:bg-[#A88640] transition shadow-xs cursor-pointer"
                    >
                      Ver en Mis Reclamaciones
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTicketGenerado(null);
                      setDetalle("");
                      setPedidoConsumidor("");
                    }}
                    className="px-4 py-2 border border-[#E5DACD] bg-[#FAF8F5] text-[#2D1A1E] rounded-xl text-xs font-semibold hover:bg-[#F2ECE4] transition cursor-pointer"
                  >
                    Nuevo registro
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#E5DACD] shadow-xs">
                {/* 1. Tipo de Registro: Reclamo vs Queja */}
                <div>
                  <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-2">
                    1. Tipo de Disconformidad
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoRegistro("RECLAMO")}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        tipoRegistro === "RECLAMO"
                          ? "border-[#7C0A1E] bg-rose-50/60 text-[#7C0A1E] shadow-xs"
                          : "border-[#E5DACD] bg-[#FAF8F5] text-[#6E5D53] hover:border-[#7C0A1E]/30"
                      }`}
                    >
                      <p className="font-bold text-xs uppercase">RECLAMO</p>
                      <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                        Disconformidad relacionada a los servicios o productos ofrecidos.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoRegistro("QUEJA")}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        tipoRegistro === "QUEJA"
                          ? "border-[#C5A059] bg-amber-50/60 text-[#8F6C22] shadow-xs"
                          : "border-[#E5DACD] bg-[#FAF8F5] text-[#6E5D53] hover:border-[#C5A059]/40"
                      }`}
                    >
                      <p className="font-bold text-xs uppercase">QUEJA</p>
                      <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                        Disconformidad por la atención al cliente o trato del personal.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Establecimiento o Servicio */}
                <div>
                  <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
                    2. Establecimiento Asociado (Opcional)
                  </label>
                  <select
                    value={establecimientoId}
                    onChange={(e) => setEstablecimientoId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DACD] text-[#2D1A1E] text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#7C0A1E] transition cursor-pointer"
                  >
                    <option value="">Plataforma Pasaporte Digital (General)</option>
                    {locales.map((l) => (
                      <option
                        key={l.id_establecimiento || l.id}
                        value={l.id_establecimiento || l.id}
                      >
                        {l.nombre_comercial || l.razon_social}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Identificación del Consumidor Reclamante */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider block">
                      3. Identificación del Consumidor
                    </label>
                    {user && (
                      <span className="text-[10px] font-semibold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md">
                        Datos completados automáticamente
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">Nombres *</span>
                      <input
                        type="text"
                        required
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        placeholder="Nombres completos"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">Apellidos *</span>
                      <input
                        type="text"
                        required
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        placeholder="Apellidos completos"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="flex gap-2">
                      <div className="w-28 shrink-0">
                        <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">Tipo Doc.</span>
                        <select
                          value={tipoDocumento}
                          onChange={(e) => {
                            setTipoDocumento(e.target.value);
                            setNumeroDocumento("");
                          }}
                          className="w-full px-2.5 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                        >
                          <option value="DNI">DNI (8 dígitos)</option>
                          <option value="CE">C.E.</option>
                          <option value="PASAPORTE">Pasaporte</option>
                          <option value="RUC">RUC (11 dígitos)</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">
                          Número * {tipoDocumento === "DNI" ? "(8 dígitos)" : ""}
                        </span>
                        <input
                          type="text"
                          required
                          value={numeroDocumento}
                          onChange={handleDocumentoChange}
                          maxLength={tipoDocumento === "DNI" ? 8 : tipoDocumento === "RUC" ? 11 : 15}
                          placeholder={tipoDocumento === "DNI" ? "Ej: 12345678" : "Número de documento"}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs font-mono text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">Correo Electrónico *</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">
                        Celular / Teléfono (9 dígitos)
                      </span>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={handleTelefonoChange}
                        maxLength={9}
                        placeholder="987654321"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs font-mono text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#8E7D7D] block mb-0.5">Monto Reclamado (S/. opcional)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={montoReclamado}
                        onChange={(e) => setMontoReclamado(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Detalle y Pedido */}
                <div>
                  <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
                    4. Detalle del Reclamo o Queja *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    placeholder="Describe de forma clara los hechos ocurridos, fecha y circunstancias..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
                    5. Pedido Concreto del Consumidor *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={pedidoConsumidor}
                    onChange={(e) => setPedidoConsumidor(e.target.value)}
                    placeholder="Indica qué solución o respuesta esperas por parte de la empresa o local..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E] leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="w-full py-3 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#650818] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>{loadingSubmit ? "Registrando en Libro..." : "Enviar Hoja de Reclamación"}</span>
                  </button>
                  <p className="text-[10px] text-[#8E7D7D] text-center mt-2">
                    Al enviar, se generará una copia oficial con código único de registro conforme a ley.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PESTAÑA 2: MIS RECLAMACIONES (Historial del Usuario) */}
        {tab === "mis-reclamaciones" && (
          <div className="bg-white rounded-2xl border border-[#E5DACD] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#2D1A1E]">Mis Reclamaciones Presentadas</h3>
                <p className="text-xs text-[#6E5D53] mt-0.5">
                  Historial de quejas y reclamos con su estado de atención y resolución legal.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchMisReclamaciones}
                disabled={loadingMisReclamos}
                className="text-xs font-semibold text-[#7C0A1E] hover:underline cursor-pointer disabled:opacity-50"
              >
                Actualizar
              </button>
            </div>

            {loadingMisReclamos ? (
              <div className="py-12 text-center text-xs text-[#8E7D7D]">
                Cargando tu historial de reclamaciones...
              </div>
            ) : misReclamos.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E5DACD] flex items-center justify-center mx-auto text-[#8E7D7D]">
                  <FileText size={22} />
                </div>
                <p className="text-xs font-bold text-[#2D1A1E]">No tienes reclamaciones registradas</p>
                <p className="text-[11px] text-[#6E5D53] max-w-xs mx-auto">
                  Si presentas alguna disconformidad, puedes registrar una nueva hoja de reclamación en la primera pestaña.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("registrar")}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#650818] transition shadow-xs cursor-pointer"
                >
                  Registrar reclamo ahora
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {misReclamos.map((rec) => {
                  const estadoBadgeColor =
                    rec.estado === "ATENDIDO" || rec.estado === "RESPONDIDO"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : rec.estado === "RECHAZADO"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : rec.estado === "EN_PROCESO"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <div
                      key={rec.id || rec.codigo_reclamacion}
                      className="p-4 rounded-2xl border border-[#E5DACD] bg-[#FAF8F5] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E5DACD]/70 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#7C0A1E] text-xs">
                            {rec.codigo_reclamacion || rec.codigo_seguimiento}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              (rec.tipo || rec.tipo_registro) === "RECLAMO"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {rec.tipo || rec.tipo_registro}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoBadgeColor}`}>
                            {rec.estado}
                          </span>
                          <span className="text-[10px] text-[#8E7D7D] font-mono">
                            {new Date(rec.fecha_registro || rec.created_at || "").toLocaleDateString("es-PE")}
                          </span>
                        </div>
                      </div>

                      {rec.establecimiento_nombre && (
                        <div className="text-xs text-[#6E5D53]">
                          <span className="font-semibold text-[#2D1A1E]">Establecimiento:</span>{" "}
                          {rec.establecimiento_nombre}
                        </div>
                      )}

                      <div className="text-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8E7D7D] block mb-0.5">
                          Detalle del reclamo:
                        </span>
                        <p className="text-[#2D1A1E] bg-white p-2.5 rounded-xl border border-[#E5DACD] leading-relaxed">
                          {rec.detalle}
                        </p>
                      </div>

                      {/* Respuesta de la Administración */}
                      {(rec.respuesta_proveedor || rec.respuesta_admin) ? (
                        <div className="border border-emerald-200 bg-emerald-50/80 p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Respuesta Oficial de la Administración:
                          </span>
                          <p className="text-emerald-950 whitespace-pre-wrap leading-relaxed">
                            {rec.respuesta_proveedor || rec.respuesta_admin}
                          </p>
                          {rec.fecha_respuesta && (
                            <span className="text-[9.5px] text-emerald-700 block font-mono mt-1">
                              Respondido el: {new Date(rec.fecha_respuesta).toLocaleString("es-PE")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="border border-amber-200 bg-amber-50/60 p-2.5 rounded-xl text-xs flex items-center gap-2 text-amber-800">
                          <Clock size={14} className="shrink-0 text-amber-600" />
                          <span className="text-[11px]">
                            En revisión legal. Plazo máximo de atención hasta el{" "}
                            {rec.fecha_limite_respuesta
                              ? new Date(rec.fecha_limite_respuesta).toLocaleDateString("es-PE")
                              : "15 días hábiles"}
                            .
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: CONSULTAR ESTADO DE RECLAMO POR CÓDIGO */}
        {tab === "consultar" && (
          <div className="bg-white rounded-2xl border border-[#E5DACD] p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Consultar Reclamación</h3>
              <p className="text-xs text-[#6E5D53] mt-0.5">
                Ingresa el código que recibiste al presentar tu reclamo (ejemplo: LR-2026-123456):
              </p>
            </div>

            <form onSubmit={handleBuscarCodigo} className="flex gap-2">
              <input
                type="text"
                required
                value={codigoBusqueda}
                onChange={(e) => setCodigoBusqueda(e.target.value)}
                placeholder="LR-2026-XXXXXX"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5DACD] bg-[#FAF8F5] text-xs font-mono font-bold text-[#2D1A1E] uppercase focus:outline-none focus:border-[#7C0A1E]"
              />
              <button
                type="submit"
                disabled={loadingBusqueda}
                className="px-4 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#650818] active:scale-95 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Search size={15} />
                <span>{loadingBusqueda ? "Buscando..." : "Buscar"}</span>
              </button>
            </form>

            {errorBusqueda && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorBusqueda}</span>
              </div>
            )}

            {reclamoEncontrado && (
              <div className="mt-4 border border-[#E5DACD] rounded-2xl p-4 sm:p-5 bg-[#FAF8F5] space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8E7D7D] block">
                      Código de Reclamación
                    </span>
                    <span className="font-mono text-base font-black text-[#7C0A1E]">
                      {reclamoEncontrado.codigo_reclamacion || reclamoEncontrado.codigo_seguimiento}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      reclamoEncontrado.estado === "RESPONDIDO" || reclamoEncontrado.estado === "ATENDIDO"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {reclamoEncontrado.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#8E7D7D] block">Tipo:</span>
                    <span className="font-semibold text-[#2D1A1E]">{reclamoEncontrado.tipo || reclamoEncontrado.tipo_registro}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E7D7D] block">Fecha de Registro:</span>
                    <span className="font-mono text-[#2D1A1E]">
                      {new Date(reclamoEncontrado.fecha_registro || reclamoEncontrado.created_at || "").toLocaleDateString("es-PE")}
                    </span>
                  </div>
                </div>

                {reclamoEncontrado.establecimiento_nombre && (
                  <div className="text-xs">
                    <span className="text-[10px] text-[#8E7D7D] block">Establecimiento:</span>
                    <span className="font-semibold text-[#2D1A1E]">{reclamoEncontrado.establecimiento_nombre}</span>
                  </div>
                )}

                <div className="text-xs">
                  <span className="text-[10px] text-[#8E7D7D] block">Detalle presentado:</span>
                  <p className="text-[#2D1A1E] mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-[#E5DACD]">
                    {reclamoEncontrado.detalle}
                  </p>
                </div>

                {/* Respuesta oficial del proveedor si existe */}
                {(reclamoEncontrado.respuesta_proveedor || reclamoEncontrado.respuesta_admin) ? (
                  <div className="border border-emerald-200 bg-emerald-50/70 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Respuesta Oficial de la Administración
                    </span>
                    <p className="text-emerald-950 leading-relaxed">
                      {reclamoEncontrado.respuesta_proveedor || reclamoEncontrado.respuesta_admin}
                    </p>
                    {reclamoEncontrado.fecha_respuesta && (
                      <span className="text-[9.5px] text-emerald-700 block font-mono mt-1">
                        Respondido el: {new Date(reclamoEncontrado.fecha_respuesta).toLocaleString("es-PE")}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="border border-amber-200 bg-amber-50/60 p-3 rounded-xl text-xs flex items-center gap-2 text-amber-800">
                    <Clock size={16} className="shrink-0 text-amber-600" />
                    <span>Tu reclamación se encuentra en proceso de revisión por parte de la administración.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
