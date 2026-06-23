/**
 * 音频控制 Composable
 * 连接 Pinia store 和 AudioEngine，提供播放控制逻辑
 */

import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { usePlaylistStore } from '../stores/playlist';
import audioEngine from '../core/audio/AudioEngine';

export function useAudio() {
  const player = usePlayerStore();
  const playlist = usePlaylistStore();

  /** 播放指定歌曲（自动加入播放列表） */
  async function playSong(song: import('../core/sources/types').Song) {
    // 添加到播放列表
    const idx = playlist.playlist.findIndex(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
    if (idx === -1) {
      playlist.addToPlaylist(song);
      playlist.setCurrentIndex(playlist.playlist.length - 1);
    } else {
      playlist.setCurrentIndex(idx);
    }

    // 调用 store 播放
    await player.playSong(song);
  }

  /** 播放下一首 */
  function playNext() {
    if (playlist.playlist.length === 0) return;

    if (player.playMode === 'random') {
      playRandom();
      return;
    }

    let nextIdx: number;
    if (playlist.currentIndex < playlist.playlist.length - 1) {
      nextIdx = playlist.currentIndex + 1;
    } else if (player.playMode === 'loop') {
      nextIdx = 0;
    } else {
      // order 模式到末尾停止
      return;
    }

    playlist.setCurrentIndex(nextIdx);
    player.playSong(playlist.playlist[nextIdx]);
  }

  /** 播放上一首 */
  function playPrevious() {
    if (playlist.playlist.length === 0) return;

    if (player.playMode === 'random') {
      playRandom();
      return;
    }

    let prevIdx: number;
    if (playlist.currentIndex > 0) {
      prevIdx = playlist.currentIndex - 1;
    } else if (player.playMode === 'loop') {
      prevIdx = playlist.playlist.length - 1;
    } else {
      return;
    }

    playlist.setCurrentIndex(prevIdx);
    player.playSong(playlist.playlist[prevIdx]);
  }

  /** 随机播放 */
  function playRandom() {
    if (playlist.playlist.length === 0) return;
    let idx: number;
    do {
      idx = Math.floor(Math.random() * playlist.playlist.length);
    } while (idx === playlist.currentIndex && playlist.playlist.length > 1);
    playlist.setCurrentIndex(idx);
    player.playSong(playlist.playlist[idx]);
  }

  /** 播放播放列表中指定位置 */
  function playAtIndex(index: number) {
    if (index >= 0 && index < playlist.playlist.length) {
      playlist.setCurrentIndex(index);
      player.playSong(playlist.playlist[index]);
    }
  }

  /** 批量添加并播放 */
  function playAll(songs: import('../core/sources/types').Song[]) {
    if (songs.length === 0) return;
    playlist.addAllToPlaylist(songs);
    playSong(songs[0]);
  }

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
      // 仅当差异大于 0.5s 时 seek（避免循环触发）
      const howl = audioEngine.getHowl();
      if (howl && Math.abs(time - (howl.seek() as number)) > 0.5) {
        audioEngine.seek(time);
      }
    },
  );

  return {
    playSong,
    playNext,
    playPrevious,
    playRandom,
    playAtIndex,
    playAll,
  };
}
