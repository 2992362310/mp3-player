<template>
  <div class="content-section" style="display: flex; flex-direction: row; gap: 0; flex: 1; min-width: 0;">
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
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
              <button
                v-for="s in search.sources"
                :key="s.id"
                @click="search.switchSource(s.id)"
                :class="['btn-action', search.currentSource === s.id ? 'btn-action-primary' : '']"
              >
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
            <div style="font-family: 'Ma Shan Zheng', cursive; color: #2d2d2d; font-size: 20px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <div style="width: 24px; height: 24px;" v-html="SketchMusicIcon"></div>
              <span>手绘播放器</span>
            </div>
            <p style="font-family: 'Ma Shan Zheng', cursive; color: #888; font-size: 16px;">一个手绘风格的在线音乐播放器</p>
          </div>
        </section>
      </div>
    </div>

    <LyricPanel />
  </div>
</template>

<script setup lang="ts">
import LyricPanel from '../LyricPanel.vue';
import { SketchMusicIcon, SketchSettingsIcon } from '../icons/SketchIcons';
import { useSearchStore } from '../../stores/search';

const search = useSearchStore();
</script>
