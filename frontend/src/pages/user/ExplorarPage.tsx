import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Coffee,
  Utensils,
  Cake,
  Compass,
  Navigation,
  LocateFixed,
  X,
  MapPin,
  TrendingUp,
  Car,
  Footprints,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  RotateCcw,
  ExternalLink,
  Layers,
  ShoppingBag,
  Landmark,
  GraduationCap,
  Mountain,
  Plane,
  Hotel,
  Store,
} from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  TrafficLayer,
} from "@react-google-maps/api";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { useLanguage } from "../../context/LanguageContext";
import {
  TurnByTurnHUD,
  NavStepInfo,
  NextStepPreview,
  NavETAInfo,
} from "../../components/navigation/TurnByTurnHUD";
import {
  navigationNightMapStyles,
  filterGpsJitter,
  filterHeadingJitter,
} from "../../components/navigation/navigationMapStyles";

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: -6.77137,
  lng: -79.84088,
};

const ACTIVE_ROUTE_STORAGE_KEY = "pd_active_route_v1";
const ROUTE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Traduce y formatea instrucciones de navegación si Google Maps entrega términos en inglés */
function traducirInstruccion(texto: string): string {
  if (!texto) return "";
  let t = texto;
  t = t.replace(/Head south-west/gi, "Dirígete al suroeste");
  t = t.replace(/Head south-east/gi, "Dirígete al sureste");
  t = t.replace(/Head north-west/gi, "Dirígete al noroeste");
  t = t.replace(/Head north-east/gi, "Dirígete al noreste");
  t = t.replace(/Head south/gi, "Dirígete hacia el sur");
  t = t.replace(/Head north/gi, "Dirígete hacia el norte");
  t = t.replace(/Head east/gi, "Dirígete hacia el este");
  t = t.replace(/Head west/gi, "Dirígete hacia el oeste");
  t = t.replace(/Head/gi, "Avanza");
  t = t.replace(/Turn right/gi, "Gira a la derecha");
  t = t.replace(/Turn left/gi, "Gira a la izquierda");
  t = t.replace(/Slight right/gi, "Gira levemente a la derecha");
  t = t.replace(/Slight left/gi, "Gira levemente a la izquierda");
  t = t.replace(/Sharp right/gi, "Giro pronunciado a la derecha");
  t = t.replace(/Sharp left/gi, "Giro pronunciado a la izquierda");
  t = t.replace(/Keep right/gi, "Mantente a la derecha");
  t = t.replace(/Keep left/gi, "Mantente a la izquierda");
  t = t.replace(/Continue onto/gi, "Continúa por");
  t = t.replace(/Continue/gi, "Continúa");
  t = t.replace(/towards/gi, "hacia");
  t = t.replace(/Destination will be on the right/gi, "El destino estará a tu derecha");
  t = t.replace(/Destination will be on the left/gi, "El destino estará a tu izquierda");
  t = t.replace(/Destination will be/gi, "Llegarás a tu destino");
  t = t.replace(/At the roundabout, take the (\d+)(st|nd|rd|th)? exit/gi, "En la rotonda, toma la salida $1");
  return t;
}

/** Extrae el nombre limpio de la calle desde la instrucción HTML */
function extractStreetName(htmlInstruction: string): string {
  if (!htmlInstruction) return "";
  const match = htmlInstruction.match(/<b>(.*?)<\/b>/g);
  if (match && match.length > 0) {
    const cleanTags = match.map((m) => m.replace(/<[^>]*>?/gm, "").trim());
    return cleanTags[cleanTags.length - 1] || cleanTags[0];
  }
  return htmlInstruction.replace(/<[^>]*>?/gm, "").trim();
}

/** Calcula el rumbo/bearing (0° a 360°) entre dos puntos geográficos */
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (toDeg(θ) + 360) % 360;
}

/** Marcador tipo pin: círculo + cola de ubicación */
const CircularMarker: React.FC<{
  logo?: string;
  nombre: string;
  activo?: boolean;
  onClick: () => void;
}> = ({ logo, nombre, activo, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer transition-transform flex flex-col items-center ${
      activo ? "scale-110 z-30" : "hover:scale-105 z-10"
    }`}
    title={nombre}
    style={{ transform: "translateY(-100%)" }}
  >
    <div
      className={`w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg bg-white relative z-10 flex items-center justify-center p-0.5 ${
        activo ? "border-[#7C0A1E] ring-2 ring-[#C5A059]" : "border-white"
      }`}
    >
      <img
        src={logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"}
        alt={nombre}
        className="w-full h-full object-cover object-center rounded-full"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80";
        }}
      />
    </div>
    {/* Cola del pin */}
    <div
      className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent -mt-0.5 ${
        activo ? "border-t-[#7C0A1E]" : "border-t-white"
      }`}
      style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}
    />
  </div>
);

