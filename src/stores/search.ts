/**
 * 搜索状态管理
 * 管理多音源搜索、结果合并、分页加载
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song } from '../core/sources/types';
import { sourceManager } from '../core/sources/SourceManager';
import { usePlayerStore } from './player';

export interface SourceInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export const useSearchStore = defineStore('search', () => {
  // ==================== 状态 ====================
  const keyword = ref('');
  const results = ref<Song[]>([]);
  const sourceResults = ref<Map<string, Song[]>>(new Map());
  const currentSource = ref('netease');
  const sources = ref<SourceInfo[]>([]);
  const loading = ref(false);
  const isLoadingMore = ref(false);
  const page = ref(1);
  const pageSize = 20;
  const hasMore = ref(false);
  const sourceHasMore = ref<Map<string, boolean>>(new Map());

  // ==================== 同步到播放器 ====================

  function syncToPlayer() {
    const player = usePlayerStore();
    player.searchResults = results.value;
  }

  // ==================== 初始化 ====================

  function loadSources() {
    const all = sourceManager.getAllSources();
    sources.value = all.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      color: s.color || '#666666',
      enabled: s.enabled !== false,
    }));
  }

  /** 默认推荐：随机搜一个关键词，取前 10 首 */
  async function loadRecommendations() {
    if (results.value.length > 0 || loading.value) return;

    const pool = [
      '周杰伦', '林俊杰', '陈奕迅', '邓紫棋', '薛之谦',
      '华晨宇', '毛不易', '李荣浩', '五月天', '王菲',
      '周深', '张学友', '刘德华', '蔡依林', '孙燕姿',
    ];
    loading.value = true;

    try {
      const enabledSources = sources.value.filter((s) => s.enabled);
      if (enabledSources.length === 0) return;

      const shuffledKeywords = [...pool].sort(() => Math.random() - 0.5);
      const shuffledSources = [...enabledSources].sort(() => Math.random() - 0.5);

      let pickedKeyword = '';
      let pickedSourceId = '';
      let pickedSongs: Song[] = [];

      for (const kw of shuffledKeywords.slice(0, 6)) {
        for (const source of shuffledSources) {
          const result = await sourceManager.search(kw, source.id, {
            page: 1,
            limit: 12,
          });

          if (result.songs.length > 0) {
            pickedKeyword = kw;
            pickedSourceId = source.id;
            pickedSongs = result.songs;
            break;
          }
        }

        if (pickedSongs.length > 0) break;
      }

      keyword.value = pickedKeyword;
      results.value = pickedSongs;
      syncToPlayer();
      sourceResults.value.clear();
      sourceHasMore.value.clear();
      if (pickedSourceId) {
        sourceResults.value.set(pickedSourceId, pickedSongs);
        sourceHasMore.value.set(pickedSourceId, false);
      }
      hasMore.value = false;
    } catch (e) {
      console.error('[Search] 推荐加载失败:', e);
    } finally {
      loading.value = false;
    }
  }

  // ==================== 搜索 ====================

  /** 合并多音源结果（去重） */
  function mergeResults(): Song[] {
    const merged = new Map<string, Song>();
    sourceResults.value.forEach((songs) => {
      songs.forEach((song) => {
        const key = `${song.sourceId}-${song.id}`;
        if (!merged.has(key)) merged.set(key, song);
      });
    });
    return Array.from(merged.values());
  }

  /** 搜索单个音源（空 sourceId 时搜索全部音源） */
  async function searchSongs(kw: string, sourceId?: string) {
    if (!kw.trim()) return;
    const source = sourceId || currentSource.value;
    if (!source) { await searchAllSources(kw); return; }

    keyword.value = kw;
    loading.value = true;
    isLoadingMore.value = false;
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    results.value = [];
    hasMore.value = false;

    try {
      const result = await sourceManager.search(kw, source, {
        page: page.value,
        limit: pageSize,
      });
      sourceResults.value.set(source, result.songs);
      sourceHasMore.value.set(source, result.hasMore || result.songs.length === pageSize);
      results.value = mergeResults();
      syncToPlayer();
      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
    } catch (e) {
      console.error('[Search] 搜索失败:', e);
    } finally {
      loading.value = false;
    }
  }

  /** 搜索所有音源（逐个请求，间隔 400ms 避免触发 API 限制） */
  async function searchAllSources(kw: string) {
    if (!kw.trim()) return;

    // 确保音源已加载
    if (sources.value.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      if (sources.value.length === 0) return;
    }

    keyword.value = kw;
    loading.value = true;
    isLoadingMore.value = false;
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    results.value = [];

    try {
      const enabledIds = sources.value
        .filter((s) => s.enabled)
        .map((s) => s.id);

      // 逐个音源顺序请求，每个请求间隔 400ms
      for (let i = 0; i < enabledIds.length; i++) {
        const sid = enabledIds[i];
        // 非首个请求前等待，避免并发触发 API 限制
        if (i > 0) await new Promise((r) => setTimeout(r, 400));

        try {
          const result = await sourceManager.search(kw, sid, {
            page: 1,
            limit: pageSize,
          });
          sourceResults.value.set(sid, result.songs);
          sourceHasMore.value.set(
            sid,
            result.hasMore || result.songs.length === pageSize,
          );
          // 每完成一个音源就立即合并展示，让用户看到逐步增加的结果
          results.value = mergeResults();
          syncToPlayer();
        } catch {
          sourceResults.value.set(sid, []);
          sourceHasMore.value.set(sid, false);
        }
      }

      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
    } catch (e) {
      console.error('[Search] 多源搜索失败:', e);
    } finally {
      loading.value = false;
    }
  }

  /** 加载更多结果（逐个音源顺序请求） */
  async function loadMore() {
    if (!hasMore.value || loading.value) return;

    loading.value = true;
    isLoadingMore.value = true;
    page.value++;

    try {
      const pending = Array.from(sourceHasMore.value.entries()).filter(([, ok]) => ok);

      for (let i = 0; i < pending.length; i++) {
        const [sid] = pending[i];
        if (i > 0) await new Promise((r) => setTimeout(r, 400));

        try {
          const result = await sourceManager.search(keyword.value, sid, {
            page: page.value,
            limit: pageSize,
          });
          const existing = sourceResults.value.get(sid) || [];
          sourceResults.value.set(sid, [...existing, ...result.songs]);
          sourceHasMore.value.set(
            sid,
            result.hasMore || result.songs.length === pageSize,
          );
          // 追加到结果（去重）
          result.songs.forEach((song) => {
            const key = `${song.sourceId}-${song.id}`;
            if (!results.value.some((s) => `${s.sourceId}-${s.id}` === key)) {
              results.value.push(song);
            }
          });
          syncToPlayer();
        } catch {
          sourceHasMore.value.set(sid, false);
        }
      }

      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
    } catch {
      page.value--;
    } finally {
      loading.value = false;
      isLoadingMore.value = false;
    }
  }

  function switchSource(sourceId: string) {
    currentSource.value = sourceId;
    if (keyword.value && sourceResults.value.size > 0) {
      results.value = mergeResults();
    }
  }

  return {
    keyword,
    results,
    sourceResults,
    currentSource,
    sources,
    loading,
    isLoadingMore,
    page,
    hasMore,
    sourceHasMore,
    loadSources,
    loadRecommendations,
    searchSongs,
    searchAllSources,
    loadMore,
    switchSource,
  };
});
