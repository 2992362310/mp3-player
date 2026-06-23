/**
 * 音效控制 — 淡入淡出、无缝播放预加载
 */

import { Howl } from 'howler';

class AudioEffects {
  /**
   * 在两个 Howl 实例之间做交叉淡入淡出
   * @param outgoing 当前播放的实例
   * @param incoming 即将播放的实例
   * @param duration 淡入淡出时长 (ms)
   */
  crossfade(outgoing: Howl, incoming: Howl, duration = 1500): void {
    const outVol = outgoing.volume();
    incoming.volume(0);
    incoming.play();

    outgoing.fade(outVol, 0, duration);
    incoming.fade(0, outVol, duration);

    setTimeout(() => {
      outgoing.stop();
    }, duration);
  }

  /**
   * 淡入
   */
  fadeIn(howl: Howl, targetVolume: number, duration = 1000): void {
    howl.volume(0);
    howl.fade(0, targetVolume, duration);
  }

  /**
   * 淡出
   */
  fadeOut(howl: Howl, duration = 1000): void {
    const currentVol = howl.volume();
    howl.fade(currentVol, 0, duration);
    setTimeout(() => {
      howl.pause();
    }, duration);
  }
}

export const audioEffects = new AudioEffects();
export default audioEffects;
