<template>
  <div class="content-section" style="display: flex; flex-direction: row; gap: 0; flex: 1; min-width: 0;">
    <div class="content-area main-scroll" style="flex: 1; min-width: 0;">
      <!-- 搜索结果 -->
      <div v-if="search.results.length > 0 || search.loading" class="sketch-card" style="padding: 0; overflow: hidden;">
        <div
          v-if="search.loading && search.results.length === 0"
          style="text-align: center; padding: 40px; font-family: 'Ma Shan Zheng', cursive;"
        >
          <div class="spinner"></div>
          <p style="color: #27ae60; font-size: 16px; margin-top: 12px;">搜索中...</p>
        </div>

        <div v-else>
          <div
            v-for="(track, i) in search.results"
            :key="`${track.sourceId}-${track.id}`"
            :class="['playlist-item', isCurrent(track) ? 'playing' : '']"
            @dblclick="playSong(track)"
            style="border-bottom: 1px dashed #e8dcc8;"
          >
            <div class="song-index">{{ i + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ track.title }}</div>
              <div class="song-artist">{{ track.artist }}</div>
            </div>
            <button
              @click.stop="player.toggleFavorite(track)"
              :class="['btn-favorite', player.isFavorite(track) ? 'active' : '']"
              style="margin-right: 8px;"
            >
              {{ player.isFavorite(track) ? '♥' : '♡' }}
            </button>
            <button class="play-btn" @click.stop="isCurrent(track) && player.isPlaying ? player.pause() : playSong(track)">
              <svg v-if="isCurrent(track) && player.isPlaying" width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
                <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <polyline points="4,2 4,14 13,8 4,2"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="search.results.length > 0 && search.hasMore" style="padding: 12px; text-align: center;">
          <button
            @click="search.loadMore()"
            :disabled="search.isLoadingMore"
            style="padding: 8px 20px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; background: rgba(255,255,255,0.5); border-radius: 6px 10px 8px 12px; cursor: pointer; color: #666; font-size: 14px;"
          >
            {{ search.isLoadingMore ? '加载中...' : '加载更多 ↓' }}
          </button>
        </div>
      </div>

      <div
        v-else-if="!search.loading"
        style="text-align: center; padding: 60px 20px; color: #b0a080; font-family: 'Ma Shan Zheng', cursive; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 16px;"
      >
        <div style="width: 48px; height: 48px; opacity: 0.5;" v-html="SketchMusicIcon"></div>
        <p>搜索您喜欢的歌曲吧 ✏️</p>
      </div>
    </div>

    <LyricPanel />
  </div>
</template>

<script setup lang="ts">
import LyricPanel from '../LyricPanel.vue';
import { SketchMusicIcon } from '../icons/SketchIcons';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { useSearchStore } from '../../stores/search';

const player = usePlayerStore();
const search = useSearchStore();
const { playSong } = useAudio();

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}
</script>
