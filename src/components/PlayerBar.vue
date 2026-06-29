<template>
  <footer class="bottom-controller">
    <div class="controller-container">
      <div class="main-controls">
        <!-- 左侧：手绘控制按钮 -->
        <div class="left-controls">
          <button @click="playPrevious()" class="sketch-icon" title="上一首" :disabled="!player.currentSong">
            <svg width="20" height="20" viewBox="0 0 16 16" stroke="#4a4a4a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="10,2 10,14"/><polyline points="10,8 4,2 4,14 10,8"/>
            </svg>
          </button>
          <!-- 播放/暂停 -->
          <button @click="player.togglePlay()" class="sketch-icon sketch-icon-play" title="播放/暂停" :disabled="!player.currentSong">
            <svg v-if="player.loading" width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round">
              <circle cx="8" cy="8" r="6" stroke-dasharray="3,2"/>
            </svg>
            <svg v-else-if="player.isPlaying" width="26" height="26" viewBox="0 0 16 16" stroke="#4a4a4a" stroke-width="1.6" stroke-linecap="round" fill="none">
              <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
            </svg>
            <svg v-else width="26" height="26" viewBox="0 0 16 16" stroke="#4a4a4a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="4,2 4,14 13,8 4,2"/>
            </svg>
          </button>
          <button @click="playNext()" class="sketch-icon" title="下一首" :disabled="!player.currentSong">
            <svg width="20" height="20" viewBox="0 0 16 16" stroke="#4a4a4a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="6,2 6,14"/><polyline points="6,8 12,2 12,14 6,8"/>
            </svg>
          </button>
        </div>

        <!-- 中间歌曲信息 -->
        <div class="center-controls">
          <div class="track-info">
            <div class="track-title">{{ player.currentSong?.title || '' }}</div>
            <div class="track-artist">{{ player.currentSong?.artist || '' }}</div>
          </div>
        </div>

        <!-- 右侧 -->
        <div class="right-controls">
          <!-- 音量 -->
          <div class="volume-controls">
            <button @click="player.toggleMute()" class="sketch-icon" title="音量" style="padding: 2px;">
              <svg v-if="!player.muted && player.volume > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5.5 7H3C2.5 7 2 7.5 2 8V16C2 16.5 2.5 17 3 17H5.5L12 21C12.5 21.3 13 20.8 13 20V4C13 3.2 12.5 2.7 12 3L5.5 7Z"/>
                <path d="M16.5 9C17.5 10 18 11.5 18 13C18 14.5 17.5 16 16.5 17"/>
                <path d="M19.5 6C21 7.5 22 10 22 13C22 16 21 18.5 19.5 20"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5.5 7H3C2.5 7 2 7.5 2 8V16C2 16.5 2.5 17 3 17H5.5L12 21C12.5 21.3 13 20.8 13 20V4C13 3.2 12.5 2.7 12 3L5.5 7Z"/>
                <line x1="18" y1="8" x2="24" y2="14"/>
                <line x1="24" y1="8" x2="18" y2="14"/>
              </svg>
            </button>
            <input type="range" class="volume-slider" min="0" max="1" step="0.01"
              :value="player.muted ? 0 : player.volume"
              @input="player.setVolume(($event.target as HTMLInputElement).valueAsNumber)" />
          </div>
          <!-- 喜欢 -->
          <button
            @click="player.currentSong && player.toggleFavorite(player.currentSong)"
            class="sketch-icon"
            :title="player.currentSong && player.isFavorite(player.currentSong) ? '取消喜欢' : '喜欢'"
            :disabled="!player.currentSong"
            style="padding: 2px;"
          >
            <svg v-if="player.currentSong && player.isFavorite(player.currentSong)" width="16" height="16" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <!-- 歌词 -->
          <button @click="toggleLyricPanel" class="sketch-icon" title="歌词" :disabled="!player.currentSong" style="padding: 2px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5L8 3L12 5L16 3L20 5V19"/>
              <line x1="4" y1="9" x2="20" y2="9"/>
              <line x1="4" y1="13" x2="16" y2="13"/>
              <line x1="4" y1="17" x2="18" y2="17"/>
              <circle cx="6" cy="21" r="2" fill="#4a4a4a"/>
              <circle cx="18" cy="19" r="2" fill="#4a4a4a"/>
            </svg>
          </button>
          <!-- 播放模式 -->
          <button @click="player.togglePlayMode()" class="sketch-icon" :title="player.playModeLabel" style="padding: 2px;" :disabled="!player.currentSong">
            <svg v-if="player.playModeIcon === 'mdi:repeat'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 4L5 7L8 10"/>
              <path d="M5 7H18C19.5 7 20 8.5 20 10V10.5"/>
              <path d="M16 20L19 17L16 14"/>
              <path d="M19 17H6C4.5 17 4 15.5 4 14V13.5"/>
            </svg>
            <svg v-else-if="player.playModeIcon === 'mdi:shuffle'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6L10 12L4 18M14 6L20 12L14 18M20 4L22 6L20 8M20 16L22 18L20 20M4 6H14M4 18H14"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 4L5 7L8 10"/>
              <path d="M5 7H18C19.5 7 20 8.5 20 10V10.5"/>
              <path d="M16 20L19 17L16 14"/>
              <path d="M19 17H6C4.5 17 4 15.5 4 14V13.5"/>
              <text x="8" y="15" font-size="6" fill="#4a4a4a" stroke="none" font-family="Ma Shan Zheng" font-weight="bold">1</text>
            </svg>
          </button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div v-if="player.error" class="player-error" role="alert">
          <span>{{ player.error }}</span>
          <button type="button" class="player-error-close" @click="player.clearError()" aria-label="关闭">×</button>
        </div>
        <div class="progress-times">
          <span class="time">{{ player.formattedCurrentTime }}</span>
          <span class="time">{{ player.formattedDuration }}</span>
        </div>
        <div class="progress-container" @click="seek">
          <div class="progress-bar" :style="{ width: `${player.progress}%` }"></div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';

const player = usePlayerStore();
const ui = useUIStore();
const { playNext, playPrevious, seekTo } = useAudio();

let errorTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => player.error,
  (msg) => {
    if (errorTimer) clearTimeout(errorTimer);
    if (!msg) return;
    errorTimer = setTimeout(() => player.clearError(), 5000);
  },
);

function seek(e: MouseEvent) {
  if (!player.currentSong || !player.duration) return;
  const t = e.currentTarget as HTMLElement;
  const rect = t.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  seekTo(pct * player.duration);
}

function toggleLyricPanel() {
  ui.toggleLyricPanel();
}
</script>

<style scoped>
.player-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  padding: 6px 10px;
  border: 1px dashed #e74c3c;
  border-radius: 6px;
  background: rgba(231, 76, 60, 0.08);
  color: #c0392b;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
}

.player-error-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
}
</style>
