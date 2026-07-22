<template>
  <div class="content-section">
    <div class="library-body">
      <div class="content-header">
        <h1>
          <SketchIcon name="heart" :size="28" />
          <span>我的</span>
        </h1>
      </div>

      <div class="tab-row">
        <button
          type="button"
          :class="['tab-btn', libraryTab === 'favorites' ? 'active' : '']"
          @click="libraryTab = 'favorites'"
        >
          收藏 ({{ player.favoriteCount }})
        </button>
        <button
          type="button"
          :class="['tab-btn', libraryTab === 'playlists' ? 'active' : '']"
          @click="openPlaylistsTab"
        >
          歌单 ({{ playlists.playlistCount }})
        </button>
      </div>

      <div class="content-area main-scroll">
        <!-- 收藏 -->
        <section v-if="libraryTab === 'favorites'">
          <div v-if="player.favorites.length === 0" class="empty-state">
            <div class="empty-icon" style="width: 64px; height: 64px;">
              <SketchIcon name="heart" :size="64" />
            </div>
            <p>还没有收藏歌曲~</p>
            <p class="hint">点击 ♡ 收藏喜欢的歌</p>
          </div>

          <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
            <VirtualSongList
              v-if="player.favorites.length > 40"
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
                <button type="button" class="play-btn" @click.stop="playFavorite(song)">播放</button>
              </div>
            </template>
          </div>
        </section>

        <!-- 歌单列表 -->
        <section v-else-if="!playlists.activePlaylist">
          <div class="playlist-toolbar">
            <input
              v-model="newPlaylistName"
              class="sketch-input"
              type="text"
              maxlength="40"
              placeholder="新建歌单名称"
              @keyup.enter="createPlaylist"
            />
            <button type="button" class="btn-action btn-action-primary" @click="createPlaylist">新建</button>
          </div>

          <div v-if="playlists.playlists.length === 0" class="empty-state">
            <p>还没有自建歌单</p>
            <p class="hint">新建后，可在歌曲旁点 + 加入</p>
          </div>

          <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
            <div
              v-for="item in playlists.playlists"
              :key="item.id"
              class="playlist-item"
              @click="playlists.openPlaylist(item.id)"
            >
              <div class="song-info">
                <div class="song-title">{{ item.name }}</div>
                <div class="song-artist">{{ item.songs.length }} 首</div>
              </div>
              <button class="play-btn" @click.stop="playPlaylist(item.id)">播放</button>
              <button class="play-btn danger" title="删除歌单" @click.stop="removePlaylist(item.id)">删</button>
            </div>
          </div>
        </section>

        <!-- 歌单详情 -->
        <section v-else>
          <div class="detail-toolbar">
            <button type="button" class="btn-action" @click="playlists.openPlaylist(null)">← 返回</button>
            <input
              v-model="renameDraft"
              type="text"
              maxlength="40"
              class="sketch-input rename-input"
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

          <div v-if="playlists.activePlaylist.songs.length === 0" class="empty-state">
            <p>歌单还是空的</p>
            <p class="hint">去发现页点歌曲旁的 + 加入</p>
          </div>

          <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
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

const libraryTab = ref<'favorites' | 'playlists'>('favorites');
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
.library-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
