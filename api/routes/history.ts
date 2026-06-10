import { Router, type Request, type Response } from 'express';
import { historyService } from '../services/historyService.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    res.json(historyService.getAll());
  } catch (err) {
    logger.error('GET /history failed', err as Error);
    res.status(500).json({ success: false, error: '获取播放历史失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { trackId, duration } = req.body;
    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少 trackId' });
    }
    const item = historyService.add(trackId, typeof duration === 'number' ? duration : 0);
    res.json({ success: true, item });
  } catch (err) {
    logger.error('Add history failed', err as Error);
    res.status(500).json({ success: false, error: '记录失败' });
  }
});

router.delete('/', (_req: Request, res: Response) => {
  try {
    historyService.clear();
    res.json({ success: true });
  } catch (err) {
    logger.error('Clear history failed', err as Error);
    res.status(500).json({ success: false, error: '清空失败' });
  }
});

export default router;
