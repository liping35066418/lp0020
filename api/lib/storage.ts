import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Track, Playlist, PlayHistoryItem } from './types.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const AUDIO_DIR = path.join(STORAGE_DIR, 'audio');
const DATA_DIR = path.join(STORAGE_DIR, 'data');

const TRACKS_FILE = path.join(DATA_DIR, 'tracks.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export function ensureStorageDirs() {
  [AUDIO_DIR, DATA_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  [TRACKS_FILE, PLAYLISTS_FILE, HISTORY_FILE].forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]', 'utf-8');
    }
  });
}

export const getPaths = () => ({ AUDIO_DIR, DATA_DIR, TRACKS_FILE, PLAYLISTS_FILE, HISTORY_FILE });

function readJSON<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return [];
    return JSON.parse(raw) as T[];
  } catch (err) {
    logger.error(`Failed to read JSON: ${filePath}`, err as Error);
    return [];
  }
}

function writeJSON<T>(filePath: string, data: T[]): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    logger.error(`Failed to write JSON: ${filePath}`, err as Error);
    return false;
  }
}

export const db = {
  getTracks: () => readJSON<Track>(TRACKS_FILE),
  saveTracks: (data: Track[]) => writeJSON<Track>(TRACKS_FILE, data),
  getPlaylists: () => readJSON<Playlist>(PLAYLISTS_FILE),
  savePlaylists: (data: Playlist[]) => writeJSON<Playlist>(PLAYLISTS_FILE, data),
  getHistory: () => readJSON<PlayHistoryItem>(HISTORY_FILE),
  saveHistory: (data: PlayHistoryItem[]) => writeJSON<PlayHistoryItem>(HISTORY_FILE, data),
};
