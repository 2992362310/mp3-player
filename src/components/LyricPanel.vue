<template>
  <!-- 全屏模式 -->
  <Transition name="fade">
    <div
      v-if="canRenderMode('fullscreen') && ui.showLyricPanel && ui.lyricMode === 'fullscreen' && player.currentSong"
      class="lyrics-fullscreen"
      @click="ui.showLyricPanel = false"
    >
      <div class="lyrics-fullscreen-body" @click.stop>
        <LyricHeader
          :title="player.currentSong?.title || ''"
          :artist="player.currentSong?.artist || ''"
          :show-actions="true"
        >
          <template #actions>
            <button class="mode-btn" @click="setLyricMode('sidebar')">侧栏</button>
            <button class="mode-btn" @click="setLyricMode('modal')">弹窗</button>
            <button class="lyrics-modal-close" @click="ui.showLyricPanel = false">&times;</button>
          </template>
        </LyricHeader>

        <div class="lyrics-scroll" ref="fullscreenScroller">
          <div v-if="lines.length === 0" class="lyrics-placeholder">
            <p style="color: #999; font-size: 16px;">✏️ 暂无歌词</p>
          </div>
          <div v-else class="lyrics-content lyrics-content-center">
            <div class="lyrics-edge-spacer"></div>
            <LyricLine
              v-for="(line, i) in lines"
              :key="`full-${i}`"
              :line="line"
              :index="i"
              :is-active="i === player.currentLyricIndex"
              :is-passed="i < player.currentLyricIndex"
              variant="fullscreen"
              :line-ref-setter="addLineRef('fullscreen', i)"
              @line-click="handleLineClick"
            />
            <div class="lyrics-edge-spacer"></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 弹窗模式 -->
  <Transition name="fade">
    <div v-if="canRenderMode('modal') && ui.showLyricPanel && ui.lyricMode === 'modal' && player.currentSong" class="lyrics-modal" @click="ui.showLyricPanel = false">
      <div class="lyrics-modal-content" @click.stop>
        <div class="lyrics-modal-header">
          <h2>🎵 歌词</h2>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="mode-btn" @click="setLyricMode('fullscreen')">全屏</button>
            <button class="lyrics-modal-close" @click="ui.showLyricPanel = false">&times;</button>
          </div>
        </div>
        <div class="lyrics-modal-body">
          <div class="lyrics-info">
            <h3 class="lyrics-title">{{ player.currentSong?.title }}</h3>
            <p class="lyrics-artist">{{ player.currentSong?.artist }}</p>
          </div>
          <div class="lyrics-display lyrics-scroll" ref="modalScroller">
            <div v-if="lines.length === 0" class="lyrics-placeholder">
              <p style="color: #999; font-size: 16px;">✏️ 暂无歌词</p>
            </div>
            <div v-else class="lyrics-content">
              <div class="lyrics-edge-spacer"></div>
              <LyricLine
                v-for="(line, i) in lines"
                :key="`modal-${i}`"
                :line="line"
                :index="i"
                :is-active="i === player.currentLyricIndex"
                :is-passed="i < player.currentLyricIndex"
                variant="modal"
                :line-ref-setter="addLineRef('modal', i)"
                @line-click="handleLineClick"
              />
              <div class="lyrics-edge-spacer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 侧边栏模式 -->
  <div
    v-if="canRenderMode('sidebar') && ui.showLyricPanel && ui.lyricMode === 'sidebar' && player.currentSong"
    class="lyrics-sidebar"
    :style="{ width: `${sidebarWidth}px` }"
  >
    <div class="lyrics-resizer" @mousedown="startResize" title="拖动调整歌词宽度"></div>
    <div class="lyrics-sidebar-header">
      <h3 class="lyrics-sidebar-title">{{ player.currentSong?.title }}</h3>
      <p class="lyrics-sidebar-artist">{{ player.currentSong?.artist }}</p>
      <div class="lyrics-sidebar-actions">
        <button class="sidebar-btn" @click="setLyricMode('modal')">
          弹窗模式
        </button>
        <button class="sidebar-btn" @click="setLyricMode('fullscreen')">
          全屏模式
        </button>
      </div>
    </div>
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
            :line-ref-setter="addLineRef('sidebar', i)"
            @line-click="handleLineClick"
          />
          <div class="lyrics-edge-spacer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';
import LyricLine from './LyricLine.vue';
import LyricHeader from './LyricHeader.vue';

type LyricMode = 'modal' | 'sidebar' | 'fullscreen';

const props = defineProps<{
  renderModes?: LyricMode[];
}>();

const player = usePlayerStore();
const ui = useUIStore();
const lines = computed(() => player.lyric?.lines || []);

function canRenderMode(mode: LyricMode) {
  return !props.renderModes || props.renderModes.includes(mode);
}

/* ========== Ref 管理统一化 ========== */
const scrollerMap = new Map<LyricMode, HTMLElement | null>([
  ['modal', null],
  ['sidebar', null],
  ['fullscreen', null],
]);

const lineRefsMap = new Map<LyricMode, HTMLElement[]>([
  ['modal', []],
  ['sidebar', []],
  ['fullscreen', []],
]);

