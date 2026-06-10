import { usePlayerStore } from '../store/playerStore';
import { Music2, ListMusic, Upload, History, Disc3 } from 'lucide-react';

const Sidebar = () => {
  const { view, setView, playlists } = usePlayerStore();

  const navItems = [
    { id: 'library' as const, label: '音乐库', icon: Music2 },
    { id: 'playlists' as const, label: '歌单', icon: ListMusic },
    { id: 'upload' as const, label: '上传', icon: Upload },
    { id: 'history' as const, label: '播放历史', icon: History },
  ];

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col border-r" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
            <Disc3 className="w-5 h-5 text-[var(--bg-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">SonicFlow</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>本地音乐播放器</p>
          </div>
        </div>
      </div>

      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`sidebar-link relative ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            我的歌单
          </p>
          <div className="space-y-1">
            {playlists.length === 0 && (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>暂无歌单</p>
            )}
            {playlists.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className={`sidebar-link relative ${view === 'playlist-detail' && usePlayerStore.getState().activePlaylistId === p.id ? 'active' : ''}`}
                onClick={() => setView('playlist-detail', p.id)}
              >
                <ListMusic className="w-4 h-4 shrink-0" />
                <span className="truncate text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <p>端口: 8620</p>
      </div>
    </aside>
  );
};

export default Sidebar;
