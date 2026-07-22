<template>
  <div
    v-if="ui.showLyricPanel && player.currentSong"
    class="lyrics-sidebar"
    :class="{ 'is-mobile-sheet': isMobile }"
    :style="sidebarStyle"
  >
    <div
      v-if="!isMobile"
      class="lyrics-resizer"
      title="拖动调整歌词宽度"
      @mousedown="startResize"
    />

    <header v-if="isMobile" class="lyrics-mobile-bar">
      <div class="lyrics-mobile-meta">
        <span class="lyrics-mobile-title">{{ player.currentSong.title }}</span>
        <span class="lyrics-mobile-artist">{{ player.currentSong.artist }}</span>
      </div>
      <button
        type="button"
        class="lyrics-close-btn"
        aria-label="关闭歌词"
        @click="ui.closeLyricPanel()"
      >
        ×
      </button>
    </header>

    <div
      v-if="isMobile && showSeekHint && lines.length > 0"
      class="lyrics-seek-hint"
      role="status"
    >
      <span>点击歌词可跳转到对应位置</span>
      <button type="button" class="lyrics-seek-hint-ok" @click="dismissSeekHint">知道了</button>
    </div>

    <div class="lyrics-sidebar-content">
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
            :is-active="i === player.currentLyricIndex"
            :is-passed="i < player.currentLyricIndex"
            :line-ref-setter="addLineRef(i)"
            @line-click="handleLineClick"
          />
          <div class="lyrics-edge-spacer"></div>
        </div>
      </div>
    </div>

    <div v-if="!isMobile" class="lyrics-signature">
      <span class="lyrics-signature-title">{{ player.currentSong?.title }}</span>
      <span class="lyrics-signature-artist">{{ player.currentSong?.artist }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';
import storage from '../core/storage';
import LyricLine from './LyricLine.vue';

const SEEK_HINT_KEY = 'lyricSeekHintDismissed';

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
const MOBILE_QUERY = '(max-width: 768px)';

const isResizing = ref(false);

const sidebarStyle = computed(() =>
  isMobile.value ? undefined : { width: `${sidebarWidth.value}px` },
);

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
  if (isMobile.value) return;
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
  () => [player.currentLyricIndex, ui.showLyricPanel, lines.value.length, isMobile.value],
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
</script>

<style scoped>
.lyrics-sidebar {
  border-left: 2px dashed var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: color-mix(in srgb, var(--paper-bg) 92%, transparent);
  min-height: 0;
  animation: lyricPanelIn 0.22s ease-out;
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

.lyrics-signature {
  padding: 12px 16px;
  text-align: right;
  border-top: 1px dashed var(--border);
  flex-shrink: 0;
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

.lyrics-mobile-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px dashed var(--border);
  flex-shrink: 0;
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

/* 移动端：铺满顶栏与播放条之间的主内容区，避免写死高度 */
@media (max-width: 768px) {
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
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
    animation: lyricSheetIn 0.22s ease-out;
  }

  .lyrics-edge-spacer {
    height: 35%;
    min-height: 56px;
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
  .lyrics-sidebar.is-mobile-sheet {
    animation: none;
  }
}
</style>
