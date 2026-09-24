import { shareLink } from "../../utils/share";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Users, Share2, ImagePlus, Video, X, MapPin } from "lucide-react";
import api from "../../services/api";
import { Publicacion } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { PostCard } from "../../components/social/PostCard";
import { StoryBar } from "../../components/social/StoryBar";
import { StoryViewer } from "../../components/social/StoryViewer";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/common/Button";
import { useUI } from "../../hooks/useUI";
import { useAuth } from "../../hooks/useAuth";
import { useStories } from "../../context/StoriesContext";

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [taggedName, setTaggedName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useUI();
  const { user } = useAuth();
  const { groups, markSeen } = useStories();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/social/feed");
      const list = data?.data ?? data ?? [];
      setPosts(Array.isArray(list) ? list : []);
    } catch {
      showToast("Error al cargar el feed", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const storyItems = groups.map((g) => ({
    id: g.userId,
    name: g.userName,
    avatar: g.avatar,
    seen: g.seen,
  }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Máximo 5 MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(String(reader.result));
      setMediaType("image");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showToast("Máximo 20 MB para videos", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(String(reader.result));
      setMediaType("video");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openCamera = () => {
    window.dispatchEvent(new CustomEvent("open-camera"));
  };

  const publicar = async () => {
    if (!texto.trim() && !mediaPreview) return;
    setPublishing(true);
    try {
      const body: Record<string, unknown> = {
        texto_contenido: texto.trim() || null,
        visibilidad: "PUBLICA",
      };
      if (mediaPreview) {
        body.url_media = mediaPreview;
        body.tipo_media = mediaType === "video" ? "VIDEO" : "IMAGEN";
      }
      if (taggedName.trim()) {
        body.etiqueta = taggedName.trim();
      }
      await api.post("/social/publicaciones", body);
      setTexto("");
      setMediaPreview(null);
      setMediaType(null);
      setTaggedName("");
      setShowTagInput(false);
      showToast("Publicación creada", "success");
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al publicar", "error");
    } finally {
      setPublishing(false);
    }
  };

  const sharePost = async (post: Publicacion) => {
    try {
      const msg = await shareLink(
        "Pasaporte NFC",
        post.texto_contenido || "Mi experiencia",
        `${location.origin}/post/${post.id}`,
      );
      if (msg) showToast(msg, "success");
    } catch {
      showToast("No se pudo compartir", "error");
    }
  };
  const likePost = async (id: string) => {
    try {
      await api.post("/social/interacciones", {
        publicacion_id: id,
        tipo: "REACCION",
      });
      await load();
    } catch {
      showToast("No se pudo registrar la reacción", "error");
    }
  };
  useEffect(() => {
    const refresh = () => {
      load();
    };
    window.addEventListener("feed-updated", refresh);
    return () => window.removeEventListener("feed-updated", refresh);
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Comunidad</h1>
        <span className="text-xs text-muted">{posts.length} posts</span>
      </div>

      <StoryBar
        stories={storyItems}
        onAdd={openCamera}
        onOpen={(id) => setViewerUserId(id)}
      />

      <div className="card space-y-3">
        <div className="flex gap-3">
          {user?.avatarUrl || user?.avatar_url ? (
            <img
              src={user.avatarUrl || user.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {(user?.nombres || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <textarea
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-slate-400 min-h-[64px]"
            placeholder="Comparte tu experiencia..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={500}
          />
        </div>

        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {mediaType === "video" ? (
              <video
                src={mediaPreview}
                controls
                playsInline
                className="w-full max-h-[300px] object-cover"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Vista previa"
                className="w-full max-h-[300px] object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setMediaPreview(null);
                setMediaType(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showTagInput && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
              placeholder="Etiqueta a alguien o un local..."
              value={taggedName}
              onChange={(e) => setTaggedName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setShowTagInput(false);
                setTaggedName("");
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleVideoSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-sky-500 hover:bg-sky-500/10 transition"
              title="Agregar imagen"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="p-2 rounded-lg text-sky-500 hover:bg-sky-500/10 transition"
              title="Agregar video"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowTagInput(!showTagInput)}
              className={`p-2 rounded-lg transition ${showTagInput ? "text-sky-500 bg-sky-500/10" : "text-sky-500 hover:bg-sky-500/10"}`}
              title="Etiquetar"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={publicar}
            loading={publishing}
            disabled={!texto.trim() && !mediaPreview}
          >
            Publicar
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin publicaciones"
          description="Sé el primero en compartir."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onLike={likePost}
              onShare={(post) => sharePost(post as Publicacion)}
            />
          ))}
        </div>
      )}

      {viewerUserId && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          startUserId={viewerUserId}
          onClose={() => setViewerUserId(null)}
          onSeen={markSeen}
        />
      )}
    </div>
  );
};
