import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import audioEngine from '../core/audio/AudioEngine';
import type { Song } from '../core/sources/types';

let initialized = false;
let playGeneration = 0;
let consecutiveFailures = 0;
let restoring = false;

export function useAudio() {
  const player = usePlayerStore();

  function normalizeText(value?: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()（）\[\]【】\-_.']/g, '');
  }

  function getFallbackCandidates(song: Song): Song[] {
    const title = normalizeText(song.title);
    const artist = normalizeText(song.artist);

    return player.queue.filter((item) => {
      if (item.id === song.id && item.sourceId === song.sourceId) return false;
      if (normalizeText(item.title) !== title) return false;
      return !artist || normalizeText(item.artist).includes(artist) || artist.includes(normalizeText(item.artist));
    });
  }

  function effectiveVolume(): number {
    return player.muted ? 0 : player.volume;
  }

  function skipAfterFailure() {
    consecutiveFailures += 1;
    const limit = Math.max(1, Math.min(player.queue.length, 5));
    if (consecutiveFailures >= limit) {
      consecutiveFailures = 0;
      return;
    }
    playNext();
  }

  async function playSong(song: Song) {
    const generation = ++playGeneration;

    const url = await player.playSong(song);
    if (generation !== playGeneration) return;

    if (url) {
      consecutiveFailures = 0;
      audioEngine.load(url, { volume: effectiveVolume() });
      return;
    }

    const fallbacks = getFallbackCandidates(song);
    for (const candidate of fallbacks) {
      if (generation !== playGeneration) return;
      const fallbackUrl = await player.playSong(candidate);
      if (generation !== playGeneration) return;
      if (fallbackUrl) {
        consecutiveFailures = 0;
        audioEngine.load(fallbackUrl, { volume: effectiveVolume() });
        return;
      }
    }

    if (generation === playGeneration) skipAfterFailure();
  }

  function playFromList(songs: Song[], song: Song) {
    player.setQueue(songs);
    playSong(song);
  }

  function playNext() {
    const list = player.queue;
    if (list.length === 0) return;
    if (player.playMode === 'random') { playRandom(); return; }
    let idx: number;
    if (player.currentIndex < list.length - 1) idx = player.currentIndex + 1;
    else if (player.playMode === 'loop') idx = 0;
    else return;
    playSong(list[idx]);
  }

  function playPrevious() {
    const list = player.queue;
    if (list.length === 0) return;
    if (player.playMode === 'random') { playRandom(); return; }
    let idx: number;
    if (player.currentIndex > 0) idx = player.currentIndex - 1;
    else if (player.playMode === 'loop') idx = list.length - 1;
    else return;
    playSong(list[idx]);
  }

  function playRandom() {
    const list = player.queue;
    if (list.length === 0) return;
    let idx: number;
    do { idx = Math.floor(Math.random() * list.length); }
    while (idx === player.currentIndex && list.length > 1);
    playSong(list[idx]);
  }

  function playAtIndex(index: number) {
    const list = player.queue;
    if (index < 0 || index >= list.length) return;
    playSong(list[index]);
  }

  function playAll(songs: Song[]) {
    if (songs.length === 0) return;
    player.setQueue(songs);
    playSong(songs[0]);
  }

  function seekTo(time: number) {
    const t = Math.max(0, Math.min(time, player.duration || 0));
    audioEngine.seek(t);
    player.persistSession();
  }

  /** 恢复上次播放（不自动播放，符合浏览器策略） */
  async function restoreLastSession() {
    if (restoring) return;
    const session = player.restoreSession();
    if (!session) return;

    restoring = true;
    const generation = ++playGeneration;
    try {
      const url = await player.resolvePlayUrl(session.song);
      if (generation !== playGeneration || !url) return;

      audioEngine.load(url, { volume: effectiveVolume(), autoplay: false });
      player.isPlaying = false;
      if (session.time > 0) {
        // 等 howl onload 后再 seek 更稳，这里短延迟兜底
        setTimeout(() => {
          if (generation !== playGeneration) return;
          audioEngine.seek(session.time);
          player.persistSession();
        }, 300);
      }
      player.loadLyric(session.song);
    } finally {
      restoring = false;
    }
  }

  if (!initialized) {
    initialized = true;

    audioEngine.setCallbacks({
      onPlay: () => { player.isPlaying = true; },
      onPause: () => { player.isPlaying = false; },
      onEnd: () => {
        player.isPlaying = false;
        if (player.playMode === 'single') {
          audioEngine.seek(0);
          audioEngine.play();
        } else {
          playNext();
        }
      },
      onTimeUpdate: (ct, dur) => player.updateTime(ct, dur),
      onError: (msg) => {
        player.error = msg.includes('失败')
          ? '音频加载失败，可能是网络或版权限制'
          : msg;
        player.isPlaying = false;
        skipAfterFailure();
      },
    });

    watch(() => player.isPlaying, (playing) => {
      if (playing) audioEngine.play();
      else audioEngine.pause();
    });

    watch(
      () => [player.volume, player.muted] as const,
      ([vol, muted]) => {
        audioEngine.setVolume(muted ? 0 : vol);
      },
      { immediate: true },
    );
  }

  return {
    playSong,
    playFromList,
    playNext,
    playPrevious,
    playRandom,
    playAtIndex,
    playAll,
    seekTo,
    restoreLastSession,
  };
}
