<template>
  <div class="content-section discover-section">
    <div v-if="search.error" class="search-error" role="alert">{{ search.error }}</div>

    <div
      v-if="showResultsPanel"
      class="results-panel sketch-card sketch-card-ghost"
    >
      <div
        v-if="search.loading && search.results.length === 0"
        class="results-loading"
      >
        <div class="spinner"></div>
        <p>搜索中...</p>
      </div>

      <template v-else>
        <div class="filter-bar">
          <SketchSelect
            v-model="filterSourceId"
            class="filter-select-wrap"
            trigger-class="filter-select"
            menu-class="filter-select-menu"
            :options="sourceFilterOptions"
          />
          <SketchSelect
            v-model="filterArtist"
            class="filter-select-wrap"
            trigger-class="filter-select"
            menu-class="filter-select-menu"
            :options="artistFilterOptions"
          />
          <button
            type="button"
            class="discover-reset-btn"
            title="返回推荐歌手"
            @click="backToDiscover"
          >
            <svg
              class="discover-reset-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 8h7.5" />
              <path d="M6 4.5L2.5 8L6 11.5" />
              <path d="M9.5 4.5h2a2 2 0 0 1 2 2v3" />
            </svg>
            <span class="discover-reset-text">推荐歌手</span>
          </button>
        </div>

        <div class="results-scroll main-scroll">
          <div v-if="search.results.length === 0" class="filter-empty search-empty-tip">
            <p>未找到「{{ search.keyword }}」相关歌曲</p>
            <p class="search-empty-sub">试试换个关键词、切换顶部音源，或返回推荐歌手继续探索</p>
            <div class="search-empty-actions">
              <button type="button" class="btn-action" @click="retrySearch">再搜一次</button>
              <button type="button" class="discover-reset-btn" @click="backToDiscover">推荐歌手</button>
            </div>
          </div>

          <div v-else-if="filteredResults.length === 0" class="filter-empty">没有符合筛选条件的歌曲</div>

          <VirtualSongList
            v-else-if="useVirtual"
            fill
            :songs="filteredResults"
            :current-song="player.currentSong"
            :is-playing="player.isPlaying"
            :loading="player.loading"
            :is-favorite="player.isFavorite"
            @play="playTrack"
            @toggle-favorite="player.toggleFavorite"
            @toggle-play="player.togglePlay()"
            @add-to-playlist="playlists.openAddToPlaylist"
            @reach-end="maybeLoadMore"
          />

          <template v-else>
            <div
              v-for="(track, i) in filteredResults"
              :key="`${track.sourceId}-${track.id}`"
              :class="['playlist-item', isCurrent(track) ? 'playing' : '']"
              @click="playTrack(track)"
            >
              <div class="song-index">{{ i + 1 }}</div>
              <div class="song-info">
                <div class="song-title">{{ track.title }}</div>
                <div class="song-artist">{{ track.artist }} · {{ sourceName(track.sourceId) }}</div>
              </div>
              <button
                type="button"
                class="play-btn"
                title="加入歌单"
                @click.stop="playlists.openAddToPlaylist(track)"
              >
                <SketchIcon name="plus" :size="16" />
              </button>
              <button
                type="button"
                :class="['btn-favorite', player.isFavorite(track) ? 'active' : '']"
                style="margin-right: 8px;"
                @click.stop="player.toggleFavorite(track)"
              >
                {{ player.isFavorite(track) ? '♥' : '♡' }}
              </button>
              <button
                type="button"
                class="play-btn"
                @click.stop="isCurrent(track) ? player.togglePlay() : playTrack(track)"
              >
                <svg v-if="isCurrent(track) && player.loading" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                  <circle cx="8" cy="8" r="6" stroke-dasharray="3,2"/>
                </svg>
                <svg v-else-if="isCurrent(track) && player.isPlaying" width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
                  <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <polyline points="4,2 4,14 13,8 4,2"/>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <div
          v-if="search.results.length > 0 && search.hasMore"
          ref="loadMoreSentinel"
          class="load-more-sentinel"
          aria-hidden="true"
        ></div>
      </template>
    </div>

    <div v-else class="discover-empty">
      <section class="listening-hero">
        <div class="listening-hero-copy">
          <span class="listening-eyebrow">MOYUN / LISTENING MOOD</span>
          <h1>今天，想怎么听歌？</h1>
          <p>{{ activeMood.title }} · {{ activeMood.description }}</p>
        </div>
        <div class="mood-quick-picks" aria-label="选择听歌人格主题">
          <button
            v-for="mood in LISTENING_MOODS"
            :key="mood.id"
            type="button"
            :class="['mood-quick-pick', ui.theme === mood.theme ? 'active' : '']"
            :title="`${mood.types} · ${mood.description}`"
            @click="ui.setTheme(mood.theme)"
          >
            <span>{{ mood.title }}</span>
            <small>{{ mood.types }}</small>
          </button>
        </div>
      </section>
      <div class="hot-groups">
        <section
          v-for="group in HOT_KEYWORD_GROUPS"
          :key="group.key"
          class="hot-group"
        >
          <h3 class="hot-group-title">{{ group.label }}</h3>
          <div class="hot-chips" role="list">
            <button
              v-for="kw in group.keywords"
              :key="kw"
              type="button"
              class="hot-chip"
              role="listitem"
              @click="void searchHot(kw)"
            >
              {{ kw }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import VirtualSongList from '../VirtualSongList.vue';
import SketchIcon from '../icons/SketchIcon.vue';
import SketchSelect from '../SketchSelect.vue';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';
import { useSearchStore } from '../../stores/search';
import { useUIStore } from '../../stores/ui';
import { HOT_KEYWORD_GROUPS } from '../../constants/hotKeywords';
import { LISTENING_MOODS } from '../../core/theme';

const player = usePlayerStore();
const playlists = usePlaylistStore();
const search = useSearchStore();
const ui = useUIStore();
const { playFromList } = useAudio();
const activeMood = computed(
  () => LISTENING_MOODS.find((mood) => mood.theme === ui.theme) || LISTENING_MOODS[0],
);

const filterSourceId = ref('');
const filterArtist = ref('');
const loadMoreSentinel = ref<HTMLElement | null>(null);
let loadMoreObserver: IntersectionObserver | null = null;

/** 有关键词或结果时保持结果面板，避免空搜索瞬间退回热词页 */
const showResultsPanel = computed(
  () => search.results.length > 0 || search.loading || Boolean(search.keyword.trim()),
);

watch(
  () => search.results,
  () => {
    filterSourceId.value = '';
    filterArtist.value = '';
  },
);

const resultSources = computed(() => {
  const ids = new Set(search.results.map((s) => s.sourceId));
  return search.sources.filter((s) => ids.has(s.id));
});

const sourceFilterOptions = computed(() => [
  { label: '全部', value: '' },
  ...resultSources.value.map((s) => ({ label: s.name, value: s.id })),
]);

const resultArtists = computed(() => {
  const pool = filterSourceId.value
    ? search.results.filter((s) => s.sourceId === filterSourceId.value)
    : search.results;
  const artists = new Set(
    pool
      .map((s) => s.artist?.trim())
      .filter((a): a is string => Boolean(a)),
  );
  return Array.from(artists).sort((a, b) => a.localeCompare(b, 'zh')).slice(0, 80);
});

const artistFilterOptions = computed(() => [
  { label: '全部歌手', value: '' },
  ...resultArtists.value.map((artist) => ({ label: artist, value: artist })),
]);

watch(filterSourceId, () => {
  if (filterArtist.value && !resultArtists.value.includes(filterArtist.value)) {
    filterArtist.value = '';
  }
});

const filteredResults = computed(() =>
  search.results.filter((song) => {
    if (filterSourceId.value && song.sourceId !== filterSourceId.value) return false;
    if (filterArtist.value && song.artist !== filterArtist.value) return false;
    return true;
  }),
);

const useVirtual = computed(() => filteredResults.value.length > 40);

/** 搜索刚结束时不要立刻自动翻页，避免二次请求把列表刷一遍并打满限流 */
const LOAD_MORE_GUARD_MS = 1500;
let loadMoreReadyAt = 0;
let loadMoreTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => [useVirtual.value, search.hasMore, search.isLoadingMore, search.loading, filteredResults.value.length] as const,
  ([, hasMore, , loading]) => {
    if (loadMoreTimer) {
      clearTimeout(loadMoreTimer);
      loadMoreTimer = null;
    }
    if (!loading && hasMore && filteredResults.value.length > 0) {
      loadMoreReadyAt = Date.now() + LOAD_MORE_GUARD_MS;
      loadMoreTimer = setTimeout(() => {
        loadMoreTimer = null;
        void nextTick(setupLoadMoreObserver);
      }, LOAD_MORE_GUARD_MS);
      return;
    }
    void nextTick(setupLoadMoreObserver);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (loadMoreTimer) clearTimeout(loadMoreTimer);
  loadMoreObserver?.disconnect();
});

