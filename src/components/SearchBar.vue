<template>
  <div class="search-box">
    <!-- 平台选择 -->
    <select
      v-model="search.currentSource"
      style="padding: 8px 10px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; border-radius: 6px 10px 8px 12px; font-size: 14px; background: rgba(255,255,255,0.8); color: #2d2d2d; flex-shrink: 0; cursor: pointer;"
    >
      <option value="">全部音源</option>
      <option v-for="s in search.sources" :key="s.id" :value="s.id">
        {{ s.name }}
      </option>
    </select>

    <!-- 搜索输入框 -->
    <div class="search-input-wrap">
      <input
        v-model="searchInput"
        @keyup.enter="handleSearch"
        @focus="showSearchHistory = true"
        @blur="hideSearchHistory"
        type="text"
        placeholder="搜索歌曲..."
        style="width: 100%; padding: 8px 36px 8px 12px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; border-radius: 6px 10px 8px 12px; font-size: 14px; background: rgba(255,255,255,0.8); color: #2d2d2d;"
      />
      <button
        @click="handleSearch"
        class="search-btn"
        style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
        v-html="SketchSearchIcon"
      ></button>

      <!-- 搜索历史下拉 -->
      <div
        v-if="showSearchHistory && searchHistory.length > 0"
        style="position: absolute; top: 100%; left: 0; right: 0; background: rgba(255,255,255,0.95); border: 2px solid #c4b5a0; border-top: none; border-radius: 0 0 8px 12px; max-height: 200px; overflow-y: auto; margin-top: -2px; z-index: 10;"
      >
        <div
          v-for="(item, idx) in searchHistory"
          :key="idx"
          @click="selectHistory(item.keyword)"
          style="padding: 8px 12px; border-bottom: 1px solid #e8dcc8; cursor: pointer; font-family: 'Ma Shan Zheng', cursive; color: #666; font-size: 14px; display: flex; justify-content: space-between; align-items: center;"
          @mouseenter="onHistoryItemEnter"
          @mouseleave="onHistoryItemLeave"
        >
          <span>{{ item.keyword }}</span>
          <span style="font-size: 12px; color: #aaa;">{{ item.source }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SketchSearchIcon } from './icons/SketchIcons';
import { useSearchStore } from '../stores/search';

interface SearchHistoryItem {
  keyword: string;
  source: string;
}

const search = useSearchStore();
const searchInput = ref('');
const showSearchHistory = ref(false);
const searchHistory = ref<SearchHistoryItem[]>([]);

async function handleSearch() {
  if (!searchInput.value.trim()) return;

  const kw = searchInput.value.trim();

  // 添加到搜索历史
  const exists = searchHistory.value.findIndex(h => h.keyword === kw);
  if (exists !== -1) searchHistory.value.splice(exists, 1);
  searchHistory.value.unshift({ keyword: kw, source: search.currentSource });
  if (searchHistory.value.length > 15) searchHistory.value = searchHistory.value.slice(0, 15);

  // 执行搜索
  await search.searchSongs(kw, search.currentSource);
}

function selectHistory(keyword: string) {
  searchInput.value = keyword;
  showSearchHistory.value = false;
  handleSearch();
}

function hideSearchHistory() {
  setTimeout(() => {
    showSearchHistory.value = false;
  }, 200);
}

function onHistoryItemEnter(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  if (target) target.style.background = 'rgba(200,180,160,0.1)';
}

function onHistoryItemLeave(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  if (target) target.style.background = 'transparent';
}
</script>

<style scoped>
.search-box {
  position: relative;
  width: 50%;
  min-width: 500px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

@media (max-width: 1024px) {
  .search-box {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .search-box {
    gap: 6px;
  }

  .search-box select {
    max-width: 110px;
    padding: 7px 8px !important;
    font-size: 12px !important;
  }

  .search-box input {
    padding: 7px 34px 7px 10px !important;
    font-size: 13px !important;
  }
}
</style>
