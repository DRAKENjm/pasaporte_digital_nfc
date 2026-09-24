import React, { useState, useEffect } from "react";
import api from "../../services/api";
export const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
  const [comment, setComment] = useState(""),
    [items, setItems] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = () =>
    api
      .get(`/social/publicaciones/${postId}/comentarios`)
      .then((r) => setItems(r.data.data));
  useEffect(() => {
    load().catch(() => setError("No se pudieron cargar los comentarios"));
  }, [postId]);
  return (
    <section className="border-t p-3 space-y-3">
      <div className="max-h-64 overflow-y-auto space-y-2">
        {items.map((c) => (
          <p key={c.id} className="text-sm">
            <strong>{c.nombres}: </strong>
            {c.comentario}
          </p>
        ))}
      </div>
      <p role="alert" className="text-red-500 text-sm">
        {error}
      </p>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!comment.trim() || busy) return;
          setBusy(true);
          try {
            await api.post("/social/interacciones", {
              publicacion_id: postId,
              tipo: "COMENTARIO",
              comentario: comment.trim(),
            });
            setComment("");
            setError("");
            await load();
          } catch {
            setError("No se pudo enviar el comentario");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          className="input-base min-w-0"
          aria-label="Comentario"
          placeholder="Escribe un comentario…"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          required
        />
        <button disabled={busy} className="text-sky-500">
          Enviar
        </button>
      </form>
    </section>
  );
};
