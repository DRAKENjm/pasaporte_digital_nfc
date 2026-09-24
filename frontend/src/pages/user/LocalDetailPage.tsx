import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, Phone } from "lucide-react";
import api from "../../services/api";
import { Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { useUI } from "../../hooks/useUI";

export const LocalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [local, setLocal] = useState<Establecimiento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/establishments/${id}`);
        setLocal(data?.data ?? data);
      } catch {
        // fallback: list and find
        try {
          const { data } = await api.get("/establishments");
          const list = data?.data ?? data ?? [];
          const found = Array.isArray(list)
            ? list.find((x: Establecimiento) => x.id === id)
            : null;
          setLocal(found || null);
        } catch {
          showToast("No se pudo cargar el local", "error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, showToast]);

  const openMaps = () => {
    if (!local) return;
    const q = encodeURIComponent(
      local.direccion || local.razon_social || local.nombre || "",
    );
    const url =
      local.lat != null && local.lng != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!local) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-sm">Local no encontrado</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </div>
    );
  }

  const nombre = local.razon_social || local.nombre || "Local";
  const images = local.imagenes?.length
    ? local.imagenes
    : local.imagen_url
      ? [local.imagen_url]
      : [];

  return (
    <div className="space-y-4 max-w-lg mx-auto animate-fadeIn -mt-1">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-sky-500"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Galería */}
      <div className="rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-[16/10]">
        {images[0] ? (
          <img
            src={images[0]}
            alt={nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-slate-400" />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(1).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
          ))}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold">{nombre}</h1>
        {local.categoria_nombre && (
          <p className="text-sm text-sky-500 mt-0.5">
            {local.categoria_nombre}
          </p>
        )}
        {local.descripcion && (
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {local.descripcion}
          </p>
        )}
      </div>

      <div className="card space-y-3">
        {local.direccion && (
          <div className="flex gap-3 items-start">
            <MapPin className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
            <p className="text-sm">{local.direccion}</p>
          </div>
        )}
        {local.horario && (
          <div className="flex gap-3 items-start">
            <Clock className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
            <p className="text-sm">{local.horario}</p>
          </div>
        )}
        {local.telefono && (
          <div className="flex gap-3 items-start">
            <Phone className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
            <a href={`tel:${local.telefono}`} className="text-sm text-sky-500">
              {local.telefono}
            </a>
          </div>
        )}
      </div>

      {/* Mapa embebido simple */}
      <div className="card !p-0 overflow-hidden">
        <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative">
          {local.lat != null && local.lng != null ? (
            <iframe
              title="Mapa"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${local.lat},${local.lng}&z=15&output=embed`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted text-sm p-4 text-center">
              <MapPin className="w-8 h-8 opacity-40" />
              <p>Mapa disponible cuando el local tenga coordenadas</p>
              {local.direccion && (
                <p className="text-xs">Usa “Cómo llegar” con la dirección</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Button fullWidth size="lg" onClick={openMaps}>
        <Navigation className="w-4 h-4" />
        Cómo llegar
      </Button>
    </div>
  );
};
