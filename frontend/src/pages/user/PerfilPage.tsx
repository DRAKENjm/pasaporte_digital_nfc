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
  Settings,
  Edit2,
  Calendar,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const PerfilPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

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
      const res = await api.patch("/auth/profile", {
        nombres,
        apellidos,
        telefono,
        foto_perfil: fotoUrl
      });
      setProfile((prev: any) => ({
        ...prev,
        ...res.data.data
      }));
      setIsEditing(false);
    } catch (err) {
      console.error("Error guardando perfil", err);
      alert("No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const nombreCompleto = profile ? `${profile.nombres} ${profile.apellidos || ""}`.trim() : user?.nombres || "José Aldair";
  const email = profile?.email || user?.email || "josealdair@gmail.com";
  const tarjetaUid = profile?.tarjeta_activa?.codigo_interno || "**** **** 1234";

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] p-5 pb-8 flex flex-col relative">
      {/* Modal Editar Perfil */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#EFE7DE] shadow-xl animate-fadeIn">
            <h3 className="text-lg font-bold text-[#2D1A1E] mb-4">Editar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider block mb-1">
                  Foto de perfil
                </label>
                
                {/* Previsualización actual */}
                {fotoUrl && (
                  <div className="mb-2 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#C5A059]"
                    />
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Foto seleccionada
                    </span>
                  </div>
                )}

                {/* Subir archivo desde la computadora */}
                <div className="mb-2">
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-[#C5A059] bg-[#FAF8F5] text-xs font-semibold text-[#7C0A1E] cursor-pointer hover:bg-[#FAF8F5]/80 transition">
                    <span>📁 Subir desde mi computadora</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const res = await api.post("/media/upload", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          if (res.data?.data?.url) {
                            setFotoUrl(res.data.data.url);
                          }
                        } catch (err) {
                          alert("Error al subir la imagen");
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Opción alternativa por URL */}
                <input
                  type="url"
                  placeholder="O pega una URL: https://..."
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EFE7DE] text-[11px] focus:outline-none focus:border-[#7C0A1E]"
                />
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
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D] hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616] disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Mi Perfil */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <h1 className="text-xl font-bold text-[#2D1A1E]">Mi Perfil</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] hover:bg-slate-50 transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Foto y Datos del Usuario */}
      <div className="flex items-center space-x-3.5 mb-5 bg-white p-3.5 rounded-2xl border border-[#EFE7DE] shadow-sm">
        <div className="relative">
          <img
            src={
              profile?.foto_perfil ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
            alt={nombreCompleto}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#C5A059]"
          />
          <button
            onClick={() => setIsEditing(true)}
            className="absolute bottom-0 right-0 w-6 h-6 bg-[#7C0A1E] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
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

      {/* Card: Mi Tarjeta NFC con Badge Activa (como en mockup 4) */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-sm mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C0A1E] text-white flex items-center justify-center shadow-sm">
              <Wifi size={20} className="rotate-90" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#2D1A1E]">Mi Tarjeta NFC</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Activa
                </span>
              </div>
              <p className="text-[11px] text-[#8E7D7D] font-mono mt-0.5">{tarjetaUid}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#8E7D7D]" />
        </div>
      </div>

      {/* Modal Locales Favoritos Vacío */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#EFE7DE] shadow-xl animate-fadeIn text-center">
            <div className="w-12 h-12 rounded-full bg-[#7C0A1E]/10 text-[#7C0A1E] flex items-center justify-center mx-auto mb-3">
              <Heart size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2D1A1E] mb-1">Locales Favoritos</h3>
            <p className="text-xs text-[#8E7D7D] mb-5">
              Aún no tienes locales favoritos guardados. Explora los establecimientos en tu ciudad y guárdalos aquí.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D] hover:bg-slate-50"
              >
                Cerrar
              </button>
              <Link
                to="/user/explorar"
                onClick={() => setShowFavoritesModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold text-center shadow-md hover:bg-[#600616]"
              >
                Explorar locales
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bloque 1 de Opciones: Beneficios e Historial */}
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
          onClick={() => setShowFavoritesModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors text-left"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Heart size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Locales favoritos</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </button>
      </div>

      {/* Bloque 2 de Opciones: Legal y Soporte */}
      <div className="bg-white rounded-2xl border border-[#EFE7DE] overflow-hidden shadow-sm mb-5">
        <div className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]">
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Users size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Invitar amigos</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]">
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Globe size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Idioma</span>
          </div>
          <span className="text-[11px] text-[#8E7D7D]">🇵🇪 Español</span>
        </div>

        <Link
          to="/libro-reclamaciones"
          className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]"
        >
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <HelpCircle size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Libro de Reclamaciones</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </Link>

        <div className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors border-b border-[#EFE7DE]">
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <FileText size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Términos y condiciones</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors">
          <div className="flex items-center space-x-3 text-[#2D1A1E]">
            <Shield size={18} className="text-[#7C0A1E]" />
            <span className="text-xs font-medium">Política de privacidad</span>
          </div>
          <ChevronRight size={16} className="text-[#8E7D7D]" />
        </div>
      </div>

      {/* Botón Cerrar sesión */}
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
