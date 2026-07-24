<template>
  <Teleport to="body" :disabled="!ui.karaokeMode">
    <div
      v-if="ui.showLyricPanel && player.currentSong"
      class="lyrics-sidebar"
      :class="{
        'is-mobile-sheet': isMobile && !ui.karaokeMode,
        'is-karaoke': ui.karaokeMode,
      }"
      :style="sidebarStyle"
    >
      <div
        v-if="!isMobile && !ui.karaokeMode"
        class="lyrics-resizer"
        title="拖动调整歌词宽度"
        @mousedown="startResize"
      />

      <header class="lyrics-toolbar">
        <div class="lyrics-mobile-meta">
          <span class="lyrics-mobile-title">{{ player.currentSong.title }}</span>
          <span class="lyrics-mobile-artist">{{ player.currentSong.artist }}</span>
        </div>
        <div class="lyrics-toolbar-actions">
          <button
            type="button"
            class="lyrics-tool-btn"
            :class="{ active: ui.karaokeMode }"
            title="跟唱模式"
            @click="toggleKaraokeMode"
          >
            跟唱
          </button>
          <label
            v-if="ui.karaokeMode"
            class="lyrics-soft-toggle"
            title="压低原唱音量，方便跟唱"
          >
            <input
              type="checkbox"
              :checked="ui.karaokeSoftVocal"
              @change="ui.setKaraokeSoftVocal(($event.target as HTMLInputElement).checked)"
            />
            <span>压低原唱</span>
          </label>
          <button
            type="button"
            class="lyrics-close-btn"
            aria-label="关闭歌词"
            @click="ui.closeLyricPanel()"
          >
            ×
          </button>
        </div>
      </header>

      <div
        v-if="showSeekHint && lines.length > 0 && !ui.karaokeMode"
        class="lyrics-seek-hint"
        role="status"
      >
        <span>点击歌词可跳转到对应位置</span>
        <button type="button" class="lyrics-seek-hint-ok" @click="dismissSeekHint">知道了</button>
      </div>

      <div v-if="ui.karaokeMode" class="karaoke-stage" aria-live="polite">
        <p class="karaoke-meta">
          <span>{{ player.currentSong.title }}</span>
          <span v-if="player.currentSong.artist"> · {{ player.currentSong.artist }}</span>
        </p>
        <template v-if="lines.length > 0">
          <div v-if="countdown > 0" class="karaoke-countdown" aria-label="倒计时">
            <span
              v-for="n in 3"
              :key="n"
              class="karaoke-beat"
              :class="{ on: n <= countdown }"
            />
            <em>{{ countdown }}</em>
          </div>
          <p class="karaoke-now">{{ activeText }}</p>
          <p v-if="upcomingText" class="karaoke-next">下一句 {{ upcomingText }}</p>
          <p class="karaoke-tip">点击下方歌词跳句 · K 开关 · Esc 退出</p>
        </template>
        <p v-else class="karaoke-now karaoke-empty">暂无歌词，无法跟唱</p>
      </div>

      <div v-if="!ui.karaokeMode || lines.length > 0" class="lyrics-sidebar-content">
        <div v-if="lines.length === 0" class="lyrics-placeholder">
          暂无歌词
        </div>
        <div v-else class="lyrics-scroll lyrics-sidebar-scroll" ref="sidebarScroller">
          <div class="lyrics-sidebar-lines">
            <div class="lyrics-edge-spacer"></div>
            <LyricLine
              v-for="(line, i) in lines"
              :key="`sidebar-${i}`"
              :line="line"
              :index="i"
              :size="ui.karaokeMode ? 'karaoke' : 'normal'"
              :is-active="i === player.currentLyricIndex"
              :is-passed="i < player.currentLyricIndex"
              :is-upcoming="i === player.currentLyricIndex + 1"
              :line-ref-setter="addLineRef(i)"
              @line-click="handleLineClick"
            />
            <div class="lyrics-edge-spacer"></div>
          </div>
        </div>
      </div>

      <div v-if="!isMobile && !ui.karaokeMode" class="lyrics-signature">
        <span class="lyrics-signature-title">{{ player.currentSong?.title }}</span>
        <span class="lyrics-signature-artist">{{ player.currentSong?.artist }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';
import storage from '../core/storage';
import LyricLine from './LyricLine.vue';

const SEEK_HINT_KEY = 'lyricSeekHintDismissed';
const COUNTDOWN_WINDOW = 3;

const player = usePlayerStore();
const ui = useUIStore();
const { seekTo } = useAudio();
const lines = computed(() => player.lyric?.lines || []);

const sidebarScroller = ref<HTMLElement | null>(null);
const lineRefs = ref<HTMLElement[]>([]);
const sidebarWidth = ref(350);
const isMobile = ref(false);
const showSeekHint = ref(!storage.get<boolean>(SEEK_HINT_KEY, false));

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 560;
const MIN_MAIN_CONTENT_WIDTH = 420;
const MOBILE_QUERY = '(max-width: 768px), (max-height: 520px) and (orientation: landscape)';

const isResizing = ref(false);

const sidebarStyle = computed(() => {
  if (isMobile.value || ui.karaokeMode) return undefined;
  return { width: `${sidebarWidth.value}px` };
});

const activeText = computed(() => {
  const idx = player.currentLyricIndex;
  if (idx < 0) return '准备跟唱…';
  return lines.value[idx]?.text || '· · ·';
});

const upcomingText = computed(() => {
  const idx = player.currentLyricIndex;
  const next = idx < 0 ? lines.value[0] : lines.value[idx + 1];
  return next?.text || '';
});

const countdown = computed(() => {
  const list = lines.value;
  if (!list.length) return 0;
  const now = player.currentTime;
  const idx = player.currentLyricIndex;
  const target = idx < 0 ? list[0] : list[idx + 1];
  if (!target) return 0;
  const remain = target.time - now;
  if (remain <= 0 || remain > COUNTDOWN_WINDOW) return 0;
  return Math.ceil(remain);
});

function addLineRef(index: number) {
  return (el: HTMLElement | null) => {
    if (el) {
      lineRefs.value[index] = el;
      return;
    }
    lineRefs.value[index] = undefined as unknown as HTMLElement;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function syncMobile() {
  isMobile.value = window.matchMedia(MOBILE_QUERY).matches;
}

function computeSidebarWidthFromPointer(clientX: number) {
  const viewportWidth = window.innerWidth;
  const maxByViewport = Math.max(MIN_SIDEBAR_WIDTH, viewportWidth - MIN_MAIN_CONTENT_WIDTH);
  const maxAllowed = Math.min(MAX_SIDEBAR_WIDTH, maxByViewport);
  return clamp(viewportWidth - clientX, MIN_SIDEBAR_WIDTH, maxAllowed);
}

function onResizeMove(event: MouseEvent) {
  if (!isResizing.value) return;
  sidebarWidth.value = computeSidebarWidthFromPointer(event.clientX);
}

function stopResize() {
  if (!isResizing.value) return;
  isResizing.value = false;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
}

function startResize(event: MouseEvent) {
  if (isMobile.value || ui.karaokeMode) return;
  event.preventDefault();
  isResizing.value = true;
  sidebarWidth.value = computeSidebarWidthFromPointer(event.clientX);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function centerActiveLine(scroller: HTMLElement | null, lineEl: HTMLElement | undefined) {
  if (!scroller || !lineEl) return;
  const top = lineEl.offsetTop - scroller.clientHeight / 2 + lineEl.clientHeight / 2;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

async function autoScrollToActiveLine() {
  await nextTick();
  const index = player.currentLyricIndex;
  if (index < 0) return;
  centerActiveLine(sidebarScroller.value, lineRefs.value[index]);
}

watch(
  () => [player.currentLyricIndex, ui.showLyricPanel, lines.value.length, isMobile.value, ui.karaokeMode],
  () => {
    if (ui.showLyricPanel) autoScrollToActiveLine();
  },
  { immediate: true },
);

watch(
  () => lines.value,
  () => {
    lineRefs.value = [];
    if (ui.showLyricPanel) autoScrollToActiveLine();
  },
);

let mediaQuery: MediaQueryList | null = null;

function onMediaChange() {
  syncMobile();
  if (isMobile.value) stopResize();
  if (ui.showLyricPanel) autoScrollToActiveLine();
}

onMounted(() => {
  syncMobile();
  mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener('change', onMediaChange);
});

onBeforeUnmount(() => {
  stopResize();
  mediaQuery?.removeEventListener('change', onMediaChange);
});

function dismissSeekHint() {
  showSeekHint.value = false;
  storage.set(SEEK_HINT_KEY, true);
}

function handleLineClick(time: number) {
  if (showSeekHint.value) dismissSeekHint();
  seekTo(time);
}

function toggleKaraokeMode() {
  ui.toggleKaraokeMode();
}
</script>

<style scoped>
.lyrics-sidebar {
  border-left: 2px dashed var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: transparent;
  min-height: 0;
  animation: lyricPanelIn 0.22s ease-out;
}

.lyrics-sidebar.is-karaoke {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  width: auto !important;
  height: auto !important;
  border-left: none;
  border-top: none;
  background-color: var(--paper-bg);
  background-image:
    linear-gradient(var(--paper-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--paper-grid) 1px, transparent 1px);
  background-size: 28px 28px;
  /* 低于播放栏(1000)，留出底部操作区；高于主内容 */
  z-index: 900;
  animation: lyricSheetIn 0.22s ease-out;
}

.lyrics-resizer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: col-resize;
  z-index: 10;
}

.lyrics-resizer::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 42px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 90%, transparent);
}

.lyrics-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px dashed var(--border);
  flex-shrink: 0;
  background: transparent;
}

.lyrics-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.lyrics-tool-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  padding: 6px 10px;
  cursor: pointer;
}

