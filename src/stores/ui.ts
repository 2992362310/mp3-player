/**
 * UI 状态管理
 * 管理面板可见性等 UI 状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);
  const lyricMode = ref<'modal' | 'sidebar'>('modal'); // 歌词显示模式
  const showPlaylistPanel = ref(false);
  const showFavoritesPanel = ref(false);
  const showPlaylist = ref(false);

  /** 当前侧边栏选中项 */
  const activeSection = ref<'discover' | 'playlist' | 'favorites' | 'settings'>('discover');

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
  }

  function togglePlaylistPanel() {
    showPlaylistPanel.value = !showPlaylistPanel.value;
    showFavoritesPanel.value = false;
  }

  function toggleFavoritesPanel() {
    showFavoritesPanel.value = !showFavoritesPanel.value;
    showPlaylistPanel.value = false;
  }

  function togglePlaylist() {
    showPlaylist.value = !showPlaylist.value;
  }

  function setActiveSection(section: 'discover' | 'playlist' | 'favorites' | 'settings') {
    activeSection.value = section;
  }

  return {
    showLyricPanel,
    lyricMode,
    showPlaylistPanel,
    showFavoritesPanel,
    showPlaylist,
    activeSection,
    toggleLyricPanel,
    togglePlaylistPanel,
    toggleFavoritesPanel,
    togglePlaylist,
    setActiveSection,
  };
});
