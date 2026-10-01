import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Shield,
  ShieldCheck,
  Scale,
  Calendar,
  ExternalLink,
  Printer,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";

type LegalDocType = "TERMINOS_CONDICIONES" | "POLITICA_PRIVACIDAD";

export const LegalViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tipo inicial por query param ?tipo=... o default TERMINOS_CONDICIONES
  const rawType = searchParams.get("tipo");
  const initialType: LegalDocType =
    rawType === "privacidad" || rawType === "POLITICA_PRIVACIDAD"
      ? "POLITICA_PRIVACIDAD"
      : "TERMINOS_CONDICIONES";

  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialType);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    titulo: string;
    version?: string;
    fecha_vigencia?: string;
    contenido_html: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar tab si cambia URL param
  useEffect(() => {
    const q = searchParams.get("tipo");
    if (q === "privacidad" || q === "POLITICA_PRIVACIDAD") {
      setActiveDoc("POLITICA_PRIVACIDAD");
    } else if (q === "terminos" || q === "TERMINOS_CONDICIONES") {
      setActiveDoc("TERMINOS_CONDICIONES");
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/legal/documentos/${activeDoc}`);
        const resData = res.data?.data || res.data;
        if (isMounted) {
          setData(resData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              "No se pudo cargar el documento legal. Por favor intenta más tarde."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoc();
    return () => {
      isMounted = false;
    };
  }, [activeDoc]);

  const switchTab = (tipo: LegalDocType) => {
    setActiveDoc(tipo);
    setSearchParams({ tipo: tipo === "POLITICA_PRIVACIDAD" ? "privacidad" : "terminos" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D1A1E] flex flex-col font-sans selection:bg-[#7C0A1E]/20 selection:text-[#7C0A1E]">
      {/* Header Superior Formal */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8DFD5] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl border border-[#E8DFD5] bg-[#FAF8F5] flex items-center justify-center hover:bg-[#F0ECE6] active:scale-95 transition-all text-[#2D1A1E]"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              <h1 className="text-sm sm:text-base font-bold text-[#2D1A1E] tracking-tight">
                Marco Legal Oficial
              </h1>
            </div>
            <p className="text-[10px] text-[#8E7D7D]">
              Pasaporte Digital NFC · República del Perú
            </p>
          </div>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8DFD5] bg-white text-xs font-semibold text-[#6E5D53] hover:text-[#7C0A1E] hover:border-[#7C0A1E]/30 transition shadow-2xs"
            title="Imprimir documento"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-[11px] font-bold">
            <ShieldCheck size={14} />
            <span>Vigente</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Selector de Pestañas Formal */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-1.5 flex gap-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => switchTab("TERMINOS_CONDICIONES")}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDoc === "TERMINOS_CONDICIONES"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            <FileText size={16} />
            <span>Términos y Condiciones</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab("POLITICA_PRIVACIDAD")}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeDoc === "POLITICA_PRIVACIDAD"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
            }`}
          >
            <Shield size={16} />
            <span>Política de Privacidad</span>
          </button>
        </div>

        {/* Tarjeta del Documento Legal con Tipografía y Estilo Institucional */}
        <article className="bg-white border border-[#E8DFD5] rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
          {/* Cabecera institucional del documento */}
          <div className="border-b border-[#E8DFD5] pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mb-1">
                  Documento Legal Certificado
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#2D1A1E] tracking-tight">
                  {data?.titulo || (activeDoc === "TERMINOS_CONDICIONES" ? "Términos y Condiciones Generales" : "Política de Privacidad")}
                </h2>
              </div>
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5 text-xs text-[#8E7D7D] font-mono">
                <span>Versión: <strong>{data?.version || "1.0"}</strong></span>
                <span>
                  Fecha:{" "}
                  <strong>
                    {data?.fecha_vigencia
                      ? new Date(data.fecha_vigencia).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "2026"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Estado de Carga */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#7C0A1E]/20 border-t-[#7C0A1E] rounded-full animate-spin" />
              <p className="text-xs text-[#8E7D7D] font-medium">Cargando documento oficial...</p>
            </div>
          )}

          {/* Estado de Error */}
          {error && !loading && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
              <p className="text-xs font-bold">{error}</p>
              <button
                type="button"
                onClick={() => switchTab(activeDoc)}
                className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Contenido HTML del Documento */}
          {!loading && !error && data && (
            <div
              className="legal-document-content text-xs sm:text-sm text-[#2D1A1E] leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: data.contenido_html }}
            />
          )}

          {/* Pie de página del documento con firma y Libro de Reclamaciones */}
          <div className="mt-12 pt-8 border-t border-[#E8DFD5] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF8F5] -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center text-[#7C0A1E] shrink-0 shadow-2xs">
                <Scale size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#2D1A1E]">
                  Protección al Consumidor
                </p>
                <p className="text-[11px] text-[#8E7D7D]">
                  ¿Tienes alguna duda o disconformidad?
                </p>
              </div>
            </div>

            <Link
              to="/reclamaciones"
              className="px-4 py-2.5 rounded-xl bg-[#7C0A1E] text-white font-bold text-xs hover:bg-[#650818] transition flex items-center gap-2 shadow-xs shrink-0"
            >
              <span>Ir al Libro de Reclamaciones</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
};
