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

const SEARCH_HISTORY_LIMIT = 20;

function normalizeHistoryKeyword(kw: string) {
  return kw.trim().toLowerCase();
}

interface QuickSearchCacheItem {
  keyword: string;
  sourceId: string;
  results: Song[];
  sourceResults: Record<string, Song[]>;
  sourceHasMore: Record<string, boolean>;
  hasMore: boolean;
  page: number;
  updatedAt: number;
}

interface SearchSnapshot {
  keyword: string;
  scope: string;
  results: Song[];
  sourceResults: Map<string, Song[]>;
  sourceHasMore: Map<string, boolean>;
  page: number;
  hasMore: boolean;
}

function songKey(song: Song) {
  return `${song.sourceId}-${song.id}`;
}

function quickSearchKey(keyword: string, sourceId: string) {
  return `${sourceId || 'all'}::${keyword.trim().toLowerCase()}`;
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
  const quickSearchCache = ref<Record<string, QuickSearchCacheItem>>(
    storage.get<Record<string, QuickSearchCacheItem>>('quickSearchCache', {}),
  );

  const activeScope = ref('');
  const activeQueryKey = ref('');
  const querySnapshots = new Map<string, SearchSnapshot>();
  const querySnapshotOrder: string[] = [];
  const querySnapshotLimit = 16;

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

  function normalizeKw(kw: string) {
    return kw.trim().toLowerCase();
  }

  function makeQueryKey(kw: string, scope: string) {
    return `${scope || '__all__'}::${normalizeKw(kw)}`;
  }

  function touchSnapshotKey(key: string) {
    const idx = querySnapshotOrder.indexOf(key);
    if (idx !== -1) querySnapshotOrder.splice(idx, 1);
    querySnapshotOrder.push(key);
  }

  function setSnapshot(key: string, snapshot: SearchSnapshot) {
    querySnapshots.set(key, snapshot);
    touchSnapshotKey(key);
    while (querySnapshotOrder.length > querySnapshotLimit) {
      const oldKey = querySnapshotOrder.shift();
      if (oldKey) querySnapshots.delete(oldKey);
    }
  }

  function cloneMapOfSongs(input: Map<string, Song[]>) {
    const out = new Map<string, Song[]>();
    input.forEach((songs, sid) => {
      out.set(sid, songs.slice());
    });
    return out;
  }

  function saveActiveSnapshot() {
    if (!activeQueryKey.value || !keyword.value || results.value.length === 0) return;
    setSnapshot(activeQueryKey.value, {
      keyword: keyword.value,
      scope: activeScope.value,
      results: results.value.slice(),
      sourceResults: cloneMapOfSongs(sourceResults.value),
      sourceHasMore: new Map(sourceHasMore.value),
      page: page.value,
      hasMore: hasMore.value,
    });
  }

  function tryRestoreSnapshot(kw: string, scope: string): boolean {
    const key = makeQueryKey(kw, scope);
    const snapshot = querySnapshots.get(key);
    if (!snapshot) return false;

    touchSnapshotKey(key);
    keyword.value = snapshot.keyword;
    results.value = snapshot.results.slice();
    sourceResults.value = cloneMapOfSongs(snapshot.sourceResults);
    sourceHasMore.value = new Map(snapshot.sourceHasMore);
    page.value = snapshot.page;
    hasMore.value = snapshot.hasMore;
    error.value = '';
    loading.value = false;
    isLoadingMore.value = false;
    activeScope.value = snapshot.scope;
    activeQueryKey.value = key;

    if (onlyPlayable.value) void probePlayable(results.value);
    return true;
  }

  function addSearchHistory(kw: string, source: string) {
    const keyword = kw.trim();
    if (!keyword) return;

    const key = normalizeHistoryKeyword(keyword);
    const exists = searchHistory.value.findIndex(
      (h) => normalizeHistoryKeyword(h.keyword) === key,
    );
    if (exists !== -1) searchHistory.value.splice(exists, 1);
    searchHistory.value.unshift({ keyword, source });
    if (searchHistory.value.length > SEARCH_HISTORY_LIMIT) {
      searchHistory.value = searchHistory.value.slice(0, SEARCH_HISTORY_LIMIT);
    }
    storage.set('searchHistory', searchHistory.value);
  }

  function removeSearchHistory(keyword: string) {
    const key = normalizeHistoryKeyword(keyword);
    const next = searchHistory.value.filter(
      (h) => normalizeHistoryKeyword(h.keyword) !== key,
    );
    if (next.length === searchHistory.value.length) return;
    searchHistory.value = next;
    if (next.length) storage.set('searchHistory', next);
    else storage.remove('searchHistory');
  }

  function clearSearchHistory() {
    searchHistory.value = [];
    storage.remove('searchHistory');
  }

  function persistQuickSearchCache() {
    storage.set('quickSearchCache', quickSearchCache.value);
  }

  function cacheCurrentQuickSearch(keywordText: string, sourceId: string) {
    const keywordTrimmed = keywordText.trim();
    if (!keywordTrimmed || results.value.length === 0) return;

    const key = quickSearchKey(keywordTrimmed, sourceId);
    const sourceResultsRecord: Record<string, Song[]> = {};
    sourceResults.value.forEach((songs, sid) => {
      sourceResultsRecord[sid] = songs;
    });

    const sourceHasMoreRecord: Record<string, boolean> = {};
    sourceHasMore.value.forEach((more, sid) => {
      sourceHasMoreRecord[sid] = more;
    });

    quickSearchCache.value[key] = {
      keyword: keywordTrimmed,
      sourceId,
      results: [...results.value],
      sourceResults: sourceResultsRecord,
      sourceHasMore: sourceHasMoreRecord,
      hasMore: hasMore.value,
      page: page.value,
      updatedAt: Date.now(),
    };

    const entries = Object.entries(quickSearchCache.value)
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    if (entries.length > 10) {
      quickSearchCache.value = Object.fromEntries(entries.slice(0, 10));
    }

    persistQuickSearchCache();
  }

  function restoreQuickSearch(keywordText: string, sourceId: string): boolean {
    const keywordTrimmed = keywordText.trim();
    if (!keywordTrimmed) return false;

    const key = quickSearchKey(keywordTrimmed, sourceId);
    const cached = quickSearchCache.value[key];
    if (!cached || !cached.results.length) return false;

    searchAbort?.abort();
    searchGen += 1;
    loading.value = false;
    isLoadingMore.value = false;
    error.value = '';

    keyword.value = cached.keyword;
    results.value = [...cached.results];
    sourceResults.value = new Map(Object.entries(cached.sourceResults));
    sourceHasMore.value = new Map(Object.entries(cached.sourceHasMore));
    hasMore.value = cached.hasMore;
    page.value = cached.page || 1;
    activeScope.value = sourceId;
    activeQueryKey.value = makeQueryKey(keywordTrimmed, sourceId);
    saveActiveSnapshot();

    return true;
  }

  function loadSources() {
    const all = sourceManager.getAllSources().filter((s) => s.id !== 'local');
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

  async function searchSongs(kw: string, sourceId?: string, options?: { force?: boolean }) {
    if (!kw.trim()) return;
    let source = sourceId === undefined ? currentSource.value : sourceId;
    // 不再支持「全部音源」并行搜；空值回落到当前/默认音源
    if (!source) {
      source = currentSource.value || pickDefaultSourceId();
      if (!source) return;
      if (!currentSource.value) {
        currentSource.value = source;
        storage.set('searchCurrentSource', source);
      }
    }
    const scope = source;
    const normalizedKeyword = kw.trim();
    const force = Boolean(options?.force);

    if (
      !force
      && keyword.value === normalizedKeyword
      && activeScope.value === scope
      && results.value.length > 0
      && !loading.value
    ) {
      return;
    }

    if (!force && tryRestoreSnapshot(normalizedKeyword, scope)) {
      return;
    }

    const sourceInfo = sources.value.find((s) => s.id === source);
    if (sourceInfo && !sourceInfo.enabled) {
      error.value = `音源 ${sourceInfo.name} 已禁用，请先启用或切换音源`;
      return;
    }

    const { signal, gen } = beginRequest();
    saveActiveSnapshot();
    const keywordChanged = keyword.value !== normalizedKeyword;
    keyword.value = normalizedKeyword;
    loading.value = true;
    isLoadingMore.value = false;
    error.value = '';
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    // 关键字变了才清空列表，避免“已有结果又闪一下空白再刷”
    if (keywordChanged || force) {
      results.value = [];
    }
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
      cacheCurrentQuickSearch(kw, source);
      if (onlyPlayable.value) void probePlayable(results.value);
      activeScope.value = scope;
      activeQueryKey.value = makeQueryKey(normalizedKeyword, scope);
      saveActiveSnapshot();
    } catch (e) {
      if (isAbortError(e) || isStale(gen)) return;
      console.error('[Search] 搜索失败:', e);
      error.value = formatUserError(e, '搜索失败，请稍后再试');
    } finally {
      if (!isStale(gen)) loading.value = false;
    }
  }

  async function searchAllSources(kw: string, options?: { force?: boolean }) {
    if (!kw.trim()) return;

    const normalizedKeyword = kw.trim();
    const scope = '';
    const force = Boolean(options?.force);
    if (
      !force
      && keyword.value === normalizedKeyword
      && activeScope.value === scope
      && results.value.length > 0
      && !loading.value
    ) {
      return;
    }

    if (!force && tryRestoreSnapshot(normalizedKeyword, scope)) {
      return;
    }

    if (sources.value.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      if (sources.value.length === 0) return;
    }

    const { signal, gen } = beginRequest();
    saveActiveSnapshot();
    const keywordChanged = keyword.value !== normalizedKeyword;
    keyword.value = normalizedKeyword;
    loading.value = true;
    isLoadingMore.value = false;
    error.value = '';
    page.value = 1;
    sourceResults.value.clear();
    sourceHasMore.value.clear();
    if (keywordChanged || force) {
      results.value = [];
    }

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
      cacheCurrentQuickSearch(kw, '');
      if (onlyPlayable.value) void probePlayable(results.value);
      activeScope.value = scope;
      activeQueryKey.value = makeQueryKey(normalizedKeyword, scope);
      saveActiveSnapshot();
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
      cacheCurrentQuickSearch(keyword.value, activeScope.value);
      if (onlyPlayable.value) void probePlayable(results.value);
      saveActiveSnapshot();
    } catch {
      if (!isStale(gen)) page.value--;
    } finally {
      if (!isStale(gen)) {
        loading.value = false;
        isLoadingMore.value = false;
      }
    }
  }

  function pickDefaultSourceId(): string {
    return sources.value.find((s) => s.id === 'netease' && s.enabled)?.id
      || enabledSources.value[0]?.id
      || '';
  }

  function switchSource(sourceId: string) {
    const next = sourceId || pickDefaultSourceId();
    if (!next) return;
    const sourceInfo = sources.value.find((s) => s.id === next);
    if (!sourceInfo?.enabled) return;
    currentSource.value = next;
    storage.set('searchCurrentSource', next);
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
    removeSearchHistory,
    clearSearchHistory,
    restoreQuickSearch,
    cacheCurrentQuickSearch,
    setOnlyPlayable,
    markPlayable,
    isPlayableKnown,
    probePlayable,
  };
});
