import { useEffect, useState } from 'react';
import { ArrowLeft, ListMusic, Play, Shuffle, Pencil, Trash2, Download } from 'lucide-react';
import TrackList from '../components/TrackList';
import { usePlayerStore } from '../store/playerStore';
import { playlistApi } from '../services/api';
import type { PlaylistDetail } from '../types';

const PlaylistDetailPage = () => {
  const { activePlaylistId, setView, playTrack, renamePlaylist, deletePlaylist, toggleShuffle, isShuffle, loadPlaylists } = usePlayerStore();
  const [detail, setDetail] = useState<PlaylistDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activePlaylistId) return;
    setLoading(true);
    try {
      const d = await playlistApi.get(activePlaylistId);
      setDetail(d);
      setEditName(d.name);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activePlaylistId]);

  if (!activePlaylistId) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <p>未选择歌单</p>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <p>加载中...</p>
      </div>
    );
  }

  const coverUrl = detail.tracks.find((t) => t.coverUrl)?.coverUrl;
  const totalDuration = detail.tracks.reduce((s, t) => s + (t.duration || 0), 0);
  const hrs = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);

  const handleRename = async () => {
    if (!editName.trim()) return;
    await renamePlaylist(detail.id, editName.trim());
    setDetail({ ...detail, name: editName.trim() });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`确定删除歌单「${detail.name}」？`)) {
      await deletePlaylist(detail.id);
      setView('playlists');
    }
  };

  return (
    <div className="flex flex-col h-full slide-up">
      <div className="shrink-0 p-6 border-b relative" style={{ borderColor: 'var(--border)' }}>
        <button
          className="icon-btn absolute top-5 left-5"
          onClick={() => setView('playlists')}
          style={{ width: 32, height: 32 }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-end justify-between gap-6 mb-5 ml-10">
          <div className="flex items-center gap-5">
            <div className="w-40 h-40 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ListMusic className="w-16 h-16" style={{ color: 'var(--accent)' }} />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>歌单</p>
              {editing ? (
                <input
                  autoFocus
                  className="input !text-4xl !font-bold !px-0 !py-1 !bg-transparent !border-transparent focus:!border-b focus:!rounded-none !shadow-none focus:!shadow-none !w-auto max-w-md"
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  onBlur={handleRename}
                />
              ) : (
                <h1 className="text-4xl font-bold mb-2 cursor-pointer" onClick={() => setEditing(true)}>
                  {detail.name}
                </h1>
              )}
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {detail.tracks.length} 首歌曲
                {detail.tracks.length > 0 && ` · ${hrs ? hrs + '小时 ' : ''}${mins}分钟`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn" onClick={handleDelete} title="删除歌单">
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="btn" onClick={() => setEditing(true)} title="重命名">
              <Pencil className="w-4 h-4" />
            </button>
            <button className="btn" onClick={toggleShuffle}>
              <Shuffle className={`w-4 h-4 ${isShuffle ? 'text-[var(--accent)]' : ''}`} />
              随机
            </button>
            <button
              className="btn-primary btn"
              disabled={detail.tracks.length === 0}
              onClick={() => playTrack(detail.tracks[0], detail.tracks)}
            >
              <Play className="w-4 h-4 fill-current" />
              播放
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {detail.tracks.length === 0 ? (
          <div className="empty-state h-full">
            <Download className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>歌单是空的</p>
            <p className="text-sm">从音乐库添加喜欢的曲目进来吧</p>
          </div>
        ) : (
          <TrackList tracks={detail.tracks} showRemoveFromPlaylist={detail.id} />
        )}
      </div>
    </div>
  );
};

export default PlaylistDetailPage;
