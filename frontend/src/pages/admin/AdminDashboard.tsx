import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  Store, 
  CreditCard, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  BarChart3,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel de Administración</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white">
          Bienvenido, {user?.nombres || 'Admin'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supervisión global del sistema Pasaporte Digital NFC & Fidelización
        </p>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Correo</span>
            <span className="font-medium text-slate-200">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Rol en Sistema</span>
            <span className="font-bold text-indigo-400">{user?.role || user?.rol}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Acceso</span>
            <span className="font-medium text-emerald-400">Total / Superadmin</span>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white">1,248</span>
            <p className="text-[11px] text-slate-400 font-medium">Usuarios Registrados</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +5
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white">42</span>
            <p className="text-[11px] text-slate-400 font-medium">Comercios Aliados</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-medium text-slate-400">89% asignadas</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white">850</span>
            <p className="text-[11px] text-slate-400 font-medium">Tarjetas NFC Activas</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-emerald-400">Hoy: +18</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white">320</span>
            <p className="text-[11px] text-slate-400 font-medium">Premios Canjeados</p>
          </div>
        </div>
      </div>

      {/* Secciones de Gestión */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gestión del Ecosistema</span>
        </h2>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl divide-y divide-slate-800/80">
          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Establecimientos y Reglas</h3>
                <p className="text-xs text-slate-400">Administrar comercios afiliados y reglas de sellos</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-lg">Ver</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Lote de Tarjetas NFC / QR</h3>
                <p className="text-xs text-slate-400">Control de stock, asignación y tarjetas extraviadas</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-lg">Ver</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Catálogo de Recompensas</h3>
                <p className="text-xs text-slate-400">Crear o editar premios y stock disponible</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-lg">Ver</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Reportes y Auditoría Antifraude</h3>
                <p className="text-xs text-slate-400">Historial transaccional y validaciones sospechosas</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-lg">Ver</span>
          </div>
        </div>
      </div>
    </div>
  );
};
