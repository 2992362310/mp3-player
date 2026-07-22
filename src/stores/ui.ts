import { defineStore } from 'pinia';
import { ref } from 'vue';
import storage from '../core/storage';

export type AppTheme = 'paper' | 'sand' | 'mint' | 'ink' | 'celadon' | 'cinnabar';

const THEME_IDS: AppTheme[] = ['paper', 'sand', 'mint', 'ink', 'celadon', 'cinnabar'];

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function normalizeTheme(value: string | null | undefined): AppTheme {
  return THEME_IDS.includes(value as AppTheme) ? (value as AppTheme) : 'paper';
}

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);
  const theme = ref<AppTheme>(normalizeTheme(storage.get<string>('appTheme', 'paper')));
  const guideDismissed = ref(storage.get<boolean>('guideDismissed', false));
  const showOnboarding = ref(!guideDismissed.value);

  applyTheme(theme.value);

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
  }

  function closeLyricPanel() {
    showLyricPanel.value = false;
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
    closeLyricPanel,
    setTheme,
    closeOnboarding,
    openOnboarding,
  };
});
