import React from 'react';
import { PostCard } from '../../components/social/PostCard';
import { Post } from '../../types';

export const FeedPage: React.FC = () => {
  const demoPosts: Post[] = [
    {
      id: '1',
      userId: 'u1',
      userName: 'Café de Especialidad',
      content: '¡Nuevo sello desbloqueado! Disfruta nuestro café filtrado de origen.',
      mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      mediaType: 'image',
      likesCount: 24,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'u2',
      userName: 'Burger Bar 90s',
      content: 'Momentos únicos sellando el pasaporte con la promo 2x1.',
      mediaUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      mediaType: 'image',
      likesCount: 42,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Comunidad</h2>
        <p className="text-xs text-slate-400">Descubre los momentos compartidos en cada visita</p>
      </div>
      {demoPosts.map((post) => (
        <PostCard key={post.id} post={post} onLike={() => {}} />
      ))}
    </div>
  );
};
