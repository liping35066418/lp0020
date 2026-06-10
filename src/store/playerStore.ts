import { create } from 'zustand';
import type { Track, Playlist, RepeatMode, View } from '../types';
import { trackApi, playlistApi, historyApi } from '../services/api';

interface PlayerState {
  view: View;
  activePlaylistId: string | null;
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeat: RepeatMode;
  isShuffle: boolean;
  searchQuery: string;
  loading: boolean;
  setView: (v: View, playlistId?: string) => void;
  loadTracks: () => Promise<void>;
  loadPlaylists: () => Promise<void>;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  playIndex: (index: number) => Promise<void>;
  togglePlay: () => void;
  setPlaying: (p: boolean) => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setProgress: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setSearchQuery: (q: string) => void;
  addTrackToLibrary: (t: Track) => void;
  deleteTrack: (id: string) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  recordHistory: (trackId: string, duration: number) => Promise<void>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  view: 'library',
  activePlaylistId: null,
  tracks: [],
  playlists: [],
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  repeat: 'off',
  isShuffle: false,
  searchQuery: '',
  loading: false,

  setView: (v, playlistId) => set({ view: v, activePlaylistId: playlistId ?? null }),

  loadTracks: async () => {
    set({ loading: true });
    try {
      const tracks = await trackApi.list();
      set({ tracks });
    } finally {
      set({ loading: false });
    }
  },

  loadPlaylists: async () => {
    try {
      const playlists = await playlistApi.list();
      set({ playlists });
    } catch {}
  },

  playTrack: async (track, queue) => {
    let q = queue;
    if (!q) {
      const all = get().tracks;
      q = get().isShuffle ? shuffle(all) : all;
    }
    const idx = q.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      queue: q,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      currentTime: 0,
    });
  },

  playIndex: async (idx) => {
    const q = get().queue;
    if (q.length === 0) return;
    const realIdx = ((idx % q.length) + q.length) % q.length;
    const t = q[realIdx];
    if (t) {
      set({
        currentTrack: t,
        queueIndex: realIdx,
        isPlaying: true,
        currentTime: 0,
      });
    }
  },

  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (p) => set({ isPlaying: p }),

  next: async () => {
    const { queue, queueIndex, repeat, isShuffle, currentTrack, tracks } = get();
    if (repeat === 'one') {
      set({ currentTime: 0 });
      return;
    }
    let nextIdx = queueIndex + 1;
    let newQueue = queue;
    if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        nextIdx = 0;
        if (isShuffle) {
          newQueue = shuffle(tracks);
          nextIdx = 0;
        }
      } else {
        set({ isPlaying: false });
        return;
      }
    }
    const nextTrack = newQueue[nextIdx];
    set({ queue: newQueue, queueIndex: nextIdx, currentTrack: nextTrack, currentTime: 0, isPlaying: true });
  },

  prev: async () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      set({ queueIndex: prevIdx, currentTrack: prevTrack, currentTime: 0, isPlaying: true });
    }
  },

  setProgress: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), isMuted: v === 0 }),
  toggleMute: () => set({ isMuted: !get().isMuted }),
  toggleRepeat: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const cur = modes.indexOf(get().repeat);
    set({ repeat: modes[(cur + 1) % modes.length] });
  },
  toggleShuffle: () => {
    const s = !get().isShuffle;
    set({
      isShuffle: s,
      queue: s ? shuffle(get().tracks) : [...get().tracks],
    });
  },
  setSearchQuery: (q) => set({ searchQuery: q }),

  addTrackToLibrary: (t) => set({ tracks: [t, ...get().tracks] }),
  deleteTrack: async (id) => {
    await trackApi.delete(id);
    const { tracks, queue, currentTrack } = get();
    const newTracks = tracks.filter((t) => t.id !== id);
    const newQueue = queue.filter((t) => t.id !== id);
    const newCurrent = currentTrack?.id === id ? null : currentTrack;
    set({ tracks: newTracks, queue: newQueue, currentTrack: newCurrent });
  },

  createPlaylist: async (name) => {
    const res = await playlistApi.create(name);
    await get().loadPlaylists();
    return res.playlist;
  },
  renamePlaylist: async (id, name) => {
    await playlistApi.rename(id, name);
    await get().loadPlaylists();
  },
  deletePlaylist: async (id) => {
    await playlistApi.delete(id);
    await get().loadPlaylists();
  },
  addToPlaylist: async (pid, tid) => {
    await playlistApi.addTrack(pid, tid);
    await get().loadPlaylists();
  },
  removeFromPlaylist: async (pid, tid) => {
    await playlistApi.removeTrack(pid, tid);
    await get().loadPlaylists();
  },

  recordHistory: async (trackId, duration) => {
    try {
      await historyApi.add(trackId, duration);
    } catch {}
  },
}));
