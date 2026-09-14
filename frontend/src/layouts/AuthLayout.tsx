import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-3">
            🎟️
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Pasaporte NFC</h1>
          <p className="text-xs text-slate-400 mt-1">Fidelización inteligente & Red Social</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
