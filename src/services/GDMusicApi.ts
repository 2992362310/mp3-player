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
  url_id: string;
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
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
const REQUEST_LIMIT = 50; // 5分钟内限制50次
const REQUEST_WINDOW = 5 * 60 * 1000; // 5分钟时间窗口

/**
 * GD Music API 服务类
 */
class GDMusicApiService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private requestTimestamps: number[] = [];

  // 稳定音乐源列表
  public readonly stableSources: MusicSource[] = ['netease', 'kuwo', 'joox', 'bilibili'];

  // 所有支持的音乐源
  public readonly allSources: MusicSource[] = [
    'netease', 'tencent', 'kuwo', 'kugou', 'migu',
    'bilibili', 'joox', 'spotify', 'ytmusic', 'apple',
    'deezer', 'tidal', 'qobuz', 'ximalaya'
  ];

  /**
   * 检查请求频率限制
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    // 清理过期的时间戳
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < REQUEST_WINDOW
    );

    if (this.requestTimestamps.length >= REQUEST_LIMIT) {
      console.warn('[GDMusicApi] 请求频率超限，请稍后再试');
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 保存数据到缓存
   */
  private saveToCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 发起 API 请求
   */
  private async request<T>(params: Record<string, string | number>): Promise<T> {
    if (!this.checkRateLimit()) {
      throw new Error('请求频率超限，请稍后再试');
    }

    const url = new URL(API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const cacheKey = url.toString();
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) {
      console.log('[GDMusicApi] 命中缓存:', cacheKey);
      return cached;
    }

    console.log('[GDMusicApi] 请求:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    this.saveToCache(cacheKey, data);
    return data;
  }

  /**
   * 搜索歌曲
   * @param params 搜索参数
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const { keyword, source = 'netease', page = 1, limit = 20 } = params;

    const response = await this.request<GDSong[]>({
      types: 'search',
      source,
      name: keyword,
      count: limit,
      pages: page
    });

    return {
      songs: response,
      total: response.length,
      page,
      limit,
      source
    };
  }

  /**
   * 获取播放地址
   * @param source 音乐源
   * @param id 歌曲ID
   * @param br 音质 (128/192/320/740/999)
   */
  async getPlayUrl(
    source: MusicSource,
    id: string,
    br: MusicQuality = 320
  ): Promise<GDPlayUrlResponse> {
    return this.request<GDPlayUrlResponse>({
      types: 'url',
      source,
      id,
      br
    });
  }

  /**
   * 获取专辑图片
   * @param source 音乐源
   * @param id 图片ID
   * @param size 尺寸 (300/500)
   */
  async getPicUrl(
    source: MusicSource,
    id: string,
    size: PicSize = 300
  ): Promise<GDPicResponse> {
    return this.request<GDPicResponse>({
      types: 'pic',
      source,
      id,
      size
    });
  }

  /**
   * 获取歌词
   * @param source 音乐源
   * @param id 歌词ID
   */
  async getLyric(source: MusicSource, id: string): Promise<GDLyricResponse> {
    return this.request<GDLyricResponse>({
      types: 'lyric',
      source,
      id
    });
  }

  /**
   * 获取专辑歌曲列表
   * @param source 音乐源
   * @param albumId 专辑ID
   */
  async getAlbumSongs(source: MusicSource, albumId: string): Promise<GDSong[]> {
    // 使用 source_album 格式
    const albumSource = `${source}_album` as any;
    return this.request<GDSong[]>({
      types: 'search',
      source: albumSource,
      name: albumId
    });
  }

  /**
   * 转换歌曲数据为标准格式
   */
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
      cover: '', // 需要单独请求
      sourceId: song.source,
      raw: song
    };
  }

  /**
   * 获取完整歌曲信息（包含封面）
   */
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

    // 获取封面
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

  /**
   * 搜索并获取完整歌曲信息
   */
  async searchWithDetails(params: SearchParams, picSize: PicSize = 300) {
    const result = await this.search(params);

    const songsWithDetails = await Promise.all(
      result.songs.map(song => this.getFullSongInfo(song, picSize))
    );

    return {
      ...result,
      songs: songsWithDetails
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[GDMusicApi] 缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例
export const gdMusicApi = new GDMusicApiService();
export default gdMusicApi;
