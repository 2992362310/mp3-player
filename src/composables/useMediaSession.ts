/**
 * 浏览器 Media Session Composable
 * 在锁屏/通知栏显示歌曲信息和控制按钮
 */

import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useAudio } from './useAudio';
import gdMusicApi, { type MusicSource } from '../services/GDMusicApi';

export function useMediaSession() {
  const player = usePlayerStore();
  const { playNext, playPrevious, seekTo } = useAudio();

  let coverRequestId = 0;

  async function resolveArtwork(song: typeof player.currentSong) {
    if (!song) return [] as MediaImage[];

    const raw = song.raw as { pic_id?: string; source?: string } | undefined;
    const picId = raw?.pic_id;
    const source = (raw?.source || song.sourceId) as MusicSource;
    if (!picId) return [] as MediaImage[];

    const req = ++coverRequestId;
    try {
      const pic = await gdMusicApi.getPicUrl(source, picId, 300);
      if (req !== coverRequestId || !pic?.url) return [] as MediaImage[];
      return [
        { src: pic.url, sizes: '96x96', type: 'image/jpeg' },
        { src: pic.url, sizes: '256x256', type: 'image/jpeg' },
        { src: pic.url, sizes: '512x512', type: 'image/jpeg' },
      ];
    } catch {
      return [] as MediaImage[];
    }
  }

  async function updateMetadata() {
    if (!('mediaSession' in navigator)) return;
    const song = player.currentSong;
    if (!song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: [],
    });

    const artwork = await resolveArtwork(song);
    if (!player.currentSong || player.currentSong.id !== song.id) return;
    if (!artwork.length) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork,
    });
  }

  function updatePositionState() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    const duration = Number(player.duration) || 0;
    if (duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, Number(player.currentTime) || 0), duration),
      });
    } catch {
      // some browsers reject invalid position ranges
    }
  }

  function setupActions() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => player.setPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => player.setPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seekTo(details.seekTime);
    });
    try {
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        seekTo(Math.max(0, (player.currentTime || 0) - 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        const duration = player.duration || 0;
        seekTo(Math.min(duration || Number.MAX_SAFE_INTEGER, (player.currentTime || 0) + 10));
      });
    } catch {
      // optional actions may be unsupported
    }
  }

  watch(() => player.currentSong, () => {
    void updateMetadata();
    updatePositionState();
  }, { immediate: true });

  watch(
    () => player.isPlaying,
    (playing) => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      }
    },
    { immediate: true },
  );

  watch(
    () => [player.currentTime, player.duration, player.isPlaying] as const,
    () => updatePositionState(),
  );

  setupActions();
}
