<template>
  <!-- 弹窗模式 -->
  <Transition name="fade">
    <div v-if="ui.showLyricPanel && ui.lyricMode === 'modal' && player.currentSong" class="lyrics-modal" @click="ui.showLyricPanel = false">
      <div class="lyrics-modal-content" @click.stop>
        <div class="lyrics-modal-header">
          <h2>🎵 歌词</h2>
          <button class="lyrics-modal-close" @click="ui.showLyricPanel = false">&times;</button>
        </div>
        <div class="lyrics-modal-body">
          <div class="lyrics-info">
            <h3 class="lyrics-title">{{ player.currentSong?.title }}</h3>
            <p class="lyrics-artist">{{ player.currentSong?.artist }}</p>
          </div>
          <div class="lyrics-display" style="overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 20px; height: 300px;">
            <div v-if="lines.length === 0" class="lyrics-placeholder">
              <p style="color: #999; font-size: 16px;">✏️ 暂无歌词</p>
            </div>
            <div v-else class="lyrics-content" style="text-align: center;">
              <p v-for="(line, i) in lines" :key="i"
                :class="[
                  'lyrics-line',
                  i === player.currentLyricIndex ? 'active' : '',
                  i < player.currentLyricIndex ? 'passed' : ''
                ]"
                @click="player.seekTo(line.time)"
                style="padding: 8px 0; cursor: pointer; font-size: 16px; color: #666; font-family: 'Ma Shan Zheng', cursive; transition: all 0.3s; margin: 0;">
                {{ line.text || '· · ·' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 侧边栏模式 -->
  <div v-if="ui.showLyricPanel && ui.lyricMode === 'sidebar' && player.currentSong" 
    class="lyrics-sidebar" 
    style="width: 350px; background: rgba(255,255,255,0.8); border-left: 2px dashed #d4c5a0; display: flex; flex-direction: column; overflow: hidden;">
    <div style="padding: 16px; border-bottom: 2px dashed #e8dcc8;">
      <h3 style="margin: 0 0 4px 0; color: #333; font-family: 'Ma Shan Zheng', cursive; font-size: 18px;">{{ player.currentSong?.title }}</h3>
      <p style="margin: 0; color: #999; font-family: 'Ma Shan Zheng', cursive; font-size: 14px;">{{ player.currentSong?.artist }}</p>
      <button @click="toggleLyricMode()" 
        style="margin-top: 8px; padding: 4px 8px; font-family: 'Ma Shan Zheng', cursive; border: 1px solid #c4b5a0; background: rgba(200,180,160,0.1); border-radius: 4px; cursor: pointer; font-size: 12px; color: #666;">
        弹窗模式
      </button>
    </div>
    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
      <div v-if="lines.length === 0" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 14px;">
        ✏️ 暂无歌词
      </div>
      <div v-else style="overflow-y: auto; padding: 12px; overflow-x: hidden; scroll-behavior: smooth;">
        <p v-for="(line, i) in lines" :key="i"
          :class="['lyrics-line']"
          @click="player.seekTo(line.time)"
          :style="{
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: '\'Ma Shan Zheng\', cursive',
            transition: 'all 0.3s',
            color: i === player.currentLyricIndex ? '#e74c3c' : i < player.currentLyricIndex ? '#999' : '#666',
            fontWeight: i === player.currentLyricIndex ? 'bold' : 'normal',
            margin: 0
          }">
          {{ line.text || '· · ·' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useUIStore } from '../stores/ui';

const player = usePlayerStore();
const ui = useUIStore();
const lines = computed(() => player.lyric?.lines || []);

function toggleLyricMode() {
  ui.lyricMode = ui.lyricMode === 'modal' ? 'sidebar' : 'modal';
}
</script>
