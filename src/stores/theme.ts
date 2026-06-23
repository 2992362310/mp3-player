/**
 * 主题状态管理
 * 支持水墨风格主题
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import storage from '../core/storage';

export type ThemeStyle = 'moyun';

export const useThemeStore = defineStore('theme', () => {
  const style = ref<ThemeStyle>(storage.get<ThemeStyle>('themeStyle', 'moyun'));

  /** 应用主题到 DOM */
  function applyTheme() {
    const root = document.documentElement;
    const themeMap: Record<ThemeStyle, string> = {
      moyun: 'moyun',
    };

    root.setAttribute('data-theme', themeMap[style.value] || 'moyun');
    root.classList.remove('theme-moyun');
    root.classList.add(`theme-${style.value}`);
  }

  function setStyle(s: ThemeStyle) {
    style.value = s;
    storage.set('themeStyle', s);
    applyTheme();
  }

  // 初始化
  applyTheme();

  return { style, setStyle, applyTheme };
});
