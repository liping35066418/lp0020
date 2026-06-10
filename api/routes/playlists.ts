import { Router, type Request, type Response } from 'express';
import { playlistService } from '../services/playlistService.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    res.json(playlistService.getAll());
  } catch (err) {
    logger.error('GET /playlists failed', err as Error);
    res.status(500).json({ success: false, error: '获取歌单失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const pl = playlistService.getById(req.params.id);
  if (!pl) {
    return res.status(404).json({ success: false, error: '歌单不存在' });
  }
  res.json(pl);
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const pl = playlistService.create(typeof name === 'string' ? name : '');
    res.json({ success: true, playlist: pl });
  } catch (err) {
    logger.error('Create playlist failed', err as Error);
    res.status(500).json({ success: false, error: '创建歌单失败' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const pl = playlistService.rename(req.params.id, typeof name === 'string' ? name : '');
    if (!pl) {
      return res.status(404).json({ success: false, error: '歌单不存在' });
    }
    res.json({ success: true, playlist: pl });
  } catch (err) {
    logger.error('Rename playlist failed', err as Error);
    res.status(500).json({ success: false, error: '重命名失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const ok = playlistService.delete(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: '歌单不存在' });
  }
  res.json({ success: true });
});

router.post('/:id/tracks', (req: Request, res: Response) => {
  try {
    const { trackId } = req.body;
    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少 trackId' });
    }
    const pl = playlistService.addTrack(req.params.id, trackId);
    if (!pl) {
      return res.status(404).json({ success: false, error: '歌单不存在' });
    }
    res.json({ success: true, playlist: pl });
  } catch (err) {
    logger.error('Add track to playlist failed', err as Error);
    res.status(500).json({ success: false, error: '添加曲目失败' });
  }
});

router.delete('/:id/tracks/:trackId', (req: Request, res: Response) => {
  try {
    const pl = playlistService.removeTrack(req.params.id, req.params.trackId);
    if (!pl) {
      return res.status(404).json({ success: false, error: '歌单不存在' });
    }
    res.json({ success: true, playlist: pl });
  } catch (err) {
    logger.error('Remove track from playlist failed', err as Error);
    res.status(500).json({ success: false, error: '移除曲目失败' });
  }
});

export default router;
