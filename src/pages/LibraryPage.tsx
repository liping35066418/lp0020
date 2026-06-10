import { useMemo, useEffect } from 'react';
import { Search, Music2, Play, Shuffle, ChevronDown } from 'lucide-react';
import TrackList from '../components/TrackList';
import { usePlayerStore } from '../store/playerStore';
import type { SortMode } from '../types';

const sortLabels: Record<SortMode, string> = {
  recent: '最近添加',
  title: '标题 A-Z',
  duration: '时长长短',
};

const LibraryPage = () => {
  const {
    tracks,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    playTrack,
    toggleShuffle,
    isShuffle,
    syncQueueWithList,
    currentTrack,
  } = usePlayerStore();

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = tracks;
    if (q) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sortMode) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
      case 'duration':
        sorted.sort((a, b) => b.duration - a.duration);
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    return sorted;
  }, [tracks, searchQuery, sortMode]);

  useEffect(() => {
    syncQueueWithList(filteredSorted);
  }, [filteredSorted, syncQueueWithList]);

  const totalDuration = filteredSorted.reduce((s, t) => s + (t.duration || 0), 0);
  const hrs = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="flex flex-col h-full slide-up">
      <div className="shrink-0 p-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-end justify-between gap-6 mb-5">
          <div className="flex items-center gap-5">
            <div className="w-32 h-32 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(99,102,241,0.25))',
              border: '1px solid var(--border)',
            }}>
              <Music2 className="w-16 h-16" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>音乐库</p>
              <h1 className="text-4xl font-bold mb-2 gradient-text">全部曲目</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {tracks.length} 首歌曲{tracks.length > 0 && ` · ${hrs ? hrs + '小时 ' : ''}${mins}分钟`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn" onClick={toggleShuffle}>
              <Shuffle className={`w-4 h-4 ${isShuffle ? 'text-[var(--accent)]' : ''}`} />
              随机
            </button>
            <button
              className="btn-primary btn"
              disabled={filteredSorted.length === 0}
              onClick={() => playTrack(filteredSorted[0], filteredSorted)}
            >
              <Play className="w-4 h-4 fill-current" />
              播放全部
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input pl-10"
              placeholder="搜索歌曲、艺术家、专辑..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="input pr-8 appearance-none cursor-pointer"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="recent">最近添加</option>
              <option value="title">标题 A-Z</option>
              <option value="duration">时长长短</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TrackList tracks={filteredSorted} />
      </div>
    </div>
  );
};

export default LibraryPage;
