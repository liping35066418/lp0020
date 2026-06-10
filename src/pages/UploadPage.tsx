import { useState, useCallback, useRef } from 'react';
import { Upload, Music, FileAudio, X, Check, AlertCircle } from 'lucide-react';
import { trackApi } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../types';
import { formatFileSize } from '../lib/utils';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  track?: Track;
}

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTrackToLibrary } = usePlayerStore();

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) =>
      f.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|aac|m4a|wma)$/i.test(f.name)
    );
    if (arr.length === 0) return;
    const newItems: UploadItem[] = arr.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => processItem(item));
  }, []);

  const processItem = async (item: UploadItem) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'uploading' } : x)));
    try {
      const track = await trackApi.upload(item.file, (p) => {
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, progress: p } : x)));
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'success', track, progress: 100 } : x)));
      addTrackToLibrary(track);
    } catch (e) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'error', error: (e as Error).message } : x)));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const clearCompleted = () => {
    setItems((prev) => prev.filter((x) => x.status === 'uploading' || x.status === 'pending'));
  };

  return (
    <div className="flex flex-col h-full slide-up">
      <div className="shrink-0 p-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>本地导入</p>
        <h1 className="text-4xl font-bold gradient-text">上传音频</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          支持 MP3、WAV、FLAC、OGG、AAC、M4A 等格式，单个文件最大 200MB
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div
          className={`card p-12 mb-6 text-center transition-all duration-200 border-2 border-dashed ${dragActive ? 'border-[var(--accent)]' : ''}`}
          style={{ borderColor: dragActive ? 'var(--accent)' : 'var(--border)' }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div
            className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: dragActive ? 'rgba(34,211,238,0.15)' : 'var(--bg-tertiary)',
              boxShadow: dragActive ? '0 8px 30px var(--accent-glow)' : 'none',
            }}
          >
            <Upload className={`w-9 h-9 transition-colors ${dragActive ? 'text-[var(--accent)]' : ''}`} style={{ color: dragActive ? undefined : 'var(--accent)' }} />
          </div>
          <p className="text-xl font-semibold mb-1">{dragActive ? '松开鼠标上传' : '拖拽文件到这里'}</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>或点击选择本地音频文件</p>
          <button
            className="btn-primary btn"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            <FileAudio className="w-4 h-4" />
            选择文件
          </button>
        </div>

        {items.length > 0 && (
          <div className="card p-2">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-medium">
                上传列表
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  {items.filter((x) => x.status === 'success').length}/{items.length} 完成
                </span>
              </p>
              {items.some((x) => x.status === 'success' || x.status === 'error') && (
                <button className="text-xs px-3 py-1.5 rounded-md hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} onClick={clearCompleted}>
                  清理已完成
                </button>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                    <Music className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{formatFileSize(item.file.size)}</span>
                    </div>
                    {item.status === 'error' ? (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertCircle className="w-3 h-3" /> {item.error || '上传失败'}
                      </p>
                    ) : item.status === 'success' ? (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#4ade80' }}>
                        <Check className="w-3 h-3" /> 上传成功 · {item.track?.title}
                      </p>
                    ) : (
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.progress}%`,
                            background: 'linear-gradient(90deg, var(--accent), #6366f1)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {item.status !== 'uploading' && (
                    <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => removeItem(item.id)}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-xs tabular-nums w-12 text-right" style={{ color: 'var(--text-muted)' }}>
                      {Math.round(item.progress)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
