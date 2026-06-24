<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <div style="width: 28px; height: 28px;" v-html="SketchMusicIcon"></div>
      </div>
      <div class="nav-center">
        <SearchBar />
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <main class="main-content">
        <div class="content-container">
          <DiscoverSection />
        </div>
      </main>

      <!-- 底部控制器 -->
      <PlayerBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSearchStore } from './stores/search';
import { usePlayerStore } from './stores/player';
import { useAudio } from './composables/useAudio';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { SketchMusicIcon } from './components/icons/SketchIcons';

import SearchBar from './components/SearchBar.vue';
import PlayerBar from './components/PlayerBar.vue';
import DiscoverSection from './components/sections/DiscoverSection.vue';

/* ========== 初始化 ========== */
const search = useSearchStore();
const player = usePlayerStore();
const { playSong } = useAudio();

useKeyboard();
useMediaSession();
search.loadSources();

// 加载推荐后自动播放第一首
onMounted(async () => {
  await search.loadRecommendations();
  if (!player.currentSong && player.searchResults.length > 0) {
    await playSong(player.searchResults[0]);
  }
});
</script>
