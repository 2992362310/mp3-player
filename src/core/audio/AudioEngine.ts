import { Howl } from 'howler';

export interface AudioCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onError: (message: string) => void;
}

export interface LoadOptions {
  volume?: number;
  /** 默认 true；恢复会话时设为 false */
  autoplay?: boolean;
  /** blob: URL 等无法从路径推断后缀时必须指定，例如 ['mp3'] */
  format?: string | string[];
}

class AudioEngine {
  private howl: Howl | null = null;
  private rafId: number | null = null;
  private callbacks: AudioCallbacks | null = null;
  private lastTimeUpdate = 0;
  private readonly timeUpdateInterval = 250;
  private volume = 1;

  /** 注册回调（由 useAudio 调用） */
  setCallbacks(cb: AudioCallbacks): void {
    this.callbacks = cb;
  }

  /** 加载音频；默认加载后立即播放 */
  load(url: string, options: LoadOptions = {}): void {
    this.stopInternal();
    if (options.volume != null) this.volume = options.volume;
    const autoplay = options.autoplay !== false;

    const formats = normalizeFormats(options.format);

    this.howl = new Howl({
      src: [url],
      html5: true,
      volume: this.volume,
      ...(formats.length ? { format: formats } : {}),
      onplay: () => {
        this.startRaf();
        this.callbacks?.onPlay();
      },
      onpause: () => {
        this.stopRaf();
        this.callbacks?.onPause();
      },
      onend: () => {
        this.stopRaf();
        this.callbacks?.onEnd();
      },
      onload: () => {
        if (!autoplay) this.emitTimeUpdate();
      },
      onloaderror: (_id, err) => {
        const detail = typeof err === 'string' ? err : '';
        this.callbacks?.onError(detail.includes('No codec') ? '音频格式不受支持' : '音频加载失败');
      },
      onplayerror: (_id, err) => {
        // 部分浏览器在异步取流后丢失手势，Howler 可在 unlock 后重试
        const sound = this.howl;
        if (sound) {
          sound.once('unlock', () => {
            sound.play();
          });
        }
        const detail = typeof err === 'string' ? err : '';
        if (detail && !/NotAllowedError|play\(\)/i.test(detail)) {
          this.callbacks?.onError('播放失败');
        }
      },
    });

    if (autoplay) this.howl.play();
  }

  play(): void {
    if (this.howl && !this.howl.playing()) this.howl.play();
  }

  pause(): void {
    this.howl?.pause();
  }

  seek(time: number): void {
    if (!this.howl) return;
    this.howl.seek(time);
    this.emitTimeUpdate();
  }

  setVolume(v: number): void {
    this.volume = v;
    this.howl?.volume(v);
  }

  isPlaying(): boolean {
    return this.howl?.playing() ?? false;
  }

  private stopInternal(): void {
    this.stopRaf();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
  }

  private emitTimeUpdate(): void {
    if (!this.howl) return;
    this.callbacks?.onTimeUpdate(
      this.howl.seek() as number,
      this.howl.duration(),
    );
    this.lastTimeUpdate = performance.now();
  }

  private startRaf(): void {
    this.stopRaf();
    this.lastTimeUpdate = 0;
    const tick = () => {
      if (!this.howl) return;
      const now = performance.now();
      if (now - this.lastTimeUpdate >= this.timeUpdateInterval) {
        this.emitTimeUpdate();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** 卸载当前音频，保留回调供后续播放 */
  unload(): void {
    this.stopInternal();
  }

  destroy(): void {
    this.stopInternal();
    this.callbacks = null;
  }
}

function normalizeFormats(format?: string | string[]): string[] {
  if (!format) return [];
  const list = Array.isArray(format) ? format : [format];
  return list
    .map((f) => f.replace(/^\./, '').trim().toLowerCase())
    .filter(Boolean);
}

export const audioEngine = new AudioEngine();
export default audioEngine;
