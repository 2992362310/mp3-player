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
            <button @click="player.toggleMute()" class="sketch-icon" title="音量">
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
           
          >
            <SketchIcon name="lyric" :size="17" />
          </button>
          <button
            @click="desktopLyrics.toggle()"
            class="sketch-icon"
            :class="{ active: desktopLyrics.isOpen }"
            :title="desktopLyrics.isOpen ? '关闭桌面歌词' : '桌面歌词（独立窗口）'"
            :disabled="!player.currentSong"
          >
            <SketchIcon name="popout" :size="17" />
          </button>
          <button @click="player.togglePlayMode()" class="sketch-icon" :title="player.playModeLabel" :disabled="!player.currentSong">
            <SketchIcon :name="modeIcon" :size="17" />
          </button>
          <!-- 睡眠定时 -->
          <div class="popover-anchor">
            <button
              @click="showSleepMenu = !showSleepMenu"
              class="sketch-icon"
              :class="{ active: sleepTimer.active }"
              :title="sleepTimer.active ? `定时 ${sleepTimer.formattedRemaining}` : '睡眠定时'"
             
            >
              <SketchIcon name="clock" :size="17" />
            </button>
            <Teleport to="body">
              <div v-if="showSleepMenu" class="popover-overlay" @click="showSleepMenu = false" />
              <div v-if="showSleepMenu" class="sleep-popover">
                <div class="sleep-popover-header">
                  <span>睡眠定时</span>
                  <button class="sleep-popover-close" @click="showSleepMenu = false">
                    <SketchIcon name="x" :size="14" />
                  </button>
                </div>
                <div v-if="sleepTimer.active" class="sleep-active-info">
                  <span class="sleep-countdown">{{ sleepTimer.formattedRemaining }}</span>
                  <button class="btn-action btn-action-sm" @click="sleepTimer.stop(); showSleepMenu = false">取消</button>
                </div>
                <div v-else class="sleep-presets">
                  <button
                    v-for="opt in sleepTimer.presetOptions"
                    :key="opt.value"
                    class="sleep-preset-btn"
                    @click="startSleep(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <label class="sleep-fade-toggle">
                  <input type="checkbox" :checked="sleepTimer.fadeOut" @change="sleepTimer.setFadeOut(($event.target as HTMLInputElement).checked)" />
                  <span>到时渐弱音量</span>
                </label>
              </div>
            </Teleport>
          </div>
          <!-- 播放队列 -->
          <button
            @click="toggleQueuePanel"
            class="sketch-icon"
            :class="{ active: showQueuePanel }"
            title="播放队列 (Q)"
           
          >
            <SketchIcon name="queue" :size="17" />
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

    <!-- 播放队列面板 -->
    <Teleport to="body">
      <div v-if="showQueuePanel" class="queue-overlay" @click.self="showQueuePanel = false">
        <div class="queue-panel">
          <div class="queue-header">
            <h3>播放队列 <em>{{ player.queue.length }} 首</em></h3>
            <div class="queue-header-actions">
              <button v-if="player.queue.length > 0" class="btn-action btn-action-sm" @click="clearQueue">清空</button>
              <button class="queue-close-btn" @click="showQueuePanel = false">
                <SketchIcon name="x" :size="16" />
              </button>
            </div>
          </div>
          <div class="queue-list main-scroll">
            <div v-if="player.queue.length === 0" class="queue-empty">队列是空的</div>
            <div
              v-for="(song, idx) in player.queue"
              :key="`${song.sourceId}-${song.id}`"
              :class="['queue-item', idx === player.currentIndex ? 'current' : '']"
              @click="playQueueItem(idx)"
            >
              <span class="queue-item-index">{{ idx === player.currentIndex ? '♪' : idx + 1 }}</span>
              <div class="queue-item-info">
                <div class="queue-item-title">{{ song.title }}</div>
                <div class="queue-item-artist">{{ song.artist }}</div>
              </div>
              <button class="queue-item-remove" title="移出队列" @click.stop="removeFromQueue(idx)">
                <SketchIcon name="x" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useSleepTimerStore } from '../stores/sleepTimer';
import { useDesktopLyricsStore } from '../stores/desktopLyrics';
import { useAudio } from '../composables/useAudio';
import SketchIcon from './icons/SketchIcon.vue';
import type { SketchIconName } from './icons/SketchIcon.vue';

const player = usePlayerStore();
const ui = useUIStore();
const desktopLyrics = useDesktopLyricsStore();
const sleepTimer = useSleepTimerStore();
const { playNext, playPrevious, seekTo, playAtIndex } = useAudio();

