<template>
  <div
    ref="rootEl"
    class="virtual-song-list"
    :class="{ fill: fill }"
    @scroll="onScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="`${item.song.sourceId}-${item.song.id}`"
          :class="['playlist-item', isCurrent(item.song) ? 'playing' : '']"
          :style="{ height: `${itemHeight}px`, boxSizing: 'border-box' }"
          @click="emit('play', item.song)"
        >
          <div class="song-index">{{ item.index + 1 }}</div>
          <div class="song-info">
            <div class="song-title">{{ item.song.title }}</div>
            <div class="song-artist">{{ item.song.artist }}</div>
          </div>
          <button
            v-if="showAddToPlaylist"
            type="button"
            class="play-btn"
            title="加入歌单"
            @click.stop="emit('add-to-playlist', item.song)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
            </svg>
          </button>
          <button
            @click.stop="emit('toggle-favorite', item.song)"
            :class="['btn-favorite', isFavorite(item.song) ? 'active' : '']"
            style="margin-right: 8px;"
          >
            {{ isFavorite(item.song) ? '♥' : '♡' }}
          </button>
          <button
            class="play-btn"
            @click.stop="isCurrent(item.song) ? emit('toggle-play') : emit('play', item.song)"
          >
            <svg
              v-if="isCurrent(item.song) && isPlaying"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              fill="none"
            >
              <line x1="4.5" y1="3" x2="4.5" y2="13" /><line x1="11.5" y1="3" x2="11.5" y2="13" />
            </svg>
            <svg
              v-else
              width="14"
              height="14"
              viewBox="0 0 16 16"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            >
              <polyline points="4,2 4,14 13,8 4,2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Song } from '../core/sources/types';

const props = withDefaults(
  defineProps<{
    songs: Song[];
    itemHeight?: number;
    overscan?: number;
    currentSong: Song | null;
    isPlaying: boolean;
    isFavorite: (song: Song) => boolean;
    showAddToPlaylist?: boolean;
    /** 填满父级高度，由父级负责滚动区域 */
    fill?: boolean;
  }>(),
  {
    itemHeight: 52,
    overscan: 6,
    showAddToPlaylist: true,
    fill: false,
  },
);

const emit = defineEmits<{
  play: [song: Song];
  'toggle-favorite': [song: Song];
  'toggle-play': [];
  'add-to-playlist': [song: Song];
}>();

const rootEl = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(400);

const totalHeight = computed(() => props.songs.length * props.itemHeight);

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan),
);

const endIndex = computed(() => {
  const visible = Math.ceil(viewportHeight.value / props.itemHeight) + props.overscan * 2;
  return Math.min(props.songs.length, startIndex.value + visible);
});

const offsetY = computed(() => startIndex.value * props.itemHeight);

const visibleItems = computed(() =>
  props.songs.slice(startIndex.value, endIndex.value).map((song, i) => ({
    song,
    index: startIndex.value + i,
  })),
);

function isCurrent(song: Song) {
  return (
    props.currentSong?.id === song.id &&
    props.currentSong?.sourceId === song.sourceId
  );
}

function onScroll() {
  if (!rootEl.value) return;
  scrollTop.value = rootEl.value.scrollTop;
}

function measure() {
  if (!rootEl.value) return;
  viewportHeight.value = rootEl.value.clientHeight || 400;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  measure();
  if (rootEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(rootEl.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.virtual-song-list {
  max-height: min(60vh, 560px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-song-list.fill {
  max-height: none;
  height: 100%;
}
</style>
