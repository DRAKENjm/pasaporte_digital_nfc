import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, Compass, Award, Clock, User, Store, Stamp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const ClientLayout: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMap = location.pathname.includes("/explorar");

  const navItems = [
    { to: "/user/home", icon: Home, label: t("home") || "Inicio" },
    { to: "/user/explorar", icon: Compass, label: t("explore") || "Explorar" },
    { to: "/user/pasaporte", icon: Award, label: "NFC", center: true },
    { to: "/user/actividad", icon: Clock, label: t("activity") || "Actividad" },
    { to: "/user/perfil", icon: User, label: t("profile") || "Perfil" },
  ];

  const sideItems = [
    { to: "/user/home", icon: Home, label: "Inicio" },
    { to: "/user/explorar", icon: Compass, label: "Explorar" },
    { to: "/user/locales", icon: Store, label: "Locales" },
    { to: "/user/mis-sellos", icon: Stamp, label: "Mis Sellos" },
    { to: "/user/pasaporte", icon: Award, label: "Tarjeta NFC" },
    { to: "/user/actividad", icon: Clock, label: "Actividad" },
    { to: "/user/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F0EB] md:bg-[#FAF8F5]">
      {/* DESKTOP VIEW (Sidebar + Centered Content) */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Sidebar */}
        <aside className="w-[280px] shrink-0 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-[#EFE7DE] z-10 sticky top-0 h-screen">
          <div className="px-6 py-8 border-b border-[#EFE7DE]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E7D7D] mb-1">Pasaporte</p>
            <h1 className="text-xl font-extrabold text-[#7C0A1E]">Digital NFC</h1>
          </div>
          <nav className="flex-1 py-6 space-y-1.5 px-4 overflow-y-auto">
            {sideItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-semibold transition-all ${
                    isActive 
                      ? "bg-[#7C0A1E]/10 text-[#7C0A1E]" 
                      : "text-[#8E7D7D] hover:bg-[#F8F6F4] hover:text-[#2D1A1E]"
                  }`
                }
              >
                <item.icon size={20} strokeWidth={2.5} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Center Content Area */}
        <main className="flex-1 bg-[#F8F6F4]">
          <div className={isMap ? "h-full w-full" : "max-w-[600px] mx-auto min-h-screen bg-white shadow-[0_0_40px_rgba(0,0,0,0.03)] border-x border-[#EFE7DE]/50"}>
            <Outlet />
          </div>
        </main>
        
        {/* Right Empty Space (to keep center column truly centered like Facebook) */}
        <aside className="w-[280px] shrink-0 hidden lg:block bg-[#F8F6F4]"></aside>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden min-h-screen flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen bg-white flex flex-col relative shadow-xl">
          <main className={`flex-1 w-full relative ${isMap ? "overflow-hidden" : "overflow-y-auto"}`}>
            <div className="pb-24 min-h-full">
              <Outlet />
            </div>
          </main>
          
          <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-[#EFE7DE] px-2 py-2 z-50 flex items-center justify-between pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {navItems.map((item) =>
              item.center ? (
                <div key={item.to} className="flex-1 flex justify-center -mt-8">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
                        isActive
                          ? "bg-[#580614] text-[#E8D3A2] ring-4 ring-[#FAF8F5]"
                          : "bg-[#7C0A1E] text-white ring-4 ring-[#FAF8F5]"
                      }`
                    }
                  >
                    <Award size={24} />
                    <span className="text-[9px] font-bold mt-0.5">NFC</span>
                  </NavLink>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                      isActive ? "text-[#7C0A1E] font-semibold" : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[10px] mt-1">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};
