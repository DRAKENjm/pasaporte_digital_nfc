import React from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCw,
  RotateCcw,
  Split,
  MapPin,
  X,
  Volume2,
  VolumeX,
  Compass,
  Search,
  AlertTriangle,
  LocateFixed,
  Car,
  Footprints,
  Sparkles,
  Navigation,
} from "lucide-react";

export interface NavStepInfo {
  instruccion: string;
  calle: string;
  distanciaTexto: string;
  distanciaMetros: number;
  maniobra: string;
}

export interface NextStepPreview {
  instruccion: string;
  maniobra: string;
}

export interface NavETAInfo {
  duracionTexto: string;
  distanciaTexto: string;
  horaLlegadaTexto: string;
}

interface TurnByTurnHUDProps {
  currentStep: NavStepInfo | null;
  nextStep: NextStepPreview | null;
  eta: NavETAInfo | null;
  destinationName: string;
  destinationLogo?: string;
  modoViaje: "DRIVING" | "WALKING";
  voiceEnabled: boolean;
  showCenterButton: boolean;
  onToggleVoice: () => void;
  onResetOrientation: () => void;
  onCenterUser: () => void;
  onExitNavigation: () => void;
  onChangeTravelMode: (mode: "DRIVING" | "WALKING") => void;
  onOpenSearch?: () => void;
  onReportIncident?: () => void;
}

/** Renderiza el icono de maniobra turn-by-turn con estilo idéntico a Google Maps */
export const ManeuverIcon: React.FC<{
  maneuver?: string;
  text?: string;
  className?: string;
}> = ({ maneuver = "", text = "", className = "w-9 h-9 text-white" }) => {
  const m = maneuver.toLowerCase();
  const t = text.toLowerCase();

  if (m.includes("sharp-right") || t.includes("cerrado a la derecha")) {
    return <CornerUpRight className={className} strokeWidth={2.5} />;
  }
  if (m.includes("sharp-left") || t.includes("cerrado a la izquierda")) {
    return <CornerUpLeft className={className} strokeWidth={2.5} />;
  }
  if (m.includes("slight-right") || t.includes("levemente a la derecha")) {
    return <ArrowUpRight className={className} strokeWidth={2.5} />;
  }
  if (m.includes("slight-left") || t.includes("levemente a la izquierda")) {
    return <ArrowUpLeft className={className} strokeWidth={2.5} />;
  }
  if (m.includes("turn-right") || t.includes("derecha")) {
    return <CornerUpRight className={className} strokeWidth={2.5} />;
  }
  if (m.includes("turn-left") || t.includes("izquierda")) {
    return <CornerUpLeft className={className} strokeWidth={2.5} />;
  }
  if (m.includes("roundabout") || m.includes("rotary") || t.includes("rotonda") || t.includes("óvalo")) {
    return <RotateCw className={className} strokeWidth={2.5} />;
  }
  if (m.includes("u-turn") || m.includes("uturn") || t.includes("retorno") || t.includes("vuelta en u")) {
    return <RotateCcw className={className} strokeWidth={2.5} />;
  }
  if (m.includes("fork") || m.includes("split") || t.includes("bifurcaci") || t.includes("ramal")) {
    return <Split className={className} strokeWidth={2.5} />;
  }
  if (m.includes("dest") || t.includes("destino") || t.includes("llegada")) {
    return <MapPin className={className} strokeWidth={2.5} />;
  }

  // Por defecto seguir recto / avanzar
  return <ArrowUp className={className} strokeWidth={2.5} />;
};

