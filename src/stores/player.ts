import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song, Lyric } from '../core/sources/types';
import { sourceManager } from '../core/sources/SourceManager';
import storage from '../core/storage';

export type PlayMode = 'order' | 'random' | 'loop' | 'single';

export const usePlayerStore = defineStore('player', () => {
  const currentSong = ref<Song | null>(null);
  const isPlaying = ref(false);
  const playMode = ref<PlayMode>(storage.get<PlayMode>('playMode', 'order'));
  const volume = ref(storage.get<number>('volume', 0.8));
  const muted = ref(storage.get<boolean>('muted', false));
  const currentTime = ref(0);
  const duration = ref(0);
  const loading = ref(false);
  const error = ref('');
  const lyric = ref<Lyric | null>(null);
  const currentLyricIndex = ref(-1);

  // 搜索结果（作为播放上下文）
  const searchResults = ref<Song[]>([]);
  const currentIndex = ref(-1);

  // 收藏
  function safeGetSongs(key: string): Song[] {
    const val = storage.get<Song[]>(key, []);
    return Array.isArray(val) ? val : [];
  }

  const favorites = ref<Song[]>(safeGetSongs('favorites'));
  const favoriteCount = computed(() => favorites.value.length);

  function isFavorite(song: Song): boolean {
    return favorites.value.some(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
  }

  function toggleFavorite(song: Song) {
    const idx = favorites.value.findIndex(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
    if (idx !== -1) {
      favorites.value.splice(idx, 1);
    } else {
      favorites.value.push(song);
    }
    storage.set('favorites', favorites.value);
  }

  // 计算属性
  const progress = computed(() =>
    duration.value === 0 ? 0 : (currentTime.value / duration.value) * 100,
  );
  const formattedCurrentTime = computed(() => formatTime(currentTime.value));
  const formattedDuration = computed(() => formatTime(duration.value));
  const currentLyricText = computed(() => {
    if (!lyric.value?.lines) return '';
    return lyric.value.lines[currentLyricIndex.value]?.text ?? '';
  });
  const playModeIcon = computed(() => {
    const icons: Record<PlayMode, string> = {
      order: 'mdi:repeat', random: 'mdi:shuffle',
      loop: 'mdi:repeat-once', single: 'mdi:repeat-once',
    };
    return icons[playMode.value];
  });
  const playModeLabel = computed(() => {
    const labels: Record<PlayMode, string> = {
      order: '顺序播放', random: '随机播放',
      loop: '列表循环', single: '单曲循环',
    };
    return labels[playMode.value];
  });

  // 播放控制
  async function playSong(song: Song): Promise<string | null> {
    loading.value = true;
    error.value = '';
    try {
      const url = await sourceManager.getPlayUrl(song);
      if (!url) throw new Error('无法获取播放地址');
      currentSong.value = song;
      const idx = searchResults.value.findIndex(
        (s) => s.id === song.id && s.sourceId === song.sourceId,
      );
      if (idx !== -1) currentIndex.value = idx;
      loadLyric(song);
      return url;
    } catch (e) {
      console.error('[Player] 播放失败:', e);
      error.value = '播放失败，请尝试其他歌曲';
      return null;
    } finally {
      loading.value = false;
    }
  }

  function togglePlay() {
    if (!currentSong.value) return;
    isPlaying.value = !isPlaying.value;
  }

  function seekTo(time: number) {
    currentTime.value = Math.max(0, Math.min(time, duration.value));
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

  function updateTime(ct: number, dur: number) {
    currentTime.value = ct;
    duration.value = dur;
    updateCurrentLyric();
  }

  // 歌词
  async function loadLyric(song: Song) {
    try {
      const source = sourceManager.getSource(song.sourceId);
      if (!source?.getLyric) { lyric.value = null; return; }
      lyric.value = await source.getLyric(song);
      currentLyricIndex.value = -1;
    } catch { lyric.value = null; }
  }

  function updateCurrentLyric() {
    if (!lyric.value?.lines?.length) return;
    const time = currentTime.value;
    let index = -1;
    for (let i = 0; i < lyric.value.lines.length; i++) {
      if (lyric.value.lines[i].time <= time) index = i;
      else break;
    }
    if (index !== currentLyricIndex.value) currentLyricIndex.value = index;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return {
    currentSong, isPlaying, playMode, volume, muted,
    currentTime, duration, loading, error, lyric, currentLyricIndex,
    searchResults, currentIndex,
    favorites, favoriteCount, isFavorite, toggleFavorite,
    progress, formattedCurrentTime, formattedDuration, currentLyricText,
    playModeIcon, playModeLabel,
    playSong, togglePlay, seekTo, setVolume, toggleMute, togglePlayMode,
    updateTime, loadLyric, formatTime,
  };
});
