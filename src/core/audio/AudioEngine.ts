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

    this.howl = new Howl({
      src: [url],
      html5: true,
      volume: this.volume,
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
      onloaderror: () => this.callbacks?.onError('音频加载失败'),
      onplayerror: () => this.callbacks?.onError('播放失败'),
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

  destroy(): void {
    this.stopInternal();
    this.callbacks = null;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