function maybeLoadMore() {
  if (Date.now() < loadMoreReadyAt) return;
  if (!search.hasMore || search.isLoadingMore || search.loading) return;
  void search.loadMore();
}

function setupLoadMoreObserver() {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
  if (useVirtual.value || !search.hasMore) return;
  if (Date.now() < loadMoreReadyAt) return;
  if (!loadMoreSentinel.value || typeof IntersectionObserver === 'undefined') return;

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) maybeLoadMore();
    },
    {
      root: null,
      rootMargin: '0px 0px 80px 0px',
      threshold: 0,
    },
  );

  loadMoreObserver.observe(loadMoreSentinel.value);
}

function sourceName(sourceId: string) {
  return search.sources.find((s) => s.id === sourceId)?.name || sourceId;
}

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}

function playTrack(track: Song) {
  playFromList(filteredResults.value, track, { autoSkipOnFail: false });
}

function backToDiscover() {
  search.error = '';
  search.keyword = '';
  search.results = [];
  search.sourceResults.clear();
  search.sourceHasMore.clear();
  search.hasMore = false;
  search.isLoadingMore = false;
  filterSourceId.value = '';
  filterArtist.value = '';
}

async function retrySearch() {
  const kw = search.keyword.trim();
  if (!kw) return;
  await search.searchSongs(kw, search.currentSource, { force: true });
}

