import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  DirectionsRenderer,
  OverlayView,
} from "@react-google-maps/api";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
};

const defaultCenter = {
  lat: -6.77137,
  lng: -79.84088,
};

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
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState<"ninguno" | "cercano" | "visitado">("ninguno");
  const [showFiltros, setShowFiltros] = useState(false);

  const { showToast } = useUI();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const watchIdRef = useRef<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Cargar locales + categorías desde DB
  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const [res, catRes] = await Promise.all([
          api.get("/establishments"),
          api.get("/establishments/categorias").catch(() => ({ data: { data: [] } })),
        ]);
        setLocales(res.data.data || []);
        const cats = catRes.data?.data || [];
        setCategoriasDb([
          { id: "Todos", label: "Todos", icono: "compass" },
          ...cats.map((c: any) => ({
            id: c.nombre,
            label: c.nombre,
            icono: c.icono_url || c.icono || "map-pin",
          })),
        ]);
      } catch (e) {
        console.error("Error cargando locales", e);
      }
    };
    fetchLocales();
  }, []);


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
        if (suc?.latitud) {
          setMapCenter({ lat: Number(suc.latitud), lng: Number(suc.longitud) });
          map?.panTo({ lat: Number(suc.latitud), lng: Number(suc.longitud) });
        }
      }
    } else if (lat && lng) {
      setMapCenter({ lat: Number(lat), lng: Number(lng) });
      map?.panTo({ lat: Number(lat), lng: Number(lng) });
    }
    // ruta=1: no auto-start sin GPS; usuario pulsa Iniciar ruta
  }, [locales, searchParams, map]);

  // NO solicitar ubicación automáticamente al montar
  // Solo al presionar "Mi Ubicación"
  const solicitarPermisoUbicacion = useCallback(
    (activarWatch = false) => {
      if (!("geolocation" in navigator)) {
        showToast("Tu navegador no soporta geolocalización", "info");
        return;
      }

      setSolicitandoGps(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserCoords(coords);
          setSolicitandoGps(false);
          showToast("Ubicación detectada", "success");

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
                setUserCoords({
                  lat: p.coords.latitude,
                  lng: p.coords.longitude,
                });
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 5000 }
            );
          }
        },
        (err) => {
          setSolicitandoGps(false);
          if (err.code === 1) showToast("Permiso de ubicación denegado", "info");
          else showToast("No se pudo obtener ubicación", "info");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    },
    [showToast, map]
  );

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
    setLocalSeleccionado(loc);
    // Al cambiar de local, limpiar ruta anterior (evita dos caminos)
    setDirections(null);
    const suc = loc.sucursales?.[0];
    if (suc?.latitud && suc?.longitud) {
      map?.panTo({ lat: Number(suc.latitud), lng: Number(suc.longitud) });
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

  // ========== RUTA: al iniciar otra se reemplaza la anterior ==========
  const iniciarRuta = () => {
    if (!localSeleccionado?.sucursales?.[0]) return;

    if (!userCoords) {
      showToast("Activa tu ubicación para iniciar la ruta", "info");
      solicitarPermisoUbicacion(true);
      return;
    }

    if (!window.google?.maps) return;

    setCargandoRuta(true);
    // Limpiar ruta previa antes de calcular la nueva
    setDirections(null);

    const directionsService = new window.google.maps.DirectionsService();
    const destino = {
      lat: Number(localSeleccionado.sucursales[0].latitud),
      lng: Number(localSeleccionado.sucursales[0].longitud),
    };

    directionsService.route(
      {
        origin: userCoords,
        destination: destino,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setCargandoRuta(false);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          showToast("Ruta lista", "success");
        } else {
          showToast("No se pudo calcular la ruta", "info");
          console.warn("Directions error:", status);
        }
      }
    );
  };

  const cerrarTarjeta = () => {
    setLocalSeleccionado(null);
    setDirections(null);
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

          <button
            onClick={handleCenterUserLocation}
            disabled={solicitandoGps}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] text-xs font-bold"
          >
            <LocateFixed size={14} className={solicitandoGps ? "animate-spin" : ""} />
            <span>{solicitandoGps ? "Localizando..." : "Mi Ubicación"}</span>
          </button>
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
            {/* Tu ubicación solo si se activó */}
            {userCoords && window.google?.maps && (
              <MarkerF
                position={userCoords}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 20),
                }}
                title="Tu ubicación"
                zIndex={999}
              />
            )}

            {/* Locales con marcadores circulares */}
            {localesFiltrados.map((loc) => {
              const suc = loc.sucursales?.[0];
              if (!suc?.latitud || !suc?.longitud) return null;
              const pos = { lat: Number(suc.latitud), lng: Number(suc.longitud) };
              const activo = localSeleccionado?.id_establecimiento === loc.id_establecimiento;

              return (
                <OverlayView
                  key={loc.id_establecimiento}
                  position={pos}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <CircularMarker
                    logo={loc.logo}
                    nombre={loc.nombre_comercial}
                    activo={activo}
                    onClick={() => handleSelectLocal(loc)}
                  />
                </OverlayView>
              );
            })}

            {/* Una sola ruta: se reemplaza al cambiar de local */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: "#7C0A1E",
                    strokeWeight: 5,
                    strokeOpacity: 0.9,
                  },
                }}
              />
            )}
          </GoogleMap>
        )}

        {/* Chips de locales */}
        <div className="absolute top-3 left-0 right-0 z-20 px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
          {localesFiltrados.map((loc) => {
            const esActivo = localSeleccionado?.id_establecimiento === loc.id_establecimiento;
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
                {loc.logo && (
                  <img src={loc.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span>{loc.nombre_comercial}</span>
              </button>
            );
          })}
        </div>

        {/* Tarjeta inferior adaptativa (no se oculta tras el nav) */}
        {localSeleccionado && (
          <div
            className="absolute left-0 right-0 z-20 px-3 sm:px-4"
            style={{ bottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
          >
            <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-[#EFE7DE] shadow-xl max-h-[40vh] overflow-y-auto relative">
              <button
                onClick={cerrarTarjeta}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#8E7D7D] cursor-pointer hover:bg-[#EFE7DE] transition-colors z-10"
                title="Cerrar"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <img
                  src={
                    localSeleccionado.logo ||
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                  }
                  alt={localSeleccionado.nombre_comercial}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border-2 border-[#EFE7DE]"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#2D1A1E] truncate">
                    {localSeleccionado.nombre_comercial}
                  </h3>
                  <p className="text-[11px] text-[#8E7D7D] truncate">
                    {localSeleccionado.sucursales?.[0]?.direccion || "Chiclayo"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      • Abierto ahora
                    </span>
                    <span className="text-[#C5A059] font-bold">
                      +{localSeleccionado.puntos_por_visita || 20} pts
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={iniciarRuta}
                disabled={cargandoRuta}
                className="mt-3 w-full py-2.5 rounded-2xl bg-[#7C0A1E] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <Navigation size={16} />
                {cargandoRuta ? "Calculando ruta..." : directions ? "Ruta activa" : "Iniciar ruta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
