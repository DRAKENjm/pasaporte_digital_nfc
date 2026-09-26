import React from "react";
import { DistribucionMetodoItem, DistribucionNivelItem } from "../../../types/admin";
import { Nfc, QrCode, Award, Layers } from "lucide-react";

interface Props {
  metodos: DistribucionMetodoItem[];
  niveles: DistribucionNivelItem[];
}

export const AdminDistributionCharts: React.FC<Props> = ({
  metodos,
  niveles,
}) => {
  // Cálculo de totales de métodos
  const totalMetodos = metodos.reduce((acc, m) => acc + m.total, 0) || 1;
  const nfcItem = metodos.find((m) => m.metodo === "NFC");
  const qrItem = metodos.find((m) => m.metodo === "QR");
  const manualItem = metodos.find((m) => m.metodo === "MANUAL_DASHBOARD");

  const nfcCount = nfcItem?.total ?? 0;
  const qrCount = qrItem?.total ?? 0;
  const manualCount = manualItem?.total ?? 0;

  const nfcPercent = Math.round((nfcCount / totalMetodos) * 100);
  const qrPercent = Math.round((qrCount / totalMetodos) * 100);
  const manualPercent = Math.max(0, 100 - nfcPercent - qrPercent);

  // Niveles de pasaporte
  const totalUsuariosNivel = niveles.reduce((acc, n) => acc + n.total, 0) || 1;

  const getNivelColor = (nivelNombre: string, colorHex?: string) => {
    if (colorHex) return colorHex;
    const lower = nivelNombre.toLowerCase();
    if (lower.includes("bronce")) return "#cd7f32";
    if (lower.includes("plata")) return "#94a3b8";
    if (lower.includes("oro")) return "#eab308";
    if (lower.includes("diamante") || lower.includes("platino")) return "#06b6d4";
    return "#3b82f6";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Gráfico de Métodos de Validación (NFC vs QR) */}
      <div className="bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
              Tecnología de Validación
            </h3>
          </div>
          <p className="text-xs text-muted">
            Proporción histórica de uso de hardware NFC vs QR dinámico
          </p>
        </div>

        {/* Donut Chart SVG */}
        <div className="my-4 flex items-center justify-center gap-6">
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {/* Fondo del anillo */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.8"
              />
              {/* Segmento NFC */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#0284c7"
                strokeWidth="3.8"
                strokeDasharray={`${nfcPercent} ${100 - nfcPercent}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Segmento QR */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="3.8"
                strokeDasharray={`${qrPercent} ${100 - qrPercent}`}
                strokeDashoffset={`${-nfcPercent}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-extrabold text-[rgb(var(--app-text))]">
                {totalMetodos > 1 ? totalMetodos : 0}
              </span>
              <span className="text-[9px] uppercase font-bold text-muted">Total</span>
            </div>
          </div>

          {/* Leyenda y contadores */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span className="font-medium text-[rgb(var(--app-text))] flex items-center gap-1">
                  <Nfc className="w-3.5 h-3.5 text-sky-500" /> NFC Físico
                </span>
              </div>
              <span className="font-bold">{nfcCount} ({nfcPercent}%)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="font-medium text-[rgb(var(--app-text))] flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-purple-500" /> QR Dinámico
                </span>
              </div>
              <span className="font-bold">{qrCount} ({qrPercent}%)</span>
            </div>

            {manualCount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Manual POS</span>
                </div>
                <span className="font-bold">{manualCount} ({manualPercent}%)</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[rgb(var(--app-border))] text-[11px] text-muted flex items-center justify-between">
          <span>Tasa de lectura rápida</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400">&lt; 1.2s promedio</span>
        </div>
      </div>

      {/* 2. Distribución de Pasaportes por Nivel / Rango */}
      <div className="bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
              Gamificación de Pasaportes
            </h3>
          </div>
          <p className="text-xs text-muted">
            Distribución de usuarios según su categoría de fidelización
          </p>
        </div>

        {/* Barras de niveles */}
        <div className="my-3 space-y-3">
          {niveles.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              Cargando niveles del pasaporte...
            </div>
          ) : (
            niveles.map((nivel, idx) => {
              const color = getNivelColor(nivel.nivel, nivel.color_hex);
              const percent = Math.round((nivel.total / totalUsuariosNivel) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="font-semibold text-[rgb(var(--app-text))]">
                        {nivel.nivel}
                      </span>
                    </div>
                    <span className="font-bold text-muted">
                      {nivel.total} usuarios ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percent, 3)}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-[rgb(var(--app-border))] text-[11px] text-muted flex items-center justify-between">
          <span>Usuarios con pasaporte</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {totalUsuariosNivel} activos
          </span>
        </div>
      </div>
    </div>
  );
};
