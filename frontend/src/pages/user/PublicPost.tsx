import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { PostCard } from "../../components/social/PostCard";
import { shareLink } from "../../utils/share";
export const PublicPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/social/publicaciones/" + id)
      .then((r) => setPost(r.data.data))
      .catch(() => setError("La publicación no existe o dejó de ser pública"));
  }, [id]);
  return (
    <main className="max-w-xl mx-auto p-4 space-y-5">
      <Link to="/" className="text-sky-500 font-bold">
        Pasaporte NFC
      </Link>
      {error ? (
        <p role="alert">{error}</p>
      ) : post ? (
        <PostCard
          post={post}
          onShare={() => {
            shareLink(
              "Pasaporte NFC",
              post.texto_contenido || "",
              location.href,
            ).catch(() => {});
          }}
        />
      ) : (
        <p>Cargando publicación…</p>
      )}
      <Link to="/auth/login" className="block underline">
        Entrar a la comunidad
      </Link>
    </main>
  );
};
