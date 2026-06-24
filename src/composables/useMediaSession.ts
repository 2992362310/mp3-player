/**
 * 浏览器 Media Session Composable
 * 在锁屏/通知栏显示歌曲信息和控制按钮
 */

import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useAudio } from './useAudio';

export function useMediaSession() {
  const player = usePlayerStore();
  const { playNext, playPrevious } = useAudio();

  function updateMetadata() {
    if (!('mediaSession' in navigator)) return;
    const song = player.currentSong;
    if (!song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.cover
        ? [{ src: song.cover, sizes: '300x300', type: 'image/jpeg' }]
        : [],
    });
  }

  function setupActions() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => player.togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => player.togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) player.seekTo(details.seekTime);
    });
  }

  // 监听当前歌曲变化，更新 metadata
  watch(() => player.currentSong, updateMetadata, { immediate: true });

  // 监听播放状态，更新 playbackState
  watch(
    () => player.isPlaying,
    (playing) => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      }
    },
    { immediate: true },
  );

  setupActions();
}
