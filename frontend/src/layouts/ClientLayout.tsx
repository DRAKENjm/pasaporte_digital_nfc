import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, Compass, Award, Clock, User } from "lucide-react";

export const ClientLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-start pb-24">
      {/* Contenedor central móvil / responsive */}
      <div className="w-full max-w-md min-h-screen bg-[#FAF8F5] flex flex-col relative shadow-xl border-x border-[#EFE7DE]">
        {/* Contenido de la pantalla activa */}
        <main className="flex-1 w-full overflow-y-auto">
          <Outlet />
        </main>

        {/* Barra de navegación inferior fija estilo mockup */}
        <nav className="fixed bottom-0 max-w-md w-full bg-[#FFFFFF] border-t border-[#EFE7DE] px-3 py-2 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {/* 1. Inicio */}
          <NavLink
            to="/user/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D] hover:text-[#7C0A1E]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">Inicio</span>
              </>
            )}
          </NavLink>

          {/* 2. Explorar */}
          <NavLink
            to="/user/explorar"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D] hover:text-[#7C0A1E]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Compass size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">Explorar</span>
              </>
            )}
          </NavLink>

          {/* 3. Botón Central Flotante: Pasaporte / Recibir Sello */}
          <div className="flex-1 flex justify-center -mt-6">
            <NavLink
              to="/user/pasaporte"
              className={({ isActive }) =>
                `w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? "bg-[#580614] text-[#E8D3A2] ring-4 ring-[#FAF8F5]"
                    : "bg-[#7C0A1E] text-white hover:bg-[#580614] ring-4 ring-[#FAF8F5]"
                }`
              }
            >
              <Award size={24} strokeWidth={2.2} />
              <span className="text-[9px] font-bold tracking-tight">NFC</span>
            </NavLink>
          </div>

          {/* 4. Actividad */}
          <NavLink
            to="/user/actividad"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D] hover:text-[#7C0A1E]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Clock size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">Actividad</span>
              </>
            )}
          </NavLink>

          {/* 5. Perfil */}
          <NavLink
            to="/user/perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D] hover:text-[#7C0A1E]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">Perfil</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