.lyrics-tool-btn.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--ink);
}

.lyrics-soft-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
}

.lyrics-soft-toggle input {
  accent-color: var(--accent);
}

.karaoke-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px 16px;
  text-align: center;
  min-height: 0;
  border-bottom: 1px dashed var(--border-soft);
}

.karaoke-meta {
  margin: 0 0 16px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  color: var(--muted);
  max-width: min(92%, 520px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.karaoke-empty {
  color: var(--muted);
  font-weight: 400;
}

.karaoke-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 28px;
  margin-bottom: 8px;
}

.karaoke-beat {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.karaoke-beat.on {
  background: var(--accent);
  border-color: var(--accent);
}

.karaoke-countdown em {
  font-style: normal;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 18px;
  color: var(--accent);
  min-width: 1.2em;
}

.karaoke-now {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: clamp(26px, 6vw, 42px);
  line-height: 1.35;
  color: var(--accent);
  font-weight: 700;
  min-height: 1.4em;
}

.karaoke-next {
  margin: 10px 0 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: clamp(14px, 3.2vw, 18px);
  color: var(--muted);
}

.karaoke-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--faint);
  font-family: 'Ma Shan Zheng', cursive;
}

.lyrics-sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lyrics-sidebar-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  padding: 8px 0;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

.lyrics-sidebar-lines {
  display: flex;
  flex-direction: column;
}

