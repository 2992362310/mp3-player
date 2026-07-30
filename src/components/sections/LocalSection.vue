<template>
  <div
    class="content-section local-section"
    :class="{ 'is-dragging': dragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <header class="local-hero">
      <h1 class="local-brand">本地</h1>
      <p class="local-tagline">导入本机音频，离线也能听；同名 .lrc 会自动配对</p>
    </header>

    <div class="local-toolbar">
      <button
        type="button"
        class="btn-action btn-action-primary"
        :disabled="local.importing"
        @click="pickFiles"
      >
        {{ local.importing ? '导入中…' : '添加文件' }}
      </button>
      <button
        type="button"
        class="btn-action"
        :disabled="local.importing"
        @click="pickFolder"
      >
        添加文件夹
      </button>
      <button
        type="button"
        class="btn-action"
        :disabled="!local.filteredSongs.length"
        @click="playAll(local.filteredSongs)"
      >
        播放全部
      </button>
      <button
        type="button"
        class="btn-action"
        :disabled="!local.songs.length || local.importing"
        @click="clearLibrary"
      >
        清空
      </button>
      <span v-if="local.count > 0" class="local-count">{{ local.count }} 首</span>
      <input
        v-model="local.query"
        class="local-search"
        type="search"
        placeholder="筛选歌名 / 歌手"
        :disabled="!local.songs.length"
      />
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.flac,.wav,.ogg,.opus,.webm,.lrc"
        multiple
        class="local-file-input"
        @change="onFilesSelected"
      />
      <input
        ref="folderInput"
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.flac,.wav,.ogg,.opus,.webm,.lrc"
        multiple
        webkitdirectory
        directory
        class="local-file-input"
        @change="onFolderSelected"
      />
    </div>

    <p v-if="statusTip" class="local-status">{{ statusTip }}</p>
    <p v-if="local.error" class="local-error">{{ local.error }}</p>

    <div class="local-body main-scroll">
      <div v-if="local.loading" class="local-empty">
        <p>正在加载本地音乐…</p>
      </div>

      <div v-else-if="local.songs.length === 0" class="local-empty local-dropzone">
        <p>把音频拖到这里，或点上方按钮导入</p>
        <p class="local-empty-hint">支持 mp3 / flac / wav / m4a / ogg 等；刷新后仍保留</p>
      </div>

      <div v-else-if="local.filteredSongs.length === 0" class="local-empty">
        <p>没有匹配的歌曲</p>
      </div>

      <div v-else class="song-panel sketch-card sketch-card-ghost">
        <VirtualSongList
          v-if="local.filteredSongs.length > 40"
          fill
          :songs="local.filteredSongs"
          :current-song="player.currentSong"
          :is-playing="player.isPlaying"
          :is-favorite="player.isFavorite"
          @play="playLocal"
          @toggle-favorite="player.toggleFavorite"
          @toggle-play="player.togglePlay()"
          @add-to-playlist="playlists.openAddToPlaylist"
        />
        <template v-else>
          <div
            v-for="(song, idx) in local.filteredSongs"
            :key="`${song.sourceId}-${song.id}`"
            :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
            @click="playLocal(song)"
          >
            <div class="song-index">{{ idx + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <button
              type="button"
              class="play-btn"
              title="加入歌单"
              @click.stop="playlists.openAddToPlaylist(song)"
            >
              <SketchIcon name="plus" :size="16" />
            </button>
            <button
              type="button"
              :class="['btn-favorite', player.isFavorite(song) ? 'active' : '']"
              style="margin-right: 8px;"
              @click.stop="player.toggleFavorite(song)"
            >
              {{ player.isFavorite(song) ? '♥' : '♡' }}
            </button>
            <button
              type="button"
              class="play-btn danger"
              title="从本地删除"
              @click.stop="removeTrack(song)"
            >
              删
            </button>
            <button
              type="button"
              class="play-btn"
              @click.stop="isCurrent(song) ? player.togglePlay() : playLocal(song)"
            >
              <svg
                v-if="isCurrent(song) && player.isPlaying"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                fill="none"
              >
                <line x1="4.5" y1="3" x2="4.5" y2="13" /><line x1="11.5" y1="3" x2="11.5" y2="13" />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 16 16"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              >
                <polyline points="4,2 4,14 13,8 4,2" />
              </svg>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VirtualSongList from '../VirtualSongList.vue';
import SketchIcon from '../icons/SketchIcon.vue';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';
import { useLocalStore } from '../../stores/local';

const player = usePlayerStore();
const playlists = usePlaylistStore();
const local = useLocalStore();
const { playFromList, playAll } = useAudio();

const fileInput = ref<HTMLInputElement | null>(null);
const folderInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const dragDepth = ref(0);
const statusTip = ref('');

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}

function playLocal(song: Song) {
  playFromList(local.filteredSongs, song);
}

function pickFiles() {
  local.clearError();
  statusTip.value = '';
  fileInput.value?.click();
}

function pickFolder() {
  local.clearError();
  statusTip.value = '';
  folderInput.value?.click();
}

async function finishImport(files: File[], pathHints?: Map<File, string>) {
  const result = await local.importFiles(files, { pathHints });
  if (result.added || result.skipped) {
    const parts = [];
    if (result.added) parts.push(`新增 ${result.added} 首`);
    if (result.skipped) parts.push(`跳过重复 ${result.skipped} 首`);
    statusTip.value = parts.join('，');
  }
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  input.value = '';
  if (files.length) await finishImport(files);
}

async function onFolderSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  input.value = '';
  if (!files.length) return;
  const pathHints = new Map<File, string>();
  for (const file of files) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (rel) pathHints.set(file, rel);
  }
  await finishImport(files, pathHints);
}

