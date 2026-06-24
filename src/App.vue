<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-center">
        <SearchBar />
      </div>
      <div class="nav-right">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-icon-btn', activeSection === section.id ? 'active' : '']"
          @click="activeSection = section.id"
          :title="section.label"
        >
          <span style="width: 20px; height: 20px;" v-html="getIconHtml(section.iconId)"></span>
        </button>
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <main class="main-content">
        <div class="content-container">
          <DiscoverSection v-if="activeSection === 'discover'" />
          <FavoritesSection v-if="activeSection === 'favorites'" />
          <SettingsSection v-if="activeSection === 'settings'" />
        </div>
      </main>

      <!-- 底部控制器 -->
      <PlayerBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSearchStore } from './stores/search';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { SketchMusicIcon, SketchHeartIcon, SketchSettingsIcon } from './components/icons/SketchIcons';

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
const activeSection = ref<SectionId>('discover');

const sections = computed<Section[]>(() => [
  { id: 'discover', label: '发现音乐', iconId: 'music' },
  { id: 'favorites', label: '我的收藏', iconId: 'heart' },
  { id: 'settings', label: '设置', iconId: 'settings' },
]);

function getIconHtml(iconId: string): string {
  const iconMap: Record<string, string> = {
    music: SketchMusicIcon,
    heart: SketchHeartIcon,
    settings: SketchSettingsIcon,
  };
  return iconMap[iconId] || '';
}

/* ========== 初始化 ========== */
useKeyboard();
useMediaSession();
search.loadSources();

onMounted(async () => {
  await search.loadRecommendations();
});
</script>