.lyrics-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted);
  font-size: 14px;
  font-family: 'Ma Shan Zheng', cursive;
  flex: 1;
}

.lyrics-scroll {
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.lyrics-scroll::-webkit-scrollbar {
  display: none;
}

.lyrics-edge-spacer {
  height: 40%;
  min-height: 72px;
}

.lyrics-sidebar.is-karaoke .lyrics-sidebar-content {
  flex: 0 0 28%;
  max-height: 32%;
  border-top: 1px dashed var(--border-soft);
}

.lyrics-sidebar.is-karaoke .lyrics-edge-spacer {
  height: 12%;
  min-height: 20px;
}

.lyrics-signature {
  padding: 12px 16px;
  text-align: right;
  border-top: 1px dashed var(--border);
  flex-shrink: 0;
  background: transparent;
}

.lyrics-signature-title {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 15px;
  color: var(--ink);
}

.lyrics-signature-artist {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--muted);
  margin-top: 2px;
}

.lyrics-mobile-meta {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.lyrics-mobile-title {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-mobile-artist {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-close-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-soft);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.lyrics-close-btn:active {
  background: var(--hover);
}

.lyrics-seek-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px dashed var(--border);
  background: var(--accent-soft);
  color: var(--ink-soft);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  flex-shrink: 0;
}

.lyrics-seek-hint-ok {
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface-strong);
  color: var(--ink);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}

@keyframes lyricPanelIn {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px), (max-height: 520px) and (orientation: landscape) {
  .lyrics-sidebar.is-mobile-sheet {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    border-left: none;
    border-top: 2px dashed var(--border);
    background-color: var(--paper-bg);
    background-image:
      linear-gradient(var(--paper-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--paper-grid) 1px, transparent 1px);
    background-size: 28px 28px;
    z-index: 40;
    animation: lyricSheetIn 0.22s ease-out;
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }

  .lyrics-sidebar.is-karaoke {
    bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }

  .lyrics-edge-spacer {
    height: 35%;
    min-height: 56px;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .lyrics-toolbar {
    padding: 6px 10px;
  }

  .lyrics-mobile-artist {
    display: none;
  }

  .lyrics-sidebar.is-karaoke .lyrics-sidebar-content {
    flex-basis: 22%;
    max-height: 24%;
  }

  .karaoke-stage {
    padding: 8px 12px 6px;
  }

  .karaoke-now {
    font-size: clamp(18px, 4.5vw, 28px);
  }

  .lyrics-edge-spacer {
    height: 14%;
    min-height: 20px;
  }

  .lyrics-close-btn {
    width: 32px;
    height: 32px;
  }
}

@keyframes lyricSheetIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lyrics-sidebar,
  .lyrics-sidebar.is-mobile-sheet,
  .lyrics-sidebar.is-karaoke {
    animation: none;
  }
}
</style>
