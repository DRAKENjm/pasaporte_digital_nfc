import React, { useState } from "react";
import { CommentSection } from "./CommentSection";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Publicacion, Post } from "../../types";
import { formatDate } from "../../utils/formatters";

type AnyPost = Post | Publicacion;

interface Props {
  post: AnyPost;
  onLike?: (id: string) => void;
  onShare?: (post: AnyPost) => void;
}

function isLegacyPost(p: AnyPost): p is Post {
  return "userName" in p || "mediaUrl" in p;
}

export const PostCard: React.FC<Props> = ({ post, onLike, onShare }) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const userName = isLegacyPost(post)
    ? post.userName
    : post.autor_username ||
      [post.autor_nombres, post.autor_apellidos].filter(Boolean).join(" ") ||
      "Usuario";

  const content = isLegacyPost(post)
    ? post.content
    : post.texto_contenido || "";
  const mediaUrl = isLegacyPost(post) ? post.mediaUrl : post.url_media;
  const mediaType = isLegacyPost(post)
    ? post.mediaType
    : post.tipo_media === "VIDEO" || post.tipo_media === "video"
      ? "video"
      : "image";
  const thumbnail = isLegacyPost(post) ? post.thumbnailUrl : post.url_thumbnail;
  const createdAt = isLegacyPost(post) ? post.createdAt : post.created_at;
  const likes = isLegacyPost(post)
    ? (post.likesCount ?? 0)
    : (post.likes_count ?? 0);
  const hasLiked = isLegacyPost(post) ? !!post.hasLiked : !!post.has_liked;
  const localName = !isLegacyPost(post)
    ? post.establecimiento_nombre
    : undefined;
  const avatar = !isLegacyPost(post) ? post.autor_avatar : undefined;
  const id = post.id;

  return (
    <article
      id={`post-${post.id}`}
      className="card !p-0 overflow-hidden animate-fadeIn"
    >
      <div className="p-3.5 flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm truncate">{userName}</h4>
          <p className="text-[11px] text-muted">
            {createdAt ? formatDate(createdAt) : ""}
            {localName ? ` · ${localName}` : ""}
          </p>
        </div>
      </div>

      {mediaUrl && (
        <div className="relative aspect-[4/5] max-h-[440px] w-full bg-black">
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              poster={thumbnail}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="p-3.5">
        {content && <p className="text-sm leading-relaxed mb-3">{content}</p>}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Me gusta"
            disabled={!onLike}
            onClick={() => onLike?.(id)}
            className={`flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-semibold transition ${
              hasLiked
                ? "text-rose-500"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? "fill-rose-500" : ""}`} />
            {likes > 0 ? likes : ""}
          </button>
          <button
            type="button"
            aria-label="Comentarios"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-semibold text-slate-500"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onShare?.(post)}
            className="flex items-center gap-1.5 min-h-[40px] px-2 rounded-xl text-xs font-semibold text-slate-500 ml-auto"
          >
            <Share2 className="w-5 h-5" />
            Compartir
          </button>
        </div>
      </div>
      {commentsOpen && <CommentSection postId={id} />}
    </article>
  );
};
