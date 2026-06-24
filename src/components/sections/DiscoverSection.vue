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
            <!-- 播放按钮 -->
            <button class="play-btn" @click.stop="isCurrent(track) && player.isPlaying ? player.pause() : playSong(track)">
              <!-- 播放中：暂停图标（手绘两条竖线） -->
              <svg v-if="isCurrent(track) && player.isPlaying" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">
                <line x1="8" y1="6" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="18"/>
              </svg>
              <!-- 当前歌曲未播放：实心三角 -->
              <svg v-else-if="isCurrent(track)" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M7.5 4.2C7.1 3.9 6.6 4.1 6.6 4.6L6.6 19.4C6.6 19.9 7.1 20.1 7.5 19.8L19.5 12.3C19.9 12 19.9 11.5 19.5 11.2L7.5 4.2Z"/>
              </svg>
              <!-- 非当前歌曲：手绘三角（描边） -->
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 4.5L7 19.5L19 12L7 4.5Z"/>
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
