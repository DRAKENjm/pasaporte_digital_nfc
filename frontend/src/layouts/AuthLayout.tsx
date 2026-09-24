import React from "react";
import { Outlet, Link } from "react-router-dom";
import { CreditCard, FileText } from "lucide-react";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Barra superior de marca limpia y sobria */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              PASAPORTE DIGITAL
            </span>
          </div>
        </div>
      </header>

      {/* Contenedor central */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <Outlet />
      </main>

      {/* Pie de página */}
      <footer className="max-w-md w-full mx-auto border-t border-slate-200 pt-4 pb-2 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Pasaporte Digital. Todos los derechos reservados.</p>
        <Link
          to="/reclamaciones"
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-sky-700 transition"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          Libro de Reclamaciones
        </Link>
      </footer>
    </div>
  );
};
