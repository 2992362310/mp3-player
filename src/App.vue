<template>
  <div :class="['h-screen flex flex-col overflow-hidden', { 'mobile-keyboard-open': isMobileKeyboardOpen }]">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <div class="logo" style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px;" v-html="SketchMusicIcon"></div>
          <span>手绘播放器</span>
        </div>
      </div>
      <div class="nav-center">
        <SearchBar />
      </div>
      <div class="nav-right" style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px;" v-html="SketchPencilIcon"></div>
        <span>云听</span>
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <ul>
            <li v-for="section in sections" :key="section.id" :class="['nav-item', activeSection === section.id ? 'active' : '']">
              <a @click.prevent="activeSection = section.id" href="#">
                <span class="icon" style="width: 24px; height: 24px;" v-html="getIconHtml(section.iconId)"></span>
                <span class="text">{{ section.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <div class="flex flex-col flex-1 overflow-hidden" style="min-width: 0;">
        <main class="main-content">
          <div class="content-container">
            <DiscoverSection v-if="activeSection === 'discover'" />
            <FavoritesSection v-if="activeSection === 'favorites'" />
            <SettingsSection v-if="activeSection === 'settings'" />
          </div>
        </main>

        <!-- 移动端底部 Tab 导航 -->
        <nav class="mobile-tabbar" aria-label="移动端页面导航">
          <button
            v-for="section in sections"
            :key="`mobile-${section.id}`"
            :class="['mobile-tab-item', activeSection === section.id ? 'active' : '']"
            @click="activeSection = section.id"
            type="button"
          >
            <span class="mobile-tab-icon" v-html="getIconHtml(section.iconId)"></span>
            <span class="mobile-tab-text">{{ section.label }}</span>
          </button>
        </nav>

        <!-- 底部控制器 -->
        <PlayerBar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, computed } from 'vue';
import { useSearchStore } from './stores/search';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { SketchMusicIcon, SketchHeartIcon, SketchSettingsIcon, SketchPencilIcon } from './components/icons/SketchIcons';

import SearchBar from './components/SearchBar.vue';
import PlayerBar from './components/PlayerBar.vue';
import DiscoverSection from './components/sections/DiscoverSection.vue';
import FavoritesSection from './components/sections/FavoritesSection.vue';
import SettingsSection from './components/sections/SettingsSection.vue';

type SectionId = 'discover' | 'favorites' | 'settings';

interface Section {
  id: SectionId;
  label: string;
  iconId: 'music' | 'heart' | 'settings';
}

/* ========== 状态 ========== */
const search = useSearchStore();

/* ========== 初始化 ========== */
useKeyboard();
useMediaSession();
search.loadSources();

/* ========== 导航配置 ========== */
const sections = computed<Section[]>(() => [
  { id: 'discover', label: '发现音乐', iconId: 'music' },
  { id: 'favorites', label: '我的收藏', iconId: 'heart' },
  { id: 'settings', label: '设置', iconId: 'settings' },
]);

const activeSection = ref<SectionId>('discover');
const isMobileKeyboardOpen = ref(false);

let baseViewportHeight = 0;
let isTextInputFocused = false;

function isTextInput(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

function updateMobileKeyboardState() {
  if (window.innerWidth > 768) {
    isMobileKeyboardOpen.value = false;
    return;
  }

  const currentHeight = window.visualViewport?.height ?? window.innerHeight;
  const diff = baseViewportHeight - currentHeight;
  isMobileKeyboardOpen.value = isTextInputFocused && diff > 120;
}

function handleFocusIn(event: FocusEvent) {
  isTextInputFocused = isTextInput(event.target);
  updateMobileKeyboardState();
}

function handleFocusOut() {
  isTextInputFocused = false;
  isMobileKeyboardOpen.value = false;
}

function handleViewportResize() {
  if (window.innerWidth > 768) {
    isMobileKeyboardOpen.value = false;
    return;
  }

  if (!isTextInputFocused) {
    baseViewportHeight = Math.max(baseViewportHeight, window.visualViewport?.height ?? window.innerHeight);
    return;
  }

  updateMobileKeyboardState();
}

function getIconHtml(iconId: string): string {
  const iconMap: Record<string, string> = {
    music: SketchMusicIcon,
    heart: SketchHeartIcon,
    settings: SketchSettingsIcon,
  };
  return iconMap[iconId] || '';
}

// 初始化：如果有播放列表，播放第一首
onMounted(async () => {
  baseViewportHeight = window.visualViewport?.height ?? window.innerHeight;
  window.addEventListener('focusin', handleFocusIn);
  window.addEventListener('focusout', handleFocusOut);
  window.visualViewport?.addEventListener('resize', handleViewportResize);
  window.addEventListener('resize', handleViewportResize);

  await search.loadRecommendations();
});

onBeforeUnmount(() => {
  window.removeEventListener('focusin', handleFocusIn);
  window.removeEventListener('focusout', handleFocusOut);
  window.visualViewport?.removeEventListener('resize', handleViewportResize);
  window.removeEventListener('resize', handleViewportResize);
});
</script>
