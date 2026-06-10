import { v4 as uuidv4 } from 'uuid';
import type { Playlist, Track } from '../lib/types.js';
import { db } from '../lib/storage.js';
import logger from '../lib/logger.js';

export const playlistService = {
  getAll(): Playlist[] {
    return db.getPlaylists().sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getById(id: string): (Playlist & { tracks: Track[] }) | undefined {
    const playlist = db.getPlaylists().find((p) => p.id === id);
    if (!playlist) return undefined;
    const allTracks = db.getTracks();
    const tracks = playlist.trackIds
      .map((tid) => allTracks.find((t) => t.id === tid))
      .filter((t): t is Track => !!t);
    return { ...playlist, tracks };
  },

  create(name: string): Playlist {
    const now = Date.now();
    const playlist: Playlist = {
      id: uuidv4(),
      name: name.trim() || '新建歌单',
      trackIds: [],
      createdAt: now,
      updatedAt: now,
    };
    const playlists = db.getPlaylists();
    playlists.push(playlist);
    db.savePlaylists(playlists);
    logger.info(`Playlist created: ${playlist.name} (${playlist.id})`);
    return playlist;
  },

  rename(id: string, name: string): Playlist | undefined {
    const playlists = db.getPlaylists();
    const idx = playlists.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    playlists[idx].name = name.trim() || '未命名歌单';
    playlists[idx].updatedAt = Date.now();
    db.savePlaylists(playlists);
    logger.info(`Playlist renamed: ${playlists[idx].name} (${id})`);
    return playlists[idx];
  },

  delete(id: string): boolean {
    const playlists = db.getPlaylists();
    const idx = playlists.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    playlists.splice(idx, 1);
    db.savePlaylists(playlists);
    logger.info(`Playlist deleted: ${id}`);
    return true;
  },

  addTrack(playlistId: string, trackId: string): Playlist | undefined {
    const playlists = db.getPlaylists();
    const idx = playlists.findIndex((p) => p.id === playlistId);
    if (idx === -1) return undefined;
    if (!playlists[idx].trackIds.includes(trackId)) {
      playlists[idx].trackIds.push(trackId);
      playlists[idx].updatedAt = Date.now();
      db.savePlaylists(playlists);
    }
    return playlists[idx];
  },

  removeTrack(playlistId: string, trackId: string): Playlist | undefined {
    const playlists = db.getPlaylists();
    const idx = playlists.findIndex((p) => p.id === playlistId);
    if (idx === -1) return undefined;
    playlists[idx].trackIds = playlists[idx].trackIds.filter((tid) => tid !== trackId);
    playlists[idx].updatedAt = Date.now();
    db.savePlaylists(playlists);
    return playlists[idx];
  },
};
