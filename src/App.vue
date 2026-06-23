<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <div class="logo" style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px;" v-html="SketchMusicIcon"></div>
          <span>手绘播放器</span>
        </div>
      </div>
      <div class="nav-center">
        <div class="search-box" style="position: relative; width: 50%; min-width: 500px; display: flex; gap: 8px; align-items: center;">
          <!-- 平台选择 -->
          <select v-model="search.currentSource"
            style="padding: 8px 10px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; border-radius: 6px 10px 8px 12px; font-size: 14px; background: rgba(255,255,255,0.8); color: #2d2d2d; flex-shrink: 0; cursor: pointer;">
            <option value="">全部音源</option>
            <option v-for="s in search.sources" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
          
          <!-- 搜索输入框 -->
          <div style="position: relative; flex: 1;">
            <input 
              v-model="searchInput" 
              @keyup.enter="handleSearch"
              @focus="showSearchHistory = true"
              @blur="hideSearchHistory"
              type="text" 
              placeholder="搜索歌曲..." 
              style="width: 100%; padding: 8px 36px 8px 12px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; border-radius: 6px 10px 8px 12px; font-size: 14px; background: rgba(255,255,255,0.8); color: #2d2d2d;"
            />
            <button @click="handleSearch" class="search-btn" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;" v-html="SketchSearchIcon"></button>
            
            <!-- 搜索历史下拉 -->
            <div v-if="showSearchHistory && searchHistory.length > 0" style="position: absolute; top: 100%; left: 0; right: 0; background: rgba(255,255,255,0.95); border: 2px solid #c4b5a0; border-top: none; border-radius: 0 0 8px 12px; max-height: 200px; overflow-y: auto; margin-top: -2px; z-index: 10;">
              <div v-for="(item, idx) in searchHistory" :key="idx" 
                @click="selectHistory(item.keyword)"
                style="padding: 8px 12px; border-bottom: 1px solid #e8dcc8; cursor: pointer; font-family: 'Ma Shan Zheng', cursive; color: #666; font-size: 14px; display: flex; justify-content: space-between; align-items: center;"
                @mouseenter="onHistoryItemEnter"
                @mouseleave="onHistoryItemLeave">
                <span>{{ item.keyword }}</span>
                <span style="font-size: 12px; color: #aaa;">{{ item.source }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-right" style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px;" v-html="SketchPencilIcon"></div>
        <span>云听</span>
      </div>
    </header>

    <!-- 主体 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <ul>
            <li :class="['nav-item', activeSection === 'discover' ? 'active' : '']">
              <a @click.prevent="activeSection = 'discover'" href="#">
                <span class="icon" v-html="SketchMusicIcon" style="width: 24px; height: 24px;"></span>
                <span class="text">发现音乐</span>
              </a>
            </li>
            <li :class="['nav-item', activeSection === 'playlist' ? 'active' : '']">
              <a @click.prevent="activeSection = 'playlist'" href="#">
                <span class="icon" v-html="SketchPlaylistIcon" style="width: 24px; height: 24px;"></span>
                <span class="text">播放列表</span>
              </a>
            </li>
            <li :class="['nav-item', activeSection === 'favorites' ? 'active' : '']">
              <a @click.prevent="activeSection = 'favorites'" href="#">
                <span class="icon" v-html="SketchHeartIcon" style="width: 24px; height: 24px;"></span>
                <span class="text">我的收藏</span>
              </a>
            </li>
            <li :class="['nav-item', activeSection === 'settings' ? 'active' : '']">
              <a @click.prevent="activeSection = 'settings'" href="#">
                <span class="icon" v-html="SketchSettingsIcon" style="width: 24px; height: 24px;"></span>
                <span class="text">设置</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <div class="flex flex-col flex-1 overflow-hidden" style="min-width: 0;">
        <main class="main-content">
          <div class="content-container">
            <!-- ====== 发现音乐 ====== -->
            <div v-if="activeSection === 'discover'" class="content-section" style="display: flex; gap: 0; flex: 1;">
              <div class="content-area main-scroll" style="flex: 1;">
                <!-- 搜索结果列表 -->
                <div v-if="search.results.length > 0 || search.loading" class="sketch-card" style="padding: 0; overflow: hidden;">
                  <!-- 加载中 -->
                  <div v-if="search.loading && search.results.length === 0"
                    style="text-align: center; padding: 40px; font-family: 'Ma Shan Zheng', cursive;">
                    <div class="spinner"></div>
                    <p style="color: #27ae60; font-size: 16px; margin-top: 12px;">搜索中...</p>
                  </div>

                  <!-- 结果列表 -->
                  <div v-else>
                    <div v-for="(track, i) in search.results" :key="`${track.sourceId}-${track.id}`"
                      :class="['playlist-item', isCurrent(track) ? 'playing' : '']"
                      @dblclick="playSong(track)"
                      style="border-bottom: 1px dashed #e8dcc8;">
                      <div class="song-index">{{ i + 1 }}</div>
                      <div class="song-info">
                        <div class="song-title">{{ track.title }}</div>
                        <div class="song-artist">{{ track.artist }}</div>
                      </div>
                      <span v-if="isCurrent(track)" class="playing-indicator">▶</span>
                      <button @click.stop="playlist.toggleFavorite(track)"
                        :class="['btn-favorite', playlist.isFavorite(track) ? 'active' : '']"
                        style="margin-right: 8px;">
                        {{ playlist.isFavorite(track) ? '♥' : '♡' }}
                      </button>
                      <button class="play-btn" @click.stop="playSong(track)">播放</button>
                    </div>
                  </div>

                  <!-- 加载更多 -->
                  <div v-if="search.results.length > 0 && search.hasMore" style="padding: 12px; text-align: center;">
                    <button @click="search.loadMore()" :disabled="search.isLoadingMore"
                      style="padding: 8px 20px; font-family: 'Ma Shan Zheng', cursive; border: 2px solid #c4b5a0; background: rgba(255,255,255,0.5); border-radius: 6px 10px 8px 12px; cursor: pointer; color: #666; font-size: 14px;">
                      {{ search.isLoadingMore ? '加载中...' : '加载更多 ↓' }}
                    </button>
                  </div>
                </div>

                <!-- 空状态 -->
                <div v-else-if="!search.loading"
                  style="text-align: center; padding: 60px 20px; color: #b0a080; font-family: 'Ma Shan Zheng', cursive; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
                  <div style="width: 48px; height: 48px; opacity: 0.5;" v-html="SketchMusicIcon"></div>
                  <p>搜索您喜欢的歌曲吧 ✏️</p>
                </div>
              </div>
              <!-- 侧边栏歌词面板 -->
              <LyricPanel />
            </div>

            <!-- ====== 播放列表 ====== -->
            <div v-if="activeSection === 'playlist'" class="content-section" style="display: flex; flex-direction: column;">
              <div class="content-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h1 style="display: flex; align-items: center; gap: 12px; margin: 0;">
                  <div style="width: 28px; height: 28px;" v-html="SketchPlaylistIcon"></div>
                  <span>播放列表</span>
                  <span style="font-size: 16px; color: #888;">({{ playlist.playlistCount }})</span>
                </h1>
                <button v-if="playlist.playlistCount > 0" @click="playlist.clearPlaylist()" class="btn-action" style="color: #e74c3c; border-color: #e74c3c; flex-shrink: 0;">🗑 清空</button>
              </div>
              <div class="content-area main-scroll" style="flex: 1;">
                <section>
                  <div v-if="playlist.playlist.length === 0" class="empty-state">
                    <div class="empty-icon" v-html="SketchPlaylistIcon" style="width: 64px; height: 64px;"></div>
                    <p>播放列表是空的~</p>
                    <p class="hint" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                      <span>去搜索歌曲吧</span>
                      <div style="width: 16px; height: 16px;" v-html="SketchPencilIcon"></div>
                    </p>
                  </div>

                  <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
                    <div v-for="(song, idx) in playlist.playlist" :key="`${song.sourceId}-${song.id}`"
                      :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
                      @dblclick="playAtIndex(idx)">
                      <div class="song-index">{{ idx + 1 }}</div>
                      <div class="song-info">
                        <div class="song-title">{{ song.title }}</div>
                        <div class="song-artist">{{ song.artist }}</div>
                      </div>
                      <span v-if="isCurrent(song)" class="playing-indicator">▶</span>
                      <button class="play-btn" @click.stop="playAtIndex(idx)" style="margin-right: 5px;">播放</button>
                      <button @click.stop="playlist.removeFromPlaylist(idx)"
                        class="delete-history-btn" title="移除">✕</button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- ====== 我的收藏 ====== -->
            <div v-if="activeSection === 'favorites'" class="content-section">
              <div class="content-header">
                <h1 style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 28px; height: 28px;" v-html="SketchHeartIcon"></div>
                  <span>我的收藏</span>
                </h1>
              </div>
              <div class="content-area main-scroll">
                <section>
                  <h2>收藏歌曲 <span style="font-size: 16px; color: #888;">({{ playlist.favoriteCount }})</span></h2>

                  <div v-if="playlist.favorites.length === 0" class="empty-state">
                    <div class="empty-icon" v-html="SketchHeartIcon" style="width: 64px; height: 64px;"></div>
                    <p>还没有收藏歌曲~</p>
                    <p class="hint">点击 ♡ 收藏喜欢的歌</p>
                  </div>

                  <div v-else class="sketch-card" style="padding: 0; overflow: hidden;">
                    <div v-for="(song, idx) in playlist.favorites" :key="`${song.sourceId}-${song.id}`"
                      :class="['playlist-item', isCurrent(song) ? 'playing' : '']"
                      @dblclick="playSong(song)">
                      <div class="song-index">{{ idx + 1 }}</div>
                      <div class="song-info">
                        <div class="song-title">{{ song.title }}</div>
                        <div class="song-artist">{{ song.artist }}</div>
                      </div>
                      <span v-if="isCurrent(song)" class="playing-indicator">▶</span>
                      <button class="btn-favorite active" @click.stop="playlist.toggleFavorite(song)" style="margin-right: 8px;">♥</button>
                      <button class="play-btn" @click.stop="playSong(song)">播放</button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- ====== 设置 ====== -->
            <div v-if="activeSection === 'settings'" class="content-section">
              <div class="content-header">
                <h1 style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 28px; height: 28px;" v-html="SketchSettingsIcon"></div>
                  <span>设置</span>
                </h1>
              </div>
              <div class="content-area main-scroll">
                <section>
                  <h2>🎨 音源设置</h2>
                  <div class="sketch-card">
                    <p style="font-family: 'Ma Shan Zheng', cursive; color: #666; margin-bottom: 15px; font-size: 17px;">选择默认音乐来源：</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      <button v-for="s in search.sources" :key="s.id"
                        @click="search.switchSource(s.id)"
                        :class="['btn-action', search.currentSource === s.id ? 'btn-action-primary' : '']">
                        {{ s.name }}
                      </button>
                    </div>
                  </div>
                </section>

                <section style="margin-top: 20px;">
                  <h2 style="display: flex; align-items: center; gap: 8px;">
                    <span>📖 关于</span>
                  </h2>
                  <div class="sketch-card">
                    <p style="font-family: 'Ma Shan Zheng', cursive; color: #2d2d2d; font-size: 20px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                      <div style="width: 24px; height: 24px;" v-html="SketchMusicIcon"></div>
                      <span>手绘播放器</span>
                    </p>
                    <p style="font-family: 'Ma Shan Zheng', cursive; color: #888; font-size: 16px;">一个手绘风格的在线音乐播放器</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <!-- 底部控制器 -->
        <PlayerBar />
      </div>
    </div>

    <!-- 歌词弹窗 -->
    <LyricPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePlayerStore } from './stores/player';
