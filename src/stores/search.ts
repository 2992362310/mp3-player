/**
 * 搜索状态管理
 * 管理多音源搜索、结果合并、分页加载、可播检测
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song } from '../core/sources/types';
import { sourceManager } from '../core/sources/SourceManager';
import storage from '../core/storage';
import { formatUserError } from '../utils/errors';
import { isAbortError } from '../services/GDMusicApi';
import { HOT_KEYWORDS } from '../constants/hotKeywords';

export interface SourceInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface SearchHistoryItem {
  keyword: string;
  source: string;
}

function songKey(song: Song) {
  return `${song.sourceId}-${song.id}`;
}

export const useSearchStore = defineStore('search', () => {
  const keyword = ref('');
  const results = ref<Song[]>([]);
  const sourceResults = ref<Map<string, Song[]>>(new Map());
  const currentSource = ref(storage.get<string>('searchCurrentSource', 'netease'));
  const sources = ref<SourceInfo[]>([]);
  const loading = ref(false);
  const isLoadingMore = ref(false);
  const error = ref('');
  const page = ref(1);
  const pageSize = 20;
  const hasMore = ref(false);
  const sourceHasMore = ref<Map<string, boolean>>(new Map());
  const sourceEnabledMap = ref<Record<string, boolean>>(
    storage.get<Record<string, boolean>>('searchSourceEnabled', {}),
  );
  const lastRecommendation = ref<{ keyword: string; sourceId: string } | null>(
    storage.get<{ keyword: string; sourceId: string } | null>('lastRecommendation', null),
  );
  const searchHistory = ref<SearchHistoryItem[]>(
    storage.get<SearchHistoryItem[]>('searchHistory', []),
  );
  const onlyPlayable = ref(false);
  const playableMap = ref<Record<string, boolean>>({});
  const probingPlayable = ref(false);

  const enabledSources = computed(() => sources.value.filter((s) => s.enabled));
  const recommendationSourceLimit = 1;

  let searchAbort: AbortController | null = null;
  let searchGen = 0;
  let probeGen = 0;

  function beginRequest() {
    searchAbort?.abort();
    searchAbort = new AbortController();
    searchGen += 1;
    return { signal: searchAbort.signal, gen: searchGen };
  }

  function isStale(gen: number) {
    return gen !== searchGen;
  }

  function pickRecommendationSources(list: SourceInfo[]): SourceInfo[] {
    if (list.length <= recommendationSourceLimit) return list;

    const picked: SourceInfo[] = [];
    const preferredId = currentSource.value || 'netease';
    const preferred = list.find((s) => s.id === preferredId);
    if (preferred) picked.push(preferred);

    const rest = list.filter((s) => !picked.some((p) => p.id === s.id));
    while (picked.length < recommendationSourceLimit && rest.length > 0) {
      const idx = Math.floor(Math.random() * rest.length);
      picked.push(rest[idx]);
      rest.splice(idx, 1);
    }

    return picked;
  }

  function addSearchHistory(kw: string, source: string) {
    const exists = searchHistory.value.findIndex((h) => h.keyword === kw);
    if (exists !== -1) searchHistory.value.splice(exists, 1);
    searchHistory.value.unshift({ keyword: kw, source });
    if (searchHistory.value.length > 15) {
      searchHistory.value = searchHistory.value.slice(0, 15);
    }
    storage.set('searchHistory', searchHistory.value);
  }

  function clearSearchHistory() {
    searchHistory.value = [];
    storage.remove('searchHistory');
  }

  function loadSources() {
    const all = sourceManager.getAllSources();
    sources.value = all.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      color: s.color || '#666666',
      enabled: sourceEnabledMap.value[s.id] ?? s.enabled !== false,
    }));

    if (!currentSource.value) {
      const defaultSource = sources.value.find((s) => s.id === 'netease' && s.enabled);
      currentSource.value = defaultSource?.id || enabledSources.value[0]?.id || '';
      storage.set('searchCurrentSource', currentSource.value);
      return;
    }

    if (
      currentSource.value &&
      !sources.value.some((s) => s.id === currentSource.value && s.enabled)
    ) {
      const defaultSource = sources.value.find((s) => s.id === 'netease' && s.enabled);
      currentSource.value = defaultSource?.id || enabledSources.value[0]?.id || '';
      storage.set('searchCurrentSource', currentSource.value);
    }
  }

  function markPlayable(song: Song, playable: boolean) {
    playableMap.value = {
      ...playableMap.value,
      [songKey(song)]: playable,
    };
  }

  function isPlayableKnown(song: Song): boolean | undefined {
    const key = songKey(song);
    return Object.prototype.hasOwnProperty.call(playableMap.value, key)
      ? playableMap.value[key]
      : undefined;
  }

  async function probePlayable(songs: Song[]) {
    const pending = songs.filter((s) => isPlayableKnown(s) === undefined).slice(0, 16);
    if (!pending.length) return;

    const gen = ++probeGen;
    probingPlayable.value = true;

    try {
      for (let i = 0; i < pending.length; i++) {
        if (gen !== probeGen) return;
        const song = pending[i];
        try {
          const url = await sourceManager.getPlayUrl(song, ['low']);
          if (gen !== probeGen) return;
          markPlayable(song, Boolean(url));
        } catch {
          if (gen !== probeGen) return;
          markPlayable(song, false);
        }
        if (i < pending.length - 1) {
          await new Promise((r) => setTimeout(r, 220));
        }
      }
    } finally {
      if (gen === probeGen) probingPlayable.value = false;
    }
  }

  async function setOnlyPlayable(next: boolean) {
    onlyPlayable.value = next;
    if (next && results.value.length) {
      await probePlayable(results.value);
    }
  }

  async function loadRecommendations() {
    if (results.value.length > 0 || loading.value) return;

    const { signal, gen } = beginRequest();
    loading.value = true;
    error.value = '';

    try {
      const enabled = sources.value.filter((s) => s.enabled);
      if (enabled.length === 0) return;

      const lastKw = lastRecommendation.value?.keyword;
      const pool = [...HOT_KEYWORDS];
      const keywordCandidates =
        pool.length > 1 && lastKw ? pool.filter((k) => k !== lastKw) : pool;
      const kw = keywordCandidates[Math.floor(Math.random() * keywordCandidates.length)];
      const sampledSources = pickRecommendationSources(enabled);
      const aggregate: Song[] = [];

      for (let i = 0; i < sampledSources.length; i++) {
        if (signal.aborted || isStale(gen)) return;
        const source = sampledSources[i];
        if (i > 0) await new Promise((r) => setTimeout(r, 300));

        try {
          const result = await sourceManager.search(kw, source.id, {
            page: 1,
            limit: 12,
            signal,
          });
          if (result.songs.length) aggregate.push(...result.songs);
        } catch (e) {
          if (isAbortError(e) || isStale(gen)) return;
        }
      }

      if (isStale(gen) || aggregate.length === 0) return;

      const unique = new Map<string, Song>();
      aggregate.forEach((song) => {
        const key = songKey(song);
        if (!unique.has(key)) unique.set(key, song);
      });

      const shuffled = Array.from(unique.values())
        .map((song) => ({ song, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((item) => item.song)
        .slice(0, 24);

      keyword.value = kw;
      results.value = shuffled;
      sourceResults.value.clear();
      sourceHasMore.value.clear();
      hasMore.value = false;

      const firstSourceId = shuffled[0]?.sourceId || enabled[0].id;
      lastRecommendation.value = { keyword: kw, sourceId: firstSourceId };
      storage.set('lastRecommendation', lastRecommendation.value);
    } catch (e) {
      if (isAbortError(e) || isStale(gen)) return;
      console.error('[Search] 推荐加载失败:', e);
      error.value = formatUserError(e, '推荐加载失败');
    } finally {
      if (!isStale(gen)) loading.value = false;
    }
  }

  function mergeResults(): Song[] {
    const merged = new Map<string, Song>();
    sourceResults.value.forEach((songs) => {
      songs.forEach((song) => {
        const key = songKey(song);
        if (!merged.has(key)) merged.set(key, song);
      });
    });
    return Array.from(merged.values());
  }

  async function searchSongs(kw: string, sourceId?: string) {
    if (!kw.trim()) return;
    const source = sourceId || currentSource.value;
    if (!source) {
      await searchAllSources(kw);
      return;
    }

    const sourceInfo = sources.value.find((s) => s.id === source);
    if (sourceInfo && !sourceInfo.enabled) {
      error.value = `音源 ${sourceInfo.name} 已禁用，请先启用或切换音源`;
      return;
    }

    const { signal, gen } = beginRequest();
    keyword.value = kw;
    loading.value = true;
    isLoadingMore.value = false;
    error.value = '';
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    results.value = [];
    hasMore.value = false;

    try {
      const result = await sourceManager.search(kw, source, {
        page: page.value,
        limit: pageSize,
        signal,
      });
      if (isStale(gen)) return;
      sourceResults.value.set(source, result.songs);
      sourceHasMore.value.set(source, result.hasMore || result.songs.length === pageSize);
      results.value = mergeResults();
      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
      if (onlyPlayable.value) void probePlayable(results.value);
    } catch (e) {
      if (isAbortError(e) || isStale(gen)) return;
      console.error('[Search] 搜索失败:', e);
      error.value = formatUserError(e, '搜索失败，请稍后再试');
    } finally {
      if (!isStale(gen)) loading.value = false;
    }
  }

  async function searchAllSources(kw: string) {
    if (!kw.trim()) return;

    if (sources.value.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      if (sources.value.length === 0) return;
    }

    const { signal, gen } = beginRequest();
    keyword.value = kw;
    loading.value = true;
    isLoadingMore.value = false;
    error.value = '';
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    results.value = [];

    try {
      const enabledIds = sources.value.filter((s) => s.enabled).map((s) => s.id);

      if (enabledIds.length === 0) {
        error.value = '没有可用音源，请在设置中启用至少一个音源';
        return;
      }

      for (let i = 0; i < enabledIds.length; i++) {
        if (signal.aborted || isStale(gen)) return;
        const sid = enabledIds[i];
        if (i > 0) await new Promise((r) => setTimeout(r, 400));
        if (signal.aborted || isStale(gen)) return;

        try {
          const result = await sourceManager.search(kw, sid, {
            page: 1,
            limit: pageSize,
            signal,
          });
          if (isStale(gen)) return;
          sourceResults.value.set(sid, result.songs);
          sourceHasMore.value.set(
            sid,
            result.hasMore || result.songs.length === pageSize,
          );
          results.value = mergeResults();
        } catch (e) {
          if (isAbortError(e) || isStale(gen)) return;
          sourceResults.value.set(sid, []);
          sourceHasMore.value.set(sid, false);
        }
      }

      if (isStale(gen)) return;
      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
      if (onlyPlayable.value) void probePlayable(results.value);
    } catch (e) {
      if (isAbortError(e) || isStale(gen)) return;
      console.error('[Search] 多源搜索失败:', e);
      error.value = formatUserError(e, '搜索失败，请稍后再试');
    } finally {
      if (!isStale(gen)) loading.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return;

    const { signal, gen } = beginRequest();
    loading.value = true;
    isLoadingMore.value = true;
    page.value++;

    try {
      const pending = Array.from(sourceHasMore.value.entries()).filter(([, ok]) => ok);

      for (let i = 0; i < pending.length; i++) {
        if (signal.aborted || isStale(gen)) return;
        const [sid] = pending[i];
        if (i > 0) await new Promise((r) => setTimeout(r, 400));
        if (signal.aborted || isStale(gen)) return;

        try {
          const result = await sourceManager.search(keyword.value, sid, {
            page: page.value,
            limit: pageSize,
            signal,
          });
          if (isStale(gen)) return;
          const existing = sourceResults.value.get(sid) || [];
          sourceResults.value.set(sid, [...existing, ...result.songs]);
          sourceHasMore.value.set(
            sid,
            result.hasMore || result.songs.length === pageSize,
          );
          result.songs.forEach((song) => {
            const key = songKey(song);
            if (!results.value.some((s) => songKey(s) === key)) {
              results.value.push(song);
            }
          });
        } catch (e) {
          if (isAbortError(e) || isStale(gen)) return;
          sourceHasMore.value.set(sid, false);
        }
      }

      if (isStale(gen)) return;
      hasMore.value = Array.from(sourceHasMore.value.values()).some((v) => v);
      if (onlyPlayable.value) void probePlayable(results.value);
    } catch {
      if (!isStale(gen)) page.value--;
    } finally {
      if (!isStale(gen)) {
        loading.value = false;
        isLoadingMore.value = false;
      }
    }
  }

  function switchSource(sourceId: string) {
    if (!sourceId) {
      currentSource.value = '';
      storage.set('searchCurrentSource', '');
      return;
    }
    const sourceInfo = sources.value.find((s) => s.id === sourceId);
    if (!sourceInfo?.enabled) return;
    currentSource.value = sourceId;
    storage.set('searchCurrentSource', sourceId);
    if (keyword.value && sourceResults.value.size > 0) {
      results.value = mergeResults();
    }
  }

  function setSourceEnabled(sourceId: string, enabled: boolean) {
    const idx = sources.value.findIndex((s) => s.id === sourceId);
    if (idx === -1) return;

    sources.value[idx] = { ...sources.value[idx], enabled };
    sourceEnabledMap.value = {
      ...sourceEnabledMap.value,
      [sourceId]: enabled,
    };
    storage.set('searchSourceEnabled', sourceEnabledMap.value);

    if (!enabled && currentSource.value === sourceId) {
      currentSource.value = enabledSources.value[0]?.id || '';
      storage.set('searchCurrentSource', currentSource.value);
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
    error,
    page,
    hasMore,
    sourceHasMore,
    searchHistory,
    enabledSources,
    onlyPlayable,
    playableMap,
    probingPlayable,
    loadSources,
    loadRecommendations,
    searchSongs,
    searchAllSources,
    loadMore,
    switchSource,
    setSourceEnabled,
    addSearchHistory,
    clearSearchHistory,
    setOnlyPlayable,
    markPlayable,
    isPlayableKnown,
    probePlayable,
  };
});
