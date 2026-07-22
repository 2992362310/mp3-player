<template>
  <div class="content-section">
    <div class="content-area main-scroll">
      <div v-if="search.error" class="search-error" role="alert">{{ search.error }}</div>

      <section v-if="player.recentPlays.length > 0" class="recent-block">
        <h2 class="section-title">最近播放</h2>
        <div class="sketch-card" style="padding: 0; overflow: hidden;">
          <div
            v-for="(track, i) in player.recentPlays.slice(0, 8)"
            :key="`recent-${track.sourceId}-${track.id}`"
            :class="['playlist-item', isCurrent(track) ? 'playing' : '']"
            @click="playRecent(track)"
          >
            <div class="song-index">{{ i + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ track.title }}</div>
              <div class="song-artist">{{ track.artist }}</div>
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
          </div>
        </div>
      </section>

      <div v-if="search.results.length > 0 || search.loading" class="sketch-card" style="padding: 0; overflow: hidden;">
        <div
          v-if="search.loading && search.results.length === 0"
          style="text-align: center; padding: 40px; font-family: 'Ma Shan Zheng', cursive;"
        >
          <div class="spinner"></div>
          <p style="color: var(--accent-green); font-size: 16px; margin-top: 12px;">搜索中...</p>
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
            <span class="filter-count">{{ filteredResults.length }}/{{ search.results.length }}</span>
          </div>

          <div v-if="filteredResults.length === 0" class="filter-empty">没有符合筛选条件的歌曲</div>

          <VirtualSongList
            v-else-if="useVirtual"
            :songs="filteredResults"
            :current-song="player.currentSong"
            :is-playing="player.isPlaying"
            :is-favorite="player.isFavorite"
            @play="playTrack"
            @toggle-favorite="player.toggleFavorite"
            @toggle-play="player.togglePlay()"
            @add-to-playlist="playlists.openAddToPlaylist"
          />

          <div v-else>
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
          </div>
        </template>

        <div v-if="search.results.length > 0 && search.hasMore" style="padding: 12px; text-align: center;">
          <button
            type="button"
            class="load-more-btn"
            :disabled="search.isLoadingMore"
            @click="search.loadMore()"
          >
            {{ search.isLoadingMore ? '加载中...' : '加载更多 ↓' }}
          </button>
        </div>
      </div>

      <div
        v-else-if="!search.loading && player.recentPlays.length === 0"
        class="discover-empty"
      >
        <div style="width: 48px; height: 48px; opacity: 0.5;">
          <SketchIcon name="music" :size="48" />
        </div>
        <p>搜索您喜欢的歌曲吧</p>
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

function playRecent(track: Song) {
  playFromList(player.recentPlays, track);
}
</script>
