import React from 'react';
import { Post } from '../../types';
import { formatDate } from '../../utils/formatters';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-4 shadow-lg">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-white">
          {post.userName.charAt(0)}
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm">{post.userName}</h4>
          <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      <div className="relative aspect-[9/16] max-h-[480px] w-full bg-black flex items-center justify-center">
        {post.mediaType === 'video' ? (
          <video
            src={post.mediaUrl}
            poster={post.thumbnailUrl}
            controls
            playsInline
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={post.mediaUrl} alt={post.content} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-4">
        <p className="text-sm text-slate-300 mb-3">{post.content}</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 font-bold transition ${
              post.hasLiked ? 'text-rose-500' : 'hover:text-white'
            }`}
          >
            ❤️ {post.likesCount} Likes
          </button>
          <span>💬 Comentarios</span>
        </div>
      </div>
    </div>
  );
};
