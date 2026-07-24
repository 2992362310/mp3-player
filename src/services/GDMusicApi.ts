/**
 * GD Music API 服务类
 * 文档: https://music-api.gdstudio.xyz/api.php
 *
 * 稳定音乐源: netease, kuwo, joox, bilibili
 * 访问限制: 5分钟内不超过50次请求
 */

// 音乐源类型
export type MusicSource =
  | 'netease'
  | 'tencent'
  | 'kuwo'
  | 'kugou'
  | 'migu'
  | 'bilibili'
  | 'joox'
  | 'spotify'
  | 'ytmusic'
  | 'apple'
  | 'deezer'
  | 'tidal'
  | 'qobuz'
  | 'ximalaya';

// 音质类型
export type MusicQuality = 128 | 192 | 320 | 740 | 999;

// 图片尺寸
export type PicSize = 300 | 500;

// 搜索结果项
export interface GDSong {
  id: string;
  name: string;
  artist: string[];
  album: string;
  pic_id: string;
  lyric_id: string;
  source: MusicSource;
}

// 播放地址响应
export interface GDPlayUrlResponse {
  url: string;
  br: number;
  size: number;
}

// 歌词响应
export interface GDLyricResponse {
  lyric: string;
  tlyric?: string;
}

// 专辑图响应
export interface GDPicResponse {
  url: string;
}

// 搜索参数
export interface SearchParams {
  keyword: string;
  source?: MusicSource;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name;
  return name === 'AbortError';
}

// 搜索结果
export interface SearchResult {
  songs: GDSong[];
  total: number;
  page: number;
  limit: number;
  source: MusicSource;
}

// 请求缓存项
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// API 配置
const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php';
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 80;
const REQUEST_LIMIT = 50;
const REQUEST_WINDOW = 5 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GD Music API 服务类
 */
class GDMusicApiService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private requestTimestamps: number[] = [];
  private cooldownUntil = 0;

  public readonly stableSources: MusicSource[] = ['netease', 'kuwo', 'joox', 'bilibili'];

  public readonly allSources: MusicSource[] = [
    'netease', 'kuwo', 'joox', 'tencent', 'bilibili',
    'spotify', 'ytmusic', 'apple', 'tidal', 'qobuz',
  ];

  /** 限流冷却剩余秒数，0 表示可请求 */
  getCooldownSeconds(): number {
    const remain = this.cooldownUntil - Date.now();
    return remain > 0 ? Math.ceil(remain / 1000) : 0;
  }

  private enterCooldown(ms = COOLDOWN_MS) {
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + ms);
  }

  private assertNotCoolingDown() {
    const seconds = this.getCooldownSeconds();
    if (seconds > 0) {
      throw new Error(`请求频率超限，请约 ${seconds} 秒后再试`);
    }
  }

  private checkRateLimit(): boolean {
    this.assertNotCoolingDown();

    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < REQUEST_WINDOW,
    );

    if (this.requestTimestamps.length >= REQUEST_LIMIT) {
      this.enterCooldown();
      console.warn('[GDMusicApi] 请求频率超限，进入冷却');
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // LRU：命中后挪到末尾
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private saveToCache<T>(key: string, data: T): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    while (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey == null) break;
      this.cache.delete(oldestKey);
    }
  }

  private isRetryableError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error ?? '');
    if (msg.includes('请求频率超限')) return false;
    if (msg.includes('HTTP error! status: 4')) return false;
    return (
      msg.includes('服务暂时不可用') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('network') ||
      msg.includes('HTTP error! status: 5')
    );
  }

  private async requestOnce<T>(url: string, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    if (!this.checkRateLimit()) {
      const seconds = this.getCooldownSeconds();
      throw new Error(`请求频率超限，请约 ${seconds || 60} 秒后再试`);
    }

    console.log('[GDMusicApi] 请求:', url);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new Error('网络异常，请检查连接后重试');
    }

    if (!response.ok) {
      if (response.status === 429) {
        this.enterCooldown();
        const seconds = this.getCooldownSeconds();
        throw new Error(`请求频率超限，请约 ${seconds || 60} 秒后再试`);
      }
      if (response.status >= 500) throw new Error('服务暂时不可用，请稍后再试');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private async request<T>(
    params: Record<string, string | number>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const cacheKey = url.toString();
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    this.assertNotCoolingDown();

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        const data = await this.requestOnce<T>(cacheKey, signal);
        this.saveToCache(cacheKey, data);
        return data;
      } catch (error) {
        lastError = error;
        if (isAbortError(error)) throw error;
        if (attempt >= MAX_RETRIES || !this.isRetryableError(error)) break;
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('请求失败');
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keyword, source = 'netease', page = 1, limit = 20, signal } = params;

    const response = await this.request<GDSong[]>(
      {
        types: 'search',
        source,
        name: keyword,
        count: limit,
        pages: page,
      },
      signal,
    );

    return {
      songs: response,
      total: response.length,
      page,
      limit,
      source,
    };
  }

  async getPlayUrl(
    source: MusicSource,
    id: string,
    br: MusicQuality = 320,
    signal?: AbortSignal,
  ): Promise<GDPlayUrlResponse> {
    return this.request<GDPlayUrlResponse>(
      {
        types: 'url',
        source,
        id,
        br,
      },
      signal,
    );
  }

  async getPicUrl(
    source: MusicSource,
    id: string,
    size: PicSize = 300,
    signal?: AbortSignal,
  ): Promise<GDPicResponse> {
    return this.request<GDPicResponse>(
      {
        types: 'pic',
        source,
        id,
        size,
      },
      signal,
    );
  }

  async getLyric(source: MusicSource, id: string, signal?: AbortSignal): Promise<GDLyricResponse> {
    return this.request<GDLyricResponse>(
      {
        types: 'lyric',
        source,
        id,
      },
      signal,
    );
  }

  async getAlbumSongs(source: MusicSource, albumId: string): Promise<GDSong[]> {
    const albumSource = `${source}_album` as any;
    return this.request<GDSong[]>({
      types: 'search',
      source: albumSource,
      name: albumId,
    });
  }

  normalizeSong(song: GDSong): {
    id: string;
    title: string;
    artist: string;
    album: string;
    cover: string;
    sourceId: string;
    raw: GDSong;
  } {
    return {
      id: String(song.id),
      title: song.name,
      artist: Array.isArray(song.artist) ? song.artist.join(', ') : song.artist,
      album: song.album || '',
      cover: '',
      sourceId: song.source,
      raw: song,
    };
  }

  async getFullSongInfo(song: GDSong, picSize: PicSize = 300): Promise<{
    id: string;
    title: string;
    artist: string;
    album: string;
    cover: string;
    sourceId: string;
    raw: GDSong;
  }> {
    const normalized = this.normalizeSong(song);

    if (song.pic_id) {
      try {
        const picResponse = await this.getPicUrl(song.source, song.pic_id, picSize);
        normalized.cover = picResponse.url;
      } catch (error) {
        console.warn('[GDMusicApi] 获取封面失败:', error);
      }
    }

    return normalized;
  }

  async searchWithDetails(params: SearchParams, picSize: PicSize = 300) {
    const result = await this.search(params);
    const songs = await Promise.all(
      result.songs.map((song) => this.getFullSongInfo(song, picSize)),
    );
    return { ...result, songs };
  }
}

export const gdMusicApi = new GDMusicApiService();
export default gdMusicApi;