function onDragEnter() {
  dragDepth.value += 1;
  dragging.value = true;
}

function onDragOver() {
  dragging.value = true;
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  if (dragDepth.value === 0) dragging.value = false;
}

async function onDrop(event: DragEvent) {
  dragging.value = false;
  dragDepth.value = 0;
  const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
  if (files.length) await finishImport(files);
}

function removeTrack(song: Song) {
  if (!confirm(`确定从本地库删除「${song.title}」吗？`)) return;
  void local.removeSong(song);
}

function clearLibrary() {
  if (!local.songs.length) return;
  if (!confirm('确定清空全部本地音乐吗？文件仅从本应用移除。')) return;
  void local.clearAll();
  statusTip.value = '已清空本地曲库';
}
</script>

<style scoped>
.local-section {
  padding: 16px 18px 12px;
  gap: 14px;
  min-width: 0;
  max-width: 100%;
  position: relative;
}

.local-section.is-dragging::after {
  content: '松开以导入音频';
  position: absolute;
  inset: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--accent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--paper-bg) 88%, var(--accent-soft));
  color: var(--accent);
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 22px;
  pointer-events: none;
}

.local-hero {
  flex-shrink: 0;
  animation: brandIn 0.4s ease-out;
}

.local-brand {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: clamp(36px, 7vw, 48px);
  font-weight: normal;
  letter-spacing: 0.12em;
  color: var(--ink);
  line-height: 1.05;
}

.local-tagline {
  margin: 6px 0 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.local-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.local-count {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--faint);
}

.local-search {
  min-width: min(180px, 100%);
  flex: 1;
  max-width: 240px;
  border: 2px dashed var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  padding: 7px 10px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  outline: none;
}

.local-search:focus {
  border-color: var(--accent);
}

.local-file-input {
  display: none;
}

.local-status,
.local-error {
  margin: 0;
  flex-shrink: 0;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 13px;
}

.local-status {
  color: var(--muted);
}

.local-error {
  color: var(--accent);
}

.local-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

.song-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 !important;
}

.local-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px 16px;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--ink-soft);
}

.local-dropzone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  margin-top: 4px;
}

.local-empty p {
  margin: 0;
  font-size: 16px;
}

.local-empty-hint {
  font-size: 13px !important;
  color: var(--faint) !important;
}

@media (max-width: 768px) {
  .local-section {
    padding: 12px 14px 10px;
    gap: 12px;
  }

  .local-brand {
    font-size: 34px;
  }

  .local-search {
    max-width: none;
    order: 10;
    width: 100%;
  }
}
</style>
