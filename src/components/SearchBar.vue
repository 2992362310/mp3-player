<template>
  <div class="search-box">
    <SketchSelect
      v-model="currentSource"
      class="search-source-select-wrap"
      trigger-class="search-source-select"
      :options="sourceOptions"
    />

    <div ref="inputWrapEl" class="search-input-wrap">
      <input
        ref="inputEl"
        v-model="searchInput"
        class="sketch-input"
        type="text"
        placeholder="搜索歌曲..."
        autocomplete="off"
        @keydown="onInputKeydown"
        @keyup.enter="onEnter"
        @focus="openHistory"
        @blur="onInputBlur"
        @input="onInputChange"
      />
      <button
        v-if="searchInput"
        type="button"
        class="search-clear-btn"
        title="清空"
        aria-label="清空输入"
        @mousedown.prevent
        @click="clearInput"
      >
        ×
      </button>
      <button type="button" class="search-btn" @click="handleSearch">
        <SketchIcon name="search" :size="20" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showSearchHistory && historyPanelVisible"
        class="search-history-dropdown"
        :style="historyStyle"
        @pointerdown.prevent
      >
        <div class="search-history-dropdown-header">
          <span>{{ historyTitle }}</span>
          <button
            v-if="filteredHistory.length > 0"
            type="button"
            class="search-history-clear"
            @click="clearAllHistory"
          >
            清空
          </button>
        </div>

        <div v-if="filteredHistory.length === 0" class="search-history-empty">
          无匹配的搜索历史
        </div>

        <button
          v-for="(item, idx) in filteredHistory"
          :key="`${item.keyword}-${item.source}`"
          type="button"
          class="search-history-item"
          :class="{ active: idx === activeIndex }"
          @pointerdown.prevent="selectHistory(item)"
          @mouseenter="activeIndex = idx"
        >
          <span class="search-history-keyword">{{ item.keyword }}</span>
          <span class="meta">{{ sourceLabel(item.source) }}</span>
          <span
            class="search-history-remove"
            title="删除"
            role="button"
            @pointerdown.prevent.stop="removeHistory(item)"
          >
            ×
          </span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, inject, watch, nextTick } from 'vue';
import SketchIcon from './icons/SketchIcon.vue';
import { useSearchStore, type SearchHistoryItem } from '../stores/search';
import SketchSelect from './SketchSelect.vue';

const search = useSearchStore();
const searchInput = ref('');
const showSearchHistory = ref(false);
const activeIndex = ref(-1);
const inputEl = ref<HTMLInputElement | null>(null);
const inputWrapEl = ref<HTMLElement | null>(null);
const historyStyle = ref<Record<string, string>>({});
const goDiscover = inject<() => void>('goDiscover');

const sourceOptions = computed(() =>
  search.enabledSources.map((s) => ({ label: s.name, value: s.id })),
);

const currentSource = computed({
  get: () => search.currentSource,
  set: (sourceId: string) => {
    search.switchSource(sourceId);
  },
});

const filteredHistory = computed(() => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return search.searchHistory;
  return search.searchHistory.filter((item) =>
    item.keyword.toLowerCase().includes(q),
  );
});

const historyPanelVisible = computed(
  () => search.searchHistory.length > 0,
);

const historyTitle = computed(() => {
  const q = searchInput.value.trim();
  if (!q) return '搜索历史';
  return filteredHistory.value.length ? '匹配历史' : '搜索历史';
});

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function updateHistoryPosition() {
  const wrap = inputWrapEl.value;
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const maxHeight = Math.min(320, Math.max(160, viewportH - rect.bottom - 12));
  historyStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: '2300',
  };
}

onMounted(() => {
  if (search.keyword) searchInput.value = search.keyword;
  if (!search.currentSource || !search.enabledSources.some((s) => s.id === search.currentSource)) {
    const fallback = search.enabledSources.find((s) => s.id === 'netease')?.id
      || search.enabledSources[0]?.id;
    if (fallback) search.switchSource(fallback);
  }
  window.addEventListener('resize', updateHistoryPosition);
  window.addEventListener('scroll', updateHistoryPosition, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHistoryPosition);
  window.removeEventListener('scroll', updateHistoryPosition, true);
});

watch(
  () => showSearchHistory.value && historyPanelVisible.value,
  (visible) => {
    if (visible) void nextTick(updateHistoryPosition);
  },
);

watch(filteredHistory, () => {
  if (activeIndex.value >= filteredHistory.value.length) {
    activeIndex.value = filteredHistory.value.length > 0 ? 0 : -1;
  }
});

function sourceLabel(sourceId: string) {
  if (!sourceId) {
    return search.currentSource
      ? (search.sources.find((s) => s.id === search.currentSource)?.name || search.currentSource)
      : '—';
  }
  return search.sources.find((s) => s.id === sourceId)?.name || sourceId;
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function openHistory() {
  clearHideTimer();
  showSearchHistory.value = true;
  activeIndex.value = -1;
  void nextTick(updateHistoryPosition);
}

function onInputChange() {
  if (!showSearchHistory.value && search.searchHistory.length > 0) {
    showSearchHistory.value = true;
  }
  activeIndex.value = -1;
  void nextTick(updateHistoryPosition);
}

function onInputBlur() {
  clearHideTimer();
  hideTimer = setTimeout(() => {
    showSearchHistory.value = false;
    activeIndex.value = -1;
    hideTimer = null;
  }, 180);
}

function clearInput() {
  searchInput.value = '';
  activeIndex.value = -1;
  inputEl.value?.focus();
  openHistory();
}

function clearAllHistory() {
  search.clearSearchHistory();
  activeIndex.value = -1;
  showSearchHistory.value = false;
  inputEl.value?.focus();
}

function removeHistory(item: SearchHistoryItem) {
  search.removeSearchHistory(item.keyword);
  if (!search.searchHistory.length) {
    showSearchHistory.value = false;
    activeIndex.value = -1;
  }
  inputEl.value?.focus();
}

function onInputKeydown(e: KeyboardEvent) {
  if (!showSearchHistory.value || !filteredHistory.value.length) {
    if (e.key === 'Escape') {
      showSearchHistory.value = false;
      activeIndex.value = -1;
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value =
      activeIndex.value < 0
        ? 0
        : (activeIndex.value + 1) % filteredHistory.value.length;
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value =
      activeIndex.value <= 0
        ? filteredHistory.value.length - 1
        : activeIndex.value - 1;
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    showSearchHistory.value = false;
    activeIndex.value = -1;
  }
}

function onEnter() {
  if (
    showSearchHistory.value
    && activeIndex.value >= 0
    && filteredHistory.value[activeIndex.value]
  ) {
    selectHistory(filteredHistory.value[activeIndex.value]);
    return;
  }
  void handleSearch();
}

async function handleSearch() {
  if (!searchInput.value.trim()) return;

  const kw = searchInput.value.trim();
  searchInput.value = kw;
  showSearchHistory.value = false;
  activeIndex.value = -1;
  goDiscover?.();
  search.addSearchHistory(kw, search.currentSource);
  if (search.restoreQuickSearch(kw, search.currentSource)) return;
  await search.searchSongs(kw, search.currentSource);
}

function selectHistory(item: SearchHistoryItem) {
  clearHideTimer();
  searchInput.value = item.keyword;
  showSearchHistory.value = false;
  activeIndex.value = -1;

  if (item.source && search.enabledSources.some((s) => s.id === item.source)) {
    search.switchSource(item.source);
  }

  inputEl.value?.focus();
  void handleSearch();
}
</script>
