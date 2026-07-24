<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <PwaInstallBanner :active-section="activeSection" />

    <div v-if="ui.showOnboarding" class="guide-backdrop" @click.self="ui.closeOnboarding()">
      <section class="guide-card">
        <h2>欢迎使用 MoYun</h2>
        <ol>
          <li>先在顶部输入歌曲名，按回车搜索。</li>
          <li>点击列表歌曲即可播放；点 + 可加入自建歌单。</li>
          <li>「我的」里可管理收藏和歌单；设置里可看快捷键。</li>
          <li>播放时按 K 或点麦克风可进入跟唱：大字歌词、可选压低原唱。</li>
          <li>在手机浏览器里可添加到主屏幕，像 App 一样使用。</li>
        </ol>
        <div class="guide-actions">
          <button class="btn-action" @click="ui.closeOnboarding()">我知道了</button>
        </div>
      </section>
    </div>

    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <div class="logo" title="墨韵 MoYun" aria-label="墨韵">
          <span class="logo-mark">墨</span><span class="logo-rest">韵</span>
        </div>
      </div>
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
          <SketchIcon :name="section.iconId" :size="20" />
        </button>
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <main class="main-content">
        <div class="app-stage">
          <div class="app-stage-main">
            <DiscoverSection v-if="activeSection === 'discover'" />
            <FavoritesSection v-if="activeSection === 'favorites'" />
            <SettingsSection v-if="activeSection === 'settings'" />
          </div>
          <LyricPanel />
        </div>
      </main>

      <!-- 底部控制器 -->
      <PlayerBar />
    </div>

    <AddToPlaylistModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useSearchStore } from './stores/search';
import { usePlayerStore } from './stores/player';
import { useUIStore } from './stores/ui';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { useWakeLock } from './composables/useWakeLock';
import { useAudio } from './composables/useAudio';
import SketchIcon from './components/icons/SketchIcon.vue';
import type { SketchIconName } from './components/icons/SketchIcon.vue';

import SearchBar from './components/SearchBar.vue';
import PlayerBar from './components/PlayerBar.vue';
import LyricPanel from './components/LyricPanel.vue';
import AddToPlaylistModal from './components/AddToPlaylistModal.vue';
import PwaInstallBanner from './components/PwaInstallBanner.vue';
import DiscoverSection from './components/sections/DiscoverSection.vue';
import FavoritesSection from './components/sections/FavoritesSection.vue';
import SettingsSection from './components/sections/SettingsSection.vue';

type SectionId = 'discover' | 'favorites' | 'settings';

interface Section {
  id: SectionId;
  label: string;
  iconId: SketchIconName;
}

/* ========== 状态 ========== */
const search = useSearchStore();
const player = usePlayerStore();
const ui = useUIStore();
const { keepScreenOn, karaokeMode } = storeToRefs(ui);
const { isPlaying } = storeToRefs(player);
const { restoreLastSession } = useAudio();
const activeSection = ref<SectionId>('discover');

const sections = computed<Section[]>(() => [
  { id: 'discover', label: '发现音乐', iconId: 'music' },
  { id: 'favorites', label: '我的', iconId: 'heart' },
  { id: 'settings', label: '设置', iconId: 'settings' },
]);

const keepAwakeActive = computed(
  () => isPlaying.value && (keepScreenOn.value || karaokeMode.value),
);

provide('goDiscover', () => {
  activeSection.value = 'discover';
});

/* ========== 初始化 ========== */
useKeyboard();
useMediaSession();
useWakeLock(keepAwakeActive);
search.loadSources();

onMounted(async () => {
  await restoreLastSession();
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
  background: var(--paper-bg);
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 18px 18px 14px;
  color: var(--ink);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  animation: modalIn 0.22s ease-out;
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

.app-stage {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
}

.app-stage-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
