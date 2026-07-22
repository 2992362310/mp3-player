<template>
  <div class="search-box">
    <select
      v-model="search.currentSource"
      class="search-source-select"
      @change="onSourceChanged"
    >
      <option value="">全部音源</option>
      <option v-for="s in search.enabledSources" :key="s.id" :value="s.id">
        {{ s.name }}
      </option>
    </select>

    <div class="search-input-wrap">
      <input
        v-model="searchInput"
        class="sketch-input"
        type="text"
        placeholder="搜索歌曲..."
        @keyup.enter="handleSearch"
        @focus="showSearchHistory = true"
        @blur="hideSearchHistory"
      />
      <button type="button" class="search-btn" @click="handleSearch">
        <SketchIcon name="search" :size="20" />
      </button>

      <div
        v-if="showSearchHistory && search.searchHistory.length > 0"
        class="search-history-dropdown"
      >
        <div
          v-for="(item, idx) in search.searchHistory"
          :key="idx"
          class="search-history-item"
          @click="selectHistory(item.keyword)"
        >
          <span>{{ item.keyword }}</span>
          <span class="meta">{{ item.source || '全部' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SketchIcon from './icons/SketchIcon.vue';
import { useSearchStore } from '../stores/search';

const search = useSearchStore();
const searchInput = ref('');
const showSearchHistory = ref(false);

onMounted(() => {
  if (search.keyword) searchInput.value = search.keyword;
  if (search.currentSource && !search.enabledSources.some((s) => s.id === search.currentSource)) {
    search.switchSource('');
  }
});

async function handleSearch() {
  if (!searchInput.value.trim()) return;

  const kw = searchInput.value.trim();
  search.addSearchHistory(kw, search.currentSource);
  await search.searchSongs(kw, search.currentSource);
}

function onSourceChanged(e: Event) {
  const sourceId = (e.target as HTMLSelectElement).value;
  search.switchSource(sourceId);
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
</script>
