import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { useLanguage } from "../../context/LanguageContext";

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
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

/** Marcador tipo pin: círculo + cola de ubicación */
const CircularMarker: React.FC<{
  logo?: string;
  nombre: string;
  activo?: boolean;
  onClick: () => void;
}> = ({ logo, nombre, activo, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer transition-transform flex flex-col items-center ${activo ? "scale-110" : "hover:scale-105"}`}
    title={nombre}
    style={{ transform: "translateY(-100%)" }}
  >
    <div
      className={`w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg bg-white relative z-10 ${
        activo ? "border-[#7C0A1E] ring-2 ring-[#C5A059]" : "border-white"
      }`}
    >
      <img
        src={logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"}
        alt={nombre}
        className="w-full h-full object-cover"
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
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [locales, setLocales] = useState<any[]>([]);
  const [categoriasDb, setCategoriasDb] = useState<{ id: string; label: string; icono?: string }[]>([{ id: "Todos", label: "Todos" }]);
  const [localSeleccionado, setLocalSeleccionado] = useState<any | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [solicitandoGps, setSolicitandoGps] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsVersion, setDirectionsVersion] = useState(0);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState<"ninguno" | "cercano" | "visitado">("ninguno");
  const [showFiltros, setShowFiltros] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [modoViaje, setModoViaje] = useState<"DRIVING" | "WALKING">("DRIVING");
  const [tarjetaExpandidaEnRuta, setTarjetaExpandidaEnRuta] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);

  const lastRouteOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const directionsRef = useRef<google.maps.DirectionsResult | null>(null);
  directionsRef.current = directions;
  const modoViajeRef = useRef<"DRIVING" | "WALKING">(modoViaje);
  modoViajeRef.current = modoViaje;
  const localSeleccionadoRef = useRef<any>(null);
  localSeleccionadoRef.current = localSeleccionado;
  const calcularRutaSilenciosaRef = useRef<(coords: { lat: number; lng: number }) => void>(() => {});

  const { showToast } = useUI();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const watchIdRef = useRef<number | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Manejador directo y limpio de rutas para Google Maps (evita líneas huérfanas)
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // Oculta los marcadores nativos 'A' y 'B' de Google para que no choquen con tu ubicación
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "#7C0A1E",
          strokeWeight: 5,
          strokeOpacity: 0.9,
        },
      });
    }

    if (directions) {
      directionsRendererRef.current.setMap(map);
      directionsRendererRef.current.setDirections(directions);
    } else {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      directionsRendererRef.current.setMap(null);
    }
  }, [map, directions]);

  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  const [refrescando, setRefrescando] = useState(false);

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

  // Manejador seguro de resize y visibilidad para evitar mapa gris / desfasado
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

  // Deep-link: ?local=ID&lat=&lng=&ruta=1 desde "Cómo llegar" / Iniciar
  useEffect(() => {
    if (!locales.length) return;
    const localId = searchParams.get("local");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const ruta = searchParams.get("ruta");
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
    // ruta=1: no auto-start sin GPS; usuario pulsa Iniciar ruta
  }, [locales, searchParams, map]);

  // Restaurar ruta activa de sessionStorage si tiene menos de 10 min
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
          calcularRuta(parsed.modoViaje || "DRIVING");
        }, 400);
      }
    } catch {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    }
  }, [locales, userCoords]);


  // NO solicitar ubicación automáticamente al montar
  // Solo al presionar "Mi Ubicación"
  const solicitarPermisoUbicacion = useCallback(
    (activarWatch = false, isSilent = false) => {
      if (!("geolocation" in navigator)) {
        if (!isSilent) showToast("Tu navegador no soporta geolocalización", "info");
        return;
      }

      if (!isSilent) setSolicitandoGps(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserCoords(coords);
          setSolicitandoGps(false);
          if (!isSilent) showToast("Ubicación detectada", "success");

          const dist = getDistanceKm(coords.lat, coords.lng, defaultCenter.lat, defaultCenter.lng);
          if (dist <= 40) {
            setMapCenter(coords);
            map?.panTo(coords);
            map?.setZoom(15);
          }

          // Si estamos en el panel y se solicita, mantener ubicación en tiempo real
          if (activarWatch && watchIdRef.current === null) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (p) => {
                const newCoords = {
                  lat: p.coords.latitude,
                  lng: p.coords.longitude,
                };
                setUserCoords(newCoords);
                if (p.coords.heading !== null && !isNaN(p.coords.heading)) {
                  setUserHeading(p.coords.heading);
                }

                // Navegación en tiempo real: auto-actualizar ruta y distancia mientras avanzas
                if (directionsRef.current && localSeleccionadoRef.current?.sucursales?.[0]) {
                  const suc = localSeleccionadoRef.current.sucursales[0];
                  if (suc.latitud && suc.longitud) {
                    const destDist = getDistanceKm(newCoords.lat, newCoords.lng, Number(suc.latitud), Number(suc.longitud));
                    // Si ya estás a menos de 50 metros del destino
                    if (destDist <= 0.05) {
                      showToast("🎉 ¡Has llegado a tu destino!", "success");
                    } else if (lastRouteOriginRef.current) {
                      // Actualización fluida al caminar o desplazarse (cada 10 metros)
                      const distMovida = getDistanceKm(
                        lastRouteOriginRef.current.lat,
                        lastRouteOriginRef.current.lng,
                        newCoords.lat,
                        newCoords.lng
                      );
                      if (distMovida >= 0.01) {
                        lastRouteOriginRef.current = newCoords;
                        calcularRutaSilenciosaRef.current(newCoords);
                      }
                    }
                  }
                }
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
            );
          }
        },
        (err) => {
          setSolicitandoGps(false);
          if (err.code === 1) {
            setGpsBlocked(true); // El usuario o el navegador denegó el permiso
            if (!isSilent) showToast("Permiso de ubicación denegado", "info");
          } else {
            if (!isSilent) showToast("No se pudo obtener ubicación", "info");
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    },
    [showToast, map]
  );

  // Solicitar ubicación al entrar a la vista "Explorar"
  useEffect(() => {
    // Solicitamos silenciosamente al inicio para no lanzar toasts molestos, 
    // pero si falla, actualizaremos el estado gpsBlocked para mostrar un banner.
    solicitarPermisoUbicacion(true, true);
  }, [solicitarPermisoUbicacion]);

  // Cleanup watch
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const iconByName = (name?: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("coffee") || n.includes("café") || n.includes("cafe")) return Coffee;
    if (n.includes("utensil") || n.includes("rest")) return Utensils;
    if (n.includes("cake") || n.includes("croissant") || n.includes("postre")) return Cake;
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

  const handleSelectLocal = (loc: any) => {
    // Limpiar y forzar remount del DirectionsRenderer
    setDirections(null);
    setDirectionsVersion((v) => v + 1);
    setLocalSeleccionado(loc);
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
    if (!isNaN(latTarget) && !isNaN(lngTarget)) {
      map?.panTo({ lat: latTarget, lng: lngTarget });
      map?.setZoom(16);
    }
  };

  const handleCenterUserLocation = () => {
    if (userCoords) {
      map?.panTo(userCoords);
      map?.setZoom(16);
      setLocalSeleccionado(null);
      setDirections(null);
      showToast("Centrado en tu ubicación", "info");
    } else {
      // Solo aquí se activa la ubicación
      solicitarPermisoUbicacion(true);
    }
  };

  // Extraer coordenadas de cualquier formato de URL de Google Maps si la sucursal no tiene lat/lng
  const parseCoordsFromUrl = (url?: string): { lat: number; lng: number } | null => {
    if (!url || !url.trim()) return null;

    // 1. Coordenadas de pin específico: !3dlat!4dlng
    const pinMatch = url.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
    if (pinMatch) {
      const lat = parseFloat(pinMatch[1]);
      const lng = parseFloat(pinMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }

    // 2. Coordenadas en rutas: destination=lat,lng o !2dlng!2dlat
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
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
    return null;
  };

  // ========== RUTA: calcular, cambiar modo y encuadrar con zoom óptimo ==========
  const calcularRuta = (travelMode: "DRIVING" | "WALKING" = modoViaje) => {
    if (!localSeleccionado) return;

    const suc = localSeleccionado.sucursales?.[0];
    let destLat = suc ? Number(suc.latitud) : NaN;
    let destLng = suc ? Number(suc.longitud) : NaN;

    // Si no tiene latitud/longitud directa o es 0/NaN, intentar extraer del google_maps_url
    if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
      const mapsUrl = suc?.google_maps_url || localSeleccionado.google_maps_url;
      const parsed = parseCoordsFromUrl(mapsUrl);
      if (parsed) {
        destLat = parsed.lat;
        destLng = parsed.lng;
      }
    }

    // Si aún no hay coordenadas válidas
    if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
      const mapsUrl = suc?.google_maps_url || localSeleccionado.google_maps_url;
      if (mapsUrl) {
        showToast("Abriendo ubicación en Google Maps...", "info");
        window.open(mapsUrl, "_blank");
      } else {
        const dir = suc?.direccion || localSeleccionado.direccion || "este establecimiento";
        showToast(`Este local aún no cuenta con coordenadas GPS configuradas (${dir})`, "info");
      }
      return;
    }

    if (!userCoords) {
      showToast("Activa tu ubicación para trazar la ruta", "info");
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
          setTarjetaExpandidaEnRuta(false); // Colapsa a barra compacta para dejar ver el mapa
          // Ajuste dinámico de zoom y encuadre a toda la ruta para ver inicio y fin
          if (result.routes[0]?.bounds && map) {
            map.fitBounds(result.routes[0].bounds, {
              top: 80,
              bottom: 120, // Solo 120px de margen inferior gracias a la barra compacta
              left: 40,
              right: 40,
            });
          }
          try {
            sessionStorage.setItem(
              ACTIVE_ROUTE_STORAGE_KEY,
              JSON.stringify({
                localId: localSeleccionado.id_establecimiento || localSeleccionado.id,
                modoViaje: travelMode,
                destLat,
                destLng,
                savedAt: Date.now(),
              })
            );
          } catch {}
          showToast(travelMode === "WALKING" ? "Ruta a pie trazada" : "Ruta en auto trazada", "success");
        } else {
          showToast("No se pudo calcular ruta exacta. Abriendo en Google Maps...", "info");
          const mapsUrl = suc?.google_maps_url || localSeleccionado.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
          window.open(mapsUrl, "_blank");
        }
      }
    );
  };

  const calcularRutaSilenciosa = (origen: { lat: number; lng: number }) => {
    if (!localSeleccionadoRef.current?.sucursales?.[0] || !window.google?.maps) return;
    const suc = localSeleccionadoRef.current.sucursales[0];
    let destLat = Number(suc.latitud);
    let destLng = Number(suc.longitud);
    if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) {
      const parsed = parseCoordsFromUrl(suc.google_maps_url || localSeleccionadoRef.current.google_maps_url);
      if (parsed) {
        destLat = parsed.lat;
        destLng = parsed.lng;
      }
    }
    if (isNaN(destLat) || isNaN(destLng) || (destLat === 0 && destLng === 0)) return;

    const directionsService = new window.google.maps.DirectionsService();
    const destino = { lat: destLat, lng: destLng };
    const gTravelMode =
      modoViajeRef.current === "WALKING"
        ? window.google.maps.TravelMode.WALKING
        : window.google.maps.TravelMode.DRIVING;

    directionsService.route(
      {
        origin: origen,
        destination: destino,
        travelMode: gTravelMode,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  };
  calcularRutaSilenciosaRef.current = calcularRutaSilenciosa;

  const cambiarModoViaje = (nuevoModo: "DRIVING" | "WALKING") => {
    setModoViaje(nuevoModo);
    if (directions) {
      calcularRuta(nuevoModo);
    }
  };

  // Distancia y tiempo calculado en vivo
  const infoRuta = useMemo(() => {
    if (!localSeleccionado?.sucursales?.[0]) return null;
    const suc = localSeleccionado.sucursales[0];
    if (!suc.latitud || !suc.longitud) return null;

    // 1. Si ya se trazó una ruta con Google Maps (precisión exacta de calles y tráfico)
    if (directions?.routes?.[0]?.legs?.[0]) {
      const leg = directions.routes[0].legs[0];
      return {
        distancia: leg.distance?.text || "",
        tiempo: leg.duration?.text || "",
        esRutaReal: true,
      };
    }

    // 2. Si no hay ruta trazada aún, pero tenemos GPS del usuario
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
        esRutaReal: false,
      };
    }

    return null;
  }, [localSeleccionado, directions, userCoords, modoViaje]);

  const cancelarRuta = () => {
    setDirections(null);
    lastRouteOriginRef.current = null;
    setTarjetaExpandidaEnRuta(false);
    try {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    } catch {}
  };

  const cerrarTarjeta = () => {
    setLocalSeleccionado(null);
    setDirections(null);
    lastRouteOriginRef.current = null;
    setTarjetaExpandidaEnRuta(false);
    try {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    } catch {}
  };

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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
    <div className="w-full h-full flex flex-col bg-[#FAF8F5] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 bg-white border-b border-[#EFE7DE] shadow-sm shrink-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#2D1A1E]">Explorar locales</h1>

          <div className="flex items-center gap-2">
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
          {/* Botón de filtros útiles: más cercano / más visitado */}
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

        {gpsBlocked && (
          <div className="mt-3 bg-amber-50 border border-amber-200/70 rounded-2xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <LocateFixed size={18} className="text-[#7C0A1E] shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#2D1A1E]">Ubicación GPS no activada</h4>
                <p className="text-[11px] text-[#8E7D7D] truncate">
                  Activa tu GPS para ver locales cercanos y trazar tu ruta.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => solicitarPermisoUbicacion(false, false)}
              className="px-3 py-1.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold shrink-0 hover:bg-[#600616] cursor-pointer"
            >
              Activar GPS
            </button>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="relative flex-1 w-full min-h-[500px] h-[calc(100vh-210px)] bg-[#E5E3DF] overflow-hidden">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[#8E7D7D]">Cargando mapa...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false,
              gestureHandling: "greedy",
            }}
          >
            {/* Tu ubicación en tiempo real con efecto radar y dirección */}
            {userCoords && (
              <OverlayView
                position={userCoords}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={() => ({ x: -16, y: -16 })}
                zIndex={999}
              >
                <div
                  title="Tu ubicación en tiempo real"
                  className="relative flex items-center justify-center pointer-events-none"
                  style={{ width: 32, height: 32 }}
                >
                  {/* Pulso de radar en vivo */}
                  <span className="absolute w-7 h-7 rounded-full bg-blue-500/35 animate-ping" />

                  {/* Círculo central azul con borde blanco */}
                  <div className="relative w-4 h-4 rounded-full bg-[#1A73E8] border-2 border-white shadow-md z-10 flex items-center justify-center">
                    {userHeading !== null && (
                      <div
                        className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-white"
                        style={{ transform: `rotate(${userHeading}deg)` }}
                      />
                    )}
                  </div>
                </div>
              </OverlayView>
            )}

            {/* Locales con marcadores circulares */}
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

        {/* Chips de locales */}
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

        {/* Tarjeta inferior adaptativa: compacta al navegar para despejar el mapa */}
        {localSeleccionado && (
          <div
            className="absolute left-0 right-0 z-20 px-3 sm:px-4 pointer-events-none transition-all duration-300"
            style={{ bottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
          >
            {directions && !tarjetaExpandidaEnRuta ? (
              /* BARRA COMPACTA FLOTANTE MODO NAVEGACIÓN ACTIVA */
              <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-[#EFE7DE] shadow-2xl flex items-center justify-between gap-2.5 animate-fadeIn">
                {/* Logo e info de ruta */}
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
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
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#EFE7DE] shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#2D1A1E] truncate">
                        {localSeleccionado.nombre_comercial}
                      </h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="En camino" />
                    </div>
                    {infoRuta && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#59494B] font-medium mt-0.5">
                        <span className="font-bold text-[#7C0A1E]">{infoRuta.distancia}</span>
                        <span>•</span>
                        <span>{infoRuta.tiempo}</span>
                        <span>•</span>
                        <span className="text-[10px] text-[#8E7D7D]">
                          {modoViaje === "WALKING" ? "A pie" : "En auto"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones compactas: ver ficha + selector rápido + cancelar + expandir */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                      if (idLoc) navigate(`/user/locales/${idLoc}`);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#EFE7DE] transition-colors"
                    title="Ver ficha del local"
                  >
                    <Info size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => cambiarModoViaje(modoViaje === "DRIVING" ? "WALKING" : "DRIVING")}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#EFE7DE] transition-colors"
                    title={`Cambiar a ${modoViaje === "DRIVING" ? "Caminando" : "En auto"}`}
                  >
                    {modoViaje === "DRIVING" ? <Car size={15} /> : <Footprints size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const suc = localSeleccionado.sucursales?.[0];
                      const destLat = suc?.latitud || "";
                      const destLng = suc?.longitud || "";
                      const url = suc?.google_maps_url || localSeleccionado.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${modoViaje.toLowerCase()}`;
                      window.open(url, "_blank");
                    }}
                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition-colors"
                    title="Navegar en Google Maps app"
                  >
                    <ExternalLink size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={cancelarRuta}
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-100 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={14} />
                    <span>{t("cancelRoute") || "Cancelar"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarjetaExpandidaEnRuta(true)}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] hover:bg-[#EFE7DE] transition-colors"
                    title="Expandir detalles"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* TARJETA COMPLETA (ANTES DE INICIAR O SI SE EXPANDIÓ) */
              <div className="pointer-events-auto bg-white rounded-3xl p-3.5 sm:p-4 border border-[#EFE7DE] shadow-xl max-h-[42vh] overflow-y-auto relative animate-fadeIn">
                {directions && (
                  <button
                    onClick={() => setTarjetaExpandidaEnRuta(false)}
                    className="absolute top-2.5 right-11 text-[11px] font-bold text-[#7C0A1E] bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#EFE7DE] flex items-center gap-1 hover:bg-[#EFE7DE] transition-colors cursor-pointer"
                    title="Minimizar barra"
                  >
                    <ChevronDown size={14} />
                    <span>{t("minimize") || "Minimizar"}</span>
                  </button>
                )}
                <button
                  onClick={cerrarTarjeta}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#8E7D7D] cursor-pointer hover:bg-[#EFE7DE] transition-colors z-10"
                  title="Cerrar"
                >
                  <X size={14} />
                </button>

                <div className="flex items-center gap-3 pr-8">
                  <div
                    onClick={() => {
                      const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                      if (idLoc) navigate(`/user/locales/${idLoc}`);
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 border-2 border-[#EFE7DE] cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs"
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
                  <div className="min-w-0">
                    <div
                      onClick={() => {
                        const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                        if (idLoc) navigate(`/user/locales/${idLoc}`);
                      }}
                      className="cursor-pointer group/title inline-block max-w-full"
                      title="Ver información y catálogo del local"
                    >
                      <h3 className="font-bold text-sm text-[#2D1A1E] group-hover/title:text-[#7C0A1E] transition-colors truncate flex items-center gap-1.5">
                        <span className="truncate">{localSeleccionado.nombre_comercial}</span>
                        <span className="text-[10px] font-semibold text-[#7C0A1E] opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0">
                          Ver perfil →
                        </span>
                      </h3>
                    </div>
                    <p className="text-[11px] text-[#8E7D7D] truncate">
                      {localSeleccionado.sucursales?.[0]?.direccion || "Chiclayo"}
                    </p>
                    
                    {/* Badges de información verídica */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[#7C0A1E] font-semibold bg-[#FAF8F5] border border-[#EFE7DE] px-2 py-0.5 rounded-full text-[10px]">
                        {localSeleccionado.categoria_nombre || localSeleccionado.categoria || "Comercio"}
                      </span>
                      <span className="text-[#C5A059] font-bold text-[10px] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} />
                        +{localSeleccionado.puntos_por_visita || 20} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distancia y tiempo estimado */}
                {infoRuta && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] w-fit text-xs text-[#2D1A1E]">
                    <span className="font-bold text-[#7C0A1E] flex items-center gap-1">
                      <MapPin size={13} className="shrink-0" />
                      {infoRuta.distancia}
                    </span>
                    <span className="text-[#C8BFB7]">•</span>
                    <span className="text-[#59494B] font-medium flex items-center gap-1">
                      <Clock size={13} className="shrink-0" />
                      {infoRuta.tiempo}
                    </span>
                    {infoRuta.esRutaReal && (
                      <span className="text-[9px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ml-1">
                        Ruta activa
                      </span>
                    )}
                  </div>
                )}

                {/* Selector de Modo: En auto vs Caminando */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EFE7DE]">
                  <span className="text-[11px] font-semibold text-[#8E7D7D]">{t("travelMode") || "Modo de viaje"}:</span>
                  <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#EFE7DE] text-xs">
                    <button
                      type="button"
                      onClick={() => cambiarModoViaje("DRIVING")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        modoViaje === "DRIVING"
                          ? "bg-white text-[#7C0A1E] shadow-sm border border-[#EFE7DE]"
                          : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                      }`}
                    >
                      <Car size={13} />
                      <span>{t("driving") || "En auto"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarModoViaje("WALKING")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        modoViaje === "WALKING"
                          ? "bg-white text-[#7C0A1E] shadow-sm border border-[#EFE7DE]"
                          : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                      }`}
                    >
                      <Footprints size={13} />
                      <span>{t("walking") || "Caminando"}</span>
                    </button>
                  </div>
                </div>

                {/* Botones de acción: Iniciar Ruta + Ver Perfil Directo */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const idLoc = localSeleccionado.id_establecimiento || localSeleccionado.id;
                      if (idLoc) navigate(`/user/locales/${idLoc}`);
                    }}
                    className="py-2.5 px-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EFE7DE] active:scale-[0.98] transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Ver toda la información del comercio"
                  >
                    <Info size={15} className="text-[#7C0A1E]" />
                    <span>{t("viewLocal") || "Ver Local"}</span>
                  </button>

                  {directions ? (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={cancelarRuta}
                        className="flex-1 py-2.5 rounded-2xl bg-red-50 text-red-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-red-200 active:scale-[0.98] transition-all cursor-pointer hover:bg-red-100"
                      >
                        <X size={16} />
                        {t("cancelRoute") || "Cancelar ruta"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const suc = localSeleccionado.sucursales?.[0];
                          const destLat = suc?.latitud || "";
                          const destLng = suc?.longitud || "";
                          const url = suc?.google_maps_url || localSeleccionado.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${modoViaje.toLowerCase()}`;
                          window.open(url, "_blank");
                        }}
                        className="py-2.5 px-3 rounded-2xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 hover:bg-blue-100 active:scale-[0.98] transition-all cursor-pointer"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink size={15} />
                        <span>Google Maps</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => calcularRuta()}
                        disabled={cargandoRuta}
                        className="flex-1 py-2.5 rounded-2xl bg-[#7C0A1E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer hover:bg-[#630718] shadow-xs"
                      >
                        <Navigation size={16} />
                        {cargandoRuta
                          ? t("calculating") || "Calculando..."
                          : modoViaje === "WALKING"
                          ? t("startRouteFoot") || "A pie"
                          : t("startRouteCar") || "Auto"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const suc = localSeleccionado.sucursales?.[0];
                          const destLat = suc?.latitud || "";
                          const destLng = suc?.longitud || "";
                          const url = suc?.google_maps_url || localSeleccionado.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${modoViaje.toLowerCase()}`;
                          window.open(url, "_blank");
                        }}
                        className="py-2.5 px-3 rounded-2xl bg-[#FAF8F5] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#EFE7DE] hover:bg-[#EFE7DE] active:scale-[0.98] transition-all cursor-pointer"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink size={15} className="text-[#7C0A1E]" />
                        <span>Maps</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
