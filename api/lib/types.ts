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

export interface PlayHistoryItem {
  id: string;
  trackId: string;
  playedAt: number;
  duration: number;
}
