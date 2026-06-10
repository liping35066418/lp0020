import { useState, useEffect } from 'react';
import { ListMusic, Plus, MoreHorizontal, Pencil, Trash2, Play, Music } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { playlistApi, trackApi } from '../services/api';
import type { Playlist, Track } from '../types';

const PlaylistsPage = () => {
  const { playlists, loadPlaylists, createPlaylist, renamePlaylist, deletePlaylist, setView, playTrack } = usePlayerStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    const load = async () => {
      const map: Record<string, string> = {};
      for (const p of playlists) {
        if (p.trackIds.length > 0) {
          try {
            const detail = await playlistApi.get(p.id);
            const trackWithCover = detail.tracks.find((t: Track) => t.coverUrl);
            if (trackWithCover?.coverUrl) map[p.id] = trackWithCover.coverUrl;
          } catch {}
        }
      }
      setCovers(map);
    };
    load();
  }, [playlists]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const pl = await createPlaylist(newName.trim());
    setView('playlist-detail', pl.id);
    setNewName('');
    setCreating(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renamePlaylist(id, editName.trim());
    setEditingId(null);
  };

  const handlePlayPlaylist = async (p: Playlist) => {
    try {
      const detail = await playlistApi.get(p.id);
      if (detail.tracks.length > 0) {
        playTrack(detail.tracks[0], detail.tracks);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col h-full slide-up">
      <div className="shrink-0 p-6 border-b flex items-end justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>收藏</p>
          <h1 className="text-4xl font-bold gradient-text">我的歌单</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>共 {playlists.length} 个歌单</p>
        </div>
        <button className="btn-primary btn" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> 新建歌单
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {creating && (
          <div className="card p-5 mb-5 fade-in">
            <p className="text-sm font-medium mb-3">新建歌单</p>
            <div className="flex gap-3">
              <input
                autoFocus
                className="input flex-1"
                placeholder="输入歌单名称..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button className="btn-primary btn" onClick={handleCreate}>创建</button>
              <button className="btn" onClick={() => { setCreating(false); setNewName(''); }}>取消</button>
            </div>
          </div>
        )}

        {playlists.length === 0 && !creating && (
          <div className="empty-state">
            <ListMusic className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>还没有歌单</p>
            <p className="text-sm mb-4">创建歌单，整理你的音乐收藏</p>
            <button className="btn-primary btn" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" /> 新建歌单
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {playlists.map((p) => (
            <div
              key={p.id}
              className="card p-4 glow-hover cursor-pointer fade-in relative"
              onMouseEnter={() => {}}
              onMouseLeave={() => setMenuOpen(null)}
            >
              <div
                className="aspect-square rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'var(--bg-tertiary)' }}
                onClick={() => setView('playlist-detail', p.id)}
              >
                {covers[p.id] ? (
                  <img src={covers[p.id]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                    <ListMusic className="w-10 h-10" />
                  </div>
                )}
                <button
                  className="absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center opacity-0 translate-y-2 transition-all duration-200 shadow-xl hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', color: 'var(--bg-primary)' }}
                  onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(p); }}
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
                <style>{`
                  .card:hover button { opacity: 1 !important; transform: translateY(0) !important; }
                `}</style>
              </div>

              {editingId === p.id ? (
                <input
                  autoFocus
                  className="input mb-1 !py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(p.id)}
                  onBlur={() => setEditingId(null)}
                />
              ) : (
                <p
                  className="font-semibold truncate mb-1"
                  onClick={() => setView('playlist-detail', p.id)}
                >
                  {p.name}
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {p.trackIds.length} 首歌曲
              </p>

              <div className="absolute top-3 right-3">
                <button
                  className="icon-btn rounded-full"
                  style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen === p.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-30 card p-1.5 w-36 slide-up shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-white/5"
                      onClick={() => { setEditingId(p.id); setEditName(p.name); setMenuOpen(null); }}
                    >
                      <Pencil className="w-4 h-4" /> 重命名
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-red-500/10"
                      style={{ color: '#f87171' }}
                      onClick={() => {
                        if (confirm(`确定删除歌单「${p.name}」？`)) {
                          deletePlaylist(p.id);
                        }
                        setMenuOpen(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> 删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistsPage;