export const TurnByTurnHUD: React.FC<TurnByTurnHUDProps> = ({
  currentStep,
  nextStep,
  eta,
  destinationName,
  destinationLogo,
  modoViaje,
  voiceEnabled,
  showCenterButton,
  onToggleVoice,
  onResetOrientation,
  onCenterUser,
  onExitNavigation,
  onChangeTravelMode,
  onOpenSearch,
  onReportIncident,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* 1. TOP BANNER: Cartel Verde Oscuro Turn-by-Turn idéntico a Google Maps */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto animate-fadeIn">
        <div className="bg-[#004D40] text-white rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 border border-[#00695C]/40 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icono grande de maniobra */}
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15 shadow-inner">
              <ManeuverIcon
                maneuver={currentStep?.maniobra}
                text={currentStep?.instruccion}
                className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm"
              />
            </div>

            {/* Instrucción principal y distancia al giro */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                {currentStep?.distanciaTexto && (
                  <span className="text-sm sm:text-base font-black text-[#A7F3D0] tracking-tight">
                    {currentStep.distanciaTexto}
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-white/80 font-medium">
                  {currentStep ? "en dirección a" : "Navegando hacia"}
                </span>
              </div>

              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate drop-shadow-xs">
                {currentStep?.calle || currentStep?.instruccion || destinationName}
              </h2>
            </div>
          </div>

          {/* Sub-píldora "Luego ↱" (próxima maniobra anticipada idéntica a Google Maps) */}
          {nextStep && (
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/25 border border-white/10 text-white/95 text-xs font-semibold backdrop-blur-xs">
                <span className="text-white/80">Luego</span>
                <ManeuverIcon
                  maneuver={nextStep.maniobra}
                  text={nextStep.instruccion}
                  className="w-3.5 h-3.5 text-[#A7F3D0]"
                />
                <span className="truncate max-w-[260px] text-[11px]">
                  {nextStep.instruccion}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. LATERAL DERECHO: Barra de herramientas flotante negra de Google Maps */}
      <div className="absolute right-3 sm:right-4 top-28 sm:top-32 flex flex-col gap-2.5 pointer-events-auto">
        {/* Brújula (Alinear al Norte) */}
        <button
          type="button"
          onClick={onResetOrientation}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/85 text-white flex items-center justify-center shadow-xl border border-white/15 hover:bg-black active:scale-95 transition-all cursor-pointer"
          title="Alinear brújula al Norte"
        >
          <div className="relative flex items-center justify-center">
            <Compass size={20} className="text-white" />
            <div className="absolute w-1 h-2 bg-red-500 top-0.5 rounded-full" />
          </div>
        </button>

        {/* Buscar en la ruta */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/85 text-white flex items-center justify-center shadow-xl border border-white/15 hover:bg-black active:scale-95 transition-all cursor-pointer"
          title="Buscar en ruta"
        >
          <Search size={18} />
        </button>

        {/* Audio / Indicaciones de voz */}
        <button
          type="button"
          onClick={onToggleVoice}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-xl border transition-all cursor-pointer ${
            voiceEnabled
              ? "bg-black/85 text-[#00E5FF] border-[#00E5FF]/40 hover:bg-black"
              : "bg-black/85 text-white/50 border-white/15 hover:bg-black"
          }`}
          title={voiceEnabled ? "Silenciar indicaciones de voz" : "Activar indicaciones de voz"}
        >
          {voiceEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>

        {/* Alternar modo vehicular / a pie */}
        <button
          type="button"
          onClick={() => onChangeTravelMode(modoViaje === "DRIVING" ? "WALKING" : "DRIVING")}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/85 text-white flex items-center justify-center shadow-xl border border-white/15 hover:bg-black active:scale-95 transition-all cursor-pointer"
          title={`Cambiar a modo ${modoViaje === "DRIVING" ? "Caminando" : "En vehículo"}`}
        >
          {modoViaje === "DRIVING" ? <Car size={18} /> : <Footprints size={18} />}
        </button>

        {/* Botón de reporte / alerta */}
        <button
          type="button"
          onClick={onReportIncident}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/85 text-amber-400 flex items-center justify-center shadow-xl border border-white/15 hover:bg-black active:scale-95 transition-all cursor-pointer"
          title="Reportar incidencia o ver tráfico"
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {/* 3 & 4. SECCIÓN INFERIOR: BOTÓN CENTRAR + FOOTER HUD NAVEGACIÓN (Elevado sobre la barra de navegación del teléfono) */}
      <div className="w-full max-w-md mx-auto pointer-events-none flex flex-col gap-2 px-1 pb-[max(78px,calc(70px+env(safe-area-inset-bottom)))]">
        {/* Fila inferior: Botón "Centrar" y Botón alternativas */}
        <div className="flex items-center justify-between w-full pointer-events-none">
          <div>
            {showCenterButton && (
              <button
                type="button"
                onClick={onCenterUser}
                className="pointer-events-auto px-3.5 py-2 rounded-full bg-white text-[#004D40] font-black text-xs sm:text-sm shadow-xl border border-slate-200/90 flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
              >
                <Navigation size={14} className="text-[#004D40] fill-[#004D40]" />
                <span>Centrar</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onResetOrientation}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white text-[#182330] shadow-xl border border-slate-200/90 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Alinear brújula / Ver ruta"
          >
            <Split size={16} className="text-[#182330]" />
          </button>
        </div>

        {/* HUD Inferior con [ ✕ ] para salir de navegación, tiempo estimado, distancia y hora */}
        <div className="pointer-events-auto w-full bg-white/98 text-[#182330] rounded-3xl p-3 sm:p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.3)] border border-slate-200 backdrop-blur-md flex items-center justify-between gap-3 animate-slideUp">
          {/* Botón circular X para salir de navegación */}
          <button
            type="button"
            onClick={onExitNavigation}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 transition-all cursor-pointer"
            title="Salir de navegación"
          >
            <X size={18} />
          </button>

          {/* Información de ETA (Tiempo restante, modo, distancia y hora estimada de llegada) */}
          <div className="flex-1 text-center min-w-0">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#00796B] tracking-tight leading-none">
                {eta?.duracionTexto || "Calculando..."}
              </span>
              {modoViaje === "WALKING" ? (
                <Footprints size={18} className="text-[#00796B]" />
              ) : (
                <Car size={18} className="text-[#00796B]" />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-bold mt-1">
              <span>{eta?.distanciaTexto || ""}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#182330] font-extrabold">{eta?.horaLlegadaTexto || ""}</span>
            </div>
          </div>

          {/* Icono de destino / sparkles a la derecha */}
          <div
            className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-inner"
            title={destinationName}
          >
            {destinationLogo ? (
              <img
                src={destinationLogo}
                alt={destinationName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles size={16} className="text-[#00796B]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