import { useSearchStore } from './stores/search';
import { usePlaylistStore } from './stores/playlist';
import { useAudio } from './composables/useAudio';
import { useKeyboard } from './composables/useKeyboard';
import { useMediaSession } from './composables/useMediaSession';
import { SketchMusicIcon, SketchPlaylistIcon, SketchHeartIcon, SketchSettingsIcon, SketchSearchIcon, SketchPencilIcon } from './components/icons/SketchIcons';

import PlayerBar from './components/PlayerBar.vue';
import LyricPanel from './components/LyricPanel.vue';
import type { Song } from './core/sources/types';

/* ========== 状态 ========== */
const player = usePlayerStore();
const search = useSearchStore();
const playlist = usePlaylistStore();
const { playSong, playAtIndex } = useAudio();

/* ========== 初始化 ========== */
useKeyboard();
useMediaSession();
search.loadSources();

/* ========== 侧边栏导航 ========== */
const activeSection = ref<'discover' | 'playlist' | 'favorites' | 'settings'>('discover');

/* ========== 搜索 ========== */
const searchInput = ref('');
const showSearchHistory = ref(false);

interface SearchHistoryItem { keyword: string; source: string; }
const searchHistory = ref<SearchHistoryItem[]>([]);

async function handleSearch() {
  if (!searchInput.value.trim()) return;
  
  const kw = searchInput.value.trim();
  
  // 添加到搜索历史
  const exists = searchHistory.value.findIndex(h => h.keyword === kw);
  if (exists !== -1) searchHistory.value.splice(exists, 1);
  searchHistory.value.unshift({ keyword: kw, source: search.currentSource });
  if (searchHistory.value.length > 15) searchHistory.value = searchHistory.value.slice(0, 15);
  
  // 执行搜索
  await search.searchSongs(kw, search.currentSource);
  activeSection.value = 'discover';
}

function selectHistory(keyword: string) {
  searchInput.value = keyword;
  showSearchHistory.value = false;
  handleSearch();
}

function hideSearchHistory() {
  setTimeout(() => {
    showSearchHistory.value = false;
  }, 200);
}

function onHistoryItemEnter(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  if (target) target.style.background = 'rgba(200,180,160,0.1)';
}

function onHistoryItemLeave(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  if (target) target.style.background = 'transparent';
}

/* ========== 辅助函数 ========== */
function isCurrent(track: Song) {
  return player.currentSong?.id === track.id && player.currentSong?.sourceId === track.sourceId;
}


// 初始化：如果有播放列表，播放第一首
onMounted(async () => {
  await search.loadRecommendations();
  if (playlist.playlist.length > 0 && !player.currentSong) {
    await playAtIndex(0);
  }
});
</script>
