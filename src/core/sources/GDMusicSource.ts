/**
 * GD Music 音源插件
 * 基于 GD Music API 实现的音源插件
 */

import type {
  ISourcePlugin,
  Song,
  Lyric,
  PlayUrl,
  SearchResult,
  SearchParams,
} from "./types";
import gdMusicApi, {
  type MusicSource,
  type MusicQuality,
  type GDSong,
} from "../../services/GDMusicApi";

/**
 * GD Music 音源插件配置
 */
interface GDMusicSourceConfig {
  /** 音乐源标识 */
  source: MusicSource;
  /** 显示名称 */
  name: string;
  /** 图标 */
  icon: string;
  /** 主题色 */
  color: string;
  /** 描述 */
  description: string;
}

/**
 * GD Music 单个音源插件类
 */
export class GDMusicSource implements ISourcePlugin {
  // 插件配置
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  version: string = "1.0.0";
  author: string = "GD Studio";
  enabled: boolean = true;
  priority: number = 100;

  features = {
    search: true,
    playUrl: true,
    lyric: true,
    recommend: false,
    ranking: false,
    playlistDetail: false,
    artistInfo: false,
    albumInfo: true,
    searchArtist: false,
    searchAlbum: false,
    searchPlaylist: false,
  };

  private source: MusicSource;

  constructor(config: GDMusicSourceConfig) {
    this.id = config.source;
    this.name = config.name;
    this.icon = config.icon;
    this.color = config.color;
    this.description = config.description;
    this.source = config.source;
  }

  /**
   * 搜索歌曲
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const { keyword, page = 1, pageSize = 20 } = params;

    try {
      const result = await gdMusicApi.search({
        keyword,
        source: this.source,
        page,
        limit: pageSize,
      });

      // 转换为标准格式
      const songs = await Promise.all(
        result.songs.map((song) => this.normalizeSong(song)),
      );

      return {
        songs,
        total: result.total,
        hasMore: songs.length === pageSize,
      };
    } catch (error) {
      console.error(`[${this.id}] 搜索失败:`, error);
      return {
        songs: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * 获取播放地址
   */
  async getPlayUrl(song: Song, quality?: string): Promise<PlayUrl> {
    const br = this.parseQuality(quality);
    const response = await gdMusicApi.getPlayUrl(this.source, String(song.id), br);
    if (!response?.url) throw new Error(`无可用地址 (${quality || 'high'})`);
    return {
      url: response.url,
      quality: this.getQualityLabel(br),
      size: response.size * 1024,
      format: "mp3",
    };
  }

  /**
   * 获取歌词
   */
  async getLyric(song: Song): Promise<Lyric> {
    try {
      const raw = song.raw as GDSong | undefined;
      const lyricId = raw?.lyric_id || String(song.id);
      const response = await gdMusicApi.getLyric(this.source, lyricId);
      return {
        text: response.lyric || "",
        translation: response.tlyric || "",
        lines: this.parseLyric(response.lyric, response.tlyric),
      };
    } catch {
      return { text: "", lines: [] };
    }
  }

  /**
   * 获取专辑歌曲
   */
  async getAlbumSongs(albumId: string | number): Promise<Song[]> {
    try {
      const songs = await gdMusicApi.getAlbumSongs(
        this.source,
        String(albumId),
      );
      return Promise.all(songs.map((song) => this.normalizeSong(song)));
    } catch (error) {
      console.error(`[${this.id}] 获取专辑歌曲失败:`, error);
      return [];
    }
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    console.log(`[${this.id}] 音源插件已初始化`);
  }

  /**
   * 销毁
   */
  async destroy(): Promise<void> {
    console.log(`[${this.id}] 音源插件已销毁`);
  }

  /**
   * 转换歌曲数据为标准格式
   */
  private async normalizeSong(song: GDSong): Promise<Song> {
    // 处理歌曲名字：如果 name 是空或 Undefined，尝试使用其他字段
    let title = song.name;
    if (!title || title.toLowerCase() === "undefined" || title.trim() === "") {
      // 尝试用 raw 数据中的其他字段
      const raw = song as any;
      title =
        raw.title ||
        raw.songname ||
        raw.songName ||
        raw.song_name ||
        `未知歌曲 (${song.id})`;
    }

    // 处理歌手名字
    let artist = "";
    if (Array.isArray(song.artist)) {
      artist = song.artist.join(", ");
    } else if (typeof song.artist === "string") {
      artist = song.artist;
    } else {
      const raw = song as any;
      artist = raw.singer || raw.author || raw.artistName || "未知歌手";
    }

    return {
      id: String(song.id),
      title: title,
      artist: artist,
      album: song.album || "",
      cover: "", // 不再自动获取封面，避免跨域和请求过多
      duration: 0,
      sourceId: this.id,
      raw: song,
    };
  }

  /**
   * 解析音质参数
   */
  private parseQuality(quality?: string): MusicQuality {
    const qualityMap: Record<string, MusicQuality> = {
      low: 128,
      medium: 192,
      high: 320,
      lossless: 999,
      "128": 128,
      "192": 192,
      "320": 320,
      "740": 740,
      "999": 999,
      flac: 999,
    };
    return qualityMap[quality || "high"] || 320;
  }

