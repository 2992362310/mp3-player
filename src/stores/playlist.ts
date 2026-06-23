/**
 * 播放列表 & 收藏状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song } from '../core/sources/types';
import { usePlayerStore } from './player';
import storage from '../core/storage';

export const usePlaylistStore = defineStore('playlist', () => {
  // 防御性读取：localStorage 旧数据可能不是数组
  function safeGetSongs(key: string): Song[] {
    const val = storage.get<Song[]>(key, []);
    return Array.isArray(val) ? val : [];
  }

  const playlist = ref<Song[]>(safeGetSongs('playlist'));
  const favorites = ref<Song[]>(safeGetSongs('favorites'));
  const currentIndex = ref(storage.get<number>('currentIndex', -1));

  const playlistCount = computed(() => playlist.value.length);
  const favoriteCount = computed(() => favorites.value.length);

  /** 判断歌曲是否在收藏中 */
  function isFavorite(song: Song): boolean {
    return favorites.value.some(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
  }

  // ==================== 播放列表 ====================

  function addToPlaylist(song: Song) {
    const exists = playlist.value.some(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
    if (!exists) {
      playlist.value.push(song);
      save();
    }
  }

  function addAllToPlaylist(songs: Song[]) {
    songs.forEach((song) => {
      const exists = playlist.value.some(
        (s) => s.id === song.id && s.sourceId === song.sourceId,
      );
      if (!exists) playlist.value.push(song);
    });
    save();
  }

  function removeFromPlaylist(index: number) {
    if (index < 0 || index >= playlist.value.length) return;
    playlist.value.splice(index, 1);
    if (currentIndex.value >= playlist.value.length) {
      currentIndex.value = playlist.value.length - 1;
    }
    save();
  }

  function clearPlaylist() {
    playlist.value = [];
    currentIndex.value = -1;
    save();
    const player = usePlayerStore();
    player.currentSong = null;
    player.isPlaying = false;
  }

  function setCurrentIndex(index: number) {
    if (index >= -1 && index < playlist.value.length) {
      currentIndex.value = index;
      save();
    }
  }

  // ==================== 收藏 ====================

  function addToFavorite(song: Song) {
    if (!isFavorite(song)) {
      favorites.value.push(song);
      saveFavorites();
    }
  }

  function removeFromFavorite(song: Song) {
    const idx = favorites.value.findIndex(
      (s) => s.id === song.id && s.sourceId === song.sourceId,
    );
    if (idx !== -1) {
      favorites.value.splice(idx, 1);
      saveFavorites();
    }
  }

  function toggleFavorite(song: Song) {
    if (isFavorite(song)) removeFromFavorite(song);
    else addToFavorite(song);
  }

  function clearFavorites() {
    favorites.value = [];
    saveFavorites();
  }

  // ==================== 持久化 ====================

  function save() {
    storage.set('playlist', playlist.value);
    storage.set('currentIndex', currentIndex.value);
  }

  function saveFavorites() {
    storage.set('favorites', favorites.value);
  }

  /** 恢复当前播放歌曲索引 */
  function restoreCurrentSong() {
    const player = usePlayerStore();
    if (playlist.value.length > 0 && currentIndex.value >= 0) {
      player.currentSong = playlist.value[currentIndex.value] ?? null;
    }
  }

  return {
    playlist,
    favorites,
    currentIndex,
    playlistCount,
    favoriteCount,
    isFavorite,
    addToPlaylist,
    addAllToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    setCurrentIndex,
    addToFavorite,
    removeFromFavorite,
    toggleFavorite,
    clearFavorites,
    restoreCurrentSong,
  };
});
