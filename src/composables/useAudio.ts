/**
 * 音频控制 Composable
 * 连接 Pinia store 和 AudioEngine，提供播放控制逻辑
 */

import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import audioEngine from '../core/audio/AudioEngine';

let initialized = false;

export function useAudio() {
  const player = usePlayerStore();

  /** 播放指定歌曲 */
  async function playSong(song: import('../core/sources/types').Song) {
    await player.playSong(song);
  }

  /** 播放下一首（在搜索结果中切换） */
  function playNext() {
    const list = player.searchResults;
    if (list.length === 0) return;

    if (player.playMode === 'random') {
      playRandom();
      return;
    }

    let nextIdx: number;
    if (player.currentIndex < list.length - 1) {
      nextIdx = player.currentIndex + 1;
    } else if (player.playMode === 'loop') {
      nextIdx = 0;
    } else {
      return;
    }

    player.playSong(list[nextIdx]);
  }

  /** 播放上一首（在搜索结果中切换） */
  function playPrevious() {
    const list = player.searchResults;
    if (list.length === 0) return;

    if (player.playMode === 'random') {
      playRandom();
      return;
    }

    let prevIdx: number;
    if (player.currentIndex > 0) {
      prevIdx = player.currentIndex - 1;
    } else if (player.playMode === 'loop') {
      prevIdx = list.length - 1;
    } else {
      return;
    }

    player.playSong(list[prevIdx]);
  }

  /** 随机播放 */
  function playRandom() {
    const list = player.searchResults;
    if (list.length === 0) return;
    let idx: number;
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (idx === player.currentIndex && list.length > 1);
    player.playSong(list[idx]);
  }

  /** 播放搜索结果中指定位置 */
  function playAtIndex(index: number) {
    const list = player.searchResults;
    if (index < 0 || index >= list.length) return;
    player.playSong(list[index]);
  }

  /** 批量设置搜索结果并播放第一首 */
  function playAll(songs: import('../core/sources/types').Song[]) {
    if (songs.length === 0) return;
    player.searchResults = songs;
    player.playSong(songs[0]);
  }

  if (!initialized) {
    initialized = true;

    // 监听 playUrl 变化 → 加载音频
    watch(
      () => player.playUrl,
      (url) => {
        if (url) audioEngine.load(url);
      },
    );

    // 监听播放状态 → 控制播放/暂停
    watch(
      () => player.isPlaying,
      (playing) => {
        if (playing) audioEngine.play();
        else audioEngine.pause();
      },
    );

    // 监听音量变化
    watch(
      () => [player.volume, player.muted],
      ([vol, muted]) => {
        audioEngine.setVolume(muted ? 0 : (vol as number));
      },
    );

    // 监听 seek
    watch(
      () => player.currentTime,
      (time) => {
        const howl = audioEngine.getHowl();
        if (howl && Math.abs(time - (howl.seek() as number)) > 0.5) {
          audioEngine.seek(time);
        }
      },
    );

    // 播放结束后按模式处理
    audioEngine.onEnded(() => {
      if (player.searchResults.length === 0) return;

      if (player.playMode === 'single') {
        return;
      }

      playNext();
    });
  }

  return {
    playSong,
    playNext,
    playPrevious,
    playRandom,
    playAtIndex,
    playAll,
  };
}