async function searchHot(kw: string) {
  const keyword = kw.trim();
  if (!keyword) return;

  if (!search.sources.length) search.loadSources();
  const source = search.currentSource || search.enabledSources[0]?.id || 'netease';
  search.addSearchHistory(keyword, source);
  if (search.restoreQuickSearch(keyword, source)) return;
  await search.searchSongs(keyword, source);
}
</script>

<style scoped>
.discover-section {
  padding: 10px 14px;
  gap: 8px;
}

.results-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 !important;
}

.results-loading {
  text-align: center;
  padding: 40px;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--accent-green);
}

.results-loading p {
  margin-top: 12px;
  font-size: 16px;
}

.results-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overflow-anchor: none;
}

.results-scroll :deep(.virtual-song-list.fill) {
  height: 100%;
  min-height: 100%;
}

.load-more-sentinel {
  height: 2px;
  flex-shrink: 0;
}

.discover-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--ink-soft);
  cursor: pointer;
  white-space: nowrap;
  border: 1px var(--stroke-style-decor) var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 4px 10px;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.discover-reset-btn:hover {
  background: var(--hover);
  border-color: var(--accent);
  color: var(--ink);
  transform: translateY(-1px);
}

.discover-reset-icon {
  display: block;
  opacity: 0.82;
}

.discover-reset-text {
  letter-spacing: 0.04em;
}

.filter-count em {
  font-style: normal;
  margin-left: 4px;
  color: var(--accent);
  font-size: 12px;
}

.search-empty-tip {
  border: 1px var(--stroke-style-decor) var(--border);
  background: var(--bg-subtle);
  margin: 12px;
  border-radius: 10px;
}

.search-empty-tip p {
  margin: 0;
}

.search-empty-sub {
  margin-top: 4px !important;
  font-size: 12px;
  color: var(--faint);
}

.search-empty-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.discover-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  color: var(--muted);
  font-family: 'Ma Shan Zheng', cursive;
  padding: 8px 12px 16px;
  overflow-x: hidden;
  overflow-y: auto;
}

.listening-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.9fr);
  align-items: end;
  gap: 20px;
  width: min(820px, 100%);
  padding: 18px 20px;
  border: 1px solid var(--border-soft);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  background: linear-gradient(115deg, var(--surface-strong), var(--surface));
  animation: slideUp 0.45s ease both;
}

.listening-eyebrow {
  color: var(--accent);
  font-family: var(--ui-font, sans-serif);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.listening-hero h1 {
  margin: 5px 0 3px;
  color: var(--ink);
  font-family: var(--ui-display, serif);
  font-size: 24px;
  font-weight: 600;
}

.listening-hero p { color: var(--muted); font-size: 13px; }

.mood-quick-picks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mood-quick-pick {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 7px 8px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: color-mix(in srgb, var(--paper-bg) 62%, transparent);
  color: var(--ink-soft);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.mood-quick-pick:hover { transform: translateY(-1px); border-color: var(--accent); }
.mood-quick-pick.active { border-color: var(--accent); background: var(--accent-soft); color: var(--ink); }
.mood-quick-pick small { color: var(--muted); font-size: 9px; white-space: nowrap; }

.hot-chips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 10px;
  width: 100%;
}

.hot-groups {
  width: min(820px, 100%);
  margin-top: 2px;
  display: grid;
  gap: 12px;
}

@media (max-width: 620px) {
  .listening-hero { grid-template-columns: 1fr; gap: 12px; padding: 14px; }
  .listening-hero h1 { font-size: 21px; }
  .mood-quick-pick { align-items: flex-start; flex-direction: column; }
}

.hot-group {
  display: grid;
  gap: 10px;
  padding: 10px 12px 12px;
  border: 1px var(--stroke-style-decor) var(--border-soft);
  border-radius: 12px;
  background: var(--bg-subtle);
}

.hot-group-title {
  font-size: 16px;
  color: var(--faint);
  font-family: 'Ma Shan Zheng', cursive;
  letter-spacing: 0.12em;
  text-align: center;
}

.hot-chip {
  border: 1px var(--stroke-style-decor) var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
  line-height: 1;
  padding: 9px 12px;
  min-height: 40px;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.hot-chip:hover {
  background: var(--hover);
  border-color: var(--accent);
  color: var(--ink);
}

@media (max-width: 1080px) {
  .hot-groups {
    width: min(720px, 100%);
  }
}

@media (max-width: 768px) {
  .discover-empty {
    padding: 8px 10px 12px;
  }

  .hot-groups {
    gap: 8px;
    margin-top: 6px;
  }

  .hot-group-title {
    font-size: 14px;
    letter-spacing: 0.1em;
  }

  .hot-chips {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .hot-chip {
    font-size: 14px;
    min-height: 36px;
    padding: 7px 10px;
  }
}
</style>