const modalScroller = ref<HTMLElement | null>(null);
const sidebarScroller = ref<HTMLElement | null>(null);
const fullscreenScroller = ref<HTMLElement | null>(null);
const sidebarWidth = ref(350);

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 560;
const MIN_MAIN_CONTENT_WIDTH = 420;

const isResizing = ref(false);

watch([() => modalScroller.value, () => sidebarScroller.value, () => fullscreenScroller.value], () => {
  scrollerMap.set('modal', modalScroller.value);
  scrollerMap.set('sidebar', sidebarScroller.value);
  scrollerMap.set('fullscreen', fullscreenScroller.value);
});

function addLineRef(mode: LyricMode, index: number) {
  return (el: HTMLElement | null) => {
    if (!lineRefsMap.get(mode)) {
      lineRefsMap.set(mode, []);
    }

    const refs = lineRefsMap.get(mode)!;
    if (el) {
      refs[index] = el;
      return;
    }

    // line unmounted
    refs[index] = undefined as unknown as HTMLElement;
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

function clearLineRefs() {
  lineRefsMap.set('modal', []);
  lineRefsMap.set('sidebar', []);
  lineRefsMap.set('fullscreen', []);
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

  const mode = ui.lyricMode as LyricMode;
  const scroller = scrollerMap.get(mode);
  const lineEls = lineRefsMap.get(mode) || [];
  centerActiveLine(scroller, lineEls[index]);
}

watch(
  () => [player.currentLyricIndex, ui.lyricMode, ui.showLyricPanel, lines.value.length],
  () => {
    if (ui.showLyricPanel) autoScrollToActiveLine();
  },
  { immediate: true }
);

watch(
  () => lines.value,
  () => {
    clearLineRefs();
    if (ui.showLyricPanel) autoScrollToActiveLine();
  }
);

onBeforeUnmount(() => {
  stopResize();
});

function setLyricMode(mode: LyricMode) {
  ui.lyricMode = mode;
  ui.showLyricPanel = true;
}

function handleLineClick(time: number) {
  player.seekTo(time);
}
</script>

<style scoped>
.mode-btn {
  padding: 4px 10px;
  font-family: 'Ma Shan Zheng', cursive;
  border: 1px solid #c4b5a0;
  background: rgba(200, 180, 160, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: rgba(200, 180, 160, 0.2);
}

/* ========== 全屏模式 ========== */
.lyrics-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: radial-gradient(circle at 20% 20%, rgba(240, 233, 220, 0.95), rgba(225, 214, 196, 0.96));
  backdrop-filter: blur(4px);
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.lyrics-fullscreen-body {
  width: min(980px, 100%);
  display: flex;
  flex-direction: column;
  padding: 28px 24px 20px;
}

.lyrics-content-center {
  text-align: center;
  padding: 36px 12px 80px;
}

/* ========== 弹窗模式 ========== */
.lyrics-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lyrics-modal-content {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.lyrics-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.lyrics-modal-header h2 {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 20px;
  color: #333;
}

.lyrics-modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lyrics-info {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.lyrics-title {
  margin: 0 0 4px 0;
  font-family: 'Ma Shan Zheng', cursive;
  color: #333;
  font-size: 18px;
}

.lyrics-artist {
  margin: 0;
  color: #999;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
}

.lyrics-display {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 300px;
}

.lyrics-content {
  text-align: center;
  width: 100%;
}

.lyrics-edge-spacer {
  height: 40%;
  min-height: 72px;
}

.lyrics-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.lyrics-modal-close:hover {
  color: #333;
}

/* ========== 侧栏模式 ========== */
.lyrics-sidebar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 245, 240, 0.92) 100%);
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

.lyrics-sidebar-header {
  padding: 16px;
  border-bottom: 2px dashed #d4c5a0;
  background: rgba(250, 248, 245, 0.6);
  flex-shrink: 0;
}

.lyrics-sidebar-title {
  margin: 0 0 4px 0;
  color: #2e2a24;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 18px;
  font-weight: 600;
}

.lyrics-sidebar-artist {
  margin: 0;
  color: #a99878;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
}

.lyrics-sidebar-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.sidebar-btn {
  padding: 4px 8px;
  font-family: 'Ma Shan Zheng', cursive;
  border: 1px solid #d4c5a0;
  background: rgba(200, 180, 160, 0.08);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #7f7568;
  transition: all 0.2s;
  flex: 1;
  text-align: center;
}

.sidebar-btn:hover {
  background: rgba(200, 180, 160, 0.15);
  border-color: #c4b5a0;
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
  color: #a99878;
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

.lyrics-scroll.modal-display {
  overflow: auto;
}

.lyrics-scroll.sidebar-display {
  overflow-y: auto;
  padding: 12px;
  overflow-x: hidden;
}

/* ========== 淡入淡出过渡 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .lyrics-sidebar {
    width: 100% !important;
    border-left: none;
    border-top: 2px dashed #d4c5a0;
    max-height: 44vh;
  }

  .lyrics-resizer {
    display: none;
  }

  .lyrics-sidebar-header {
    padding: 10px 12px;
  }

  .lyrics-sidebar-title {
    font-size: 16px;
  }

  .lyrics-sidebar-artist {
    font-size: 13px;
  }
}
</style>
