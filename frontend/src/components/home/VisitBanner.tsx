import React from "react";
import { CheckCircle2, ScanLine } from "lucide-react";

interface Props {
  puntos: number;
  onClose?: () => void;
}

export const VisitBanner: React.FC<Props> = ({ puntos }) => (
  <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 p-[1px] animate-slideUp shadow-glow">
    <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3.5 flex items-center gap-3 text-white">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <ScanLine className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Visita validada</p>
        <p className="text-xs text-white/85">+{puntos} puntos añadidos</p>
      </div>
      <CheckCircle2 className="w-6 h-6 shrink-0 opacity-90" />
    </div>
  </div>
);
