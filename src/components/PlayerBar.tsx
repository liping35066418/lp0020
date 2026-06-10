import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, Shuffle, Music2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { trackApi } from '../services/api';
import { formatDuration } from '../lib/utils';

const PlayerBar = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTime, setDraggedTime] = useState(0);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeat,
    isShuffle,
    queue,
    queueIndex,
    setPlaying,
    setProgress,
    setDuration,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    prev,
    next,
    recordHistory,
  } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const src = trackApi.streamUrl(currentTrack.id);
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const onTimeUpdate = useCallback(() => {
    if (!isDragging && audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  }, [isDragging, setProgress]);

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, [setDuration]);

  const onEnded = useCallback(async () => {
    if (currentTrack) {
      await recordHistory(currentTrack.id, audioRef.current?.duration || 0);
    }
    await next();
  }, [next, currentTrack, recordHistory]);

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    setIsDragging(true);
    updateProgress(e);
  };

  const updateProgress = (e: React.MouseEvent | MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setDraggedTime(ratio * duration);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updateProgress(e);
    const onUp = () => {
      if (audioRef.current && duration) {
        audioRef.current.currentTime = draggedTime;
        setProgress(draggedTime);
      }
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, duration, draggedTime, setProgress]);

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    if (!volumeRef.current) return;
    updateVolume(e);
    const onMove = (ev: MouseEvent) => updateVolume(ev);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const updateVolume = (e: React.MouseEvent | MouseEvent) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(ratio);
  };

  const effectiveTime = isDragging ? draggedTime : currentTime;
  const progressPct = duration > 0 ? (effectiveTime / duration) * 100 : 0;
  const volumePct = isMuted ? 0 : volume * 100;

  const coverUrl = currentTrack?.coverUrl;

  return (
    <div className="glass shrink-0">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="px-5 pt-4 pb-2">
        <div
          ref={progressRef}
          className="progress-bar"
          onMouseDown={handleProgressMouseDown}
        >
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <div className="progress-thumb" style={{ left: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{formatDuration(effectiveTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1 flex items-center gap-6">
        <div className="flex items-center gap-3 w-1/4 min-w-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className={`w-full h-full object-cover spin-animation ${isPlaying ? '' : 'paused'}`}
              />
            ) : (
              <Music2 className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {currentTrack?.title || '未选择曲目'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {currentTrack ? `${currentTrack.artist} · ${currentTrack.album}` : '从音乐库选择一首歌开始播放'}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              className={`icon-btn ${isShuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              title="随机播放"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button className="icon-btn" onClick={() => prev()} title="上一首">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #6366f1)',
                color: 'var(--bg-primary)',
                boxShadow: isPlaying ? '0 8px 30px var(--accent-glow)' : '0 4px 20px var(--accent-glow)',
              }}
              onClick={() => setPlaying(!isPlaying)}
              disabled={!currentTrack && queue.length === 0}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button className="icon-btn" onClick={() => next()} title="下一首">
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              className={`icon-btn ${repeat !== 'off' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={`循环: ${repeat === 'off' ? '关闭' : repeat === 'all' ? '列表循环' : '单曲循环'}`}
            >
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            队列 {queue.length > 0 ? `${queueIndex + 1} / ${queue.length}` : '空'}
          </p>
        </div>

        <div className="w-1/4 flex items-center justify-end gap-3">
          <button className="icon-btn" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div
            ref={volumeRef}
            className="volume-slider"
            onMouseDown={handleVolumeMouseDown}
          >
            <div className="volume-fill" style={{ width: `${volumePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
