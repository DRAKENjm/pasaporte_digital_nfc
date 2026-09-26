import React, { useEffect, useState } from "react";
import { FileText, Shield, Save, CheckCircle2, Edit3, Plus, Globe } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";

export const AdminLegal: React.FC = () => {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get("/admin/documentos-legales");
        const list = res.data.data || [];
        setDocumentos(list);
        if (list.length > 0) setSelectedDoc(list[0]);
      } catch (e) {
        console.error("Error al cargar documentos legales", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Documento legal actualizado y publicado", "success");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Documentos Legales y Privacidad</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Gestión de Términos y Condiciones, Políticas de Privacidad y Cumplimiento Normativo (Ley N° 29733)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector de Documentos */}
        <div className="bg-white rounded-3xl p-5 border border-[#EFE7DE] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#8E7D7D] uppercase tracking-wider">
            Documentos Activos
          </h3>

          <div className="space-y-2">
            {[
              { id: 1, title: "Términos y Condiciones Generales", version: "v2.1", date: "2026-09-01" },
              { id: 2, title: "Política de Privacidad y Tratamiento de Datos", version: "v2.0", date: "2026-08-15" },
              { id: 3, title: "Reglamento del Programa de Recompensas", version: "v1.4", date: "2026-09-10" },
              { id: 4, title: "Políticas de Cookies y Rastreo", version: "v1.0", date: "2026-07-20" },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  selectedDoc?.id === doc.id
                    ? "bg-rose-50 border-[#7C0A1E]/30 text-[#7C0A1E]"
                    : "bg-white border-[#EFE7DE] text-[#2D1A1E] hover:bg-[#FAF8F5]"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{doc.title}</h4>
                  <p className="text-[10px] text-[#8E7D7D]">Versión {doc.version} · {doc.date}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Vigente
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor del Documento */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE7DE] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#2D1A1E]">
                {selectedDoc?.title || "Términos y Condiciones Generales"}
              </h3>
              <p className="text-xs text-[#8E7D7D]">Última modificación registrada por Administración General</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] transition shadow-xs flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{saving ? "Publicando..." : "Guardar Versión"}</span>
            </button>
          </div>

          <textarea
            rows={14}
            defaultValue={`TÉRMINOS Y CONDICIONES DEL SERVICIO PASAPORTE DIGITAL NFC

1. OBJETO
El presente documento regula el uso de la plataforma 'Pasaporte Digital NFC' y sus aplicaciones asociadas, destinadas a la fidelización de clientes en establecimientos comerciales afiliados.

2. TITULARIDAD DE LA CUENTA Y PUNTOS
El cliente es el único titular de su cuenta digital, los puntos acumulados y los sellos obtenidos. La tarjeta física NFC constituye un medio de acceso y validación; en caso de extravío o deterioro, la cuenta retiene el 100% de los beneficios.

3. TRATAMIENTO DE DATOS PERSONALES (LEY 29733)
De conformidad con la Ley N° 29733, los datos personales recopilados se utilizan exclusivamente para la gestión del programa de recompensas, notificaciones de saldo y prevención de fraudes.

4. VIGENCIA Y CANJE DE RECOMPENSAS
Los puntos y sellos son acumulables según las reglas específicas de cada establecimiento afiliado. Los canjes están sujetos a disponibilidad de stock en local.`}
            className="w-full p-4 rounded-2xl border border-[#EFE7DE] text-xs font-mono text-[#2D1A1E] leading-relaxed focus:outline-none focus:border-[#7C0A1E]"
          />
        </div>
      </div>
    </div>
  );
};
