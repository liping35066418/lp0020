import { useEffect, useState } from 'react';
import { History, Play, Trash2, Clock, Disc, User } from 'lucide-react';
import { historyApi } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import type { PlayHistoryItem } from '../types';
import { formatDuration, formatDate } from '../lib/utils';

const HistoryPage = () => {
  const [list, setList] = useState<PlayHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, tracks } = usePlayerStore();

  const load = async () => {
    setLoading(true);
    try {
      const d = await historyApi.list();
      setList(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!confirm('确定清空全部播放历史？')) return;
    await historyApi.clear();
    setList([]);
  };

  const handleReplay = (item: PlayHistoryItem) => {
    if (!item.track) return;
    playTrack(item.track);
  };

  const groups = new Map<string, PlayHistoryItem[]>();
  list.forEach((item) => {
    const date = new Date(item.playedAt);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const label =
      new Date(key).toDateString() === new Date().toDateString()
        ? '今天'
        : new Date(new Date().setDate(new Date().getDate() - 1)).toDateString() === new Date(key).toDateString()
        ? '昨天'
        : key;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  });

  return (
    <div className="flex flex-col h-full slide-up">
      <div className="shrink-0 p-6 border-b flex items-end justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>最近</p>
          <h1 className="text-4xl font-bold gradient-text">播放历史</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>共 {list.length} 条播放记录</p>
        </div>
        {list.length > 0 && (
          <button className="btn btn-danger" onClick={handleClear}>
            <Trash2 className="w-4 h-4" /> 清空历史
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="empty-state"><p>加载中...</p></div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <History className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>暂无播放记录</p>
            <p className="text-sm">播放歌曲后会在这里显示</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(groups.entries()).map(([label, items]) => (
              <div key={label} className="fade-in">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {items.length} 首</span>
                </div>
                <div className="card divide-y overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                      onDoubleClick={() => handleReplay(item)}
                    >
                      <div className="w-11 h-11 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                        {item.track?.coverUrl ? (
                          <img src={item.track.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Disc className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.track?.title || '（曲目已删除）'}</p>
                          {item.track && (
                            <button
                              className="icon-btn opacity-0 hover:opacity-100 ml-auto transition-opacity"
                              style={{ width: 30, height: 30 }}
                              onClick={() => handleReplay(item)}
                            >
                              <Play className="w-4 h-4 fill-current" style={{ color: 'var(--accent)' }} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.track && (
                            <>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {item.track.artist}
                              </span>
                              <span className="flex items-center gap-1">
                                <Disc className="w-3 h-3" /> {item.track.album}
                              </span>
                            </>
                          )}
                          <span>{formatDate(item.playedAt)}</span>
                          <span>播放时长 {formatDuration(item.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
