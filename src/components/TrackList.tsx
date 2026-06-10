import { useState } from 'react';
import { Music2, Play, Clock, MoreHorizontal, Plus, Trash2, User, Disc } from 'lucide-react';
import type { Track } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { formatDuration, formatFileSize } from '../lib/utils';

interface TrackListProps {
  tracks: Track[];
  showRemoveFromPlaylist?: string;
}

const TrackList = ({ tracks, showRemoveFromPlaylist }: TrackListProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [playlistMenu, setPlaylistMenu] = useState<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    playTrack,
    deleteTrack,
    playlists,
    addToPlaylist,
    removeFromPlaylist,
  } = usePlayerStore();

  const handlePlay = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playTrack(track, tracks);
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[40px_1fr_1.5fr_1fr_80px_100px] items-center gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        <div className="text-center">#</div>
        <div>标题</div>
        <div>专辑</div>
        <div>艺术家</div>
        <div className="text-right"><Clock className="w-4 h-4 inline" /></div>
        <div className="text-right pr-2">大小</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 && (
          <div className="empty-state">
            <Music2 className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>暂无曲目</p>
            <p className="text-sm">前往「上传」面板添加本地音频文件</p>
          </div>
        )}
        {tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isHovered = hoveredId === track.id;
          return (
            <div
              key={track.id}
              className={`track-row fade-in ${isCurrent ? 'playing' : ''}`}
              onMouseEnter={() => setHoveredId(track.id)}
              onMouseLeave={() => { setHoveredId(null); setMenuOpen(null); setPlaylistMenu(null); }}
              onDoubleClick={() => handlePlay(track)}
            >
              <div className="text-center text-sm flex items-center justify-center h-5" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}>
                {isCurrent && isPlaying ? (
                  <div className="flex items-end h-4 gap-0.5">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                ) : isHovered ? (
                  <Play className="w-4 h-4 fill-current" style={{ color: 'var(--accent)' }} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Disc className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {track.title}
                  </p>
                </div>
              </div>

              <div className="text-sm truncate flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Disc className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate">{track.album}</span>
              </div>

              <div className="text-sm truncate flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <User className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate">{track.artist}</span>
              </div>

              <div className="text-sm text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {formatDuration(track.duration)}
              </div>

              <div className="flex items-center justify-end gap-1 relative">
                <span className="text-xs mr-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatFileSize(track.fileSize)}
                </span>

                {showRemoveFromPlaylist ? (
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30 }}
                    onClick={(e) => { e.stopPropagation(); removeFromPlaylist(showRemoveFromPlaylist, track.id); }}
                    title="从歌单移除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      className="icon-btn"
                      style={{ width: 30, height: 30 }}
                      onClick={(e) => { e.stopPropagation(); setPlaylistMenu(playlistMenu === track.id ? null : track.id); }}
                      title="添加到歌单"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {playlistMenu === track.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 card p-2 w-48 slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {playlists.length === 0 ? (
                          <p className="text-xs px-2 py-2" style={{ color: 'var(--text-muted)' }}>暂无歌单，先创建一个</p>
                        ) : (
                          playlists.map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-white/5"
                              onClick={() => { addToPlaylist(p.id, track.id); setPlaylistMenu(null); }}
                            >
                              {p.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <button
                      className="icon-btn"
                      style={{ width: 30, height: 30 }}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === track.id ? null : track.id); }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen === track.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 card p-1.5 w-36 slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-white/5"
                          style={{ color: '#f87171' }}
                          onClick={() => { if (confirm('确定删除此曲目？')) deleteTrack(track.id); setMenuOpen(null); }}
                        >
                          <Trash2 className="w-4 h-4" /> 删除
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackList;
