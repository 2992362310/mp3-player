import { defineStore } from 'pinia';
import { ref } from 'vue';
import storage from '../core/storage';

export type AppTheme = 'paper' | 'sand' | 'mint';

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);
  const theme = ref<AppTheme>(storage.get<AppTheme>('appTheme', 'paper'));
  const guideDismissed = ref(storage.get<boolean>('guideDismissed', false));
  const showOnboarding = ref(!guideDismissed.value);

  applyTheme(theme.value);

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
  }

  function setTheme(nextTheme: AppTheme) {
    theme.value = nextTheme;
    storage.set('appTheme', nextTheme);
    applyTheme(nextTheme);
  }

  function closeOnboarding() {
    showOnboarding.value = false;
    guideDismissed.value = true;
    storage.set('guideDismissed', true);
  }

  function openOnboarding() {
    showOnboarding.value = true;
  }

  return {
    showLyricPanel,
    theme,
    showOnboarding,
    toggleLyricPanel,
    setTheme,
    closeOnboarding,
    openOnboarding,
  };
});
