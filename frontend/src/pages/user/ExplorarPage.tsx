import React, { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Coffee, 
  Utensils, 
  Cake, 
  Compass, 
  MapPin, 
  ChevronRight, 
  Navigation,
  Crosshair,
  LocateFixed,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";

export const ExplorarPage: React.FC = () => {
  const [modoVista, setModoVista] = useState<"mapa" | "lista">("mapa");
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [locales, setLocales] = useState<any[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<any | null>(null);

  // Estados de Ubicación y Permisos GPS
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [solicitandoGps, setSolicitandoGps] = useState(false);
  const [permisoGpsRechazado, setPermisoGpsRechazado] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: string; lng: string }>({
    lat: "-6.7713700", // Chiclayo Centro por defecto
    lng: "-79.8408800"
  });

  const { showToast } = useUI();

  // 1. Cargar locales desde la API
  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const res = await api.get("/establishments");
        const list = res.data.data || [];
        setLocales(list);
        if (list.length > 0) {
          setLocalSeleccionado(list[0]);
          if (list[0].sucursales?.[0]?.latitud && list[0].sucursales?.[0]?.longitud) {
            setMapCenter({
              lat: String(list[0].sucursales[0].latitud),
              lng: String(list[0].sucursales[0].longitud)
            });
          }
        }
      } catch (e) {
        console.error("Error cargando locales", e);
      }
    };
    fetchLocales();
  }, []);

  // 2. Pedir permiso de geolocalización al entrar
  const solicitarPermisoUbicacion = () => {
    if (!("geolocation" in navigator)) {
      showToast("Tu navegador no soporta geolocalización", "info");
      return;
    }

    setSolicitandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        setMapCenter({
          lat: String(coords.lat),
          lng: String(coords.lng)
        });
        setPermisoGpsRechazado(false);
        setSolicitandoGps(false);
        showToast("Ubicación actualizada con éxito", "success");
      },
      (err) => {
        console.warn("Geolocalización rechazada o no disponible:", err.message);
        setPermisoGpsRechazado(true);
        setSolicitandoGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    // Solicitar permiso de ubicación inicial si aún no se tiene
    solicitarPermisoUbicacion();
  }, []);

  const categorias = [
    { id: "Todos", label: "Todos", icon: SlidersHorizontal },
    { id: "Café", label: "Café", icon: Coffee },
    { id: "Restaurante", label: "Restaurante", icon: Utensils },
    { id: "Postres", label: "Postres", icon: Cake },
    { id: "Otros", label: "Otros", icon: Compass },
  ];

  // Filtrado reactivo en el frontend
  const localesFiltrados = useMemo(() => {
    return locales.filter((loc) => {
      const matchSearch =
        !busqueda.trim() ||
        loc.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.sucursales?.some((s: any) =>
          s.direccion?.toLowerCase().includes(busqueda.toLowerCase())
        );

      const matchCat =
        categoriaActiva === "Todos" ||
        loc.nombre_comercial?.toLowerCase().includes(categoriaActiva.toLowerCase()) ||
        loc.descripcion?.toLowerCase().includes(categoriaActiva.toLowerCase());

      return matchSearch && matchCat;
    });
  }, [locales, busqueda, categoriaActiva]);

  // Manejar selección de un local (Mueve el mapa a las coordenadas del local)
  const handleSelectLocal = (loc: any) => {
    setLocalSeleccionado(loc);
    const suc = loc.sucursales?.[0];
    if (suc?.latitud && suc?.longitud) {
      setMapCenter({
        lat: String(suc.latitud),
        lng: String(suc.longitud)
      });
    }
  };

  // Centrar en Mi Ubicación
  const handleCenterUserLocation = () => {
    if (userCoords) {
      setMapCenter({
        lat: String(userCoords.lat),
        lng: String(userCoords.lng)
      });
      setLocalSeleccionado(null);
      showToast("Mapa centrado en tu posición actual", "info");
    } else {
      solicitarPermisoUbicacion();
    }
  };

  // URL interactiva de Google Maps para el Iframe
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=15&output=embed`;
  
  // URL para cómo llegar
  const latDest = localSeleccionado?.sucursales?.[0]?.latitud || mapCenter.lat;
  const lngDest = localSeleccionado?.sucursales?.[0]?.longitud || mapCenter.lng;
  const googleMapsDirectionsUrl = userCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${latDest},${lngDest}`
    : `https://www.google.com/maps/search/?api=1&query=${latDest},${lngDest}`;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Header fijo de Explorar */}
      <div className="p-5 pb-3 bg-white border-b border-[#EFE7DE] shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#2D1A1E]">Explorar locales</h1>
          
          {/* Botón rápido GPS */}
          <button
            onClick={handleCenterUserLocation}
            disabled={solicitandoGps}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] text-xs font-bold hover:bg-[#7C0A1E] hover:text-white transition-all shadow-xs"
            title="Centrar en mi ubicación"
          >
            <LocateFixed size={14} className={solicitandoGps ? "animate-spin" : ""} />
            <span>{solicitandoGps ? "Localizando..." : "Mi Ubicación"}</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative flex items-center mb-3">
          <Search size={18} className="absolute left-3.5 text-[#8E7D7D]" />
          <input
            type="text"
            placeholder="Buscar por local, café o distrito en Chiclayo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E]"
          />
          <button className="absolute right-3 text-[#8E7D7D] hover:text-[#7C0A1E]">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Carrusel de Categorías */}
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
                    : "bg-[#FAF8F5] border-[#EFE7DE] text-[#8E7D7D] hover:border-[#7C0A1E]"
                }`}
              >
                <Icon size={18} className={activo ? "text-white" : "text-[#7C0A1E]"} />
                <span className="text-[10px] font-medium mt-1">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Mapa / Lista */}
        <div className="mt-3 bg-[#FAF8F5] p-1 rounded-xl flex border border-[#EFE7DE]">
          <button
            onClick={() => setModoVista("mapa")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modoVista === "mapa" ? "bg-[#7C0A1E] text-white shadow-sm" : "text-[#8E7D7D]"
            }`}
          >
            Mapa Interactivo
          </button>
          <button
            onClick={() => setModoVista("lista")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modoVista === "lista" ? "bg-[#7C0A1E] text-white shadow-sm" : "text-[#8E7D7D]"
            }`}
          >
            Lista de Locales ({localesFiltrados.length})
          </button>
        </div>
      </div>

      {/* Contenido según el modo */}
      {modoVista === "mapa" ? (
        <div className="relative flex-1 w-full min-h-[500px] bg-[#E5E3DF] overflow-hidden flex flex-col justify-between">
          {/* Mapa Real Interactivo centrado dinámicamente */}
          <iframe
            key={`${mapCenter.lat}-${mapCenter.lng}`}
            title="Mapa Interactivo"
            src={mapEmbedUrl}
            className="absolute inset-0 w-full h-full border-none pointer-events-auto"
            loading="lazy"
          />

          {/* Marcadores Flotantes Rápidos de Locales (permite mover el mapa al hacer clic) */}
          <div className="relative z-20 p-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
            {localesFiltrados.map((loc) => {
              const esActivo = localSeleccionado?.id_establecimiento === loc.id_establecimiento;
              return (
                <button
                  key={loc.id_establecimiento}
                  onClick={() => handleSelectLocal(loc)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 shadow-md flex items-center gap-1.5 border transition-all ${
                    esActivo
                      ? "bg-[#7C0A1E] text-white border-[#7C0A1E] scale-105"
                      : "bg-white text-[#2D1A1E] border-[#EFE7DE] hover:bg-slate-50"
                  }`}
                >
                  <MapPin size={13} className={esActivo ? "text-[#C5A059]" : "text-[#7C0A1E]"} />
                  <span>{loc.nombre_comercial}</span>
                </button>
              );
            })}
          </div>

          {/* Botón flotante derecho para volver a Mi Ubicación */}
          <button
            onClick={handleCenterUserLocation}
            className="absolute right-4 bottom-24 z-30 w-11 h-11 bg-white text-[#7C0A1E] rounded-full shadow-lg border border-[#EFE7DE] flex items-center justify-center hover:bg-[#FAF8F5] active:scale-95 transition-all"
            title="Centrar en mi ubicación"
          >
            <Crosshair size={20} />
          </button>

          {/* Tarjeta flotante inferior del local activo */}
          {localSeleccionado ? (
            <div className="p-4 relative z-20 pointer-events-auto animate-fadeIn">
              <div className="bg-white rounded-3xl p-3.5 border border-[#EFE7DE] shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={
                      localSeleccionado.logo ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                    }
                    alt={localSeleccionado.nombre_comercial}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#EFE7DE]"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-[#2D1A1E]">
                      {localSeleccionado.nombre_comercial}
                    </h3>
                    <p className="text-[11px] text-[#8E7D7D] truncate max-w-[180px]">
                      {localSeleccionado.sucursales?.[0]?.direccion || "Chiclayo"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-[10px]">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        • Abierto ahora
                      </span>
                      <span className="text-[#C5A059] font-bold">
                        +{localSeleccionado.puntos_por_visita || 20} pts
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-2xl bg-[#7C0A1E] text-white flex items-center justify-center shadow-md hover:bg-[#600616] transition-all shrink-0 ml-2"
                  title="Cómo llegar"
                >
                  <Navigation size={18} />
                </a>
              </div>
            </div>
          ) : (
            /* Estado informativo cuando no hay local seleccionado */
            locales.length === 0 && (
              <div className="p-4 relative z-20 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 border border-[#EFE7DE] shadow-md text-center">
                  <p className="text-xs font-bold text-[#2D1A1E]">Explorando Chiclayo</p>
                  <p className="text-[11px] text-[#8E7D7D] mt-0.5">
                    No hay locales registrados aún. Usa "Mi Ubicación" para situarte en el mapa.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        /* Vista de Lista */
        <div className="p-5 space-y-3 pb-24">
          {localesFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-8 shadow-xs">
              <Compass className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2D1A1E]">
                {locales.length === 0
                  ? "Aún no hay establecimientos afiliados registrados"
                  : "No se encontraron locales en esta categoría"}
              </p>
              <p className="text-[11px] text-[#8E7D7D] mt-0.5">
                {locales.length === 0
                  ? "Los nuevos comercios y cafeterías se publicarán aquí próximamente."
                  : 'Intenta con otra búsqueda o selecciona "Todos"'}
              </p>
            </div>
          ) : (
            localesFiltrados.map((loc) => (
              <div
                key={loc.id_establecimiento}
                onClick={() => {
                  handleSelectLocal(loc);
                  setModoVista("mapa");
                }}
                className="bg-white rounded-3xl p-4 border border-[#EFE7DE] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#7C0A1E] transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <img
                    src={
                      loc.logo ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                    }
                    alt={loc.nombre_comercial}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#EFE7DE]"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-[#2D1A1E]">{loc.nombre_comercial}</h3>
                    <p className="text-[11px] text-[#8E7D7D] truncate max-w-[200px]">
                      {loc.sucursales?.[0]?.direccion || "Chiclayo"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="bg-[#7C0A1E]/10 text-[#7C0A1E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{loc.puntos_por_visita || 20} pts por visita
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7C0A1E] flex items-center justify-center border border-[#EFE7DE]">
                  <ChevronRight size={18} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
