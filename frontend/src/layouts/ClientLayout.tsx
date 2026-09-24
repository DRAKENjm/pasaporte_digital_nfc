import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, MapPin, Users, Gift, Plus, Bell } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../hooks/useUI";
import { useStories } from "../context/StoriesContext";
import { ProfileSheet } from "../components/profile/ProfileSheet";
import {
  CameraComposer,
  CameraResult,
} from "../components/camera/CameraComposer";
import { greeting, initials } from "../utils/levels";
import api from "../services/api";

/**
 * Layout exclusivo CLIENTE
 * Nav: Inicio | Locales | (+) | Comunidad | Recompensas
 * Desktop: sidebar izquierda + contenido centrado
 */
export const ClientLayout: React.FC = () => {
  const { user } = useAuth();
  const { profileOpen, openProfile, closeProfile, showToast } = useUI();
  const { addStory } = useStories();
  const location = useLocation();
  const [cameraOpen, setCameraOpen] = useState(false);
  const isHome = location.pathname.startsWith("/user/home");
  const nombreCorto =
    user?.nombres?.split(" ")[0] || user?.username || "viajero";

  useEffect(() => {
    const handleOpenCamera = () => setCameraOpen(true);
    window.addEventListener("open-camera", handleOpenCamera);
    return () => window.removeEventListener("open-camera", handleOpenCamera);
  }, []);

  const onCapture = async (result: CameraResult) => {
    if (result.mode === "story") {
      await addStory(
        {
          mediaUrl: result.dataUrl,
          mediaType: "image",
          caption: result.caption,
        },
        { userId: user!.id, userName: user!.nombres || user!.email },
      );
      showToast("Historia publicada durante 24 horas", "success");
    } else {
      await api.post("/social/publicaciones", {
        texto_contenido: result.caption,
        url_media: result.dataUrl,
        tipo_media: "IMAGEN",
        visibilidad: "PUBLICA",
      });
      window.dispatchEvent(new Event("feed-updated"));
      showToast("Publicación creada", "success");
    }
  };

  const nav = (
    <>
      <NavItem to="/user/home" label="Inicio" icon={Home} />
      <NavItem to="/user/locales" label="Locales" icon={MapPin} />
      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="flex flex-col items-center justify-center -mt-3 lg:mt-0 lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5 lg:rounded-xl lg:hover:bg-sky-500/10"
        aria-label="Abrir cámara"
      >
        <span className="w-12 h-12 lg:w-9 lg:h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Plus className="w-6 h-6 lg:w-5 lg:h-5" strokeWidth={2.5} />
        </span>
        <span className="text-[10px] lg:text-sm font-medium text-sky-500 mt-0.5 lg:mt-0">
          Crear
        </span>
      </button>
      <NavItem to="/user/feed" label="Comunidad" icon={Users} />
      <NavItem to="/user/rewards" label="Recompensas" icon={Gift} />
    </>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-text))]">
      <div className="lg:flex lg:max-w-6xl lg:mx-auto lg:min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex lg:w-56 xl:w-64 flex-col border-r border-[rgb(var(--app-border))] sticky top-0 h-screen p-4 gap-1">
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
              P
            </div>
            <span className="font-extrabold">Pasaporte NFC</span>
          </div>
          <nav className="flex flex-col gap-1 flex-1">{nav}</nav>
          <button
            type="button"
            onClick={openProfile}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left"
          >
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatarUrl || user?.avatar_url ? (
                <img
                  src={user.avatarUrl || user.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials(user)
              )}
            </span>
            <span className="text-sm font-medium truncate">
              {user?.nombres || user?.email}
            </span>
          </button>
        </aside>

        {/* Columna principal */}
        <div className="min-w-0 flex-1 flex flex-col min-h-screen max-w-3xl lg:max-w-none mx-auto lg:mx-0 w-full border-x border-[rgb(var(--app-border))] lg:border-x-0">
          <header className="sticky top-0 z-40 safe-area-pt bg-[rgb(var(--app-bg))]/90 backdrop-blur-md border-b border-[rgb(var(--app-border))] lg:px-6">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0">
                  P
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm leading-none">
                    Pasaporte NFC
                  </p>
                  {isHome && (
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {greeting()}, {nombreCorto}
                    </p>
                  )}
                </div>
              </div>
              <p className="hidden lg:block font-semibold text-sm text-muted">
                {isHome ? `${greeting()}, ${nombreCorto}` : ""}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="min-h-touch min-w-touch flex items-center justify-center rounded-xl text-slate-500"
                  aria-label="Notificaciones"
                  onClick={() =>
                    showToast("No tienes notificaciones nuevas", "info")
                  }
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={openProfile}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center lg:hidden overflow-hidden"
                >
                  {user?.avatarUrl || user?.avatar_url ? (
                    <img
                      src={user.avatarUrl || user.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials(user)
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 lg:px-8 pt-4 pb-28 lg:pb-8 min-w-0">
            <div className="max-w-lg lg:max-w-2xl mx-auto lg:mx-0">
              <Outlet />
            </div>
          </main>

          {/* Bottom nav móvil */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 max-w-3xl mx-auto z-40 bg-[rgb(var(--app-card))]/95 backdrop-blur-lg border-t border-[rgb(var(--app-border))] safe-area-pb">
            <div className="flex items-center justify-around px-1 py-1">
              {nav}
            </div>
          </nav>
        </div>
      </div>

      <ProfileSheet open={profileOpen} onClose={closeProfile} />
      <CameraComposer
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onCapture}
      />
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-0.5 lg:gap-3 min-w-[56px] min-h-[52px] lg:min-h-0 lg:px-3 lg:py-2.5 lg:rounded-xl transition-colors ${
        isActive
          ? "text-sky-500 lg:bg-sky-500/10 font-semibold"
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 lg:hover:bg-slate-100 dark:lg:hover:bg-white/5"
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] lg:text-sm font-medium leading-none">
      {label}
    </span>
  </NavLink>
);
