/**
 * UI 状态管理
 * 管理面板可见性等 UI 状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);
  const showFavoritesPanel = ref(false);

  /** 当前侧边栏选中项 */
  const activeSection = ref<'discover' | 'favorites' | 'settings'>('discover');

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
  }

  function toggleFavoritesPanel() {
    showFavoritesPanel.value = !showFavoritesPanel.value;
  }

  function setActiveSection(section: 'discover' | 'favorites' | 'settings') {
    activeSection.value = section;
  }

  return {
    showLyricPanel,
    showFavoritesPanel,
    activeSection,
    toggleLyricPanel,
    toggleFavoritesPanel,
    setActiveSection,
  };
});
