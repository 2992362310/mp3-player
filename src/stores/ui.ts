import { defineStore } from 'pinia';
import { ref } from 'vue';
import storage from '../core/storage';
import {
  applyThemeToDocument,
  defaultsForTheme,
  normalizeCustomize,
  normalizeTheme,
  type AppTheme,
  type ThemeCustomize,
} from '../core/theme';

export type { AppTheme, ThemeCustomize } from '../core/theme';

export const useUIStore = defineStore('ui', () => {
  const showLyricPanel = ref(false);
  const theme = ref<AppTheme>(normalizeTheme(storage.get<string>('appTheme', 'paper')));
  const customize = ref<ThemeCustomize>(
    normalizeCustomize(storage.get<Partial<ThemeCustomize>>('themeCustomize', defaultsForTheme(theme.value))),
  );
  const guideDismissed = ref(storage.get<boolean>('guideDismissed', false));
  const showOnboarding = ref(!guideDismissed.value);
  const keepScreenOn = ref(storage.get<boolean>('keepScreenOn', false));
  /** 跟唱模式：大字歌词 + 可选压低原唱 */
  const karaokeMode = ref(false);
  const karaokeSoftVocal = ref(storage.get<boolean>('karaokeSoftVocal', true));

  applyThemeToDocument(theme.value, customize.value);

  function persistCustomize() {
    storage.set('themeCustomize', customize.value);
    applyThemeToDocument(theme.value, customize.value);
  }

  function toggleLyricPanel() {
    showLyricPanel.value = !showLyricPanel.value;
    if (!showLyricPanel.value) karaokeMode.value = false;
  }

  function closeLyricPanel() {
    showLyricPanel.value = false;
    karaokeMode.value = false;
  }

  function setKaraokeMode(on: boolean) {
    karaokeMode.value = on;
    if (on) showLyricPanel.value = true;
  }

  function toggleKaraokeMode() {
    setKaraokeMode(!karaokeMode.value);
  }

  function setKaraokeSoftVocal(on: boolean) {
    karaokeSoftVocal.value = on;
    storage.set('karaokeSoftVocal', on);
  }

  function setTheme(nextTheme: AppTheme) {
    theme.value = nextTheme;
    storage.set('appTheme', nextTheme);
    // 切换预设时带上该预设的默认风格，但保留用户自选强调色
    const next = defaultsForTheme(nextTheme);
    next.accent = customize.value.accent;
    customize.value = next;
    persistCustomize();
  }

  function patchCustomize(patch: Partial<ThemeCustomize>) {
    customize.value = normalizeCustomize({ ...customize.value, ...patch });
    persistCustomize();
  }

  function resetCustomize() {
    customize.value = defaultsForTheme(theme.value);
    persistCustomize();
  }

  function setKeepScreenOn(next: boolean) {
    keepScreenOn.value = next;
    storage.set('keepScreenOn', next);
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
    customize,
    showOnboarding,
    keepScreenOn,
    karaokeMode,
    karaokeSoftVocal,
    toggleLyricPanel,
    closeLyricPanel,
    setKaraokeMode,
    toggleKaraokeMode,
    setKaraokeSoftVocal,
    setTheme,
    patchCustomize,
    resetCustomize,
    setKeepScreenOn,
    closeOnboarding,
    openOnboarding,
  };
});
