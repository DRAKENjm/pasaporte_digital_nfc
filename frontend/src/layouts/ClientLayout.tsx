import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, Compass, Award, Clock, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const ClientLayout: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-start pb-24">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl min-h-screen bg-[#FAF8F5] flex flex-col relative shadow-xl border-x border-[#EFE7DE]">
        <main className="flex-1 w-full overflow-y-auto">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 max-w-md md:max-w-lg lg:max-w-xl w-full bg-[#FFFFFF] border-t border-[#EFE7DE] px-3 py-2 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-pb">
          <NavLink
            to="/user/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">{t("home")}</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/user/explorar"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Compass size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">{t("explore")}</span>
              </>
            )}
          </NavLink>

          <div className="flex-1 flex justify-center -mt-6">
            <NavLink
              to="/user/pasaporte"
              className={({ isActive }) =>
                `w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? "bg-[#580614] text-[#E8D3A2] ring-4 ring-[#FAF8F5]"
                    : "bg-[#7C0A1E] text-white ring-4 ring-[#FAF8F5]"
                }`
              }
            >
              <Award size={24} strokeWidth={2.2} />
              <span className="text-[9px] font-bold tracking-tight">NFC</span>
            </NavLink>
          </div>

          <NavLink
            to="/user/actividad"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Clock size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">{t("activity")}</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/user/perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1">{t("profile")}</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
