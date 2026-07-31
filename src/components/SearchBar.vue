<template>
  <div class="search-box">
    <SketchSelect
      v-model="currentSource"
      class="search-source-select-wrap"
      trigger-class="search-source-select"
      :options="sourceOptions"
    />

    <div class="search-input-wrap">
      <input
        ref="inputEl"
        v-model="searchInput"
        class="sketch-input"
        type="text"
        placeholder="搜索歌曲..."
        @keyup.enter="handleSearch"
        @focus="showSearchHistory = true"
        @blur="onInputBlur"
      />
      <button type="button" class="search-btn" @click="handleSearch">
        <SketchIcon name="search" :size="20" />
      </button>

      <div
        v-if="showSearchHistory && search.searchHistory.length > 0"
        class="search-history-dropdown"
        @pointerdown.prevent
      >
        <button
          v-for="(item, idx) in search.searchHistory"
          :key="idx"
          type="button"
          class="search-history-item"
          @pointerdown.prevent="selectHistory(item)"
        >
          <span>{{ item.keyword }}</span>
          <span class="meta">{{ sourceLabel(item.source) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, inject } from 'vue';
import SketchIcon from './icons/SketchIcon.vue';
import { useSearchStore, type SearchHistoryItem } from '../stores/search';
import SketchSelect from './SketchSelect.vue';

const search = useSearchStore();
const searchInput = ref('');
const showSearchHistory = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);
const goDiscover = inject<() => void>('goDiscover');

const sourceOptions = computed(() => [
  { label: '全部音源', value: '' },
  ...search.enabledSources.map((s) => ({ label: s.name, value: s.id })),
]);

const currentSource = computed({
  get: () => search.currentSource,
  set: (sourceId: string) => {
    search.switchSource(sourceId);
  },
});

let hideTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  if (search.keyword) searchInput.value = search.keyword;
  if (search.currentSource && !search.enabledSources.some((s) => s.id === search.currentSource)) {
    search.switchSource('');
  }
});

function sourceLabel(sourceId: string) {
  if (!sourceId) return '全部';
  return search.sources.find((s) => s.id === sourceId)?.name || sourceId;
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function onInputBlur() {
  clearHideTimer();
  hideTimer = setTimeout(() => {
    showSearchHistory.value = false;
    hideTimer = null;
  }, 180);
}

async function handleSearch() {
  if (!searchInput.value.trim()) return;

  const kw = searchInput.value.trim();
  searchInput.value = kw;
  goDiscover?.();
  search.addSearchHistory(kw, search.currentSource);
  if (search.restoreQuickSearch(kw, search.currentSource)) return;
  await search.searchSongs(kw, search.currentSource);
}

function selectHistory(item: SearchHistoryItem) {
  clearHideTimer();
  searchInput.value = item.keyword;
  showSearchHistory.value = false;

  if (item.source) {
    const enabled = search.enabledSources.some((s) => s.id === item.source);
    search.switchSource(enabled ? item.source : '');
  } else {
    search.switchSource('');
  }

  inputEl.value?.focus();
  void handleSearch();
}
</script>
