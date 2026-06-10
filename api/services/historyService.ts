import { v4 as uuidv4 } from 'uuid';
import type { PlayHistoryItem, Track } from '../lib/types.js';
import { db } from '../lib/storage.js';
import logger from '../lib/logger.js';

export const historyService = {
  getAll(): (PlayHistoryItem & { track?: Track })[] {
    const history = db.getHistory().sort((a, b) => b.playedAt - a.playedAt);
    const allTracks = db.getTracks();
    return history.slice(0, 200).map((h) => ({
      ...h,
      track: allTracks.find((t) => t.id === h.trackId),
    }));
  },

  add(trackId: string, duration: number): PlayHistoryItem {
    const item: PlayHistoryItem = {
      id: uuidv4(),
      trackId,
      playedAt: Date.now(),
      duration,
    };
    const history = db.getHistory();
    history.push(item);
    if (history.length > 500) {
      history.splice(0, history.length - 500);
    }
    db.saveHistory(history);
    return item;
  },

  clear(): boolean {
    db.saveHistory([]);
    logger.info('Play history cleared');
    return true;
  },
};
