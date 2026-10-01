import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Search, Info, Heart } from "lucide-react";
import api from "../../services/api";

export const LocalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [locales, setLocales] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const [catActiva, setCatActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [locRes, catRes, favRes] = await Promise.all([
        api.get("/establishments"),
        api.get("/establishments/categorias").catch(() => ({ data: { data: [] } })),
        api.get("/establishments/favoritos").catch(() => ({ data: { data: [] } })),
      ]);
      setLocales(locRes.data?.data || []);
      const cats = catRes.data?.data || [];
      setCategorias(cats);
      const favs = favRes.data?.data || [];
      setFavoritosIds(
        new Set(favs.map((f: any) => String(f.id_establecimiento)))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cats = useMemo(() => {
    const names = ["Todos", ...categorias.map((c: any) => c.nombre).filter(Boolean)];
    return Array.from(new Set(names));
  }, [categorias]);

  const filtrados = useMemo(() => {
    return locales.filter((loc) => {
      const matchSearch =
        !busqueda.trim() ||
        loc.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase());
      const catName =
        loc.categoria_nombre ||
        categorias.find((c: any) => c.id === loc.categoria_id)?.nombre ||
        "";
      const matchCat = catActiva === "Todos" || catName === catActiva;
      return matchSearch && matchCat;
    });
  }, [locales, busqueda, catActiva, categorias]);

  const toggleFav = async (id: string | number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const sid = String(id);
    try {
      const res = await api.post(`/establishments/${id}/favorito`);
      const isFav = !!res.data?.data?.favorito;
      setFavoritosIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(sid);
        else next.delete(sid);
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const iniciarRuta = (loc: any) => {
    const suc = loc.sucursales?.[0];
    const params = new URLSearchParams();
    if (suc?.latitud) params.set("lat", String(suc.latitud));
    if (suc?.longitud) params.set("lng", String(suc.longitud));
    params.set("local", String(loc.id_establecimiento));
    params.set("ruta", "1");
    navigate(`/user/explorar?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-8">
      <div className="sticky top-0 z-20 bg-white border-b border-[#EFE7DE] px-4 pt-3 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Link
            to="/user/home"
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-[#2D1A1E]">Locales</h1>
        </div>
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E7D7D]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar local..."
            className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#7C0A1E]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCatActiva(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                catActiva === c
                  ? "bg-[#7C0A1E] text-white"
                  : "bg-[#FAF8F5] text-[#8E7D7D] border border-[#EFE7DE]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-xs text-[#8E7D7D] py-10">No hay locales.</p>
        ) : (
          filtrados.map((loc) => {
            const isFav = favoritosIds.has(String(loc.id_establecimiento));
            return (
              <div
                key={loc.id_establecimiento}
                className="bg-white rounded-2xl border border-[#EFE7DE] p-3.5 shadow-sm relative"
              >
                <button
                  type="button"
                  onClick={(e) => toggleFav(loc.id_establecimiento, e)}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                    isFav ? "bg-[#7C0A1E] text-white" : "bg-[#FAF8F5] text-[#8E7D7D]"
                  }`}
                  title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                </button>
                <div className="flex gap-3 pr-8">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#EFE7DE]">
                    <img
                      src={loc.logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100"}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#2D1A1E] truncate">{loc.nombre_comercial}</h3>
                    <p className="text-[11px] text-[#8E7D7D] truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />
                      {loc.sucursales?.[0]?.direccion || "Chiclayo"}
                    </p>
                    {(loc.categoria_nombre || isFav) && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {loc.categoria_nombre && (
                          <span className="text-[9px] font-bold bg-[#FAF8F5] text-[#7C0A1E] px-1.5 py-0.5 rounded-full">
                            {loc.categoria_nombre}
                          </span>
                        )}
                        {isFav && (
                          <span className="text-[9px] font-bold bg-[#7C0A1E]/10 text-[#7C0A1E] px-1.5 py-0.5 rounded-full">
                            Favorito
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => iniciarRuta(loc)}
                    className="flex-1 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={14} /> Iniciar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/user/locales/${loc.id_establecimiento || loc.id}`)}
                    className="flex-1 py-2 rounded-xl border border-[#EFE7DE] bg-[#FAF8F5] hover:bg-[#EFE7DE] text-[#2D1A1E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Info size={14} /> Ver detalles
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
