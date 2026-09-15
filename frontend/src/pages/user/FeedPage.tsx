import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Publicacion } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { PostCard } from '../../components/social/PostCard';
import { useUI } from '../../hooks/useUI';
import { Button } from '../../components/common/Button';

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [publishing, setPublishing] = useState(false);
  const { showToast } = useUI();

  const load = async () => {
    try {
      const { data } = await api.get('/social/feed');
      setPosts(data.data);
    } catch {
      showToast('Error al cargar el feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publicar = async () => {
    if (!texto.trim()) return;
    setPublishing(true);
    try {
      await api.post('/social/publicaciones', { texto_contenido: texto, visibilidad: 'PUBLICA' });
      setTexto('');
      showToast('Publicación creada', 'success');
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al publicar', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Comunidad</h1>

      {/* Composer */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <textarea
          className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-slate-500"
          rows={3}
          placeholder="Comparte tu experiencia..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={publicar} loading={publishing} disabled={!texto.trim()}>
            Publicar
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">Sé el primero en compartir una experiencia.</p>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
};