export const ExplorarPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useUI();

  // Estados de datos
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [locales, setLocales] = useState<any[]>([]);
  const [categoriasDb, setCategoriasDb] = useState<{ id: string; label: string; icono?: string }[]>([
    { id: "Todos", label: "Todos" },
  ]);
  const [localSeleccionado, setLocalSeleccionado] = useState<any | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Estados de navegación y GPS
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [smoothCoords, setSmoothCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [solicitandoGps, setSolicitandoGps] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState<"ninguno" | "cercano" | "visitado">("ninguno");
  const [showFiltros, setShowFiltros] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false);
  const [localizandoPill, setLocalizandoPill] = useState<"buscando" | "listo" | null>(null);
  const [modoViaje, setModoViaje] = useState<"DRIVING" | "WALKING">("DRIVING");
  const [tarjetaExpandidaEnRuta, setTarjetaExpandidaEnRuta] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [displayHeading, setDisplayHeading] = useState<number>(0);
  const continuousHeadingRef = useRef<number>(0);
  const userSpeedRef = useRef<number>(0);
  const [mostrarTrafico, setMostrarTrafico] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  // Actualizador angular continuo (Shortest Arc Interpolation): elimina el salto de 360° -> 0°
  const updateContinuousHeading = useCallback((targetDeg: number) => {
    if (isNaN(targetDeg) || targetDeg === null || targetDeg === undefined) return;
    const current = continuousHeadingRef.current;
    const currentNormalized = ((current % 360) + 360) % 360;
    let diff = targetDeg - currentNormalized;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // Zona muerta de 2.5 grados para evitar micro-vibraciones en reposo
    if (Math.abs(diff) < 2.5) return;

    // Acumulación angular continua para rotación suave sin giros inversos de 360°
    const nextContinuous = current + diff;
    continuousHeadingRef.current = nextContinuous;
    setDisplayHeading(nextContinuous);
    setUserHeading(targetDeg);
  }, []);

  // --- MODO NAVEGACIÓN ACTIVA TURN-BY-TURN (Idéntico a Google Maps) ---
  const [modoNavegacion, setModoNavegacion] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Modo de Contingencia (Aviso profesional para clientes si la navegación propia no está disponible)
  const [contingenciaModalOpen, setContingenciaModalOpen] = useState(false);
  const [contingenciaDestUrl, setContingenciaDestUrl] = useState<string>("");
  const [modoContingenciaGlobal, setModoContingenciaGlobal] = useState(false);

  useEffect(() => {
    // Comprobar estado de contingencia de navegación del backend
    api.get("/public/estado-navegacion")
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d?.contingencia_activa) {
          setModoContingenciaGlobal(true);
        }
      })
      .catch(() => {});
  }, []);

  // Referencias para filtrado de ruido y deadband
  const lastAcceptedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentHeadingRef = useRef<number | null>(null);
  const lastOrientationTimeRef = useRef<number>(0);
  const lastSpokenInstructionRef = useRef<string>("");

  // Referencias para animación Lerp controlada
  const targetCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const lastRouteOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const directionsRef = useRef<google.maps.DirectionsResult | null>(null);
  directionsRef.current = directions;
  const modoViajeRef = useRef<"DRIVING" | "WALKING">(modoViaje);
  modoViajeRef.current = modoViaje;
  const localSeleccionadoRef = useRef<any>(null);
  localSeleccionadoRef.current = localSeleccionado;
  const modoNavegacionRef = useRef<boolean>(modoNavegacion);
  modoNavegacionRef.current = modoNavegacion;

  // Referencias estables de navegación para evitar reinicios de GPS y anuncios duplicados
  const currentStepIndexRef = useRef<number>(currentStepIndex);
  currentStepIndexRef.current = currentStepIndex;
  const hasAnnouncedArrivalRef = useRef<boolean>(false);
  const hasAnnouncedNearRef = useRef<boolean>(false);
  const announcedStepIndexRef = useRef<number>(-1);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const vectorMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";
  const watchIdRef = useRef<number | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);
  const casingPolylineRef = useRef<google.maps.Polyline | null>(null);
  const originConnectorPolylineRef = useRef<google.maps.Polyline | null>(null);
  const destConnectorPolylineRef = useRef<google.maps.Polyline | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    language: "es",
    region: "PE",
  });

  // Motor de voz Text-to-Speech (Web Speech API)
  const speakInstruction = useCallback(
    (texto: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
      const clean = texto.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
      if (!clean || lastSpokenInstructionRef.current === clean) return;
      lastSpokenInstructionRef.current = clean;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = "es-PE";
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis warning:", e);
      }
    },
    [voiceEnabled]
  );

  // Extraer coordenadas de URLs de Google Maps
  const parseCoordsFromUrl = (url?: string): { lat: number; lng: number } | null => {
    if (!url || !url.trim()) return null;

    const pinMatch = url.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
    if (pinMatch) {
      const lat = parseFloat(pinMatch[1]);
      const lng = parseFloat(pinMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }

    const destMatch = url.match(/destination=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (destMatch) {
      const lat = parseFloat(destMatch[1]);
      const lng = parseFloat(destMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }

    const dirMatch = url.match(/!2d(-?\d+\.?\d+)!2d(-?\d+\.?\d+)/);
    if (dirMatch) {
      const lng = parseFloat(dirMatch[1]);
      const lat = parseFloat(dirMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }

    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /maps\?.*ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/,
    ];
    for (const pat of patterns) {
      const m = url.match(pat);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
      }
    }
    return null;
  };

  // Renderizado visual avanzado de rutas: Cian eléctrico en navegación / Azul estándar en vista previa
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const clearCustomPolylines = () => {
      if (mainPolylineRef.current) {
        mainPolylineRef.current.setMap(null);
        mainPolylineRef.current = null;
      }
      if (casingPolylineRef.current) {
        casingPolylineRef.current.setMap(null);
        casingPolylineRef.current = null;
      }
      if (originConnectorPolylineRef.current) {
        originConnectorPolylineRef.current.setMap(null);
        originConnectorPolylineRef.current = null;
      }
      if (destConnectorPolylineRef.current) {
        destConnectorPolylineRef.current.setMap(null);
        destConnectorPolylineRef.current = null;
      }
    };

    clearCustomPolylines();

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        suppressPolylines: true,
        preserveViewport: true,
      });
    }

    if (directions && directions.routes?.[0]?.legs?.[0]) {
      directionsRendererRef.current.setMap(map);
      directionsRendererRef.current.setDirections(directions);

      const leg = directions.routes[0].legs[0];
      const overviewPath = directions.routes[0].overview_path;

      // Coordenadas reales del local destino
      const suc = localSeleccionado?.sucursales?.[0];
      let destLat = Number(suc?.latitud);
      let destLng = Number(suc?.longitud);
      if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
        const parsed = parseCoordsFromUrl(suc?.google_maps_url || localSeleccionado?.google_maps_url);
        if (parsed) {
          destLat = parsed.lat;
          destLng = parsed.lng;
        }
      }

      if (modoViaje === "WALKING") {
        // --- MODO A PIE: Puntos azules punteados ---
        const walkingDotSymbol: google.maps.Symbol = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillOpacity: 1,
          scale: 4,
          strokeColor: modoNavegacion ? "#00E5FF" : "#1A73E8",
          fillColor: modoNavegacion ? "#00E5FF" : "#1A73E8",
          strokeWeight: 1,
        };

        mainPolylineRef.current = new window.google.maps.Polyline({
          path: overviewPath,
          strokeOpacity: 0,
          icons: [
            {
              icon: walkingDotSymbol,
              offset: "0",
              repeat: "13px",
            },
          ],
          map,
          zIndex: 50,
        });

        // Conector peatonal
        if (!isNaN(destLat) && !isNaN(destLng)) {
          const destLatLng = new window.google.maps.LatLng(destLat, destLng);
          const distDestKm = getDistanceKm(leg.end_location.lat(), leg.end_location.lng(), destLat, destLng);
          if (distDestKm > 0.005) {
            destConnectorPolylineRef.current = new window.google.maps.Polyline({
              path: [leg.end_location, destLatLng],
              strokeOpacity: 0,
              icons: [{ icon: walkingDotSymbol, offset: "0", repeat: "13px" }],
              map,
              zIndex: 55,
            });
          }
        }
      } else {
        // --- MODO EN AUTO: Cian Eléctrico en Navegación (Screenshot Google Maps) / Azul en preview ---
        const strokeColorMain = modoNavegacion ? "#00E5FF" : "#4285F4";
        const strokeColorCasing = modoNavegacion ? "#006474" : "#174EA6";

        casingPolylineRef.current = new window.google.maps.Polyline({
          path: overviewPath,
          strokeColor: strokeColorCasing,
          strokeWeight: modoNavegacion ? 8.5 : 7.5,
          strokeOpacity: 0.95,
          map,
          zIndex: 40,
        });

        mainPolylineRef.current = new window.google.maps.Polyline({
          path: overviewPath,
          strokeColor: strokeColorMain,
          strokeWeight: modoNavegacion ? 5.5 : 5,
          strokeOpacity: 1,
          map,
          zIndex: 45,
        });

        // Puntos conectores blancos estilo Google Maps navegación
        const dotConnectorSymbol: google.maps.Symbol = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillOpacity: 1,
          scale: 3.5,
          strokeColor: modoNavegacion ? "#FFFFFF" : "#70757A",
          fillColor: modoNavegacion ? "#FFFFFF" : "#9AA0A6",
          strokeWeight: 1,
        };

        if (!isNaN(destLat) && !isNaN(destLng)) {
          const destLatLng = new window.google.maps.LatLng(destLat, destLng);
          const distDestKm = getDistanceKm(leg.end_location.lat(), leg.end_location.lng(), destLat, destLng);
          if (distDestKm > 0.005) {
            destConnectorPolylineRef.current = new window.google.maps.Polyline({
              path: [leg.end_location, destLatLng],
              strokeOpacity: 0,
              icons: [{ icon: dotConnectorSymbol, offset: "0", repeat: "11px" }],
              map,
              zIndex: 60,
            });
          }
        }
      }
    } else {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      directionsRendererRef.current.setMap(null);
    }

    return () => {
      clearCustomPolylines();
    };
  }, [map, directions, modoViaje, localSeleccionado, modoNavegacion]);

  // Interpolación Lerp amortiguada de 60fps para evitar teletransportación
  useEffect(() => {
    if (!userCoords) return;
    targetCoordsRef.current = userCoords;

    if (!currentCoordsRef.current) {
      currentCoordsRef.current = { ...userCoords };
      setSmoothCoords(userCoords);
      return;
    }

    const animate = () => {
      if (!currentCoordsRef.current || !targetCoordsRef.current) return;
      const curr = currentCoordsRef.current;
      const target = targetCoordsRef.current;

      const dLat = target.lat - curr.lat;
      const dLng = target.lng - curr.lng;

      if (Math.abs(dLat) < 0.000002 && Math.abs(dLng) < 0.000002) {
        currentCoordsRef.current = { ...target };
        setSmoothCoords(target);
        return;
      }

      // Factor de deslizamiento suave (Lerp: 0.15 por frame)
      const factor = 0.15;
      const nextLat = curr.lat + dLat * factor;
      const nextLng = curr.lng + dLng * factor;

      currentCoordsRef.current = { lat: nextLat, lng: nextLng };
      setSmoothCoords({ lat: nextLat, lng: nextLng });

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [userCoords]);

  // Seguimiento de cámara en modo navegación activa (Auto-Follow fluido con actualización por desplazamiento GPS)
  useEffect(() => {
    if (modoNavegacion && autoFollow && map && userCoords) {
      map.panTo(userCoords);
    }
  }, [modoNavegacion, autoFollow, map, userCoords]);

  // Cargar locales + categorías desde DB
  const fetchLocales = useCallback(async () => {
    try {
      const [res, catRes] = await Promise.all([
        api.get("/establishments"),
        api.get("/establishments/categorias").catch(() => ({ data: { data: [] } })),
      ]);
      setLocales(res.data.data || []);
      const cats = catRes.data?.data || [];
      const seen = new Set(["todos"]);
      const fromDb = (cats || [])
        .filter((c: any) => c && c.nombre && String(c.nombre).toLowerCase() !== "todos")
        .map((c: any) => ({
          id: String(c.nombre),
          label: String(c.nombre),
          icono: c.icono_url || c.icono || "map-pin",
        }))
        .filter((c: any) => {
          const k = c.id.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      setCategoriasDb([{ id: "Todos", label: "Todos", icono: "compass" }, ...fromDb]);
    } catch (e) {
      console.error("Error cargando locales", e);
    }
  }, []);

  useEffect(() => {
    fetchLocales();
  }, [fetchLocales]);

  // Redimensionamiento seguro de Google Maps
  useEffect(() => {
    const handleResizeOrFocus = () => {
      if (map && window.google?.maps) {
        window.google.maps.event.trigger(map, "resize");
        if (userCoords) {
          map.panTo(userCoords);
        } else if (mapCenter) {
          map.panTo(mapCenter);
        }
      }
    };

    window.addEventListener("resize", handleResizeOrFocus);
    document.addEventListener("visibilitychange", handleResizeOrFocus);

    return () => {
      window.removeEventListener("resize", handleResizeOrFocus);
      document.removeEventListener("visibilitychange", handleResizeOrFocus);
    };
  }, [map, userCoords, mapCenter]);

  const handleRefreshMap = async () => {
    setRefrescando(true);
    try {
      await fetchLocales();
      if (map && window.google?.maps) {
        window.google.maps.event.trigger(map, "resize");
      }
      solicitarPermisoUbicacion(true, false);
      showToast("Mapa y locales actualizados", "success");
    } catch {
      showToast("Error al refrescar el mapa", "error");
    } finally {
      setRefrescando(false);
    }
  };

  const [searchParams] = useSearchParams();

  // Deep-link: ?local=ID&lat=&lng=
  useEffect(() => {
    if (!locales.length) return;
    const localId = searchParams.get("local");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (localId) {
      const found = locales.find((l) => String(l.id_establecimiento) === String(localId));
      if (found) {
        setLocalSeleccionado(found);
        const suc = found.sucursales?.[0];
        let latTarget = suc?.latitud ? Number(suc.latitud) : NaN;
        let lngTarget = suc?.longitud ? Number(suc.longitud) : NaN;
        if (isNaN(latTarget) || isNaN(lngTarget)) {
          const parsed = parseCoordsFromUrl(suc?.google_maps_url || found.google_maps_url);
          if (parsed) {
            latTarget = parsed.lat;
            lngTarget = parsed.lng;
          }
        }
        if (!isNaN(latTarget) && !isNaN(lngTarget)) {
          setMapCenter({ lat: latTarget, lng: lngTarget });
          map?.panTo({ lat: latTarget, lng: lngTarget });
        }
      }
    } else if (lat && lng) {
      setMapCenter({ lat: Number(lat), lng: Number(lng) });
      map?.panTo({ lat: Number(lat), lng: Number(lng) });
    }
  }, [locales, searchParams, map]);

  // Restaurar ruta activa de sessionStorage
  useEffect(() => {
    if (!locales.length || !userCoords || directions) return;
    try {
      const raw = sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > ROUTE_TTL_MS) {
        sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
        return;
      }
      const found = locales.find(
        (l) => String(l.id_establecimiento || l.id) === String(parsed.localId)
      );
      if (found) {
        setLocalSeleccionado(found);
        if (parsed.modoViaje) setModoViaje(parsed.modoViaje);
        setTimeout(() => {
          calcularRuta(parsed.modoViaje || "DRIVING", false);
        }, 400);
      }
    } catch {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    }
  }, [locales, userCoords]);

  // SOLICITAR UBICACIÓN CON FILTRO DE RUIDO Y SEGUIMIENTO PRECISO
  const solicitarPermisoUbicacion = useCallback(
    (activarWatch = true, isSilent = false) => {
      if (!("geolocation" in navigator)) {
        if (!isSilent) showToast("Tu dispositivo no soporta geolocalización", "info");
        return;
      }

      setLocalizandoPill("buscando");
      if (!isSilent) setSolicitandoGps(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const rawCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          lastAcceptedCoordsRef.current = rawCoords;
          setUserCoords(rawCoords);
          setGpsBlocked(false);
          setSolicitandoGps(false);
          setLocalizandoPill("listo");
          setTimeout(() => setLocalizandoPill(null), 2000);

          if (!isSilent) showToast("Ubicación detectada correctamente", "success");

          if (!localSeleccionadoRef.current) {
            setMapCenter(rawCoords);
            map?.panTo(rawCoords);
            map?.setZoom(16.5);
          }

          // Seguimiento GPS continuo con FILTRADO DE RUIDO (Deadband)
          if (activarWatch) {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
              (p) => {
                const incoming = {
                  lat: p.coords.latitude,
                  lng: p.coords.longitude,
                };
                const speed = p.coords.speed || 0;
                userSpeedRef.current = speed;
                setGpsBlocked(false);

                // FILTRO DE ZONA MUERTA (Deadband): Previene temblores por fluctuaciones GPS de 1 a 3 metros
                const filtered = filterGpsJitter(
                  lastAcceptedCoordsRef.current,
                  incoming,
                  speed,
                  getDistanceKm
                );

                // Rumbo / Heading: Priorizar rumbo nativo del GPS cuando hay velocidad (> 0.8 m/s) o bearing al desplazarse
                if (p.coords.heading !== null && !isNaN(p.coords.heading) && p.coords.heading >= 0 && speed > 0.8) {
                  updateContinuousHeading(p.coords.heading);
                } else if (lastAcceptedCoordsRef.current) {
                  const distMove = getDistanceKm(
                    lastAcceptedCoordsRef.current.lat,
                    lastAcceptedCoordsRef.current.lng,
                    filtered.lat,
                    filtered.lng
                  );
                  // Solo calcular rumbo si el movimiento real supera 3.5 metros (evita giros aleatorios en reposo)
                  if (distMove >= 0.0035) {
                    const angle = calculateBearing(
                      lastAcceptedCoordsRef.current.lat,
                      lastAcceptedCoordsRef.current.lng,
                      filtered.lat,
                      filtered.lng
                    );
                    updateContinuousHeading(angle);
                  }
                }

                lastAcceptedCoordsRef.current = filtered;
                setUserCoords(filtered);

                // PROGRESIÓN PASO A PASO EN NAVEGACIÓN ACTIVA ("Que funcione de verdad")
                if (directionsRef.current?.routes?.[0]?.legs?.[0] && modoNavegacionRef.current) {
                  const leg = directionsRef.current.routes[0].legs[0];
                  const steps = leg.steps || [];

                  // Verificar destino final con coordenadas reales del local
                  const suc = localSeleccionadoRef.current?.sucursales?.[0];
                  let realDestLat = suc ? Number(suc.latitud) : NaN;
                  let realDestLng = suc ? Number(suc.longitud) : NaN;
                  if (isNaN(realDestLat) || isNaN(realDestLng)) {
                    const destLoc = leg.end_location;
                    realDestLat = destLoc.lat();
                    realDestLng = destLoc.lng();
                  }
                  const distDestKm = getDistanceKm(filtered.lat, filtered.lng, realDestLat, realDestLng);

                  // Aviso previo de aproximación (< 45 metros)
                  if (distDestKm <= 0.045 && !hasAnnouncedNearRef.current && !hasAnnouncedArrivalRef.current) {
                    hasAnnouncedNearRef.current = true;
                    const venueName = localSeleccionadoRef.current?.nombre_comercial || "tu destino";
                    speakInstruction(`Estás llegando a ${venueName}`);
                  }

                  // Verificar llegada al destino (< 20 metros) - Anuncio único
                  if (distDestKm <= 0.02) {
                    if (!hasAnnouncedArrivalRef.current) {
                      hasAnnouncedArrivalRef.current = true;
                      const venueName = localSeleccionadoRef.current?.nombre_comercial || "tu destino";
                      speakInstruction(`¡Has llegado a ${venueName}!`);
                      showToast(`¡Has llegado a ${venueName}!`, "success");
                    }
                    return;
                  }

                  // Verificar llegada a la siguiente intersección / maniobra secuencialmente
                  const currIdx = currentStepIndexRef.current;
                  if (steps.length > 0 && currIdx < steps.length) {
                    const currentStep = steps[currIdx];
                    if (currentStep?.end_location) {
                      const distStepKm = getDistanceKm(
                        filtered.lat,
                        filtered.lng,
                        currentStep.end_location.lat(),
                        currentStep.end_location.lng()
                      );

                      // A menos de 22 metros de la maniobra: avanzar al siguiente paso
                      if (distStepKm <= 0.022 && currIdx < steps.length - 1) {
                        const nextIdx = currIdx + 1;
                        currentStepIndexRef.current = nextIdx;
                        setCurrentStepIndex(nextIdx);
                        if (announcedStepIndexRef.current !== nextIdx) {
                          announcedStepIndexRef.current = nextIdx;
                          const nextStepObj = steps[nextIdx];
                          const cleanInst = traducirInstruccion(
                            nextStepObj.instructions?.replace(/<[^>]*>?/gm, "") || ""
                          );
                          speakInstruction(cleanInst);
                        }
                      }
                    }
                  }
                }
              },
              (watchErr) => {
                if (watchErr.code === 2 || watchErr.code === 1) {
                  setGpsBlocked(true);
                  setGpsBannerDismissed(false);
                  showToast("Por favor active su GPS para poder continuar guiándole", "info");
                  if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                  }
                }
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
            );
          }
        },
        (err) => {
          setSolicitandoGps(false);
          setLocalizandoPill(null);
          setGpsBlocked(true);
          if (!isSilent) {
            if (err.code === 1) {
              showToast("Permiso de ubicación denegado. Actívalo en los ajustes de tu navegador.", "info");
            } else {
              showToast("Por favor active su GPS para poder ubicarle y ayudarle.", "info");
            }
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    },
    [showToast, map, speakInstruction, updateContinuousHeading]
  );

  // Escuchar brújula física con filtro angular amortiguado (elimina temblor en reposo)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      // Throttle de eventos a máx 15fps (evita 60Hz de ruido magnético innecesario)
      if (now - lastOrientationTimeRef.current < 65) return;
      lastOrientationTimeRef.current = now;

      // Si el usuario se desplaza activamente (speed > 0.8 m/s), el GPS es más preciso que la brújula magnética
      if (userSpeedRef.current > 0.8) return;

      let compass = 0;
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        compass = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        compass = (360 - e.alpha) % 360;
      } else {
        return;
      }

      if (!isNaN(compass) && compass >= 0) {
        updateContinuousHeading(compass);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientationabsolute" as any, handleOrientation, true);
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientationabsolute" as any, handleOrientation, true);
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, [updateContinuousHeading]);

  // Verificar permisos y solicitar ubicación de forma amigable al inicio
  useEffect(() => {
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as any })
        .then((result) => {
          if (result.state === "granted") {
            solicitarPermisoUbicacion(true, true);
          } else if (result.state === "denied") {
            setGpsBlocked(true);
          } else {
            // "prompt": En móvil no forzamos pop-up intrusivo al cargar, mostramos la opción elegante para activar
            setGpsBlocked(true);
          }

          result.onchange = () => {
            if (result.state === "granted") {
              setGpsBlocked(false);
              solicitarPermisoUbicacion(true, false);
            } else if (result.state === "denied") {
              setGpsBlocked(true);
              setGpsBannerDismissed(false);
            }
          };
        })
        .catch(() => {
          solicitarPermisoUbicacion(true, true);
        });
    } else {
      solicitarPermisoUbicacion(true, true);
    }
  }, [solicitarPermisoUbicacion]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const iconByName = (name?: string) => {
    const n = (name || "").toLowerCase().trim();
    if (n.includes("coffee") || n.includes("café") || n.includes("cafe")) return Coffee;
    if (n.includes("utensil") || n.includes("rest") || n.includes("comida") || n.includes("gastr")) return Utensils;
    if (n.includes("cake") || n.includes("croissant") || n.includes("postre") || n.includes("dulce")) return Cake;
    if (n.includes("turis") || n.includes("landmark") || n.includes("monument") || n.includes("cultura") || n.includes("museo")) return Landmark;
    if (n.includes("educa") || n.includes("book") || n.includes("estudio") || n.includes("coleg") || n.includes("univer") || n.includes("acad")) return GraduationCap;
    if (n.includes("moda") || n.includes("shop") || n.includes("boutique") || n.includes("ropa") || n.includes("calzado")) return ShoppingBag;
    if (n.includes("hotel") || n.includes("hosped") || n.includes("aloj")) return Hotel;
    if (n.includes("viaje") || n.includes("plane") || n.includes("vuelo")) return Plane;
    if (n.includes("avent") || n.includes("mount") || n.includes("sender")) return Mountain;
    if (n.includes("tienda") || n.includes("store") || n.includes("market") || n.includes("comerc")) return Store;
    if (n.includes("compass") || n.includes("todo")) return Compass;
    return MapPin;
  };
  const categorias = categoriasDb.map((c) => ({ ...c, icon: iconByName(c.icono || c.label) }));

  const localesFiltrados = useMemo(() => {
    let list = locales.filter((loc) => {
      const matchSearch =
        !busqueda.trim() ||
        loc.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.sucursales?.some((s: any) =>
          s.direccion?.toLowerCase().includes(busqueda.toLowerCase())
        );

      const catName = loc.categoria_nombre || loc.categoria || "";
      const matchCat =
        categoriaActiva === "Todos" ||
        catName === categoriaActiva ||
        catName?.toLowerCase().includes(categoriaActiva.toLowerCase());

      return matchSearch && matchCat;
    });

    if (filtroRapido === "cercano" && userCoords) {
      list = [...list].sort((a, b) => {
        const sa = a.sucursales?.[0];
        const sb = b.sucursales?.[0];
        if (!sa?.latitud || !sb?.latitud) return 0;
        const da = getDistanceKm(userCoords.lat, userCoords.lng, Number(sa.latitud), Number(sa.longitud));
        const db = getDistanceKm(userCoords.lat, userCoords.lng, Number(sb.latitud), Number(sb.longitud));
        return da - db;
      });
    } else if (filtroRapido === "visitado") {
      list = [...list].sort(
        (a, b) => (b.total_visitas || b.visitas_count || 0) - (a.total_visitas || a.visitas_count || 0)
      );
    }

    return list;
  }, [locales, busqueda, categoriaActiva, filtroRapido, userCoords]);

  // CÁLCULO DE RUTA UNIFICADO (Vista previa o Navegación Turn-by-Turn activa)
  const calcularRuta = useCallback(
    (
      travelMode: "DRIVING" | "WALKING" = modoViaje,
      iniciarNavegacion: boolean = false,
      targetLocal?: any
    ) => {
      const loc = targetLocal || localSeleccionado;
      if (!loc) return;

      const suc = loc.sucursales?.[0];
      let destLat = suc ? Number(suc.latitud) : NaN;
      let destLng = suc ? Number(suc.longitud) : NaN;

      if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
        const mapsUrl = suc?.google_maps_url || loc.google_maps_url;
        const parsed = parseCoordsFromUrl(mapsUrl);
        if (parsed) {
          destLat = parsed.lat;
          destLng = parsed.lng;
        }
      }

      if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
        const mapsUrl = suc?.google_maps_url || loc.google_maps_url;
        if (mapsUrl) {
          showToast("Abriendo ubicación en Google Maps...", "info");
          window.open(mapsUrl, "_blank");
        } else {
          const dir = suc?.direccion || loc.direccion || "este establecimiento";
          showToast(`Este local aún no cuenta con coordenadas GPS (${dir})`, "info");
        }
        return;
      }

      if (!userCoords) {
        if (!iniciarNavegacion) {
          map?.panTo({ lat: destLat, lng: destLng });
          map?.setZoom(16);
          return;
        }
        showToast("Activa tu ubicación para iniciar la navegación", "info");
        solicitarPermisoUbicacion(true);
        return;
      }

      if (!window.google?.maps) {
        showToast("Cargando servicios de mapa...", "info");
        return;
      }

      setCargandoRuta(true);
      lastRouteOriginRef.current = userCoords;

      const directionsService = new window.google.maps.DirectionsService();
      const destino = { lat: destLat, lng: destLng };

      const gTravelMode =
        travelMode === "WALKING"
          ? window.google.maps.TravelMode.WALKING
          : window.google.maps.TravelMode.DRIVING;

      directionsService.route(
        {
          origin: userCoords,
          destination: destino,
          travelMode: gTravelMode,
        },
        (result, status) => {
          setCargandoRuta(false);
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            setCurrentStepIndex(0);
            currentStepIndexRef.current = 0;
            hasAnnouncedArrivalRef.current = false;
            hasAnnouncedNearRef.current = false;
            announcedStepIndexRef.current = iniciarNavegacion ? 0 : -1;

            if (iniciarNavegacion) {
              setModoNavegacion(true);
              setAutoFollow(true);
              if (map && userCoords) {
                map.panTo(userCoords);
                map.setZoom(18);
              }

              const firstStep = result.routes[0]?.legs?.[0]?.steps?.[0];
              const firstInstr = firstStep
                ? traducirInstruccion(firstStep.instructions?.replace(/<[^>]*>?/gm, "") || "")
                : `Navegando hacia ${loc.nombre_comercial}`;
              speakInstruction(`Iniciando ruta hacia ${loc.nombre_comercial}. ${firstInstr}`);
              showToast("Navegación paso a paso iniciada", "success");
            } else {
              setModoNavegacion(false);
              setTarjetaExpandidaEnRuta(true);
              if (result.routes[0]?.bounds && map) {
                map.fitBounds(result.routes[0].bounds, {
                  top: 80,
                  bottom: 240,
                  left: 40,
                  right: 40,
                });
              }
            }

            try {
              sessionStorage.setItem(
                ACTIVE_ROUTE_STORAGE_KEY,
                JSON.stringify({
                  localId: loc.id_establecimiento || loc.id,
                  modoViaje: travelMode,
                  destLat,
                  destLng,
                  savedAt: Date.now(),
                })
              );
            } catch {}
          } else {
            // Modo de Contingencia si DirectionsService falla o se agota la cuota (OVER_QUERY_LIMIT)
            console.warn("Fallo o cuota en DirectionsService. Status:", status);
            const mapsUrl =
              suc?.google_maps_url ||
              loc.google_maps_url ||
              `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${travelMode.toLowerCase()}`;
            setContingenciaDestUrl(mapsUrl);
            setContingenciaModalOpen(true);
          }
        }
      );
    },
    [localSeleccionado, userCoords, map, modoViaje, showToast, solicitarPermisoUbicacion, speakInstruction]
  );

  // Traza la ruta en el mapa inmediatamente al seleccionar cualquier local delegando a calcularRuta
  const trazarRutaLocal = useCallback(
    (loc: any, travelMode: "DRIVING" | "WALKING" = modoViaje) => {
      calcularRuta(travelMode, false, loc);
    },
    [calcularRuta, modoViaje]
  );

  const handleSelectLocal = (loc: any) => {
    setLocalSeleccionado(loc);
    setModoNavegacion(false);
    setCurrentStepIndex(0);
    setTarjetaExpandidaEnRuta(true);

    const suc = loc.sucursales?.[0];
    let latTarget = suc?.latitud ? Number(suc.latitud) : NaN;
    let lngTarget = suc?.longitud ? Number(suc.longitud) : NaN;
    if (isNaN(latTarget) || isNaN(lngTarget)) {
      const parsed = parseCoordsFromUrl(suc?.google_maps_url || loc.google_maps_url);
      if (parsed) {
        latTarget = parsed.lat;
        lngTarget = parsed.lng;
      }
    }

    if (userCoords && !gpsBlocked) {
      // Al presionar un lugar se traza inmediatamente la ruta en el mapa (a pie o auto)
      trazarRutaLocal(loc, modoViaje);
    } else {
      if (!isNaN(latTarget) && !isNaN(lngTarget)) {
        map?.panTo({ lat: latTarget, lng: lngTarget });
        map?.setZoom(16);
      }
      showToast("Por favor active su GPS para poder trazar la ruta hacia este local", "info");
    }
  };

  // Si el usuario tenía un local seleccionado y se obtienen las coordenadas GPS
  useEffect(() => {
    if (userCoords && !gpsBlocked && localSeleccionado && !directions && !modoNavegacion) {
      trazarRutaLocal(localSeleccionado, modoViaje);
    }
  }, [userCoords, gpsBlocked, localSeleccionado, directions, modoNavegacion, trazarRutaLocal, modoViaje]);

  const handleCenterUserLocation = () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission().catch(() => {});
    }

    if (!userCoords || gpsBlocked) {
      showToast("Por favor active su GPS para poder ubicarle en el mapa", "info");
      solicitarPermisoUbicacion(true, false);
      return;
    }

    if (map) {
      map.panTo(userCoords);
      map.setZoom(16.5);
      showToast("Centrado en tu ubicación", "info");
    }
  };

  const handleActivarGps = () => {
    setGpsBannerDismissed(false);
    solicitarPermisoUbicacion(true, false);
  };

  // Iniciar experiencia de Navegación Turn-by-Turn completa como Google Maps
  const iniciarNavegacionActiva = () => {
    if (!userCoords || gpsBlocked) {
      showToast("Por favor active su GPS para poder iniciar la navegación paso a paso", "info");
      solicitarPermisoUbicacion(true, false);
      return;
    }

    // Si el modo de contingencia global está activado por el administrador o cuota
    if (modoContingenciaGlobal && localSeleccionado) {
      const suc = localSeleccionado.sucursales?.[0];
      const destLat = suc?.latitud || "";
      const destLng = suc?.longitud || "";
      const mapsUrl =
        suc?.google_maps_url ||
        localSeleccionado.google_maps_url ||
        `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${modoViaje.toLowerCase()}`;
      setContingenciaDestUrl(mapsUrl);
      setContingenciaModalOpen(true);
      return;
    }

    if (directions && localSeleccionado) {
      setModoNavegacion(true);
      setAutoFollow(true);
      setCurrentStepIndex(0);
      currentStepIndexRef.current = 0;
      hasAnnouncedArrivalRef.current = false;
      hasAnnouncedNearRef.current = false;
      announcedStepIndexRef.current = 0;
      if (map) {
        const pos = smoothCoords || userCoords;
        if (pos) {
          map.panTo(pos);
          map.setZoom(18);
        }
      }
      const firstStep = directions.routes[0]?.legs?.[0]?.steps?.[0];
      const firstInstr = firstStep
        ? traducirInstruccion(firstStep.instructions?.replace(/<[^>]*>?/gm, "") || "")
        : `Navegando hacia ${localSeleccionado.nombre_comercial}`;
      speakInstruction(`Iniciando navegación hacia ${localSeleccionado.nombre_comercial}. ${firstInstr}`);
      showToast("Navegación paso a paso iniciada", "success");
    } else {
      calcularRuta(modoViaje, true);
    }
  };

  const cambiarModoViaje = (nuevoModo: "DRIVING" | "WALKING") => {
    setModoViaje(nuevoModo);
    if (localSeleccionado) {
      if (modoNavegacion) {
        calcularRuta(nuevoModo, true);
      } else {
        trazarRutaLocal(localSeleccionado, nuevoModo);
      }
    }
  };

  // Información y pasos de la ruta calculada (dinámicos según avance paso a paso)
  const infoRuta = useMemo(() => {
    if (!localSeleccionado?.sucursales?.[0]) return null;
    const suc = localSeleccionado.sucursales[0];
    if (!suc.latitud || !suc.longitud) return null;

    if (directions?.routes?.[0]?.legs?.[0]) {
      const leg = directions.routes[0].legs[0];
      const steps = (leg.steps || []).map((st: any) => {
        const rawText = st.instructions ? st.instructions.replace(/<[^>]*>?/gm, "") : "";
        return {
          instruccion: traducirInstruccion(rawText),
          calle: extractStreetName(st.instructions || ""),
          distancia: st.distance?.text || "",
          distanciaValor: st.distance?.value || 0,
          duracion: st.duration?.text || "",
          duracionValor: st.duration?.value || 0,
          maniobra: (st as any).maneuver || "straight",
        };
      });

      // Cálculo dinámico de distancia y tiempo restantes según el paso actual de navegación
      const pasosRestantes =
        modoNavegacion && currentStepIndex > 0 ? steps.slice(currentStepIndex) : steps;

      const duracionSegundos =
        modoNavegacion && currentStepIndex > 0
          ? pasosRestantes.reduce((acc: number, s: any) => acc + (s.duracionValor || 0), 0)
          : (leg.duration?.value || 0);

      const distanciaMetros =
        modoNavegacion && currentStepIndex > 0
          ? pasosRestantes.reduce((acc: number, s: any) => acc + (s.distanciaValor || 0), 0)
          : (leg.distance?.value || 0);

      const tiempoFormateado =
        duracionSegundos >= 3600
          ? `${Math.floor(duracionSegundos / 3600)} h ${Math.round((duracionSegundos % 3600) / 60)} min`
          : `${Math.max(1, Math.round(duracionSegundos / 60))} min`;

      const distanciaFormateada =
        distanciaMetros >= 1000
          ? `${(distanciaMetros / 1000).toFixed(1)} km`
          : `${Math.round(distanciaMetros)} m`;

      // Cálculo de hora de llegada exacta sumando segundos de duración restante
      const horaLlegada = new Date(Date.now() + duracionSegundos * 1000);
      const horaLlegadaTexto = horaLlegada.toLocaleTimeString("es-PE", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        distancia: distanciaFormateada,
        tiempo: tiempoFormateado,
        horaLlegadaTexto,
        pasos: steps,
        esRutaReal: true,
      };
    }

    if (userCoords) {
      const dKm = getDistanceKm(userCoords.lat, userCoords.lng, Number(suc.latitud), Number(suc.longitud));
      const distStr = dKm < 1 ? `${Math.round(dKm * 1000)} m` : `${dKm.toFixed(1)} km`;
      const minEstimados =
        modoViaje === "WALKING"
          ? Math.max(1, Math.round((dKm * 60) / 4.5))
          : Math.max(1, Math.round((dKm * 60) / 25));
      return {
        distancia: distStr,
        tiempo: `~${minEstimados} min`,
        horaLlegadaTexto: "",
        pasos: [],
        esRutaReal: false,
      };
    }

    return null;
  }, [localSeleccionado, directions, userCoords, modoViaje, modoNavegacion, currentStepIndex]);

  // Pasos y datos del HUD Turn-by-Turn
  const navCurrentStep = useMemo<NavStepInfo | null>(() => {
    if (!infoRuta?.pasos || infoRuta.pasos.length === 0) return null;
    const step = infoRuta.pasos[currentStepIndex] || infoRuta.pasos[0];
    if (!step) return null;
    return {
      instruccion: step.instruccion,
      calle: step.calle || step.instruccion,
      distanciaTexto: step.distancia,
      distanciaMetros: step.distanciaValor,
      maniobra: step.maniobra,
    };
  }, [infoRuta, currentStepIndex]);

  const navNextStep = useMemo<NextStepPreview | null>(() => {
    if (!infoRuta?.pasos || infoRuta.pasos.length <= currentStepIndex + 1) return null;
    const next = infoRuta.pasos[currentStepIndex + 1];
    return {
      instruccion: next.instruccion,
      maniobra: next.maniobra,
    };
  }, [infoRuta, currentStepIndex]);

  const navETA = useMemo<NavETAInfo | null>(() => {
    if (!infoRuta?.esRutaReal) return null;
    return {
      duracionTexto: infoRuta.tiempo,
      distanciaTexto: infoRuta.distancia,
      horaLlegadaTexto: infoRuta.horaLlegadaTexto,
    };
  }, [infoRuta]);

  const salirDeNavegacion = () => {
    setModoNavegacion(false);
    setAutoFollow(true);
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    hasAnnouncedArrivalRef.current = false;
    hasAnnouncedNearRef.current = false;
    announcedStepIndexRef.current = -1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const cancelarRuta = () => {
    salirDeNavegacion();
    setDirections(null);
    lastRouteOriginRef.current = null;
    setTarjetaExpandidaEnRuta(false);
    try {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    } catch {}
  };

  const cerrarTarjeta = () => {
    cancelarRuta();
    setLocalSeleccionado(null);
  };

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (locales.length > 0 && !localSeleccionadoRef.current && !directionsRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        let validPoints = 0;
        locales.forEach((loc) => {
          const suc = loc.sucursales?.[0];
          let lat = Number(suc?.latitud);
          let lng = Number(suc?.longitud);
          if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
            const parsed = parseCoordsFromUrl(suc?.google_maps_url || loc.google_maps_url);
            if (parsed) {
              lat = parsed.lat;
              lng = parsed.lng;
            }
          }
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
            validPoints++;
          }
        });
        if (validPoints > 0) {
          mapInstance.fitBounds(bounds, { top: 70, bottom: 90, left: 40, right: 40 });
        }
      }
    },
    [locales]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Al arrastrar el mapa manualmente, desactivar auto-follow para mostrar el botón "Centrar"
  const handleMapDrag = useCallback(() => {
    if (modoNavegacion) {
      setAutoFollow(false);
    }
  }, [modoNavegacion]);

  // Centrar nuevamente en el usuario y reactivar auto-follow
  const handleCenterInNav = useCallback(() => {
    if (!userCoords || gpsBlocked) {
      showToast("Por favor active su GPS para centrar en su posición", "info");
      solicitarPermisoUbicacion(true, false);
      return;
    }
    setAutoFollow(true);
    if (map) {
      const pos = smoothCoords || userCoords;
      if (pos) {
        map.panTo(pos);
        map.setZoom(18);
        // Restablecer orientación del mapa al Norte al re-centrar
        map.setHeading(0);
        map.setTilt(0);
      }
    }
  }, [map, smoothCoords, userCoords, gpsBlocked, showToast, solicitarPermisoUbicacion]);

  // Restablecer la orientación de la brújula al Norte
  const handleResetOrientation = useCallback(() => {
    setUserHeading(0);
    currentHeadingRef.current = 0;
    if (map) {
      map.setHeading(0);
    }
    showToast("Orientación alineada al Norte", "info");
  }, [map, showToast]);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((v) => {
      const next = !v;
      showToast(next ? "Indicaciones de voz activadas" : "Voz silenciada", "info");
      if (!next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, [showToast]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#FAF8F5] p-6 text-center">
        <p className="text-sm font-bold text-[#7C0A1E]">Falta VITE_GOOGLE_MAPS_API_KEY en .env</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF8F5] p-6 text-center">
        <p className="text-sm font-bold text-[#7C0A1E]">Error al cargar Google Maps</p>
      </div>
    );
  }

  return (
    <div
      className={
        modoNavegacion
          ? "fixed inset-0 z-50 w-full h-[100dvh] flex flex-col bg-[#182330] overflow-hidden"
          : "w-full h-full flex-1 flex flex-col bg-[#FAF8F5] overflow-hidden relative"
      }
    >
      {/* 1. Header (Se oculta automáticamente en Modo Navegación Activa para dejar espacio completo al mapa) */}
      {!modoNavegacion && (
        <div className="p-4 pb-3 bg-white border-b border-[#EFE7DE] shadow-sm shrink-0 z-30">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#2D1A1E]">Explorar locales</h1>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMostrarTrafico((v) => !v)}
                className={`p-1.5 rounded-full border transition-all ${
                  mostrarTrafico
                    ? "bg-[#7C0A1E] text-white border-[#7C0A1E] shadow-xs"
                    : "bg-[#FAF8F5] border-[#EFE7DE] text-[#2D1A1E] hover:text-[#7C0A1E]"
                }`}
                title={mostrarTrafico ? "Ocultar tráfico en vivo" : "Mostrar tráfico en vivo"}
              >
                <Layers size={14} />
              </button>

              <button
                onClick={handleRefreshMap}
                disabled={refrescando}
                className="p-1.5 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#2D1A1E] hover:text-[#7C0A1E] transition"
                title="Refrescar mapa y locales"
              >
                <RotateCcw size={14} className={refrescando ? "animate-spin text-[#7C0A1E]" : ""} />
              </button>

              <button
                onClick={handleCenterUserLocation}
                disabled={solicitandoGps}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] text-xs font-bold shadow-2xs hover:bg-[#F2ECE4] transition"
              >
                <LocateFixed size={14} className={solicitandoGps ? "animate-spin" : ""} />
                <span>{solicitandoGps ? "Localizando..." : "Mi Ubicación"}</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center mb-3">
            <Search size={18} className="absolute left-3.5 text-[#8E7D7D]" />
            <input
              type="text"
              placeholder="Buscar por local, café o distrito..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl pl-10 pr-12 py-2.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E]"
            />
            <div className="absolute right-2">
              <button
                onClick={() => setShowFiltros((v) => !v)}
                className={`p-1.5 rounded-xl transition-colors ${
                  filtroRapido !== "ninguno" ? "bg-[#7C0A1E] text-white" : "text-[#8E7D7D] hover:bg-[#EFE7DE]"
                }`}
                title="Filtros rápidos"
              >
                <TrendingUp size={16} />
              </button>
              {showFiltros && (
                <div className="absolute right-0 top-9 bg-white border border-[#EFE7DE] rounded-xl shadow-lg py-1 z-50 min-w-[160px]">
                  <button
                    onClick={() => {
                      setFiltroRapido("cercano");
                      setShowFiltros(false);
                      if (!userCoords) {
                        showToast("Activa tu ubicación para ordenar por cercanía", "info");
                        solicitarPermisoUbicacion(true);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#FAF8F5] flex items-center gap-2"
                  >
                    <MapPin size={14} className="text-[#7C0A1E]" />
                    Más cercano
                  </button>
                  <button
                    onClick={() => {
                      setFiltroRapido("visitado");
                      setShowFiltros(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#FAF8F5] flex items-center gap-2"
                  >
                    <TrendingUp size={14} className="text-[#7C0A1E]" />
                    Más visitado
                  </button>
                  {filtroRapido !== "ninguno" && (
                    <button
                      onClick={() => {
                        setFiltroRapido("ninguno");
                        setShowFiltros(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#FAF8F5] text-[#8E7D7D] border-t border-[#EFE7DE]"
                    >
                      Quitar filtro
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              const activo = categoriaActiva === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-2xl border transition-all ${
                    activo
                      ? "bg-[#7C0A1E] border-[#7C0A1E] text-white shadow-sm"
                      : "bg-[#FAF8F5] border-[#EFE7DE] text-[#8E7D7D]"
                  }`}
                >
                  <Icon size={18} className={activo ? "text-white" : "text-[#7C0A1E]"} />
                  <span className="text-[10px] font-medium mt-1">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MAPA INTERACTIVO */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-[#182330] overflow-hidden">
        {/* BARRA DE PROGRESO DE CARGA Y PILL DE ESTADO GPS */}
        {localizandoPill && (
          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none flex flex-col items-center">
            {localizandoPill === "buscando" && (
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#7C0A1E] to-transparent animate-pulse" />
            )}
            <div className="mt-2.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#EFE7DE] flex items-center gap-2 text-xs font-bold text-[#2D1A1E] pointer-events-auto animate-fadeIn">
              {localizandoPill === "buscando" ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Obteniendo tu ubicación...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-emerald-700">✓ Ubicación detectada</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* AVISO DE SEÑAL GPS PERDIDA EN MODO NAVEGACIÓN ACTIVA */}
        {modoNavegacion && (gpsBlocked || !userCoords) && (
          <div className="absolute top-[82px] left-3 right-3 z-40 animate-slideDown pointer-events-auto">
            <div className="bg-amber-500/95 backdrop-blur-md text-slate-900 rounded-2xl px-3.5 py-2.5 shadow-xl border border-amber-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 text-xs font-bold">
                <LocateFixed size={16} className="text-slate-950 shrink-0 animate-spin" />
                <span className="truncate">Por favor active su GPS para continuar guiándole.</span>
              </div>
              <button
                type="button"
                onClick={() => solicitarPermisoUbicacion(true, false)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 text-[11px] font-bold shrink-0 active:scale-95 cursor-pointer"
              >
                Activar
              </button>
            </div>
          </div>
        )}

        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF8F5]">
            <p className="text-sm font-semibold text-[#8E7D7D]">Cargando mapa...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={modoNavegacion ? 18 : 15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onDragStart={handleMapDrag}
            onZoomChanged={() => {
              if (modoNavegacion) {
                setAutoFollow(false);
              }
            }}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              rotateControl: false,
              panControl: false,
              scaleControl: false,
              clickableIcons: true,
              gestureHandling: "greedy",
              // Vector Map ID: habilita renderizado WebGL con rotación y tilt con dos dedos en móvil
              ...(vectorMapId ? {
                mapId: vectorMapId,
                // En vector maps, colorScheme reemplaza a styles para modo nocturno
                ...(modoNavegacion ? { colorScheme: "DARK" as any } : {}),
              } : {
                // Sin mapId: renderizado raster clásico con estilos JSON para modo nocturno
                styles: modoNavegacion ? navigationNightMapStyles : undefined,
              }),
            }}
          >
            {mostrarTrafico && <TrafficLayer />}

            {/* PUCK DE UBICACIÓN EN TIEMPO REAL: CÍRCULO EN PLANIFICACIÓN, TRIÁNGULO/FLECHA EN NAVEGACIÓN */}
            {(smoothCoords || userCoords) && (
              <OverlayView
                position={smoothCoords || userCoords!}
                mapPaneName={OverlayView.FLOAT_PANE}
                getPixelPositionOffset={() => (modoNavegacion ? { x: -18, y: -20 } : { x: -22, y: -22 })}
                zIndex={9999}
              >
                {modoNavegacion ? (
                  /* MARCADOR TRIANGULAR / FLECHA DE NAVEGACIÓN 3D TIPO GOOGLE MAPS */
                  <div
                    title="Navegación activa"
                    className="relative flex items-center justify-center pointer-events-none select-none"
                    style={{
                      width: 36,
                      height: 40,
                      transform: `rotate(${displayHeading}deg)`,
                      transformOrigin: "18px 20px",
                      transition: "transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)",
                    }}
                  >
                    {/* Halo de pulsación aerodinámico */}
                    <span className="absolute w-8 h-8 rounded-full bg-[#00E5FF]/20 animate-ping" />
                    <span className="absolute w-7 h-7 rounded-full bg-[#00E5FF]/15" />

                    {/* Flecha chevron facetada 3D estilo Google Maps */}
                    <svg
                      width="36"
                      height="40"
                      viewBox="0 0 36 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
                    >
                      {/* Borde exterior blanco nítido */}
                      <path
                        d="M18 2 L33 34 L18 26 L3 34 Z"
                        fill="white"
                      />
                      {/* Ala izquierda (iluminada - azul cielo / cian navegación) */}
                      <path
                        d="M18 4.5 L4.5 32 L18 25 Z"
                        fill="url(#navArrowLeftFacet)"
                      />
                      {/* Ala derecha (facetada más oscura - azul navegación) */}
                      <path
                        d="M18 4.5 L31.5 32 L18 25 Z"
                        fill="url(#navArrowRightFacet)"
                      />
                      {/* Línea central de arista 3D */}
                      <line
                        x1="18"
                        y1="4.5"
                        x2="18"
                        y2="25"
                        stroke="rgba(255,255,255,0.45)"
                        strokeWidth="0.8"
                      />
                      <defs>
                        <linearGradient id="navArrowLeftFacet" x1="4.5" y1="18" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#38BDF8" />
                          <stop offset="1" stopColor="#0284C7" />
                        </linearGradient>
                        <linearGradient id="navArrowRightFacet" x1="18" y1="18" x2="31.5" y2="18" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#0369A1" />
                          <stop offset="1" stopColor="#075985" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                ) : (
                  /* MARCADOR CIRCULAR DE PLANIFICACIÓN / EXPLORACIÓN CON CONO DE VISIÓN */
                  <div
                    title="Tu ubicación en tiempo real"
                    className="relative flex items-center justify-center pointer-events-none select-none"
                    style={{ width: 44, height: 44 }}
                  >
                    {/* Cono o haz de linterna (flashlight beam) en dirección de la brújula */}
                    {userHeading !== null && (
                      <div
                        className="absolute w-28 h-28 pointer-events-none"
                        style={{
                          transform: `rotate(${displayHeading}deg)`,
                          transformOrigin: "center center",
                          transition: "transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)",
                        }}
                      >
                        <div
                          className="w-full h-full"
                          style={{
                            background: "radial-gradient(circle at 50% 50%, rgba(66,133,244,0.38) 0%, rgba(66,133,244,0) 70%)",
                            clipPath: "polygon(50% 50%, 20% 0%, 80% 0%)",
                          }}
                        />
                      </div>
                    )}

                    {/* Halo sutil de radar */}
                    <span className="absolute w-9 h-9 rounded-full bg-[#1A73E8]/20 animate-ping" />
                    <span className="absolute w-8 h-8 rounded-full bg-[#1A73E8]/15" />

                    {/* Círculo central azul Google Maps con borde blanco */}
                    <div
                      className="relative w-[22px] h-[22px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-[2.5px] border-white flex items-center justify-center ring-1 ring-black/15 bg-[#1A73E8]"
                      style={{
                        transform: userHeading !== null ? `rotate(${displayHeading}deg)` : undefined,
                        transition: "transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)",
                      }}
                    >
                      {userHeading !== null ? (
                        /* Pequeña flecha de dirección frontal blanca */
                        <div className="w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[7px] border-l-transparent border-r-transparent border-b-white -mt-0.5 filter drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.4))" />
                      ) : (
                        /* Punto blanco de descanso en el centro */
                        <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </div>
                  </div>
                )}
              </OverlayView>
            )}



            {/* Marcadores de los locales */}
            {localesFiltrados.map((loc) => {
              const suc = loc.sucursales?.[0];
              let markerLat = suc?.latitud ? Number(suc.latitud) : NaN;
              let markerLng = suc?.longitud ? Number(suc.longitud) : NaN;
              if (isNaN(markerLat) || isNaN(markerLng) || (markerLat === 0 && markerLng === 0)) {
                const parsed = parseCoordsFromUrl(suc?.google_maps_url || loc.google_maps_url);
                if (parsed) {
                  markerLat = parsed.lat;
                  markerLng = parsed.lng;
                }
              }
              if (isNaN(markerLat) || isNaN(markerLng)) return null;
              const pos = { lat: markerLat, lng: markerLng };
              const activo = localSeleccionado?.id_establecimiento === loc.id_establecimiento;

              return (
                <OverlayView
                  key={loc.id_establecimiento}
                  position={pos}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <CircularMarker
                    logo={loc.logo || loc.imagen_portada || loc.imagen_url}
                    nombre={loc.nombre_comercial}
                    activo={activo}
                    onClick={() => handleSelectLocal(loc)}
                  />
                </OverlayView>
              );
            })}
          </GoogleMap>
        )}

        {/* 3. EXPERIENCIA TURN-BY-TURN HUD (Modo Navegación Activa idéntico a Google Maps) */}
        {modoNavegacion ? (
          <TurnByTurnHUD
            currentStep={navCurrentStep}
            nextStep={navNextStep}
            eta={navETA}
            destinationName={localSeleccionado?.nombre_comercial || "Destino"}
            destinationLogo={localSeleccionado?.logo || localSeleccionado?.imagen_portada}
            modoViaje={modoViaje}
            voiceEnabled={voiceEnabled}
            showCenterButton={!autoFollow || Boolean(modoNavegacion)}
            onToggleVoice={handleToggleVoice}
            onResetOrientation={handleResetOrientation}
            onCenterUser={handleCenterInNav}
            onExitNavigation={salirDeNavegacion}
            onChangeTravelMode={cambiarModoViaje}
            onOpenSearch={() => showToast("Buscando locales en la ruta...", "info")}
            onReportIncident={() => showToast("Reporte registrado para la comunidad", "info")}
          />
        ) : (
          /* 4. VISTA DE EXPLORACIÓN HABITUAL (Chips de locales o Cabecera de Ruta Activa) */
          <>
            {/* Chips superiores de locales */}
            <div className="absolute top-3 left-0 right-0 z-20 px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
                {localesFiltrados.map((loc) => {
                  const esActivo = localSeleccionado?.id_establecimiento === loc.id_establecimiento;
                  const locImg = loc.logo || loc.imagen_portada || loc.imagen_url;
                  return (
                    <button
                      key={loc.id_establecimiento}
                      onClick={() => handleSelectLocal(loc)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 shadow-md flex items-center gap-1.5 border ${
                        esActivo
                          ? "bg-[#7C0A1E] text-white border-[#7C0A1E]"
                          : "bg-white text-[#2D1A1E] border-[#EFE7DE]"
                      }`}
                    >
                      {locImg && (
                        <img src={locImg} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span>{loc.nombre_comercial}</span>
                    </button>
                  );
                })}
              </div>

            {/* Tarjeta inferior adaptativa (elevada sobre el bottom navbar de móvil) */}
            {localSeleccionado && (
              <div className="absolute left-0 right-0 z-20 px-3 sm:px-4 pointer-events-none transition-all duration-300 bottom-[calc(68px+env(safe-area-inset-bottom,8px))] md:bottom-4">
                {directions && !tarjetaExpandidaEnRuta ? (
                  /* BARRA COMPACTA FLOTANTE MODO RUTA TRAZADA */
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-[#EFE7DE] shadow-2xl flex items-center justify-between gap-2 animate-fadeIn">
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setTarjetaExpandidaEnRuta(true)}
                      title="Toca para ver detalles completos"
                    >
                      <img
                        src={
                          localSeleccionado.logo ||
                          localSeleccionado.imagen_portada ||
                          localSeleccionado.imagen_url ||
                          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100"
                        }
                        alt={localSeleccionado.nombre_comercial}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-[#EFE7DE] shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[#2D1A1E] truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                            {localSeleccionado.nombre_comercial}
                          </h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="En camino" />
                        </div>
                        {infoRuta && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
                            <span className="font-bold text-[#7C0A1E] bg-[#7C0A1E]/10 px-1.5 py-0.5 rounded shrink-0">
                              {infoRuta.distancia}
                            </span>
                            <span className="text-[#59494B] bg-[#FAF8F5] border border-[#EFE7DE] px-1.5 py-0.5 rounded font-medium shrink-0">
                              {infoRuta.tiempo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {/* Botón para iniciar Navegación en vivo turn-by-turn */}
                      <button
                        type="button"
                        onClick={iniciarNavegacionActiva}
                        className="h-8 px-3 rounded-xl bg-[#004D40] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-[#00382E]"
                        title="Iniciar navegación GPS"
                      >
                        <Navigation size={13} className="text-[#A7F3D0] animate-pulse" />
                        <span>Iniciar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cambiarModoViaje(modoViaje === "DRIVING" ? "WALKING" : "DRIVING")}
                        className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#EFE7DE] active:scale-95 transition-all cursor-pointer"
                        title={`Cambiar a ${modoViaje === "DRIVING" ? "Caminando" : "En auto"}`}
                      >
                        {modoViaje === "DRIVING" ? <Car size={14} /> : <Footprints size={14} />}
                      </button>

                      <button
                        type="button"
                        onClick={cancelarRuta}
                        className="h-8 px-2 sm:px-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-100 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Cancelar ruta"
                      >
                        <X size={13} />
                        <span className="hidden sm:inline">{t("cancelRoute") || "Cancelar"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTarjetaExpandidaEnRuta(true)}
                        className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] hover:bg-[#EFE7DE] transition-colors cursor-pointer"
                        title="Expandir detalles"
                      >
                        <ChevronUp size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TARJETA COMPLETA OPTIMIZADA: ERGONÓMICA, COMPACTA Y SIN SCROLL */
                  <div className="pointer-events-auto bg-white rounded-3xl p-3.5 sm:p-4 border border-[#EFE7DE] shadow-2xl relative animate-fadeIn flex flex-col gap-2.5">
                    {/* Botones de acción superior: Minimizar y Cerrar */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {directions && (
                        <button
                          type="button"
                          onClick={() => setTarjetaExpandidaEnRuta(false)}
                          className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#EFE7DE] active:scale-95 transition-all cursor-pointer"
                          title="Minimizar barra"
                        >
                          <ChevronDown size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={cerrarTarjeta}
                        className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] hover:bg-[#EFE7DE] active:scale-95 transition-all cursor-pointer"
                        title="Cerrar"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Fila 1: Logo, Nombre comercial y Dirección / Puntos */}
                    <div className="flex items-center gap-3 pr-16 sm:pr-20">
                      <div
                        onClick={() => {
                          const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                          if (idLoc) navigate(`/user/locales/${idLoc}`);
                        }}
                        className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-[#EFE7DE] cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs"
                        title="Ver detalles completos del local"
                      >
                        <img
                          src={
                            localSeleccionado.logo ||
                            localSeleccionado.imagen_portada ||
                            localSeleccionado.imagen_url ||
                            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                          }
                          alt={localSeleccionado.nombre_comercial}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          onClick={() => {
                            const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                            if (idLoc) navigate(`/user/locales/${idLoc}`);
                          }}
                          className="cursor-pointer group/title flex items-center gap-2"
                          title="Ver información del local"
                        >
                          <h3 className="font-bold text-sm sm:text-base text-[#2D1A1E] group-hover/title:text-[#7C0A1E] transition-colors truncate">
                            {localSeleccionado.nombre_comercial}
                          </h3>
                        </div>

                        {/* Dirección y puntos en una sola línea compacta */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8E7D7D] mt-0.5">
                          <span className="truncate max-w-[140px] xs:max-w-[190px] sm:max-w-[240px]">
                            {localSeleccionado.sucursales?.[0]?.direccion || "Chiclayo"}
                          </span>
                          <span className="text-slate-300 shrink-0">•</span>
                          <span className="text-[#C5A059] font-bold text-[10px] bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1 shrink-0">
                            <Sparkles size={10} className="shrink-0" />
                            +{localSeleccionado.puntos_por_visita || 20} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fila 2: Distancia/Tiempo (Izquierda) + Selector de Modo de viaje (Derecha) UNIFICADOS EN 1 FILA */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFE7DE]">
                      {infoRuta ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#2D1A1E] font-semibold bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#EFE7DE]">
                          <span className="font-bold text-[#7C0A1E] flex items-center gap-1">
                            <MapPin size={12} className="shrink-0" />
                            {infoRuta.distancia}
                          </span>
                          <span className="text-[#C8BFB7]">•</span>
                          <span className="text-[#59494B] flex items-center gap-1">
                            <Clock size={12} className="shrink-0" />
                            {infoRuta.tiempo}
                          </span>
                          {infoRuta.esRutaReal && (
                            <span className="hidden xs:inline text-[9px] text-emerald-700 bg-emerald-100/70 px-1 py-0.5 rounded font-bold uppercase tracking-wider ml-0.5">
                              Ruta
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#8E7D7D]">Calculando distancia...</span>
                      )}

                      {/* Selector de modo En auto / Caminando */}
                      <div className="flex bg-[#FAF8F5] p-0.5 rounded-xl border border-[#EFE7DE] text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => cambiarModoViaje("DRIVING")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            modoViaje === "DRIVING"
                              ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                              : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                          }`}
                          title="En auto"
                        >
                          <Car size={13} />
                          <span className="text-[11px]">{t("driving") || "Auto"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarModoViaje("WALKING")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            modoViaje === "WALKING"
                              ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                              : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                          }`}
                          title="Caminando"
                        >
                          <Footprints size={13} />
                          <span className="text-[11px]">{t("walking") || "A pie"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Fila 3: Botones de Acción - INICIAR NAVEGACIÓN PROMINENTE Y TOTALMENTE VISIBLE */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {/* Botón principal INICIAR: grande, verde Google Maps y con foco prioritario */}
                      <button
                        onClick={iniciarNavegacionActiva}
                        disabled={cargandoRuta}
                        className="flex-1 h-11 rounded-2xl bg-[#004D40] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer hover:bg-[#00382E] shadow-md shadow-emerald-950/15"
                      >
                        <Navigation size={16} className="text-[#A7F3D0] animate-pulse" />
                        <span>{cargandoRuta ? (t("calculating") || "Calculando...") : "Iniciar"}</span>
                      </button>

                      {/* Botón Ver Local */}
                      <button
                        type="button"
                        onClick={() => {
                          const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                          if (idLoc) navigate(`/user/locales/${idLoc}`);
                        }}
                        className="h-11 px-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EFE7DE] active:scale-[0.98] transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Ver detalles del local"
                      >
                        <Info size={14} className="text-[#7C0A1E]" />
                        <span className="hidden xs:inline">{t("viewLocal") || "Detalles"}</span>
                      </button>

                      {/* Botón Google Maps externo */}
                      <button
                        type="button"
                        onClick={() => {
                          const suc = localSeleccionado.sucursales?.[0];
                          const destLat = suc?.latitud || "";
                          const destLng = suc?.longitud || "";
                          const url =
                            suc?.google_maps_url ||
                            localSeleccionado.google_maps_url ||
                            `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${modoViaje.toLowerCase()}`;
                          window.open(url, "_blank");
                        }}
                        className="h-11 px-3 rounded-2xl bg-[#FAF8F5] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#EFE7DE] hover:bg-[#EFE7DE] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink size={14} className="text-[#7C0A1E]" />
                        <span>Maps</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOTONES FLOTANTES ERGONÓMICOS LATERALES PARA MÓVIL (Screenshot 3 & 4) */}
            <div
              className="absolute right-3.5 z-20 flex flex-col gap-2.5 pointer-events-auto transition-all duration-300"
              style={{
                bottom: localSeleccionado
                  ? (tarjetaExpandidaEnRuta ? "calc(190px + 68px)" : "calc(65px + 68px)")
                  : (gpsBlocked && !gpsBannerDismissed ? "calc(80px + 68px)" : "calc(16px + 68px)"),
              }}
            >
              <button
                type="button"
                onClick={() => setMostrarTrafico((v) => !v)}
                className={`w-11 h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  mostrarTrafico
                    ? "bg-[#7C0A1E] text-white border-[#7C0A1E]"
                    : "bg-white/95 text-[#59494B] border-[#EFE7DE] hover:bg-white"
                }`}
                title="Mostrar u ocultar tráfico"
              >
                <Layers size={18} />
              </button>

              {/* Botón Mi Ubicación (Diseño Google Maps bespoke de Screenshot 3 & 4) */}
              <button
                type="button"
                onClick={handleCenterUserLocation}
                className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 flex items-center justify-center transition-all active:scale-90 hover:shadow-2xl cursor-pointer group"
                title="Centrar en mi ubicación"
              >
                <div className="relative flex items-center justify-center pointer-events-none">
                  {/* Anillo exterior azul Google Maps */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      userCoords && !gpsBlocked
                        ? "border-[#1A73E8] group-hover:scale-105"
                        : "border-amber-500"
                    } flex items-center justify-center`}
                  >
                    {/* Punto central azul Google Maps */}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        userCoords && !gpsBlocked ? "bg-[#1A73E8]" : "bg-amber-500"
                      } ${solicitandoGps ? "animate-ping" : ""}`}
                    />
                  </div>
                  {/* Retículas crosshairs en los 4 ejes */}
                  <div className="absolute -top-1 w-0.5 h-1 bg-[#1A73E8] rounded-full" />
                  <div className="absolute -bottom-1 w-0.5 h-1 bg-[#1A73E8] rounded-full" />
                  <div className="absolute -left-1 w-1 h-0.5 bg-[#1A73E8] rounded-full" />
                  <div className="absolute -right-1 w-1 h-0.5 bg-[#1A73E8] rounded-full" />
                </div>
              </button>
            </div>

            {/* AVISO FLOTANTE DE GPS DESACTIVADO EN MODO EXPLORACIÓN */}
            {(gpsBlocked || !userCoords) && !gpsBannerDismissed && !localSeleccionado && (
              <div className="absolute bottom-[calc(68px+env(safe-area-inset-bottom,8px))] md:bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-30 pointer-events-auto animate-fadeIn">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-[#EFE7DE] shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-[#7C0A1E] shrink-0">
                      <LocateFixed size={18} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#2D1A1E]">¿Activar tu ubicación?</h4>
                      <p className="text-[11px] text-[#8E7D7D] truncate">
                        Para descubrir locales cercanos y trazar rutas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setGpsBannerDismissed(false);
                        solicitarPermisoUbicacion(true, false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      Activar
                    </button>
                    <button
                      type="button"
                      onClick={() => setGpsBannerDismissed(true)}
                      className="p-1.5 rounded-xl text-[#8E7D7D] hover:bg-[#FAF8F5] active:scale-95 transition-all cursor-pointer"
                      title="Cerrar aviso"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL PROFESIONAL DE CONTINGENCIA CUANDO LA NAVEGACIÓN PROPIA NO ESTÁ DISPONIBLE */}
      {contingenciaModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-[#EFE7DE] shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center mx-auto shadow-sm">
              <MapPin size={28} />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#2D1A1E]">
                Navegación temporalmente no disponible
              </h3>
              <p className="text-xs text-[#59494B] mt-2 leading-relaxed">
                En este momento no podemos ofrecerte la navegación desde RutaYa. Puedes abrir Google Maps para continuar tu viaje hasta el destino.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (contingenciaDestUrl) {
                    window.open(contingenciaDestUrl, "_blank");
                  }
                  setContingenciaModalOpen(false);
                }}
                className="w-full py-3 rounded-2xl bg-[#004D40] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#00382E] active:scale-[0.98] transition shadow-md cursor-pointer"
              >
                <ExternalLink size={16} className="text-[#A7F3D0]" />
                <span>Abrir en Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => setContingenciaModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-[#FAF8F5] text-[#8E7D7D] font-bold text-xs hover:bg-[#EFE7DE] hover:text-[#2D1A1E] transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
