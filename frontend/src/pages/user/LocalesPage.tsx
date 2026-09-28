import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Search, X, Info } from "lucide-react";
import api from "../../services/api";

export const LocalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [locales, setLocales] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [catActiva, setCatActiva] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalLocal, setModalLocal] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          api.get("/establishments"),
          api.get("/establishments/categorias").catch(() => ({ data: { data: [] } })),
        ]);
        setLocales(locRes.data?.data || []);
        setCategorias(catRes.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cats = useMemo(() => {
    const names = ["Todos", ...categorias.map((c: any) => c.nombre).filter(Boolean)];
    return Array.from(new Set(names));
  }, [categorias]);

  const filtrados = useMemo(() => {
    return locales.filter((loc) => {
      const matchSearch =
        !busqueda.trim() ||
        loc.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const catName = loc.categoria_nombre || categorias.find((c: any) => c.id === loc.categoria_id)?.nombre;
      const matchCat =
        catActiva === "Todos" ||
        catName === catActiva ||
        loc.nombre_comercial?.toLowerCase().includes(catActiva.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [locales, busqueda, catActiva, categorias]);

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
          <p className="text-center text-xs text-[#8E7D7D] py-10">No hay locales en esta categoría.</p>
        ) : (
          filtrados.map((loc) => (
            <div
              key={loc.id_establecimiento}
              className="bg-white rounded-2xl border border-[#EFE7DE] p-3.5 shadow-sm"
            >
              <div className="flex gap-3">
                {/* Imagen: solo animación, no navega */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#EFE7DE] transition-transform hover:scale-105">
                  <img
                    src={
                      loc.logo ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100"
                    }
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
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => iniciarRuta(loc)}
                  className="flex-1 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Navigation size={14} />
                  Iniciar
                </button>
                <button
                  type="button"
                  onClick={() => setModalLocal(loc)}
                  className="flex-1 py-2 rounded-xl border border-[#EFE7DE] text-[#2D1A1E] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Info size={14} />
                  Ver detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal detalles (reemplaza panel azul feo) */}
      {modalLocal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setModalLocal(null)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-5 relative max-h-[50vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalLocal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <div className="flex gap-3 pr-8">
              <img
                src={
                  modalLocal.logo ||
                  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100"
                }
                alt=""
                className="w-16 h-16 rounded-2xl object-cover border border-[#EFE7DE]"
              />
              <div>
                <h3 className="text-base font-bold text-[#2D1A1E]">{modalLocal.nombre_comercial}</h3>
                <p className="text-[11px] text-[#8E7D7D] mt-0.5">
                  {modalLocal.sucursales?.[0]?.direccion || "—"}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#8E7D7D] mt-3 leading-relaxed">
              {modalLocal.descripcion || "Establecimiento afiliado."}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setModalLocal(null);
                  iniciarRuta(modalLocal);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Navigation size={14} /> Iniciar
              </button>
              <Link
                to={`/user/locales/${modalLocal.id_establecimiento}`}
                onClick={() => setModalLocal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-[#EFE7DE] text-xs font-semibold text-center text-[#2D1A1E]"
              >
                Perfil completo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
