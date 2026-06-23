<template>
  <footer class="bottom-controller">
    <div class="controller-container">
      <div class="main-controls">
        <!-- 左侧：手绘控制按钮 -->
        <div class="left-controls">
          <!-- 上一首 -->
          <button @click="playPrevious()" class="sketch-icon" title="上一首" :disabled="!player.currentSong">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 5V19M18 6L9 12L18 18V6Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <!-- 播放/暂停 -->
          <button @click="player.togglePlay()" class="sketch-icon sketch-icon-play" title="播放/暂停" :disabled="!player.currentSong">
            <svg v-if="player.loading" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="9" fill="none" stroke-dasharray="3,2"/>
            </svg>
            <svg v-else-if="player.isPlaying" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.5" stroke-linecap="round">
              <rect x="6" y="5" width="3" height="14" rx="0.5" fill="#4a4a4a"/>
              <rect x="15" y="5" width="3" height="14" rx="0.5" fill="#4a4a4a"/>
            </svg>
            <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="#4a4a4a" stroke="#4a4a4a" stroke-width="1">
              <path d="M8 5.5C7.9 5.4 7.8 5.5 7.8 5.6L7.8 18.4C7.8 18.5 7.9 18.6 8 18.5L18.5 12C18.6 12 18.6 11.9 18.5 11.8L8 5.5Z"/>
            </svg>
          </button>
          <!-- 下一首 -->
          <button @click="playNext()" class="sketch-icon" title="下一首" :disabled="!player.currentSong">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 5V19M6 6L15 12L6 18V6Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- 中间歌曲信息 -->
        <div class="center-controls">
          <div class="track-info">
            <div class="track-title">{{ player.currentSong?.title || '请先搜索并播放歌曲' }}</div>
            <div class="track-artist">{{ player.currentSong?.artist || '点击上方搜索，双击歌曲即可开始播放' }}</div>
          </div>
        </div>

        <!-- 右侧 -->
        <div class="right-controls">
          <!-- 音量 -->
          <div class="volume-controls">
            <button @click="player.toggleMute()" class="sketch-icon" title="音量" style="padding: 2px;">
              <!-- 音量开 -->
              <svg v-if="!player.muted && player.volume > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5.5 7H3C2.5 7 2 7.5 2 8V16C2 16.5 2.5 17 3 17H5.5L12 21C12.5 21.3 13 20.8 13 20V4C13 3.2 12.5 2.7 12 3L5.5 7Z"/>
                <path d="M16.5 9C17.5 10 18 11.5 18 13C18 14.5 17.5 16 16.5 17"/>
                <path d="M19.5 6C21 7.5 22 10 22 13C22 16 21 18.5 19.5 20"/>
              </svg>
              <!-- 静音 -->
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
          <!-- 歌词 -->
          <button @click="toggleLyricPanel" class="sketch-icon" title="歌词" :disabled="!player.currentSong">
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
            <!-- 列表循环 -->
            <svg v-if="player.playModeIcon === 'mdi:repeat'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 4L5 7L8 10"/>
              <path d="M5 7H18C19.5 7 20 8.5 20 10V10.5"/>
              <path d="M16 20L19 17L16 14"/>
              <path d="M19 17H6C4.5 17 4 15.5 4 14V13.5"/>
            </svg>
            <!-- 随机播放 -->
            <svg v-else-if="player.playModeIcon === 'mdi:shuffle'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6L10 12L4 18M14 6L20 12L14 18M20 4L22 6L20 8M20 16L22 18L20 20M4 6H14M4 18H14"/>
            </svg>
            <!-- 单曲循环 -->
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
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';

const player = usePlayerStore();
const ui = useUIStore();
const { playNext, playPrevious } = useAudio();

function seek(e: MouseEvent) {
  if (!player.currentSong || !player.duration) return;
  const t = e.currentTarget as HTMLElement;
  const rect = t.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  player.seekTo(pct * player.duration);
}

function toggleLyricPanel() {
  ui.toggleLyricPanel();
}
</script>
