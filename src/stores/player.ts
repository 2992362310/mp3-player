import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Song, Lyric } from '../core/sources/types';
import { sourceManager } from '../core/sources/SourceManager';
import { serializeSong } from '../core/song';
import storage from '../core/storage';
import { formatUserError } from '../utils/errors';

export type PlayMode = 'order' | 'random' | 'loop' | 'single';
export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';

const QUALITY_ORDER: AudioQuality[] = ['lossless', 'high', 'medium', 'low'];
const HISTORY_LIMIT = 50;
const SESSION_SAVE_INTERVAL = 4000;

function safeGetSongs(key: string): Song[] {
  const val = storage.get<Song[]>(key, []);
  return Array.isArray(val) ? val : [];
}

export const usePlayerStore = defineStore('player', () => {
  const currentSong = ref<Song | null>(null);
  const isPlaying = ref(false);
  const playMode = ref<PlayMode>(storage.get<PlayMode>('playMode', 'order'));
  const volume = ref(storage.get<number>('volume', 0.8));
  const muted = ref(storage.get<boolean>('muted', false));
  const preferredQuality = ref<AudioQuality>(
    storage.get<AudioQuality>('preferredQuality', 'high'),
  );
  const currentTime = ref(0);
  const duration = ref(0);
  const loading = ref(false);
  const error = ref('');
  const lyric = ref<Lyric | null>(null);
  const currentLyricIndex = ref(-1);

  const queue = ref<Song[]>([]);
  const currentIndex = ref(-1);
  const recentPlays = ref<Song[]>(safeGetSongs('recentPlays'));

  const favorites = ref<Song[]>(safeGetSongs('favorites'));
  const favoriteCount = computed(() => favorites.value.length);

  const favoriteKeys = computed(
    () => new Set(favorites.value.map((s) => `${s.sourceId}-${s.id}`)),
  );

  function isFavorite(song: Song): boolean {
    return favoriteKeys.value.has(`${song.sourceId}-${song.id}`);
  }

  function toggleFavorite(song: Song) {
    const idx = favorites.value.findIndex(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
    if (idx !== -1) {
      favorites.value.splice(idx, 1);
    } else {
      favorites.value.push(serializeSong(song));
    }
    storage.set('favorites', favorites.value);
  }

  function setQueue(songs: Song[]) {
    queue.value = songs;
    persistSession();
  }

  function addToHistory(song: Song) {
    const key = `${song.sourceId}-${song.id}`;
    recentPlays.value = [
      serializeSong(song),
      ...recentPlays.value.filter((s) => `${s.sourceId}-${s.id}` !== key),
    ].slice(0, HISTORY_LIMIT);
    storage.set('recentPlays', recentPlays.value);
  }

  function clearRecentPlays() {
    recentPlays.value = [];
    storage.remove('recentPlays');
  }

  function persistSession() {
    storage.set('playbackSession', {
      queue: queue.value.map(serializeSong),
      currentSong: currentSong.value ? serializeSong(currentSong.value) : null,
      currentIndex: currentIndex.value,
      currentTime: currentTime.value,
    });
  }

  function restoreSession(): {
    song: Song;
    queue: Song[];
    index: number;
    time: number;
  } | null {
    const session = storage.get<{
      queue?: Song[];
      currentSong?: Song | null;
      currentIndex?: number;
      currentTime?: number;
    } | null>('playbackSession', null);

    if (!session?.currentSong || !Array.isArray(session.queue) || session.queue.length === 0) {
      return null;
    }

    queue.value = session.queue;
    currentSong.value = session.currentSong;
    currentIndex.value = session.currentIndex ?? 0;
    currentTime.value = Math.max(0, session.currentTime || 0);
    return {
      song: session.currentSong,
      queue: session.queue,
      index: currentIndex.value,
      time: currentTime.value,
    };
  }

  const progress = computed(() =>
    duration.value === 0 ? 0 : (currentTime.value / duration.value) * 100,
  );
  const formattedCurrentTime = computed(() => formatTime(currentTime.value));
  const formattedDuration = computed(() => formatTime(duration.value));
  const currentLyricText = computed(() => {
    if (!lyric.value?.lines) return '';
    return lyric.value.lines[currentLyricIndex.value]?.text ?? '';
  });
  const playModeLabel = computed(() => {
    const labels: Record<PlayMode, string> = {
      order: '顺序播放', random: '随机播放',
      loop: '列表循环', single: '单曲循环',
    };
    return labels[playMode.value];
  });
  const qualityCascade = computed(() => {
    const start = QUALITY_ORDER.indexOf(preferredQuality.value);
    const from = start === -1 ? QUALITY_ORDER.indexOf('high') : start;
    return QUALITY_ORDER.slice(from);
  });

  async function playSong(song: Song): Promise<string | null> {
    loading.value = true;
    error.value = '';
    try {
      const url = await sourceManager.getPlayUrl(song, qualityCascade.value);
      if (!url) throw new Error('无法获取播放地址');
      currentSong.value = serializeSong(song);
      const idx = queue.value.findIndex(
        (s) => s.id === song.id && s.sourceId === song.sourceId,
      );
      if (idx !== -1) currentIndex.value = idx;
      addToHistory(song);
      loadLyric(song);
      persistSession();
      return url;
    } catch (e) {
      console.error('[Player] 播放失败:', e);
      error.value = formatUserError(e, '播放失败，请尝试其他歌曲');
      return null;
    } finally {
      loading.value = false;
    }
  }

  /** 恢复会话时只解析 URL，不写入历史 */
  async function resolvePlayUrl(song: Song): Promise<string | null> {
    try {
      return await sourceManager.getPlayUrl(song, qualityCascade.value);
    } catch {
      return null;
    }
  }

  function togglePlay() {
    if (!currentSong.value) return;
    isPlaying.value = !isPlaying.value;
  }

  function setPlaying(playing: boolean) {
    if (!currentSong.value) return;
    isPlaying.value = playing;
  }

  function clearError() {
    error.value = '';
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v));
    muted.value = false;
    storage.set('volume', volume.value);
    storage.set('muted', false);
  }

  function toggleMute() {
    muted.value = !muted.value;
    storage.set('muted', muted.value);
  }

  function togglePlayMode() {
    const modes: PlayMode[] = ['order', 'random', 'loop', 'single'];
    const idx = modes.indexOf(playMode.value);
    playMode.value = modes[(idx + 1) % modes.length];
    storage.set('playMode', playMode.value);
  }

  function setPreferredQuality(quality: AudioQuality) {
    preferredQuality.value = quality;
    storage.set('preferredQuality', quality);
  }

  function updateTime(ct: number, dur: number) {
    currentTime.value = ct;
    duration.value = dur;
    updateCurrentLyric();
  }

  async function loadLyric(song: Song) {
    try {
      const source = sourceManager.getSource(song.sourceId);
      if (!source?.getLyric) { lyric.value = null; return; }
      lyric.value = await source.getLyric(song);
      currentLyricIndex.value = -1;
    } catch { lyric.value = null; }
  }

  function updateCurrentLyric() {
    const lines = lyric.value?.lines;
    if (!lines?.length) return;

    const time = currentTime.value;
    let lo = 0;
    let hi = lines.length - 1;
    let index = -1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].time <= time) {
        index = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (index !== currentLyricIndex.value) currentLyricIndex.value = index;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // 节流持久化进度
  let lastPersistAt = 0;
  watch(
    () => [currentTime.value, isPlaying.value] as const,
    ([, playing]) => {
      const now = Date.now();
      if (!playing || now - lastPersistAt >= SESSION_SAVE_INTERVAL) {
        lastPersistAt = now;
        if (currentSong.value) persistSession();
      }
    },
  );

  return {
    currentSong, isPlaying, playMode, volume, muted, preferredQuality,
    currentTime, duration, loading, error, lyric, currentLyricIndex,
    queue, currentIndex, setQueue, recentPlays,
    favorites, favoriteCount, isFavorite, toggleFavorite,
    progress, formattedCurrentTime, formattedDuration, currentLyricText,
    playModeLabel, qualityCascade,
    playSong, resolvePlayUrl, togglePlay, setPlaying, clearError,
    setVolume, toggleMute, togglePlayMode, setPreferredQuality,
    updateTime, loadLyric, formatTime,
    addToHistory, clearRecentPlays, persistSession, restoreSession,
  };
});
