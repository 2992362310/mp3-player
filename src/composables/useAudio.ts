import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useSearchStore } from '../stores/search';
import audioEngine from '../core/audio/AudioEngine';
import type { Song } from '../core/sources/types';
import { LOCAL_SOURCE_ID } from '../core/sources/LocalSource';

let initialized = false;
let playGeneration = 0;
let consecutiveFailures = 0;
let restoring = false;
let nextPrefetchTask: Promise<void> | null = null;
let prefetchedNext: { key: string; url: string } | null = null;

function audioFormatFor(song: Song | null | undefined, url: string): string[] | undefined {
  if (!song) return undefined;
  // blob: URL 没有扩展名，Howler 需要显式 format，否则首次加载会误报失败
  if (!url.startsWith('blob:') && song.sourceId !== LOCAL_SOURCE_ID) return undefined;

  const mime = String(song.raw?.mimeType || song.raw?.mime || '').toLowerCase();
  const mimeMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/opus': 'opus',
  };
  if (mimeMap[mime]) return [mimeMap[mime]];

  const ext = String(song.raw?.fileName || '').split('.').pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return [ext === 'mp4' ? 'm4a' : ext];
  return ['mp3'];
}

export function useAudio() {
  const player = usePlayerStore();
  const search = useSearchStore();

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
    if (player.muted) return 0;
    return player.volume;
  }

  function applyOutputVolume() {
    audioEngine.setVolume(effectiveVolume());
  }

  function songKey(song: Song): string {
    return `${song.sourceId}-${song.id}`;
  }

  function loadAudio(song: Song, url: string, autoplay = true) {
    audioEngine.load(url, {
      volume: effectiveVolume(),
      autoplay,
      format: audioFormatFor(song, url),
    });
  }

  function clearNextPrefetch() {
    prefetchedNext = null;
    nextPrefetchTask = null;
  }

  function getSequentialNextSong(): Song | null {
    const list = player.queue;
    if (list.length === 0) return null;
    if (!player.currentSong) return null;
    if (player.playMode === 'random' || player.playMode === 'single') return null;

    let idx: number | null = null;
    if (player.currentIndex < list.length - 1) idx = player.currentIndex + 1;
    else if (player.playMode === 'loop') idx = 0;
    if (idx == null) return null;

    return list[idx] || null;
  }

  async function prefetchSequentialNext() {
    const nextSong = getSequentialNextSong();
    if (!nextSong) {
      clearNextPrefetch();
      return;
    }

    const key = songKey(nextSong);
    if (prefetchedNext?.key === key) return;

    const task = (async () => {
      try {
        const url = await player.resolvePlayUrl(nextSong);
        if (!url) return;
        const latest = getSequentialNextSong();
        if (!latest || songKey(latest) !== key) return;
        prefetchedNext = { key, url };
      } catch {
        // ignore prefetch errors; normal play flow will still resolve on demand
      }
    })();

    nextPrefetchTask = task;
    await task;
    if (nextPrefetchTask === task) nextPrefetchTask = null;
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

  async function playSong(song: Song, resolvedUrl?: string, options?: { addToHistory?: boolean }) {
    const generation = ++playGeneration;
    clearNextPrefetch();

    const url = await player.playSong(song, resolvedUrl, options);
    if (generation !== playGeneration) return;

    if (url) {
      consecutiveFailures = 0;
      search.markPlayable(song, true);
      loadAudio(song, url);
      void prefetchSequentialNext();
      return;
    }

    search.markPlayable(song, false);

    // 本地曲无需跨音源回退
    if (song.sourceId === LOCAL_SOURCE_ID) return;

    const fallbacks = getFallbackCandidates(song);
    for (const candidate of fallbacks) {
      if (generation !== playGeneration) return;
      const fallbackUrl = await player.playSong(candidate, undefined, options);
      if (generation !== playGeneration) return;
      if (fallbackUrl) {
        consecutiveFailures = 0;
        search.markPlayable(candidate, true);
        loadAudio(candidate, fallbackUrl);
        void prefetchSequentialNext();
        return;
      }
      search.markPlayable(candidate, false);
    }

    if (generation === playGeneration) skipAfterFailure();
  }

  function playFromList(songs: Song[], song: Song, options?: { addToHistory?: boolean }) {
    player.setQueue(songs);
    playSong(song, undefined, options);
  }

  async function playNext() {
    const list = player.queue;
    if (list.length === 0) return;
    if (player.playMode === 'random') { playRandom(); return; }
    let idx: number;
    if (player.currentIndex < list.length - 1) idx = player.currentIndex + 1;
    else if (player.playMode === 'loop') idx = 0;
    else return;

    const target = list[idx];
    const key = songKey(target);
    if (nextPrefetchTask) {
      try { await nextPrefetchTask; } catch { /* ignore */ }
    }
    if (prefetchedNext?.key === key) {
      const { url } = prefetchedNext;
      clearNextPrefetch();
      playSong(target, url);
      return;
    }

    playSong(target);
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

      loadAudio(session.song, url, false);
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
      onPlay: () => {
        player.isPlaying = true;
        player.clearError();
      },
      onPause: () => { player.isPlaying = false; },
      onEnd: () => {
        player.isPlaying = false;
        if (player.playMode === 'single') {
          audioEngine.seek(0);
          audioEngine.play();
        } else {
          void playNext();
        }
      },
      onTimeUpdate: (ct, dur) => player.updateTime(ct, dur),
      onError: (msg) => {
        const isLocal = player.currentSong?.sourceId === LOCAL_SOURCE_ID;
        if (isLocal) {
          player.error = msg.includes('格式')
            ? '本地音频格式不受当前浏览器支持'
            : '本地音频加载失败，请尝试重新导入';
          player.isPlaying = false;
          return;
        }
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
      () => applyOutputVolume(),
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
