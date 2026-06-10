import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import LibraryPage from './pages/LibraryPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import UploadPage from './pages/UploadPage';
import HistoryPage from './pages/HistoryPage';
import { usePlayerStore } from './store/playerStore';

export default function App() {
  const { view, loadTracks, loadPlaylists } = usePlayerStore();

  useEffect(() => {
    loadTracks();
    loadPlaylists();
  }, [loadTracks, loadPlaylists]);

  const renderView = () => {
    switch (view) {
      case 'library':
      default:
        return <LibraryPage />;
      case 'playlists':
        return <PlaylistsPage />;
      case 'playlist-detail':
        return <PlaylistDetailPage />;
      case 'upload':
        return <UploadPage />;
      case 'history':
        return <HistoryPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{
      background: `
        radial-gradient(ellipse at top left, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
        var(--bg-primary)
      `
    }}>
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {renderView()}
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
