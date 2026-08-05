<template>
  <footer class="bottom-controller">
    <div class="controller-container">
      <div class="main-controls">
        <!-- 左侧：手绘控制按钮 -->
        <div class="left-controls">
          <button @click="playPrevious()" class="sketch-icon" title="上一首" :disabled="!player.currentSong">
            <SketchIcon name="prev" :size="20" :stroke-width="2.4" />
          </button>
          <button @click="player.togglePlay()" class="sketch-icon sketch-icon-play" title="播放/暂停" :disabled="!player.currentSong">
            <SketchIcon
              :name="player.loading ? 'loading' : player.isPlaying ? 'pause' : 'play'"
              :size="26"
              :stroke-width="player.loading ? 1.8 : 2.2"
              :class="{ 'icon-spin': player.loading }"
            />
          </button>
          <button @click="playNext()" class="sketch-icon" title="下一首" :disabled="!player.currentSong">
            <SketchIcon name="next" :size="20" :stroke-width="2.4" />
          </button>
        </div>

        <!-- 中间歌曲信息 -->
        <div class="center-controls">
          <div class="track-info">
            <div class="track-title-wrap">
              <div
                class="track-title"
                :class="{ marquee: shouldMarquee }"
              >
                {{ player.currentSong?.title || '' }}
              </div>
            </div>
            <div class="track-artist">{{ player.currentSong?.artist || '' }}</div>
          </div>
        </div>

        <!-- 右侧 -->
        <div class="right-controls">
          <div class="volume-controls">
            <button @click="player.toggleMute()" class="sketch-icon" title="音量" style="padding: 2px;">
              <SketchIcon
                :name="!player.muted && player.volume > 0 ? 'volume' : 'mute'"
                :size="17"
              />
            </button>
            <input type="range" class="volume-slider" min="0" max="1" step="0.01"
              :value="player.muted ? 0 : player.volume"
              @input="player.setVolume(($event.target as HTMLInputElement).valueAsNumber)" />
          </div>
          <button
            @click="player.currentSong && player.toggleFavorite(player.currentSong)"
            class="sketch-icon"
            :class="{ 'fav-on': player.currentSong && player.isFavorite(player.currentSong) }"
            :title="player.currentSong && player.isFavorite(player.currentSong) ? '取消喜欢' : '喜欢'"
            :disabled="!player.currentSong"
            style="padding: 2px;"
          >
            <SketchIcon
              name="heart"
              :size="17"
              :filled="!!(player.currentSong && player.isFavorite(player.currentSong))"
            />
          </button>
          <button
            @click="toggleLyricPanel"
            class="sketch-icon"
            :class="{ active: ui.showLyricPanel }"
            title="歌词 (L)"
            :disabled="!player.currentSong"
            style="padding: 2px;"
          >
            <SketchIcon name="lyric" :size="17" />
          </button>
          <button @click="player.togglePlayMode()" class="sketch-icon" :title="player.playModeLabel" style="padding: 2px;" :disabled="!player.currentSong">
            <SketchIcon :name="modeIcon" :size="17" />
          </button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-row">
          <span class="time">{{ player.formattedCurrentTime }}</span>
          <div
            ref="progressEl"
            class="progress-container"
            :class="{ dragging: isDragging }"
            @pointerdown="onPointerDown"
          >
            <div class="progress-bar" :style="{ width: `${displayProgress}%` }"></div>
          </div>
          <span class="time">{{ player.formattedDuration }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="player.error" class="player-toast" role="alert">
        <span class="player-toast-text">{{ player.error }}</span>
        <button type="button" class="player-toast-close" @click="player.clearError()" aria-label="关闭">×</button>
      </div>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';
import SketchIcon from './icons/SketchIcon.vue';
import type { SketchIconName } from './icons/SketchIcon.vue';

const player = usePlayerStore();
const ui = useUIStore();
const { playNext, playPrevious, seekTo } = useAudio();

const progressEl = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragProgress = ref(0);

const displayProgress = computed(() =>
  isDragging.value ? dragProgress.value : player.progress,
);

const shouldMarquee = computed(() => (player.currentSong?.title?.length || 0) > 12);

const modeIcon = computed<SketchIconName>(() => {
  const map: Record<string, SketchIconName> = {
    order: 'mode-order',
    random: 'mode-random',
    loop: 'mode-loop',
    single: 'mode-single',
  };
  return map[player.playMode] || 'mode-order';
});

let errorTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => player.error,
  (msg) => {
    if (errorTimer) clearTimeout(errorTimer);
    if (!msg) return;
    errorTimer = setTimeout(() => player.clearError(), 5000);
  },
);

function progressFromClientX(clientX: number): number {
  const el = progressEl.value;
  if (!el || !player.duration) return 0;
  const rect = el.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return pct * 100;
}

function seekFromClientX(clientX: number) {
  if (!player.currentSong || !player.duration) return;
  const pct = progressFromClientX(clientX) / 100;
  seekTo(pct * player.duration);
}

function onPointerDown(e: PointerEvent) {
  if (!player.currentSong || !player.duration) return;
  const el = progressEl.value;
  if (!el) return;

  isDragging.value = true;
  dragProgress.value = progressFromClientX(e.clientX);
  el.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    dragProgress.value = progressFromClientX(ev.clientX);
  };
  const onUp = (ev: PointerEvent) => {
    seekFromClientX(ev.clientX);
    isDragging.value = false;
    el.releasePointerCapture(ev.pointerId);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}

function toggleLyricPanel() {
  ui.toggleLyricPanel();
}

</script>

<style scoped>
.player-toast {
  position: fixed;
  left: 50%;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 8px);
  transform: translateX(-50%);
  z-index: 1600;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(92vw, 420px);
  padding: 10px 12px 10px 14px;
  border: var(--stroke-focus);
  border-radius: 10px;
  background: color-mix(in srgb, var(--paper-bg) 92%, var(--accent-soft));
  color: var(--accent);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  line-height: 1.35;
  animation: toastIn 0.2s ease-out;
}

@media (max-width: 768px) {
  .player-toast {
    bottom: calc(82px + 24px + env(safe-area-inset-bottom, 0px) + 8px);
  }
}

@media (max-width: 420px) {
  .player-toast {
    bottom: calc(80px + 28px + env(safe-area-inset-bottom, 0px) + 8px);
  }
}

.player-toast-text {
  flex: 1;
  min-width: 0;
}

.player-toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translate(-50%, 8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.sketch-icon {
  color: var(--ink-soft);
}

.sketch-icon.active {
  color: var(--accent);
}

.fav-on {
  color: var(--accent);
}

.icon-spin {
  animation: iconSpin 0.9s linear infinite;
}

@keyframes iconSpin {
  to { transform: rotate(360deg); }
}
</style>
