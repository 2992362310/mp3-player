<template>
  <div
    ref="rootEl"
    class="virtual-song-list"
    :class="{ fill: fill }"
    @scroll="onScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <SongRow
          v-for="item in visibleItems"
          :key="`${item.song.sourceId}-${item.song.id}`"
          :song="item.song"
          :index="item.index"
          :height="itemHeight"
          :current="isCurrent(item.song)"
          :playing="isPlaying"
          :loading="loading"
          :favorite="isFavorite(item.song)"
          :show-add-to-playlist="showAddToPlaylist"
          :removable="removable"
          @play="emit('play', $event)"
          @toggle-favorite="emit('toggle-favorite', $event)"
          @toggle-play="emit('toggle-play')"
          @add-to-playlist="emit('add-to-playlist', $event)"
          @remove="emit('remove', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import SongRow from './SongRow.vue';
import type { Song } from '../core/sources/types';
import { isSameSong } from '../core/song';

const props = withDefaults(
  defineProps<{
    songs: Song[];
    itemHeight?: number;
    overscan?: number;
    currentSong: Song | null;
    isPlaying: boolean;
    loading?: boolean;
    isFavorite: (song: Song) => boolean;
    showAddToPlaylist?: boolean;
    removable?: boolean;
    /** 填满父级高度，由父级负责滚动区域 */
    fill?: boolean;
    /** 距离底部多少像素时触发懒加载 */
    loadMoreThreshold?: number;
  }>(),
  {
    itemHeight: 52,
    overscan: 6,
    loading: false,
    showAddToPlaylist: true,
    removable: false,
    fill: false,
    loadMoreThreshold: 140,
  },
);

const emit = defineEmits<{
  play: [song: Song];
  'toggle-favorite': [song: Song];
  'toggle-play': [];
  'add-to-playlist': [song: Song];
  remove: [song: Song];
  'reach-end': [];
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
  return isSameSong(props.currentSong, song);
}

function onScroll() {
  if (!rootEl.value) return;
  scrollTop.value = rootEl.value.scrollTop;

  const remain = rootEl.value.scrollHeight - (rootEl.value.scrollTop + rootEl.value.clientHeight);
  if (remain <= props.loadMoreThreshold) emit('reach-end');
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
  overflow-anchor: none;
}

.virtual-song-list.fill {
  max-height: none;
  height: 100%;
}
</style>
