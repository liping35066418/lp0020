import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import type { Track } from '../lib/types.js';
import { db, getPaths } from '../lib/storage.js';
import logger from '../lib/logger.js';

const { AUDIO_DIR } = getPaths();

export const trackService = {
  getAll(): Track[] {
    return db.getTracks().sort((a, b) => b.createdAt - a.createdAt);
  },

  getById(id: string): Track | undefined {
    return db.getTracks().find((t) => t.id === id);
  },

  async createFromFile(
    filePath: string,
    originalName: string,
    mimeType: string
  ): Promise<Track | null> {
    try {
      const stats = fs.statSync(filePath);
      const id = uuidv4();
      const ext = path.extname(originalName).toLowerCase();
      const storedName = `${id}${ext}`;
      const storedPath = path.join(AUDIO_DIR, storedName);

      fs.copyFileSync(filePath, storedPath);

      let title = path.basename(originalName, ext);
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';
      let duration = 0;
      let coverUrl: string | undefined;

      try {
        const metadata = await parseFile(storedPath);
        title = metadata.common.title || title;
        artist = metadata.common.artist || artist;
        album = metadata.common.album || album;
        duration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0];
          const coverExt = pic.format.includes('png') ? 'png' : 'jpg';
          const coverName = `${id}-cover.${coverExt}`;
          const coverPath = path.join(AUDIO_DIR, coverName);
          fs.writeFileSync(coverPath, pic.data);
          coverUrl = `/storage/audio/${coverName}`;
        }
      } catch (metaErr) {
        logger.warn(`Metadata parse failed for ${originalName}:`, metaErr as Error);
      }

      const track: Track = {
        id,
        title,
        artist,
        album,
        duration,
        coverUrl,
        filePath: storedPath,
        fileName: storedName,
        fileSize: stats.size,
        mimeType,
        createdAt: Date.now(),
      };

      const tracks = db.getTracks();
      tracks.push(track);
      db.saveTracks(tracks);
      logger.info(`Track created: ${title} (${id})`);
      return track;
    } catch (err) {
      logger.error('Failed to create track', err as Error);
      return null;
    }
  },

  delete(id: string): boolean {
    try {
      const tracks = db.getTracks();
      const idx = tracks.findIndex((t) => t.id === id);
      if (idx === -1) return false;

      const track = tracks[idx];
      if (fs.existsSync(track.filePath)) {
        fs.unlinkSync(track.filePath);
      }
      if (track.coverUrl) {
        const coverPath = path.join(AUDIO_DIR, path.basename(track.coverUrl));
        if (fs.existsSync(coverPath)) {
          fs.unlinkSync(coverPath);
        }
      }

      tracks.splice(idx, 1);
      db.saveTracks(tracks);

      const playlists = db.getPlaylists();
      playlists.forEach((p) => {
        p.trackIds = p.trackIds.filter((tid) => tid !== id);
        p.updatedAt = Date.now();
      });
      db.savePlaylists(playlists);

      logger.info(`Track deleted: ${id}`);
      return true;
    } catch (err) {
      logger.error('Failed to delete track', err as Error);
      return false;
    }
  },
};
