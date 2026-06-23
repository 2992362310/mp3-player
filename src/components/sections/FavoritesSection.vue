<template>
  <div class="content-section" style="display: flex; flex-direction: row; gap: 0; flex: 1; min-width: 0;">
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
      <div class="content-header">
        <h1 style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px;" v-html="SketchHeartIcon"></div>
          <span>我的收藏</span>
        </h1>
      </div>
      <div class="content-area main-scroll">
        <section>
          <h2>收藏歌曲 <span style="font-size: 16px; color: #888;">({{ playlist.favoriteCount }})</span></h2>

          <div v-if="playlist.favorites.length === 0" class="empty-state">
            <div class="empty-icon" v-html="SketchHeartIcon" style="width: 64px; height: 64px;"></div>
            <p>还没有收藏歌曲~</p>
            <p class="hint">点击 ♡ 收藏喜欢的歌</p>
          </div>

          <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
            <div
              v-for="(song, idx) in playlist.favorites"
              :key="`${song.sourceId}-${song.id}`"
              :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
              @dblclick="playSong(song)"
            >
              <div class="song-index">{{ idx + 1 }}</div>
              <div class="song-info">
                <div class="song-title">{{ song.title }}</div>
                <div class="song-artist">{{ song.artist }}</div>
              </div>
              <span v-if="isCurrent(song)" class="playing-indicator">▶</span>
              <button class="btn-favorite active" @click.stop="playlist.toggleFavorite(song)" style="margin-right: 8px;">♥</button>
              <button class="play-btn" @click.stop="playSong(song)">播放</button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <LyricPanel />
  </div>
</template>

<script setup lang="ts">
import LyricPanel from '../LyricPanel.vue';
import { SketchHeartIcon } from '../icons/SketchIcons';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';

const player = usePlayerStore();
const playlist = usePlaylistStore();
const { playSong } = useAudio();

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}
</script>