const progressEl = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragProgress = ref(0);
const showSleepMenu = ref(false);
const showQueuePanel = ref(false);

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

// 睡眠定时：到时由 useAudio 处理暂停，这里只关菜单
watch(() => sleepTimer.active, (val) => {
  if (!val) showSleepMenu.value = false;
});

function startSleep(minutes: number) {
  sleepTimer.start(minutes);
  showSleepMenu.value = false;
}

function toggleQueuePanel() {
  showQueuePanel.value = !showQueuePanel.value;
}

function playQueueItem(idx: number) {
  playAtIndex(idx);
}

function removeFromQueue(idx: number) {
  const q = [...player.queue];
  q.splice(idx, 1);
  player.setQueue(q);
  if (idx < player.currentIndex) {
    player.currentIndex = player.currentIndex - 1;
  }
}

function clearQueue() {
  player.setQueue([]);
  player.currentIndex = -1;
}

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

onBeforeUnmount(() => {
  if (errorTimer) clearTimeout(errorTimer);
});
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
  border-radius: var(--radius-control);
  background: color-mix(in srgb, var(--paper-bg) 92%, var(--accent-soft));
  color: var(--accent);
  box-shadow: 3px 3px 0 var(--shadow-ink);
  font-family: var(--ui-font);
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
  padding: 2px;
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

/* ===== 睡眠定时弹出层 ===== */
.popover-anchor {
  position: relative;
  display: inline-flex;
}

.popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
}

.sleep-popover {
  position: fixed;
  bottom: calc(90px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  z-index: 1510;
  width: 232px;
  border: var(--stroke-control);
  border-radius: var(--radius-popover);
  background: var(--surface-strong);
  box-shadow: 3px 3px 0 var(--shadow-ink);
  padding: 12px;
  animation: sleepPopIn 0.18s ease-out;
}

@keyframes sleepPopIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.sleep-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--ui-font);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 10px;
}

.sleep-popover-close {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
}

.sleep-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.sleep-preset-btn {
  padding: 8px 6px;
  border: 1px var(--stroke-style-decor) var(--border);
  border-radius: var(--radius-control);
  background: var(--paper-bg);
  color: var(--ink-soft);
  font-family: var(--ui-font);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.sleep-preset-btn:hover {
  background: var(--hover);
  border-color: var(--accent);
}

.sleep-active-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
}

.sleep-countdown {
  font-family: var(--ui-font);
  font-size: 22px;
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.sleep-fade-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px var(--stroke-style-decor) var(--line-soft);
  font-family: var(--ui-font);
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
}

/* ===== 播放队列面板 ===== */
.queue-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  justify-content: flex-end;
}

.queue-panel {
  width: min(360px, 88vw);
  height: 100%;
  background: var(--paper-bg);
  border-left: 2px var(--stroke-style-decor) var(--border);
  box-shadow: -3px 0 0 var(--shadow-ink);
  display: flex;
  flex-direction: column;
  animation: queueSlideIn 0.22s ease-out;
}

@keyframes queueSlideIn {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px var(--stroke-style-decor) var(--line-soft);
  flex-shrink: 0;
}

.queue-header h3 {
  margin: 0;
  font-family: var(--ui-font);
  font-size: 17px;
  color: var(--ink);
}

.queue-header h3 em {
  font-style: normal;
  font-size: 12px;
  color: var(--muted);
  margin-left: 6px;
}

.queue-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.queue-close-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  border-radius: 6px;
}

.queue-close-btn:hover {
  background: var(--hover);
  color: var(--ink);
}

.queue-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.queue-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--muted);
  font-family: var(--ui-font);
  font-size: 14px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-left: var(--stroke-rail-idle);
  border-bottom: 1px var(--stroke-style-decor) var(--line-soft);
  cursor: pointer;
  transition: background 0.12s;
}

.queue-item:hover {
  background: var(--hover);
}

.queue-item.current {
  background: var(--accent-soft);
  border-left-color: var(--accent);
}

.queue-item-index {
  width: 22px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.queue-item.current .queue-item-index {
  color: var(--accent);
  font-size: 15px;
}

.queue-item-info {
  flex: 1;
  min-width: 0;
}

.queue-item-title {
  font-family: var(--ui-font);
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-item-artist {
  font-family: var(--ui-font);
  font-size: 11px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-item-remove {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.queue-item:hover .queue-item-remove {
  opacity: 1;
}

.queue-item-remove:hover {
  color: var(--accent);
}

.btn-action-sm {
  padding: 4px 10px;
  font-size: 12px;
}
</style>
