import React, { useEffect, useState } from "react";
import {
  Wifi,
  Gift,
  History,
  Heart,
  Users,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Edit2,
  Sparkles,
  Copy,
  Check,
  X,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

const IDIOMAS = [
  { code: "es", label: "Español", flag: "🇵🇪" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "qu", label: "Quechua", flag: "🏔️" },
] as const;

type IdiomaCode = (typeof IDIOMAS)[number]["code"];

export const PerfilPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [showIdioma, setShowIdioma] = useState(false);
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLegal, setShowLegal] = useState<"terminos" | "privacidad" | null>(null);
  const [legalContent, setLegalContent] = useState("");
  const [legalTitle, setLegalTitle] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        const data = res.data.data;
        setProfile(data);
        setNombres(data.nombres || "");
        setApellidos(data.apellidos || "");
        setTelefono(data.telefono || "");
        setFotoUrl(data.foto_perfil || "");
        if (data.idioma) setIdioma(data.idioma);
        else {
          const saved = localStorage.getItem("pd_idioma") as IdiomaCode | null;
          if (saved) setIdioma(saved);
        }
      } catch (e) {
        console.error("Error al cargar perfil", e);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // foto_perfil se guarda como URL/path en la DB (Supabase Storage o media service)
      const res = await api.patch("/auth/profile", {
        nombres,
        apellidos,
        telefono,
        foto_perfil: fotoUrl || null,
      });
      setProfile((prev: any) => ({
        ...prev,
        ...res.data.data,
      }));
      setIsEditing(false);
    } catch (err) {
      console.error("Error guardando perfil", err);
      alert("No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFoto = async (file: File) => {
    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", "foto_perfil");
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setFotoUrl(url);
        // Guardar inmediatamente en DB
        await api.patch("/auth/profile", { foto_perfil: url });
        setProfile((prev: any) => (prev ? { ...prev, foto_perfil: url } : prev));
      }
    } catch {
      alert("Error al subir la imagen. Asegúrate de que el backend/Supabase Storage esté configurado.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const cambiarIdioma = async (code: IdiomaCode) => {
    setIdioma(code);
    setLang(code);
    try {
      await api.patch("/auth/preferencias", { idioma: code });
    } catch {
      /* local ok */
    }
    setShowIdioma(false);
  };

  const generarInvitacion = async () => {
    try {
      const res = await api.post("/friends/invite");
      const data = res.data?.data || res.data;
      setInviteCode(data.codigo || data.code || "PD-XXXX");
      setInviteLink(
        data.link ||
          `${window.location.origin}/auth/register?ref=${data.codigo || data.code}`
      );
      setShowInvite(true);
    } catch {
      // Fallback local si el endpoint aún no existe
      const code = "PD" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setInviteCode(code);
      setInviteLink(`${window.location.origin}/auth/register?ref=${code}`);
      setShowInvite(true);
    }
  };

  const copiarInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cargarFavoritos = async () => {
    try {
      const res = await api.get("/establishments/favoritos");
      setFavoritos(res.data?.data || []);
    } catch {
      setFavoritos([]);
    }
    setShowFavoritesModal(true);
  };

  const abrirLegal = async (tipo: "terminos" | "privacidad") => {
    setShowLegal(tipo);
    setLegalTitle(tipo === "terminos" ? "Términos y Condiciones" : "Política de Privacidad");
    setLegalContent("Cargando...");
    try {
      const tipoDb = tipo === "terminos" ? "TERMINOS_CONDICIONES" : "POLITICA_PRIVACIDAD";
      const res = await api.get(`/legal/documentos/${tipoDb}`);
      const doc = res.data?.data || res.data;
      setLegalContent(doc?.contenido_html || doc?.contenido || "Documento no disponible. Contacta soporte.");
      if (doc?.titulo) setLegalTitle(doc.titulo);
    } catch {
      setLegalContent(
        tipo === "terminos"
          ? "Términos y Condiciones de Pasaporte Digital NFC. El contenido se cargará desde la base de datos cuando esté configurado."
          : "Política de Privacidad de Pasaporte Digital NFC. El contenido se cargará desde la base de datos cuando esté configurado."
      );
    }
  };

  const nombreCompleto = profile
    ? `${profile.nombres} ${profile.apellidos || ""}`.trim()
    : user?.nombres || "Usuario";
  const email = profile?.email || user?.email || "";
  const tarjetaUid = profile?.tarjeta_activa?.codigo_interno || "**** **** 1234";
  const idiomaActual = IDIOMAS.find((i) => i.code === idioma) || IDIOMAS[0];

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] p-5 pb-8 flex flex-col relative">
      {/* Modal Editar Perfil */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#EFE7DE] shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#2D1A1E] mb-4">Editar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider block mb-1">
                  Foto de perfil
                </label>
                {fotoUrl && (
                  <div className="mb-2 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#C5A059]"
                    />
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Guardada en base de datos
                    </span>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-[#C5A059] bg-[#FAF8F5] text-xs font-semibold text-[#7C0A1E] cursor-pointer hover:bg-[#FAF8F5]/80 transition">
                  <Upload size={14} />
                  <span>{uploadingFoto ? "Subiendo..." : "Subir imagen (se guarda en DB/Storage)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingFoto}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFoto(file);
                    }}
                  />
                </label>
                <p className="text-[9px] text-[#8E7D7D] mt-1">
                  La imagen se sube al storage y la URL se guarda en usuarios.foto_perfil
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider block mb-1">
                  Nombres
                </label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs focus:outline-none focus:border-[#7C0A1E]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider block mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs focus:outline-none focus:border-[#7C0A1E]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider block mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs focus:outline-none focus:border-[#7C0A1E]"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Idioma */}
      {showIdioma && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-[#EFE7DE] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2D1A1E]">Idioma</h3>
              <button onClick={() => setShowIdioma(false)} className="p-1 rounded-full hover:bg-[#FAF8F5]">
                <X size={18} className="text-[#8E7D7D]" />
              </button>
            </div>
            <div className="space-y-1">
              {IDIOMAS.map((i) => (
                <button
                  key={i.code}
                  onClick={() => cambiarIdioma(i.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    idioma === i.code
                      ? "bg-[#7C0A1E] text-white"
                      : "hover:bg-[#FAF8F5] text-[#2D1A1E]"
                  }`}
                >
                  <span className="text-lg">{i.flag}</span>
                  <span className="font-medium">{i.label}</span>
                  {idioma === i.code && <Check size={16} className="ml-auto" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8E7D7D] mt-3">
              El idioma se aplica solo a tu cuenta y se guarda en preferencias.
            </p>
          </div>
        </div>
      )}

      {/* Modal Invitar */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#EFE7DE] shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#7C0A1E] text-[#E8D3A2] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#7C0A1E]/30">
              <Users size={26} />
            </div>
            <h3 className="text-base font-bold text-[#7C0A1E] mb-1">{t("inviteTitle")}</h3>
            <p className="text-xs text-[#8E7D7D] mb-4">
              {t("inviteDesc")}
            </p>
            <div className="bg-[#7C0A1E] rounded-xl px-4 py-3 mb-3 border border-[#C5A059]/50">
              <p className="text-[10px] text-[#E8D3A2] uppercase font-bold">{t("code")}</p>
              <p className="text-xl font-black tracking-widest text-white">{inviteCode}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copiarInvite}
                className="flex-1 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "¡Copiado!" : "Copiar link"}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Legal */}
      {showLegal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg border border-[#EFE7DE] shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-base font-bold text-[#2D1A1E]">{legalTitle}</h3>
              <button onClick={() => setShowLegal(null)} className="p-1 rounded-full hover:bg-[#FAF8F5]">
                <X size={18} className="text-[#8E7D7D]" />
              </button>
            </div>
            <div
              className="overflow-y-auto text-xs text-[#2D1A1E] leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: legalContent }}
            />
          </div>
        </div>
      )}

      {/* Favoritos */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#EFE7DE] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2D1A1E]">Locales favoritos</h3>
              <button onClick={() => setShowFavoritesModal(false)} className="p-1 rounded-full hover:bg-[#FAF8F5]">
                <X size={18} className="text-[#8E7D7D]" />
              </button>
            </div>
            {favoritos.length === 0 ? (
              <div className="text-center py-6">
                <Heart size={28} className="mx-auto text-[#7C0A1E] mb-2 opacity-50" />
                <p className="text-xs text-[#8E7D7D] mb-4">
                  Aún no tienes locales favoritos. Explora y guárdalos.
                </p>
                <Link
                  to="/user/explorar"
                  onClick={() => setShowFavoritesModal(false)}
                  className="inline-block py-2.5 px-5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold"
                >
                  Explorar locales
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {favoritos.map((f: any) => (
                  <Link
                    key={f.id_establecimiento || f.id}
                    to={`/user/locales/${f.id_establecimiento || f.id}`}
                    onClick={() => setShowFavoritesModal(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#EFE7DE] hover:bg-[#FAF8F5]"
                  >
                    <img
                      src={f.logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-[#2D1A1E]">{f.nombre_comercial || f.nombre}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header — sin botón de configuraciones (es lo mismo que editar perfil) */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <h1 className="text-xl font-bold text-[#2D1A1E]">Mi Perfil</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] hover:bg-slate-50 transition-colors"
          title="Editar perfil"
        >
          <Edit2 size={16} />
        </button>
      </div>

      {/* Foto y Datos */}
      <div className="flex items-center space-x-3.5 mb-5 bg-white p-3.5 rounded-2xl border border-[#EFE7DE] shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#C5A059] bg-[#EFE7DE] overflow-hidden flex items-center justify-center text-[#7C0A1E] font-bold text-lg">
            {profile?.foto_perfil ? (
              <img
                src={profile.foto_perfil}
                alt={nombreCompleto}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(nombreCompleto || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="absolute bottom-0 right-0 w-6 h-6 bg-[#7C0A1E] text-white rounded-full flex items-center justify-center shadow-md"
          >
            <Edit2 size={11} />
          </button>
        </div>
        <div>
          <h2 className="text-base font-bold text-[#2D1A1E]">{nombreCompleto}</h2>
          <p className="text-xs text-[#8E7D7D]">{email}</p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-[#C5A059]/20 text-[#7C0A1E] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} />
              {profile?.nivel?.nombre || "Explorador"}
            </span>
          </div>
        </div>
      </div>

      {/* Mi Tarjeta NFC — ir a personalización interactiva */}
      <Link
        to="/user/pasaporte"
        className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-sm mb-5 block hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              !profile?.tarjeta_activa?.uid_nfc
                ? "bg-amber-100 text-amber-700"
                : profile?.tarjeta_activa?.estado === "BLOQUEADA"
                ? "bg-rose-100 text-rose-700"
                : "bg-[#7C0A1E] text-white"
            }`}>
              <Wifi size={20} className="rotate-90" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#2D1A1E]">Mi Tarjeta NFC</span>
                {!profile?.tarjeta_activa?.uid_nfc ? (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Sin vincular
                  </span>
                ) : profile?.tarjeta_activa?.estado === "BLOQUEADA" ? (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Bloqueada
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Activa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8E7D7D] font-mono mt-0.5">
                {profile?.tarjeta_activa?.codigo_interno || profile?.tarjeta_activa?.uid_nfc || "Sin tarjeta física"}
              </p>
              <p className="text-[10px] text-[#C5A059] mt-0.5">
                {!profile?.tarjeta_activa?.uid_nfc ? "Solicitar en un local →" : "Ver pasaporte y QR →"}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#8E7D7D]" />
        </div>
      </Link>

      {/* Bloque beneficios */}
      <div className="bg-white rounded-2xl border border-[#EFE7DE] overflow-hidden shadow-sm mb-4">
        <Link
          to="/user/rewards"
          className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Gift size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Recompensas</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>
        <Link
          to="/user/actividad"
          className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <History size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Historial de visitas</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>
        <button
          onClick={cargarFavoritos}
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Heart size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Locales favoritos</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </button>
      </div>

      {/* Bloque social / legal */}
      <div className="bg-white rounded-2xl border border-[#EFE7DE] overflow-hidden shadow-sm mb-5">
        <Link
          to="/user/amigos?tab=invitar"
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE] text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Users size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Invitar amigos (Gana +50 pts)</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>

        <button
          onClick={() => setShowIdioma(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE] text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Globe size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Idioma</span>
          </div>
          <span className="text-[11px] text-[#8E7D7D]">
            {idiomaActual.flag} {idiomaActual.label}
          </span>
        </button>

        <Link
          to="/user/reclamaciones"
          className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <HelpCircle size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Libro de Reclamaciones</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>

        <Link
          to="/user/legal?tipo=terminos"
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE] text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <FileText size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Términos y condiciones</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>

        <Link
          to="/user/legal?tipo=privacidad"
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Shield size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Política de privacidad</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-[#FAF8F5] hover:bg-rose-50 text-[#7C0A1E] font-bold text-xs py-3.5 px-4 rounded-2xl border border-[#7C0A1E]/20 flex items-center justify-between transition-colors shadow-sm"
      >
        <div className="flex items-center space-x-2">
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </div>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
