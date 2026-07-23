<template>
  <div class="content-section library-section">
    <!-- 页头：一个主标题 + 一句说明 -->
    <header class="library-hero">
      <h1 class="library-brand">我的</h1>
      <p class="library-tagline">收藏、歌单，还有刚才听过的</p>
    </header>

    <!-- 最近播放：顶部只留快捷条，完整列表进「最近」页签 -->
    <section
      v-if="player.recentPlays.length > 0 && libraryTab !== 'recent'"
      class="recent-block"
    >
      <div class="recent-head">
        <h2>最近播放</h2>
        <span class="recent-count">{{ player.recentPlays.length }}</span>
        <button type="button" class="recent-more" @click="libraryTab = 'recent'">
          全部
        </button>
      </div>
      <div class="recent-strip" role="list">
        <button
          v-for="track in player.recentPlays"
          :key="`recent-${track.sourceId}-${track.id}`"
          type="button"
          role="listitem"
          :class="['recent-chip', isCurrent(track) ? 'playing' : '']"
          @click="playRecent(track)"
        >
          <span class="recent-chip-title">{{ track.title }}</span>
          <span class="recent-chip-artist">{{ track.artist }}</span>
        </button>
      </div>
    </section>

    <!-- 分段：收藏 / 歌单 / 最近 -->
    <nav class="library-nav" aria-label="我的内容">
      <button
        type="button"
        :class="['library-nav-btn', libraryTab === 'favorites' ? 'active' : '']"
        @click="libraryTab = 'favorites'"
      >
        收藏
        <em>{{ player.favoriteCount }}</em>
      </button>
      <button
        type="button"
        :class="['library-nav-btn', libraryTab === 'playlists' ? 'active' : '']"
        @click="openPlaylistsTab"
      >
        歌单
        <em>{{ playlists.playlistCount }}</em>
      </button>
      <button
        type="button"
        :class="['library-nav-btn', libraryTab === 'recent' ? 'active' : '']"
        @click="libraryTab = 'recent'"
      >
        最近
        <em>{{ player.recentPlays.length }}</em>
      </button>
      <span class="library-nav-ink" :data-tab="libraryTab" aria-hidden="true" />
    </nav>

    <div class="library-body main-scroll">
      <!-- 最近播放（完整列表） -->
      <section v-if="libraryTab === 'recent'" class="library-pane">
        <div v-if="player.recentPlays.length === 0" class="library-empty">
          <p>还没有听过歌</p>
          <p class="library-empty-hint">播过的歌会留在这里，最多记 50 首</p>
        </div>

        <template v-else>
          <div class="recent-toolbar">
            <button
              type="button"
              class="btn-action btn-action-primary"
              @click="playAll(player.recentPlays)"
            >
              播放全部
            </button>
            <button type="button" class="btn-action" @click="clearRecent">
              清空
            </button>
          </div>

          <div class="song-panel sketch-card sketch-card-ghost">
            <VirtualSongList
              v-if="player.recentPlays.length > 40"
              fill
              :songs="player.recentPlays"
              :current-song="player.currentSong"
              :is-playing="player.isPlaying"
              :is-favorite="player.isFavorite"
              @play="playRecent"
              @toggle-favorite="player.toggleFavorite"
              @toggle-play="player.togglePlay()"
              @add-to-playlist="playlists.openAddToPlaylist"
            />
            <template v-else>
              <div
                v-for="(song, idx) in player.recentPlays"
                :key="`${song.sourceId}-${song.id}`"
                :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
                @click="playRecent(song)"
              >
                <div class="song-index">{{ idx + 1 }}</div>
                <div class="song-info">
                  <div class="song-title">{{ song.title }}</div>
                  <div class="song-artist">{{ song.artist }}</div>
                </div>
                <button type="button" class="play-btn" title="加入歌单" @click.stop="playlists.openAddToPlaylist(song)">
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
                  class="play-btn"
                  @click.stop="isCurrent(song) ? player.togglePlay() : playRecent(song)"
                >
                  <svg v-if="isCurrent(song) && player.isPlaying" width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
                    <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                    <polyline points="4,2 4,14 13,8 4,2"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </template>
      </section>

      <!-- 收藏 -->
      <section v-else-if="libraryTab === 'favorites'" class="library-pane">
        <div v-if="player.favorites.length === 0" class="library-empty">
          <p>还没有收藏</p>
          <p class="library-empty-hint">在发现页点 ♡，歌会出现在这里</p>
        </div>

        <div v-else class="song-panel sketch-card sketch-card-ghost">
          <VirtualSongList
            v-if="player.favorites.length > 40"
            fill
            :songs="player.favorites"
            :current-song="player.currentSong"
            :is-playing="player.isPlaying"
            :is-favorite="player.isFavorite"
            @play="playFavorite"
            @toggle-favorite="player.toggleFavorite"
            @toggle-play="player.togglePlay()"
            @add-to-playlist="playlists.openAddToPlaylist"
          />
          <template v-else>
            <div
              v-for="(song, idx) in player.favorites"
              :key="`${song.sourceId}-${song.id}`"
              :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
              @click="playFavorite(song)"
            >
              <div class="song-index">{{ idx + 1 }}</div>
              <div class="song-info">
                <div class="song-title">{{ song.title }}</div>
                <div class="song-artist">{{ song.artist }}</div>
              </div>
              <button type="button" class="play-btn" title="加入歌单" @click.stop="playlists.openAddToPlaylist(song)">
                <SketchIcon name="plus" :size="16" />
              </button>
              <button type="button" class="btn-favorite active" style="margin-right: 8px;" @click.stop="player.toggleFavorite(song)">♥</button>
              <button type="button" class="play-btn" @click.stop="isCurrent(song) ? player.togglePlay() : playFavorite(song)">
                <svg v-if="isCurrent(song) && player.isPlaying" width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none">
                  <line x1="4.5" y1="3" x2="4.5" y2="13"/><line x1="11.5" y1="3" x2="11.5" y2="13"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <polyline points="4,2 4,14 13,8 4,2"/>
                </svg>
              </button>
            </div>
          </template>
        </div>
      </section>

      <!-- 歌单列表 -->
      <section v-else-if="!playlists.activePlaylist" class="library-pane">
        <form class="create-row" @submit.prevent="createPlaylist">
          <input
            v-model="newPlaylistName"
            class="sketch-input"
            type="text"
            maxlength="40"
            placeholder="写一个歌单名…"
          />
          <button type="submit" class="btn-action btn-action-primary">新建</button>
        </form>

        <div v-if="playlists.playlists.length === 0" class="library-empty">
          <p>还没有歌单</p>
          <p class="library-empty-hint">建好后，在歌曲旁点 + 加入</p>
        </div>

        <ul v-else class="playlist-grid">
          <li
            v-for="item in playlists.playlists"
            :key="item.id"
            class="playlist-tile"
          >
            <button type="button" class="playlist-tile-main" @click="playlists.openPlaylist(item.id)">
              <span class="playlist-tile-name">{{ item.name }}</span>
              <span class="playlist-tile-meta">{{ item.songs.length }} 首</span>
            </button>
            <div class="playlist-tile-actions">
              <button
                type="button"
                class="tile-btn"
                :disabled="!item.songs.length"
                @click="playPlaylist(item.id)"
              >
                播放
              </button>
              <button
                type="button"
                class="tile-btn danger"
                title="删除歌单"
                @click="removePlaylist(item.id)"
              >
                删
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- 歌单详情 -->
      <section v-else class="library-pane">
        <div class="detail-bar">
          <button type="button" class="btn-action" @click="playlists.openPlaylist(null)">← 返回</button>
          <input
            v-model="renameDraft"
            type="text"
            maxlength="40"
            class="sketch-input rename-input"
            aria-label="歌单名称"
            @change="commitRename"
            @keyup.enter="commitRename"
          />
          <button
            type="button"
            class="btn-action btn-action-primary"
            :disabled="!playlists.activePlaylist.songs.length"
            @click="playPlaylist(playlists.activePlaylist.id)"
          >
            播放全部
          </button>
        </div>

        <div v-if="playlists.activePlaylist.songs.length === 0" class="library-empty">
          <p>歌单还是空的</p>
          <p class="library-empty-hint">去发现页点歌曲旁的 + 加入</p>
        </div>

        <div v-else class="song-panel sketch-card sketch-card-ghost">
          <div
            v-for="(song, idx) in playlists.activePlaylist.songs"
            :key="`${song.sourceId}-${song.id}`"
            :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
            @click="playFromActive(song)"
          >
            <div class="song-index">{{ idx + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <button
              class="btn-favorite"
              :class="player.isFavorite(song) ? 'active' : ''"
              style="margin-right: 8px;"
              @click.stop="player.toggleFavorite(song)"
            >
              {{ player.isFavorite(song) ? '♥' : '♡' }}
            </button>
            <button
              class="play-btn danger"
              title="移出歌单"
              @click.stop="playlists.removeSongFromPlaylist(playlists.activePlaylist!.id, song)"
            >
              移出
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import VirtualSongList from '../VirtualSongList.vue';
import SketchIcon from '../icons/SketchIcon.vue';
import { useAudio } from '../../composables/useAudio';
import type { Song } from '../../core/sources/types';
import { usePlayerStore } from '../../stores/player';
import { usePlaylistStore } from '../../stores/playlist';

const player = usePlayerStore();
const playlists = usePlaylistStore();
const { playFromList, playAll } = useAudio();

const libraryTab = ref<'favorites' | 'playlists' | 'recent'>('favorites');
const newPlaylistName = ref('');
const renameDraft = ref('');

watch(
  () => playlists.activePlaylist?.name,
  (name) => {
    renameDraft.value = name || '';
  },
  { immediate: true },
);

function openPlaylistsTab() {
  libraryTab.value = 'playlists';
}

function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}

function playFavorite(song: Song) {
  playFromList(player.favorites, song);
}

function playRecent(track: Song) {
  playFromList(player.recentPlays, track);
}

function clearRecent() {
  if (!player.recentPlays.length) return;
  if (!confirm('确定清空最近播放吗？')) return;
  player.clearRecentPlays();
}

function createPlaylist() {
  const created = playlists.createPlaylist(newPlaylistName.value || '我的歌单');
  if (created) {
    newPlaylistName.value = '';
    playlists.openPlaylist(created.id);
  }
}

function commitRename() {
  if (!playlists.activePlaylist) return;
  playlists.renamePlaylist(playlists.activePlaylist.id, renameDraft.value);
  renameDraft.value = playlists.activePlaylist.name;
}

function removePlaylist(id: string) {
  if (!confirm('确定删除这个歌单吗？')) return;
  playlists.deletePlaylist(id);
}

function playPlaylist(id: string) {
  const target = playlists.playlists.find((p) => p.id === id);
  if (!target?.songs.length) return;
  playAll(target.songs);
}

function playFromActive(song: Song) {
  if (!playlists.activePlaylist) return;
  playFromList(playlists.activePlaylist.songs, song);
}
</script>

<style scoped>
.library-section {
  padding: 16px 18px 12px;
  gap: 14px;
  min-width: 0;
  max-width: 100%;
}

.library-hero {
  flex-shrink: 0;
  animation: brandIn 0.4s ease-out;
}

.library-brand {
  margin: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: clamp(36px, 7vw, 48px);
  font-weight: normal;
  letter-spacing: 0.12em;
  color: var(--ink);
  line-height: 1.05;
}

.library-tagline {
  margin: 6px 0 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.recent-block {
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.recent-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.recent-head h2 {
  margin: 0;
  font-size: 15px;
  font-family: 'Ma Shan Zheng', cursive;
  font-weight: normal;
  color: var(--ink-soft);
  border: none;
  padding: 0;
}

.recent-count {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 12px;
  color: var(--faint);
}

.recent-more {
  margin-left: auto;
  border: none;
  background: none;
  padding: 0;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
}

.recent-more:hover {
  color: var(--ink);
}

.recent-toolbar {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.recent-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  padding: 2px 2px 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.recent-chip {
  flex: 0 0 auto;
  width: 140px;
  max-width: 140px;
  padding: 8px 12px;
  border: 1px dashed var(--border);
  border-radius: 8px 12px 6px 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: 'Ma Shan Zheng', cursive;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.recent-chip:hover {
  background: var(--hover);
}

.recent-chip.playing {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.recent-chip-title {
  display: block;
  color: var(--ink);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-chip-artist {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-nav {
  position: relative;
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  border-bottom: 1px dashed var(--border-soft);
  padding-bottom: 2px;
}

.library-nav-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  background: none;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.library-nav-btn em {
  font-style: normal;
  font-size: 12px;
  color: var(--faint);
}

.library-nav-btn:hover {
  color: var(--ink-soft);
}

.library-nav-btn.active {
  color: var(--ink);
}

.library-nav-btn.active em {
  color: var(--accent);
}

.library-nav-ink {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: calc(100% / 3);
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  transition: transform 0.25s ease;
}

.library-nav-ink[data-tab='playlists'] {
  transform: translateX(100%);
}

.library-nav-ink[data-tab='recent'] {
  transform: translateX(200%);
}

.library-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

.library-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.28s ease-out;
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

.library-empty {
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

.library-empty p {
  margin: 0;
  font-size: 16px;
}

.library-empty-hint {
  font-size: 13px !important;
  color: var(--faint) !important;
}

.create-row,
.detail-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.create-row .sketch-input,
.rename-input {
  flex: 1;
  min-width: 0;
}

.playlist-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playlist-tile {
  display: flex;
  align-items: stretch;
  gap: 4px;
  border: 1px dashed var(--border);
  border-radius: 8px 14px 6px 12px;
  background: transparent;
  overflow: hidden;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.playlist-tile:hover {
  background: var(--hover);
  border-color: var(--border-strong);
}

.playlist-tile-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 14px 14px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-family: 'Ma Shan Zheng', cursive;
}

.playlist-tile-name {
  color: var(--ink);
  font-size: 17px;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.playlist-tile-meta {
  color: var(--muted);
  font-size: 13px;
}

.playlist-tile-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px 6px 0;
}

.tile-btn {
  border: none;
  background: none;
  padding: 6px 10px;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
}

.tile-btn:hover:not(:disabled) {
  color: var(--ink);
  background: var(--surface-strong);
}

.tile-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tile-btn.danger {
  color: var(--accent);
}

@media (max-width: 768px) {
  .library-section {
    padding: 12px 14px 10px;
    gap: 12px;
  }

  .library-brand {
    font-size: 34px;
  }

  .library-nav-btn {
    font-size: 15px;
  }
}
</style>
