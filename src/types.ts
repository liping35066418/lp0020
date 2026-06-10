export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[];
}

export interface PlayHistoryItem {
  id: string;
  trackId: string;
  playedAt: number;
  duration: number;
  track?: Track;
}

export type RepeatMode = 'off' | 'one' | 'all';
export type View = 'library' | 'playlists' | 'playlist-detail' | 'upload' | 'history';
export type SortMode = 'recent' | 'title' | 'duration';
