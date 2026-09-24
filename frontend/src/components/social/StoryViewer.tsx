import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { StoryGroup } from "../../context/StoriesContext";
import { useAuth } from "../../hooks/useAuth";
import { useStories } from "../../context/StoriesContext";

export const StoryViewer: React.FC<{
  groups: StoryGroup[];
  startUserId: string;
  onClose: () => void;
  onSeen: (id: string) => void;
}> = ({ groups, startUserId, onClose, onSeen }) => {
  const [gid, setGid] = useState(startUserId);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { deleteStory } = useStories();
  const close = useRef(onClose);
  close.current = onClose;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const gi = groups.findIndex((g) => g.userId === gid);
  const group = groups[gi];
  const slide = group?.slides[idx];

  const goNext = useCallback(() => {
    if (!group) return;
    if (idx < group.slides.length - 1) {
      setIdx(idx + 1);
    } else if (gi < groups.length - 1) {
      setGid(groups[gi + 1].userId);
      setIdx(0);
    } else {
      close.current();
    }
  }, [group, idx, gi, groups]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      setIdx(idx - 1);
    } else if (gi > 0) {
      setGid(groups[gi - 1].userId);
      setIdx(0);
    }
  }, [idx, gi, groups]);

  useEffect(() => {
    if (!slide) {
      close.current();
      return;
    }
    onSeen(gid);
    if (paused || busy || slide.mediaType === "video") return;
    const t = setTimeout(goNext, 5000);
    return () => clearTimeout(t);
  }, [slide?.id, paused, busy, gid, idx, goNext, onSeen]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    touchStart.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 300) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else goNext();
  };

  if (!group || !slide) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Historia"
      className="fixed inset-0 z-[75] bg-black flex justify-center text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full max-w-lg h-dvh flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 p-2 pt-3">
          {group.slides.map((s, i) => (
            <div
              key={s.id}
              className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/30"
            >
              <div
                className={`h-full bg-white rounded-full transition-all duration-300 ${
                  i < idx
                    ? "w-full"
                    : i === idx
                      ? "w-full animate-progress"
                      : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="flex gap-3 items-center px-4 py-2">
          {group.avatar ? (
            <img
              src={group.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-white/30">
              {group.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <strong className="flex-1 truncate text-sm">{group.userName}</strong>
          {group.userId === user?.id && (
            <button
              aria-label="Eliminar historia"
              disabled={busy}
              onClick={async () => {
                setPaused(true);
                if (!confirm("¿Eliminar esta historia?")) {
                  setPaused(false);
                  return;
                }
                setBusy(true);
                try {
                  await deleteStory(slide.id);
                  close.current();
                } catch {
                  setError("No se pudo eliminar. Intenta nuevamente.");
                } finally {
                  setBusy(false);
                }
              }}
              className="p-2 rounded-full hover:bg-white/10 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Media - tap zones */}
        <div
          className="flex-1 min-h-0 relative"
          onClick={handleTap}
          onDoubleClick={() => setPaused(!paused)}
        >
          {slide.mediaType === "video" ? (
            <video
              src={slide.mediaUrl}
              controls={false}
              playsInline
              autoPlay
              onEnded={goNext}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={slide.mediaUrl}
              alt={slide.caption || "Historia"}
              className="w-full h-full object-contain"
            />
          )}
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-300 text-center text-sm px-4">
            {error}
          </p>
        )}

        {slide.caption && (
          <p className="px-4 py-2 text-sm text-center bg-gradient-to-t from-black/60 to-transparent">
            {slide.caption}
          </p>
        )}
      </div>
    </div>
  );
};
