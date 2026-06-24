import { Howl } from 'howler';

export interface AudioCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onError: (message: string) => void;
}

class AudioEngine {
  private howl: Howl | null = null;
  private rafId: number | null = null;
  private callbacks: AudioCallbacks | null = null;

  /** 注册回调（由 useAudio 调用） */
  setCallbacks(cb: AudioCallbacks): void {
    this.callbacks = cb;
  }

  /** 加载并播放 */
  load(url: string): void {
    this.stopInternal();
    this.howl = new Howl({
      src: [url],
      html5: true,
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
      onloaderror: () => this.callbacks?.onError('音频加载失败'),
      onplayerror: () => this.callbacks?.onError('播放失败'),
    });
    this.howl.play();
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
    this.callbacks?.onTimeUpdate(time, this.howl.duration());
  }

  setVolume(v: number): void {
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

  private startRaf(): void {
    this.stopRaf();
    const tick = () => {
      if (!this.howl) return;
      this.callbacks?.onTimeUpdate(
        this.howl.seek() as number,
        this.howl.duration(),
      );
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
