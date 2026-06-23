<template>
  <div class="content-section" style="display: flex; flex-direction: row; gap: 0; flex: 1; min-width: 0;">
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
      <div class="content-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="display: flex; align-items: center; gap: 12px; margin: 0;">
          <div style="width: 28px; height: 28px;" v-html="SketchPlaylistIcon"></div>
          <span>播放列表</span>
          <span style="font-size: 16px; color: #888;">({{ playlist.playlistCount }})</span>
        </h1>
        <button
          v-if="playlist.playlistCount > 0"
          @click="playlist.clearPlaylist()"
          class="btn-action"
          style="color: #e74c3c; border-color: #e74c3c; flex-shrink: 0;"
        >
          🗑 清空
        </button>
      </div>
      <div class="content-area main-scroll" style="flex: 1;">
        <section>
          <div v-if="playlist.playlist.length === 0" class="empty-state">
            <div class="empty-icon" v-html="SketchPlaylistIcon" style="width: 64px; height: 64px;"></div>
            <p>播放列表是空的~</p>
            <p class="hint" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>去搜索歌曲吧</span>
              <div style="width: 16px; height: 16px;" v-html="SketchPencilIcon"></div>
            </p>
          </div>

          <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
            <div
              v-for="(song, idx) in playlist.playlist"
              :key="`${song.sourceId}-${song.id}`"
              :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
              @dblclick="playAtIndex(idx)"
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
        </section>
      </div>
    </div>

    <LyricPanel :render-modes="['sidebar']" />
  </div>
</template>

<script setup lang="ts">
import LyricPanel from '../LyricPanel.vue';
import { SketchPencilIcon, SketchPlaylistIcon } from '../icons/SketchIcons';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';

const player = usePlayerStore();
const playlist = usePlaylistStore();
const { playAtIndex } = useAudio();

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}
</script>
