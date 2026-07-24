/**
 * 音源插件管理器
 * 管理和调度所有音乐源插件
 */

import type { ISourcePlugin, Song, SearchResult } from './types';

class SourceManager {
  private sources: Map<string, ISourcePlugin> = new Map();
  private initialized = false;

  /** 注册音源插件 */
  register(source: ISourcePlugin): void {
    if (this.sources.has(source.id)) {
      console.warn(`[SourceManager] 音源 ${source.id} 已存在，将被覆盖`);
    }
    this.sources.set(source.id, source);
    console.log(`[SourceManager] 注册音源: ${source.name} (${source.id})`);
  }

  /** 注销音源插件 */
  unregister(sourceId: string): boolean {
    return this.sources.delete(sourceId);
  }

  /** 获取所有已注册的音源 */
  getAllSources(): ISourcePlugin[] {
    return Array.from(this.sources.values());
  }

  /** 获取单个音源 */
  getSource(sourceId: string): ISourcePlugin | undefined {
    return this.sources.get(sourceId);
  }

  /** 搜索歌曲 - 单个音源 */
  async search(
    keyword: string,
    sourceId: string,
    options?: { page?: number; limit?: number; signal?: AbortSignal },
  ): Promise<SearchResult> {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`音源 ${sourceId} 不存在`);

    try {
      return await source.search({
        keyword,
        page: options?.page || 1,
        pageSize: options?.limit || 20,
        signal: options?.signal,
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') throw error;
      console.error(`[SourceManager] 搜索失败 (${sourceId}):`, error);
      return { songs: [], hasMore: false };
    }
  }

  /** 搜索所有音源（并行） */
  async searchAll(
    keyword: string,
    options?: { limit?: number },
  ): Promise<Map<string, SearchResult>> {
    const results = new Map<string, SearchResult>();
    const limit = options?.limit || 20;

    const promises = Array.from(this.sources.entries()).map(async ([id]) => {
      try {
        const result = await this.search(keyword, id, { limit, page: 1 });
        results.set(id, result);
      } catch (error) {
        console.error(`[SourceManager] 搜索失败 (${id}):`, error);
        results.set(id, { songs: [], hasMore: false });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /** 获取播放地址：从首选音质向下降级 */
  async getPlayUrl(
    song: Song,
    qualities: Array<'low' | 'medium' | 'high' | 'lossless'> = ['high', 'medium', 'low'],
  ): Promise<string | null> {
    const source = this.sources.get(song.sourceId);
    if (!source) throw new Error(`音源不可用：${song.sourceId}`);

    let lastError: unknown = new Error('无法获取播放地址');

    for (const quality of qualities) {
      try {
        const playUrl = await source.getPlayUrl(song, quality);
        if (playUrl?.url) return playUrl.url;
        lastError = new Error(`无可用地址 (${quality})`);
      } catch (error) {
        lastError = error;
        console.warn(`[SourceManager] 音质 ${quality} 失败，尝试降级:`, error);
      }
    }

    console.error(`[SourceManager] 获取播放地址失败: ${song.title}`);
    throw lastError instanceof Error ? lastError : new Error('无法获取播放地址');
  }

  /** 获取歌词 */
  async getLyric(song: Song) {
    const source = this.sources.get(song.sourceId);
    if (!source?.getLyric) return null;

    try {
      return await source.getLyric(song);
    } catch (error) {
      console.error(`[SourceManager] 获取歌词失败:`, error);
      return null;
    }
  }

  /** 获取推荐内容 */
  async getRecommend(sourceId?: string) {
    if (sourceId) {
      const source = this.sources.get(sourceId);
      if (source?.getRecommend) return await source.getRecommend();
      return [];
    }

    const all: any[] = [];
    const promises = Array.from(this.sources.values()).map(async (source) => {
      if (source.getRecommend) {
        try {
          const list = await source.getRecommend();
          all.push(...(list.playlists || []), ...(list.songs || []));
        } catch (error) {
          console.error(`[SourceManager] 获取推荐失败 (${source.id}):`, error);
        }
      }
    });
    await Promise.all(promises);
    return all;
  }

  /** 初始化所有音源 */
  async init(): Promise<void> {
    if (this.initialized) return;

    const promises = Array.from(this.sources.values()).map(async (source) => {
      if (source.init) {
        try {
          await source.init();
        } catch (error) {
          console.error(`[SourceManager] 初始化失败 (${source.id}):`, error);
        }
      }
    });

    await Promise.all(promises);
    this.initialized = true;
    console.log(`[SourceManager] 初始化完成，共 ${this.sources.size} 个音源`);
  }

  /** 销毁所有音源 */
  destroy(): void {
    this.sources.forEach((source) => {
      if (source.destroy) {
        try {
          source.destroy();
        } catch (error) {
          console.error(`[SourceManager] 销毁失败 (${source.id}):`, error);
        }
      }
    });
    this.sources.clear();
    this.initialized = false;
  }
}

export const sourceManager = new SourceManager();
export default sourceManager;
