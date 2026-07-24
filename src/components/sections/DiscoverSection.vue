<template>
  <div class="content-section discover-section">
    <div v-if="search.error" class="search-error" role="alert">{{ search.error }}</div>

    <!-- 结果区：仅内部滚动 -->
    <div
      v-if="search.results.length > 0 || search.loading"
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
          <select v-model="filterSourceId" class="filter-select">
            <option value="">全部音源</option>
            <option v-for="s in resultSources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <select v-model="filterArtist" class="filter-select">
            <option value="">全部歌手</option>
            <option v-for="artist in resultArtists" :key="artist" :value="artist">{{ artist }}</option>
          </select>
          <label class="playable-toggle" title="开启后会探测播放地址（消耗请求额度）">
            <input
              type="checkbox"
              :checked="search.onlyPlayable"
              @change="onOnlyPlayableChange(($event.target as HTMLInputElement).checked)"
            />
            <span>仅可播</span>
          </label>
          <span class="filter-count">
            {{ filteredResults.length }}/{{ search.results.length }}
            <em v-if="search.probingPlayable">检测中</em>
          </span>
        </div>

        <div class="results-scroll main-scroll">
          <div v-if="filteredResults.length === 0" class="filter-empty">
            {{
              search.onlyPlayable
                ? (search.probingPlayable ? '正在检测可播放歌曲…' : '没有检测到可播放歌曲')
                : '没有符合筛选条件的歌曲'
            }}
          </div>

          <VirtualSongList
            v-else-if="useVirtual"
            fill
            :songs="filteredResults"
            :current-song="player.currentSong"
            :is-playing="player.isPlaying"
            :is-favorite="player.isFavorite"
            @play="playTrack"
            @toggle-favorite="player.toggleFavorite"
            @toggle-play="player.togglePlay()"
            @add-to-playlist="playlists.openAddToPlaylist"
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
                <svg v-if="isCurrent(track) && player.isPlaying" width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
                  <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <polyline points="4,2 4,14 13,8 4,2"/>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <div v-if="search.results.length > 0 && search.hasMore" class="results-footer">
          <button
            type="button"
            class="load-more-btn"
            :disabled="search.isLoadingMore"
            @click="search.loadMore()"
          >
            {{ search.isLoadingMore ? '加载中...' : '加载更多 ↓' }}
          </button>
        </div>
      </template>
    </div>

    <div
      v-else-if="!search.loading"
      class="discover-empty"
    >
      <div class="discover-empty-mark" aria-hidden="true">墨</div>
      <p>搜索你喜欢的歌</p>
      <p class="discover-empty-hint">点下面快捷词，或到顶部搜索框输入</p>
      <div class="hot-chips" role="list">
        <button
          v-for="kw in HOT_KEYWORDS"
          :key="kw"
          type="button"
          class="hot-chip"
          role="listitem"
          @click="searchHot(kw)"
        >
          {{ kw }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import VirtualSongList from '../VirtualSongList.vue';
import SketchIcon from '../icons/SketchIcon.vue';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';
import { useSearchStore } from '../../stores/search';
import { HOT_KEYWORDS } from '../../constants/hotKeywords';

const player = usePlayerStore();
const playlists = usePlaylistStore();
const search = useSearchStore();
const { playFromList } = useAudio();

const filterSourceId = ref('');
const filterArtist = ref('');

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

watch(filterSourceId, () => {
  if (filterArtist.value && !resultArtists.value.includes(filterArtist.value)) {
    filterArtist.value = '';
  }
});

const filteredResults = computed(() =>
  search.results.filter((song) => {
    if (filterSourceId.value && song.sourceId !== filterSourceId.value) return false;
    if (filterArtist.value && song.artist !== filterArtist.value) return false;
    // 仅可播：隐藏已确认不可播；检测中仍显示未知项
    if (search.onlyPlayable && search.isPlayableKnown(song) === false) return false;
    return true;
  }),
);

const useVirtual = computed(() => filteredResults.value.length > 40);

function sourceName(sourceId: string) {
  return search.sources.find((s) => s.id === sourceId)?.name || sourceId;
}

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}

function playTrack(track: Song) {
  playFromList(filteredResults.value, track);
}

function onOnlyPlayableChange(checked: boolean) {
  void search.setOnlyPlayable(checked);
}

async function searchHot(kw: string) {
  search.addSearchHistory(kw, search.currentSource);
  await search.searchSongs(kw, search.currentSource);
}
</script>

<style scoped>
.discover-section {
  padding: 12px 16px;
  gap: 10px;
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
}

.results-scroll :deep(.virtual-song-list.fill) {
  height: 100%;
  min-height: 100%;
}

.results-footer {
  flex-shrink: 0;
  padding: 10px 12px;
  text-align: center;
  border-top: 1px dashed var(--border-soft);
}

.playable-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--ink-soft);
  cursor: pointer;
  white-space: nowrap;
}

.playable-toggle input {
  accent-color: var(--accent);
}

.filter-count em {
  font-style: normal;
  margin-left: 4px;
  color: var(--accent);
  font-size: 12px;
}

.discover-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--muted);
  font-family: 'Ma Shan Zheng', cursive;
  padding: 12px 8px 24px;
}

.discover-empty-mark {
  font-size: 56px;
  line-height: 1;
  color: var(--ink);
  opacity: 0.28;
  letter-spacing: 0.08em;
  animation: brandIn 0.45s ease-out;
}

.discover-empty p {
  font-size: 18px;
  color: var(--ink-soft);
}

.discover-empty-hint {
  font-size: 13px !important;
  color: var(--faint) !important;
}

.hot-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 420px;
  margin-top: 10px;
}

.hot-chip {
  border: 1px dashed var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.hot-chip:hover {
  background: var(--hover);
  border-color: var(--accent);
  color: var(--ink);
}
</style>