  /**
   * 获取音质标签
   */
  private getQualityLabel(
    br: MusicQuality,
  ): "low" | "medium" | "high" | "lossless" {
    if (br >= 999) return "lossless";
    if (br >= 320) return "high";
    if (br >= 192) return "medium";
    return "low";
  }

  /**
   * 解析歌词
   */
  private parseLyric(
    lyric: string,
    translation?: string,
  ): Array<{ time: number; text: string; translation?: string }> {
    if (!lyric) return [];

    const lines: Array<{ time: number; text: string; translation?: string }> =
      [];
    const lyricLines = lyric.split("\n");
    const translationMap = new Map<number, string>();

    // 解析翻译
    if (translation) {
      const transLines = translation.split("\n");
      transLines.forEach((line) => {
        const match = line.match(/\[(\d+):(\d+\.?\d*)\]/);
        if (match) {
          const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
          const text = line.replace(/\[\d+:\d+\.?\d*\]/, "").trim();
          if (text) {
            translationMap.set(Math.floor(time * 100) / 100, text);
          }
        }
      });
    }

    // 解析歌词
    lyricLines.forEach((line) => {
      const match = line.match(/\[(\d+):(\d+\.?\d*)\]/);
      if (match) {
        const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
        const text = line.replace(/\[\d+:\d+\.?\d*\]/, "").trim();
        if (text) {
          const roundedTime = Math.floor(time * 100) / 100;
          lines.push({
            time: roundedTime,
            text,
            translation: translationMap.get(roundedTime),
          });
        }
      }
    });

    return lines.sort((a, b) => a.time - b.time);
  }
}

/**
 * 创建所有 GD Music 音源插件实例
 */
export function createGDMusicSources(): ISourcePlugin[] {
  const configs: GDMusicSourceConfig[] = [
    {
      source: "netease",
      name: "网易云音乐",
      icon: "mdi:music-note",
      color: "#E91E63",
      description: "网易云音乐，发现好音乐",
    },
    {
      source: "tencent",
      name: "QQ音乐",
      icon: "mdi:music-circle",
      color: "#1DB954",
      description: "QQ音乐，听我想听",
    },
    {
      source: "kuwo",
      name: "酷我音乐",
      icon: "mdi:music-box",
      color: "#FF5722",
      description: "酷我音乐，好音质",
    },
    {
      source: "kugou",
      name: "酷狗音乐",
      icon: "mdi:dog",
      color: "#2196F3",
      description: "酷狗音乐，就是歌多",
    },
    {
      source: "migu",
      name: "咪咕音乐",
      icon: "mdi:music-note-outline",
      color: "#9C27B0",
      description: "咪咕音乐，音乐新生活",
    },
    {
      source: "bilibili",
      name: "B站音乐",
      icon: "mdi:play-circle",
      color: "#00A1D6",
      description: "B站音乐区",
    },
    {
      source: "joox",
      name: "JOOX",
      icon: "mdi:music-note-plus",
      color: "#4CAF50",
      description: "JOOX音乐",
    },
  ];

  // 文档标注较稳定的音源；bilibili 用于扩展插件验证
  const stableSources = ["netease", "kuwo", "joox", "bilibili"];

  return configs
    .filter((config) => stableSources.includes(config.source))
    .map((config) => new GDMusicSource(config));
}

/**
 * 创建单个音源插件
 */
export function createGDMusicSource(source: MusicSource): ISourcePlugin | null {
  const configs: Record<MusicSource, Partial<GDMusicSourceConfig>> = {
    netease: { name: "网易云音乐", icon: "mdi:music-note", color: "#E91E63" },
    tencent: { name: "QQ音乐", icon: "mdi:music-circle", color: "#1DB954" },
    kuwo: { name: "酷我音乐", icon: "mdi:music-box", color: "#FF5722" },
    kugou: { name: "酷狗音乐", icon: "mdi:dog", color: "#2196F3" },
    migu: {
      name: "咪咕音乐",
      icon: "mdi:music-note-outline",
      color: "#9C27B0",
    },
    bilibili: { name: "B站音乐", icon: "mdi:play-circle", color: "#00A1D6" },
    joox: { name: "JOOX", icon: "mdi:music-note-plus", color: "#4CAF50" },
    spotify: { name: "Spotify", icon: "mdi:spotify", color: "#1DB954" },
    ytmusic: { name: "YouTube Music", icon: "mdi:youtube", color: "#FF0000" },
    apple: { name: "Apple Music", icon: "mdi:apple", color: "#FC3C44" },
    deezer: { name: "Deezer", icon: "mdi:music", color: "#00C7F2" },
    tidal: { name: "Tidal", icon: "mdi:music-note", color: "#000000" },
    qobuz: { name: "Qobuz", icon: "mdi:music-note", color: "#00A1E4" },
    ximalaya: { name: "喜马拉雅", icon: "mdi:microphone", color: "#F26B1F" },
  };

  const config = configs[source];
  if (!config) return null;

  return new GDMusicSource({
    source,
    name: config.name || source,
    icon: config.icon || "mdi:music",
    color: config.color || "#666666",
    description: config.name || source,
  });
}

// 默认导出
export default GDMusicSource;
