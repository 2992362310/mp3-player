<template>
  <!-- 侧边栏模式 -->
  <div
    v-if="ui.showLyricPanel && player.currentSong"
    class="lyrics-sidebar"
    :style="{ width: `${sidebarWidth}px` }"
  >
    <div class="lyrics-resizer" @mousedown="startResize" title="拖动调整歌词宽度"></div>
    <div class="lyrics-sidebar-content">
      <div v-if="lines.length === 0" class="lyrics-placeholder">
        ✏️ 暂无歌词
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
            variant="sidebar"
            :line-ref-setter="addLineRef(i)"
            @line-click="handleLineClick"
          />
          <div class="lyrics-edge-spacer"></div>
        </div>
      </div>
    </div>
    <div class="lyrics-signature">
      <span class="lyrics-signature-title">{{ player.currentSong?.title }}</span>
      <span class="lyrics-signature-artist">{{ player.currentSong?.artist }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import { useAudio } from '../composables/useAudio';
import LyricLine from './LyricLine.vue';

const player = usePlayerStore();
const ui = useUIStore();
const { seekTo } = useAudio();
const lines = computed(() => player.lyric?.lines || []);

/* ========== Ref 管理 ========== */
const sidebarScroller = ref<HTMLElement | null>(null);
const lineRefs = ref<HTMLElement[]>([]);
const sidebarWidth = ref(350);

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 560;
const MIN_MAIN_CONTENT_WIDTH = 420;

const isResizing = ref(false);

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
  () => [player.currentLyricIndex, ui.showLyricPanel, lines.value.length],
  () => {
    if (ui.showLyricPanel) autoScrollToActiveLine();
  },
  { immediate: true }
);

watch(
  () => lines.value,
  () => {
    lineRefs.value = [];
    if (ui.showLyricPanel) autoScrollToActiveLine();
  }
);

onBeforeUnmount(() => {
  stopResize();
});

function handleLineClick(time: number) {
  seekTo(time);
}
</script>

<style scoped>
/* ========== 侧栏模式 ========== */
.lyrics-sidebar {
  border-left: 2px dashed #d4c5a0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
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
  background: rgba(196, 181, 160, 0.9);
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
  color: #999;
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

/* ========== 右下角签名 ========== */
.lyrics-signature {
  padding: 12px 16px;
  text-align: right;
  border-top: 1px dashed #d4c5a0;
  flex-shrink: 0;
}

.lyrics-signature-title {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 15px;
  color: #2d2d2d;
}

.lyrics-signature-artist {
  display: block;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .lyrics-sidebar {
    position: fixed;
    bottom: 64px;
    left: 0;
    right: 0;
    width: 100% !important;
    height: calc(100vh - 64px - 100px);
    max-height: none;
    border-left: none;
    border-top: 2px dashed #d4c5a0;
    background-color: #fdf6e3;
    z-index: 500;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  }

  .lyrics-resizer {
    display: none;
  }
}
</style>
