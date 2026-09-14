import React, { useState } from 'react';

export const CommentSection: React.FC<{ postId: string }> = () => {
  const [comment, setComment] = useState('');

  return (
    <div className="pt-3 border-t border-slate-800/80">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
        />
        <button className="bg-sky-600 px-3 py-2 rounded-xl text-xs font-bold text-white">Enviar</button>
      </div>
    </div>
  );
};
