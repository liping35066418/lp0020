import type { Track, Playlist, PlaylistDetail, PlayHistoryItem } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || '请求失败');
  }
  return res.json();
}

export const trackApi = {
  list: () => request<Track[]>('/tracks'),
  get: (id: string) => request<Track>(`/tracks/${id}`),
  streamUrl: (id: string) => `${API_BASE}/tracks/${id}/stream`,
  delete: (id: string) => request<{ success: boolean }>(`/tracks/${id}`, { method: 'DELETE' }),
  upload: async (file: File, onProgress?: (p: number) => void): Promise<Track> => {
    const form = new FormData();
    form.append('audio', file);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/tracks/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) resolve(data.track);
          else reject(new Error(data.error || '上传失败'));
        } catch {
          reject(new Error('解析响应失败'));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(form);
    });
  },
};

export const playlistApi = {
  list: () => request<Playlist[]>('/playlists'),
  get: (id: string) => request<PlaylistDetail>(`/playlists/${id}`),
  create: (name: string) => request<{ success: boolean; playlist: Playlist }>('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  rename: (id: string, name: string) => request<{ success: boolean; playlist: Playlist }>(`/playlists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  delete: (id: string) => request<{ success: boolean }>(`/playlists/${id}`, { method: 'DELETE' }),
  addTrack: (playlistId: string, trackId: string) =>
    request<{ success: boolean; playlist: Playlist }>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    }),
  removeTrack: (playlistId: string, trackId: string) =>
    request<{ success: boolean; playlist: Playlist }>(`/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    }),
};

export const historyApi = {
  list: () => request<PlayHistoryItem[]>('/history'),
  add: (trackId: string, duration: number) =>
    request<{ success: boolean; item: PlayHistoryItem }>('/history', {
      method: 'POST',
      body: JSON.stringify({ trackId, duration }),
    }),
  clear: () => request<{ success: boolean }>('/history', { method: 'DELETE' }),
};
