import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, ChevronRight } from "lucide-react";
import api from "../../services/api";
import { Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";

export const LocalesPage: React.FC = () => {
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) {
      showToast("Tu navegador no ofrece ubicación", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        showToast(
          "No se pudo obtener tu ubicación. Revisa permisos y HTTPS.",
          "error",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  const distance = (l: Establecimiento) => {
    if (!position || l.lat == null || l.lng == null) return Infinity;
    const rad = Math.PI / 180,
      dlat = (Number(l.lat) - position.lat) * rad,
      dlng = (Number(l.lng) - position.lng) * rad;
    const a =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(position.lat * rad) *
        Math.cos(Number(l.lat) * rad) *
        Math.sin(dlng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const [q, setQ] = useState("");
  const { showToast } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/establishments");
        const list = data?.data ?? data ?? [];
        setLocales(Array.isArray(list) ? list : []);
      } catch {
        showToast("No se pudieron cargar los locales", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const filtered = locales
    .filter((l) => {
      const name = [l.razon_social, l.nombre, l.categoria_nombre, l.direccion]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return name.includes(q.toLowerCase());
    })
    .sort((a, b) => (position ? distance(a) - distance(b) : 0));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto animate-fadeIn">
      <div>
        <h1 className="text-lg font-bold">Locales aliados</h1>
        <p className="text-xs text-muted mt-0.5">
          Descubre dónde canjear experiencias
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="input-base !pl-10"
          placeholder="Buscar local o categoría..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <button className="input-base" onClick={locate} disabled={locating}>
        {locating ? "Buscando tu ubicación…" : "Ordenar por cercanía"}
      </button>
      {position && (
        <p className="text-xs text-muted">
          Distancias aproximadas en línea recta. Los locales sin coordenadas
          aparecen al final.
        </p>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Sin locales"
          description="Pronto habrá establecimientos afiliados cerca de ti."
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => navigate(`/user/locales/${l.id}`)}
                className="card w-full flex items-center gap-3 text-left hover:opacity-95 transition active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {l.imagen_url ? (
                    <img
                      src={l.imagen_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MapPin className="w-6 h-6 text-sky-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {l.razon_social || l.nombre}{" "}
                    {Number.isFinite(distance(l)) && (
                      <span className="text-sky-500">
                        · {distance(l).toFixed(1)} km
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {l.categoria_nombre || "Establecimiento"}
                    {l.direccion ? ` · ${l.direccion}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
