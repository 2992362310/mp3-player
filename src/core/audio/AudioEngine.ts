/**
 * 音频引擎 — 基于 Howler.js
 * 统一管理音频播放、淡入淡出、播放速率、均衡器连接
 */

import { Howl } from 'howler';
import { usePlayerStore } from '../../stores/player';

class AudioEngine {
  private howl: Howl | null = null;
  private _fadeDuration = 1500; // 淡入淡出时长 ms
  private _rate = 1.0;

  /** 加载并播放指定 URL */
  load(url: string): void {
    // 淡出当前播放
    if (this.howl && this.howl.playing()) {
      this.howl.fade(this.howl.volume(), 0, this._fadeDuration);
      setTimeout(() => {
        this.howl?.unload();
        this._createAndPlay(url);
      }, this._fadeDuration);
    } else {
      this.howl?.unload();
      this._createAndPlay(url);
    }
  }

  private _createAndPlay(url: string): void {
    const player = usePlayerStore();

    this.howl = new Howl({
      src: [url],
      html5: true,
      volume: player.muted ? 0 : player.volume,
      rate: this._rate,
      onplay: () => {
        player.isPlaying = true;
        player.clearError();
        // 淡入
        if (this._fadeDuration > 0) {
          this.howl?.volume(0);
          this.howl?.fade(0, player.muted ? 0 : player.volume, this._fadeDuration);
        }
        this._startTimeUpdate();
      },
      onpause: () => {
        player.isPlaying = false;
      },
      onend: () => {
        player.isPlaying = false;
        this._handleEnded();
      },
      onloaderror: () => {
        player.error = '音频加载失败';
        player.isPlaying = false;
      },
      onplayerror: () => {
        player.error = '播放失败';
        player.isPlaying = false;
      },
    });

    this.howl.play();
  }

  private _updateTimer: number | null = null;

  private _startTimeUpdate(): void {
    this._stopTimeUpdate();
    const tick = () => {
      if (!this.howl) return;
      const player = usePlayerStore();
      player.updateTime(this.howl.seek() as number, this.howl.duration());
      this._updateTimer = requestAnimationFrame(tick);
    };
    this._updateTimer = requestAnimationFrame(tick);
  }

  private _stopTimeUpdate(): void {
    if (this._updateTimer !== null) {
      cancelAnimationFrame(this._updateTimer);
      this._updateTimer = null;
    }
  }

  private _handleEnded(): void {
    const player = usePlayerStore();
    if (player.playMode === 'single') {
      this.seek(0);
      this.play();
    } else {
      // 由外部通过 watch 触发 playNext
      // 这里只通知结束
    }
  }

  play(): void {
    if (this.howl && !this.howl.playing()) {
      this.howl.play();
    }
  }

  pause(): void {
    this.howl?.pause();
  }

  toggle(): void {
    if (this.howl?.playing()) this.pause();
    else this.play();
  }

  stop(): void {
    this.howl?.stop();
  }

  seek(time: number): void {
    if (this.howl) {
      this.howl.seek(time);
      const player = usePlayerStore();
      player.updateTime(time, this.howl.duration());
    }
  }

  setVolume(v: number): void {
    this.howl?.volume(v);
  }

  setRate(rate: number): void {
    this._rate = Math.max(0.5, Math.min(4, rate));
    this.howl?.rate(this._rate);
  }

  getRate(): number {
    return this._rate;
  }

  setFadeDuration(ms: number): void {
    this._fadeDuration = Math.max(0, ms);
  }

  /** 获取 Howler 实例（供均衡器连接 Web Audio 节点） */
  getHowl(): Howl | null {
    return this.howl;
  }

  /** 获取底层 AudioContext（供 Equalizer 使用） */
  getAudioContext(): AudioContext | null {
    // Howler 内部管理 AudioContext
    return (Howler as any)._ctx ?? null;
  }

  destroy(): void {
    this._stopTimeUpdate();
    this.howl?.unload();
    this.howl = null;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
