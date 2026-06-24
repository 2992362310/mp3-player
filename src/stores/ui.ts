import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
  }

  return { showLyricPanel, toggleLyricPanel };
});
