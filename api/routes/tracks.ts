import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { trackService } from '../services/trackService.js';
import logger from '../lib/logger.js';
import { getPaths } from '../lib/storage.js';

const router = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/ogg',
      'audio/vorbis',
      'audio/aac',
      'audio/mp4',
      'audio/m4a',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的音频格式'));
    }
  },
});

router.get('/', (_req: Request, res: Response) => {
  try {
    res.json(trackService.getAll());
  } catch (err) {
    logger.error('GET /tracks failed', err as Error);
    res.status(500).json({ success: false, error: '获取曲目列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const track = trackService.getById(req.params.id);
  if (!track) {
    return res.status(404).json({ success: false, error: '曲目不存在' });
  }
  res.json(track);
});

router.get('/:id/stream', (req: Request, res: Response) => {
  try {
    const track = trackService.getById(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, error: '曲目不存在' });
    }
    if (!fs.existsSync(track.filePath)) {
      return res.status(404).json({ success: false, error: '音频文件丢失' });
    }

    const stat = fs.statSync(track.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': track.mimeType,
      });
      fs.createReadStream(track.filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': track.mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(track.filePath).pipe(res);
    }
  } catch (err) {
    logger.error('Stream track failed', err as Error);
    res.status(500).json({ success: false, error: '流媒体读取失败' });
  }
});

router.post(
  '/upload',
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '未接收到文件' });
      }
      const track = await trackService.createFromFile(
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      );
      fs.promises.unlink(req.file.path).catch(() => {});
      if (!track) {
        return res.status(500).json({ success: false, error: '音频处理失败' });
      }
      res.json({ success: true, track });
    } catch (err) {
      logger.error('Upload failed', err as Error);
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
);

router.delete('/:id', (req: Request, res: Response) => {
  const ok = trackService.delete(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: '曲目不存在' });
  }
  res.json({ success: true });
});

export default router;
