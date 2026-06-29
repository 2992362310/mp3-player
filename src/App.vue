<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <PwaInstallBanner :active-section="activeSection" />

    <div v-if="ui.showOnboarding" class="guide-backdrop" @click.self="ui.closeOnboarding()">
      <section class="guide-card">
        <h2>欢迎使用 MoYun</h2>
        <ol>
          <li>先在顶部输入歌曲名，按回车搜索。</li>
          <li>双击列表歌曲可播放，底部可调音量和模式。</li>
          <li>点击右上角齿轮进入设置，可切换主题和音源。</li>
          <li>在手机浏览器里可添加到主屏幕，像 App 一样使用。</li>
        </ol>
        <div class="guide-actions">
          <button class="btn-action" @click="ui.closeOnboarding()">我知道了</button>
        </div>
      </section>
    </div>

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
import { useUIStore } from './stores/ui';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { SketchMusicIcon, SketchHeartIcon, SketchSettingsIcon } from './components/icons/SketchIcons';

import SearchBar from './components/SearchBar.vue';
import PlayerBar from './components/PlayerBar.vue';
import PwaInstallBanner from './components/PwaInstallBanner.vue';
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
const ui = useUIStore();
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

<style scoped>
.guide-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(25, 25, 25, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.guide-card {
  width: min(92vw, 520px);
  background: #fdf6e3;
  border: 2px dashed #c4b5a0;
  border-radius: 12px;
  padding: 18px 18px 14px;
  color: #2d2d2d;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.guide-card h2 {
  margin: 0 0 10px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 24px;
}

.guide-card ol {
  margin: 0;
  padding-left: 20px;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color: #5f5f5f;
  line-height: 1.65;
  font-size: 14px;
}

.guide-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
