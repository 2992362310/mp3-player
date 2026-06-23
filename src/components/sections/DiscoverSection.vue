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
            <span v-if="isCurrent(track)" class="playing-indicator">▶</span>
            <button
              @click.stop="playlist.toggleFavorite(track)"
              :class="['btn-favorite', playlist.isFavorite(track) ? 'active' : '']"
              style="margin-right: 8px;"
            >
              {{ playlist.isFavorite(track) ? '♥' : '♡' }}
            </button>
            <button class="play-btn" @click.stop="playSong(track)">播放</button>
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

      <!-- 当前播放列表 -->
      <div v-if="playlist.playlist.length > 0" class="sketch-card playlist-section">
        <div class="playlist-header">
          <h2 style="margin: 0; font-size: 18px; color: #2d2d2d; font-family: 'Ma Shan Zheng', cursive;">
            当前播放列表
            <span style="font-size: 14px; color: #888;">({{ playlist.playlistCount }})</span>
          </h2>
          <button
            @click="playlist.clearPlaylist()"
            style="padding: 4px 12px; font-family: 'Ma Shan Zheng', cursive; border: 1px solid #e74c3c; background: transparent; border-radius: 4px; cursor: pointer; color: #e74c3c; font-size: 13px;"
          >
            清空
          </button>
        </div>
        <div style="padding: 0; overflow: hidden;">
          <div
            v-for="(song, idx) in playlist.playlist"
            :key="`pl-${song.sourceId}-${song.id}`"
            :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
            @dblclick="playAtIndex(idx)"
            style="border-bottom: 1px dashed #e8dcc8;"
          >
            <div class="song-index">{{ idx + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <span v-if="isCurrent(song)" class="playing-indicator">▶</span>
            <button class="play-btn" @click.stop="playAtIndex(idx)" style="margin-right: 5px;">播放</button>
            <button @click.stop="playlist.removeFromPlaylist(idx)" class="delete-history-btn" title="移除">✕</button>
          </div>
        </div>
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
import { usePlaylistStore } from '../../stores/playlist';
import { useSearchStore } from '../../stores/search';

const player = usePlayerStore();
const playlist = usePlaylistStore();
const search = useSearchStore();
const { playSong, playAtIndex } = useAudio();

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}
</script>

<style scoped>
.playlist-section {
  margin-top: 16px;
  padding: 0;
  overflow: hidden;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 2px dashed #d4c5a0;
}
</style>
