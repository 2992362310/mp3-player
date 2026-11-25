<template>
  <div
    :class="['playlist-item', current ? 'playing' : '']"
    :style="height ? { height: `${height}px`, boxSizing: 'border-box' } : undefined"
    @click="emit('play', song)"
  >
    <div class="song-index">{{ index + 1 }}</div>
    <div class="song-info">
      <div class="song-title">{{ song.title }}</div>
      <div class="song-artist">{{ subtitle ?? song.artist }}</div>
    </div>
    <button
      v-if="showAddToPlaylist"
      type="button"
      class="play-btn"
      title="加入歌单"
      @click.stop="emit('add-to-playlist', song)"
    >
      <SketchIcon name="plus" :size="16" />
    </button>
    <button
      type="button"
      :class="['btn-favorite', 'spaced', favorite ? 'active' : '']"
      @click.stop="emit('toggle-favorite', song)"
    >
      {{ favorite ? '♥' : '♡' }}
    </button>
    <button
      v-if="removable"
      type="button"
      class="play-btn danger"
      title="从本地删除"
      @click.stop="emit('remove', song)"
    >
      <SketchIcon name="trash" :size="14" />
    </button>
    <slot name="actions" :song="song" />
    <button
      v-if="showPlayButton"
      type="button"
      class="play-btn"
      @click.stop="current ? emit('toggle-play') : emit('play', song)"
    >
      <SketchIcon v-if="current && loading" class="row-spinner" name="loading" :size="14" />
      <SketchIcon v-else-if="current && playing" name="pause" :size="14" />
      <SketchIcon v-else name="play" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import SketchIcon from './icons/SketchIcon.vue';
import type { Song } from '../core/sources/types';

withDefaults(
  defineProps<{
    song: Song;
    index: number;
    current: boolean;
    playing: boolean;
    favorite: boolean;
    loading?: boolean;
    /** 覆盖副标题，例如搜索结果需要附带音源名 */
    subtitle?: string;
    showAddToPlaylist?: boolean;
    showPlayButton?: boolean;
    removable?: boolean;
    /** 虚拟列表传入固定行高 */
    height?: number;
  }>(),
  {
    loading: false,
    subtitle: undefined,
    height: undefined,
    showAddToPlaylist: true,
    showPlayButton: true,
    removable: false,
  },
);

const emit = defineEmits<{
  play: [song: Song];
  'toggle-favorite': [song: Song];
  'toggle-play': [];
  'add-to-playlist': [song: Song];
  remove: [song: Song];
}>();
</script>

<style scoped>
.row-spinner {
  animation: song-row-spin 1.1s linear infinite;
}

@keyframes song-row-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
