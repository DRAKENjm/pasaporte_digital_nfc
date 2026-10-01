import React, { useEffect, useState } from "react";
import { FileText, Shield, Save, CheckCircle2, Edit3, Plus, Globe } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";

interface DocLegalItem {
  id?: string | number;
  id_documento?: string | number;
  tipo_documento: string;
  titulo: string;
  version: string;
  contenido_html?: string;
  contenido_url?: string;
  fecha_creacion?: string;
  fecha_publicacion?: string;
  estado?: number;
}

const DEFAULT_DOCS: DocLegalItem[] = [
  {
    tipo_documento: "TERMINOS_CONDICIONES",
    titulo: "Términos y Condiciones Generales",
    version: "v2.1",
    contenido_html: `<h3>1. Objeto y Alcance</h3>
<p>El presente documento regula el uso de la plataforma 'Pasaporte Digital NFC' y sus aplicaciones móviles asociadas, destinadas a la fidelización y certificación de visitas en establecimientos comerciales afiliados.</p>

<h3>2. Titularidad de la Cuenta y Sellos</h3>
<p>El cliente es el único titular de su cuenta digital y de los sellos obtenidos mediante validación presencial NFC. En caso de pérdida de la credencial física, los beneficios se mantienen respaldados en la nube.</p>

<h3>3. Canje de Beneficios</h3>
<p>Cada comercio afiliado determina el número de sellos necesarios para acceder a recompensas y promociones exclusivas.</p>`,
  },
  {
    tipo_documento: "POLITICA_PRIVACIDAD",
    titulo: "Política de Privacidad y Tratamiento de Datos",
    version: "v2.0",
    contenido_html: `<h3>1. Marco Legal (Ley N° 29733)</h3>
<p>De conformidad con la Ley de Protección de Datos Personales del Perú (Ley N° 29733), los datos recopilados se tratan de forma confidencial y segura.</p>

<h3>2. Finalidades</h3>
<p>Sus datos personales se utilizan exclusivamente para el registro de visitas NFC, emisión de sellos oficiales y atención de requerimientos en el Libro de Reclamaciones.</p>

<h3>3. Derechos ARCO</h3>
<p>Puede solicitar el acceso, rectificación, cancelación u oposición de sus datos en cualquier momento a través de los canales oficiales de soporte.</p>`,
  },
  {
    tipo_documento: "POLITICA_COOKIES",
    titulo: "Políticas de Cookies y Rastreo",
    version: "v1.0",
    contenido_html: `<h3>Uso de Tecnologías de Almacenamiento</h3>
<p>Utilizamos cookies de sesión y LocalStorage únicamente para mantener la autenticación del usuario, guardar preferencias de idioma y garantizar transacciones seguras.</p>`,
  },
];

export const AdminLegal: React.FC = () => {
  const [documentos, setDocumentos] = useState<DocLegalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocLegalItem | null>(null);
  const [titulo, setTitulo] = useState("");
  const [version, setVersion] = useState("1.0");
  const [contenido, setContenido] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();

  const fetchDocs = async () => {
    try {
      const res = await api.get("/admin/documentos-legales");
      const list = res.data.data || res.data || [];
      if (list.length > 0) {
        setDocumentos(list);
        setSelectedDoc(list[0]);
        setTitulo(list[0].titulo || "");
        setVersion(list[0].version || "1.0");
        setContenido(list[0].contenido_html || "");
      } else {
        setDocumentos(DEFAULT_DOCS);
        setSelectedDoc(DEFAULT_DOCS[0]);
        setTitulo(DEFAULT_DOCS[0].titulo);
        setVersion(DEFAULT_DOCS[0].version);
        setContenido(DEFAULT_DOCS[0].contenido_html || "");
      }
    } catch (e) {
      console.error("Error al cargar documentos legales", e);
      setDocumentos(DEFAULT_DOCS);
      setSelectedDoc(DEFAULT_DOCS[0]);
      setTitulo(DEFAULT_DOCS[0].titulo);
      setVersion(DEFAULT_DOCS[0].version);
      setContenido(DEFAULT_DOCS[0].contenido_html || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSelectDoc = (doc: DocLegalItem) => {
    setSelectedDoc(doc);
    setTitulo(doc.titulo || "");
    setVersion(doc.version || "1.0");
    setContenido(doc.contenido_html || "");
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      await api.post("/admin/documentos-legales", {
        tipo_documento: selectedDoc.tipo_documento,
        titulo: titulo.trim(),
        version: version.trim(),
        contenido_html: contenido.trim(),
        estado: 1,
      });

      showToast("Documento legal guardado y publicado en la app móvil", "success");
      await fetchDocs();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al guardar el documento legal", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  }

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
            Documentos Activos en el Sistema
          </h3>

          <div className="space-y-2">
            {documentos.map((doc) => {
              const isSelected = selectedDoc?.tipo_documento === doc.tipo_documento;
              return (
                <button
                  key={doc.tipo_documento || doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-rose-50 border-[#7C0A1E]/30 text-[#7C0A1E]"
                      : "bg-white border-[#EFE7DE] text-[#2D1A1E] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold truncate">{doc.titulo}</h4>
                    <p className="text-[10px] text-[#8E7D7D] font-mono">
                      Versión {doc.version} · {doc.tipo_documento}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    Vigente
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor del Documento */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE7DE] pb-4">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8E7D7D] block">
                {selectedDoc?.tipo_documento}
              </span>
              <h3 className="text-base font-bold text-[#2D1A1E] truncate">
                {titulo || "Documento Legal"}
              </h3>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? "Guardando..." : "Guardar y Publicar"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10.5px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
                Título del Documento
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EFE7DE] bg-[#FAF8F5] text-xs text-[#2D1A1E] font-semibold focus:outline-none focus:border-[#7C0A1E]"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
                Versión
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EFE7DE] bg-[#FAF8F5] text-xs font-mono font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10.5px] font-bold text-[#6E5D53] uppercase tracking-wider block mb-1">
              Contenido (HTML / Texto Formateado)
            </label>
            <textarea
              rows={14}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Ingresa el contenido HTML o texto del documento..."
              className="w-full p-4 rounded-2xl border border-[#EFE7DE] bg-[#FAF8F5] text-xs font-mono text-[#2D1A1E] leading-relaxed focus:outline-none focus:border-[#7C0A1E] focus:bg-white transition"
            />
            <p className="text-[10px] text-[#8E7D7D] mt-1.5">
              Este contenido se mostrará de inmediato a todos los usuarios cuando abran Términos y Condiciones o Políticas de Privacidad desde su perfil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
