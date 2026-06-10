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
  seekId: number;
  seekTargetTime: number | null;
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
  consumeSeekTarget: () => number | null;
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
  seekId: 0,
  seekTargetTime: null,

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
      if (get().isShuffle) {
        const others = all.filter((t) => t.id !== track.id);
        q = [track, ...shuffle(others)];
      } else {
        q = all;
      }
    }
    const idx = q.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      queue: q,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      currentTime: 0,
      seekId: get().seekId + 1,
      seekTargetTime: 0,
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
        seekId: get().seekId + 1,
        seekTargetTime: 0,
      });
    }
  },

  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (p) => set({ isPlaying: p }),

  next: async () => {
    const { queue, queueIndex, repeat, isShuffle, tracks, currentTrack } = get();
    if (queue.length === 0 || !currentTrack) return;

    if (repeat === 'one') {
      set({ currentTime: 0, isPlaying: true, seekId: get().seekId + 1, seekTargetTime: 0 });
      return;
    }

    let nextIdx = queueIndex + 1;
    let newQueue = queue;
    if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        if (isShuffle) {
          const others = tracks.filter((t) => t.id !== currentTrack.id);
          newQueue = [currentTrack, ...shuffle(others)];
        }
        nextIdx = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }
    const nextTrack = newQueue[nextIdx];
    set({ queue: newQueue, queueIndex: nextIdx, currentTrack: nextTrack, currentTime: 0, isPlaying: true, seekId: get().seekId + 1, seekTargetTime: 0 });
  },

  prev: async () => {
    const { queue, queueIndex, currentTime, currentTrack } = get();
    if (queue.length === 0 || !currentTrack) return;
    if (currentTime > 3) {
      set({ currentTime: 0, isPlaying: true, seekId: get().seekId + 1, seekTargetTime: 0 });
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      set({ queueIndex: prevIdx, currentTrack: prevTrack, currentTime: 0, isPlaying: true, seekId: get().seekId + 1, seekTargetTime: 0 });
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
  consumeSeekTarget: () => {
    const t = get().seekTargetTime;
    if (t !== null) {
      set({ seekTargetTime: null });
    }
    return t;
  },
  toggleShuffle: () => {
    const s = !get().isShuffle;
    const { currentTrack, tracks, queue, queueIndex } = get();
    let newQueue: Track[];
    let newIndex = queueIndex;

    if (s) {
      if (currentTrack) {
        const curInQueue = queue[queueIndex]?.id === currentTrack.id ? currentTrack : null;
        const base = curInQueue ? queue : tracks;
        const others = base.filter((t) => t.id !== currentTrack.id);
        newQueue = [currentTrack, ...shuffle(others)];
        newIndex = 0;
      } else {
        newQueue = shuffle(tracks);
        newIndex = 0;
      }
    } else {
      if (currentTrack) {
        newQueue = [...tracks];
        const idx = newQueue.findIndex((t) => t.id === currentTrack.id);
        newIndex = idx >= 0 ? idx : 0;
      } else {
        newQueue = [...tracks];
        newIndex = 0;
      }
    }
    set({ isShuffle: s, queue: newQueue, queueIndex: newIndex });
  },
  setSearchQuery: (q) => set({ searchQuery: q }),

  addTrackToLibrary: (t) => set({ tracks: [t, ...get().tracks] }),
  deleteTrack: async (id) => {
    await trackApi.delete(id);
    const { tracks, queue, currentTrack, queueIndex, isPlaying } = get();
    const newTracks = tracks.filter((t) => t.id !== id);
    const deletedIdx = queue.findIndex((t) => t.id === id);
    const newQueue = queue.filter((t) => t.id !== id);

    let newQueueIndex = queueIndex;
    if (deletedIdx !== -1) {
      if (deletedIdx < queueIndex) {
        newQueueIndex = queueIndex - 1;
      } else if (deletedIdx === queueIndex) {
        if (newQueueIndex >= newQueue.length) {
          newQueueIndex = Math.max(0, newQueue.length - 1);
        }
      }
    }
    if (newQueue.length === 0) {
      newQueueIndex = 0;
    } else {
      newQueueIndex = Math.min(newQueueIndex, newQueue.length - 1);
    }

    const isCurrentTrack = currentTrack?.id === id;
    const newCurrent = isCurrentTrack
      ? newQueue.length > 0 ? newQueue[newQueueIndex] : null
      : currentTrack;
    const newIsPlaying = isCurrentTrack ? false : isPlaying;
    const newSeekId = isCurrentTrack ? get().seekId + 1 : get().seekId;
    const newSeekTarget = isCurrentTrack ? 0 : null;

    set({
      tracks: newTracks,
      queue: newQueue,
      queueIndex: newQueueIndex,
      currentTrack: newCurrent,
      isPlaying: newIsPlaying,
      currentTime: isCurrentTrack ? 0 : get().currentTime,
      seekId: newSeekId,
      seekTargetTime: newSeekTarget,
    });
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
