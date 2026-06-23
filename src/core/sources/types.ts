/**
 * 音源插件类型定义
 * 用于定义音乐源插件的标准接口
 */

/**
 * 歌曲信息
 */
export interface Song {
  /** 歌曲ID */
  id: string | number;
  /** 歌曲名称 */
  title: string;
  /** 歌手名称 */
  artist: string;
  /** 专辑名称 */
  album?: string;
  /** 封面图片 */
  cover?: string;
  /** 时长（秒） */
  duration?: number;
  /** 音源ID */
  sourceId: string;
  /** 原始数据（供插件内部使用） */
  raw?: any;
}

/**
 * 歌单信息
 */
export interface Playlist {
  /** 歌单ID */
  id: string | number;
  /** 歌单名称 */
  title: string;
  /** 封面图片 */
  cover?: string;
  /** 描述 */
  description?: string;
  /** 播放量 */
  playCount?: number;
  /** 歌曲数量 */
  trackCount?: number;
  /** 创建者 */
  creator?: string;
  /** 音源ID */
  sourceId: string;
  /** 原始数据 */
  raw?: any;
}

/**
 * 歌手信息
 */
export interface Artist {
  /** 歌手ID */
  id: string | number;
  /** 歌手名称 */
  name: string;
  /** 头像 */
  avatar?: string;
  /** 简介 */
  description?: string;
  /** 歌曲数量 */
  songCount?: number;
  /** 专辑数量 */
  albumCount?: number;
  /** 音源ID */
  sourceId: string;
  /** 原始数据 */
  raw?: any;
}

/**
 * 专辑信息
 */
export interface Album {
  /** 专辑ID */
  id: string | number;
  /** 专辑名称 */
  title: string;
  /** 歌手名称 */
  artist: string;
  /** 封面图片 */
  cover?: string;
  /** 发行时间 */
  publishTime?: string;
  /** 描述 */
  description?: string;
  /** 歌曲数量 */
  trackCount?: number;
  /** 音源ID */
  sourceId: string;
  /** 原始数据 */
  raw?: any;
}

/**
 * 歌词信息
 */
export interface Lyric {
  /** 原始歌词文本 */
  text: string;
  /** 翻译歌词 */
  translation?: string;
  /** 解析后的歌词行 [{time: 0, text: "..."}] */
  lines?: LyricLine[];
}

/**
 * 歌词行
 */
export interface LyricLine {
  /** 时间（秒） */
  time: number;
  /** 歌词文本 */
  text: string;
  /** 翻译 */
  translation?: string;
}

/**
 * 播放地址信息
 */
export interface PlayUrl {
  /** 播放地址 */
  url: string;
  /** 音质 */
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  /** 文件大小（字节） */
  size?: number;
  /** 格式 */
  format?: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 歌曲列表 */
  songs: Song[];
  /** 是否有更多 */
  hasMore?: boolean;
  /** 总数 */
  total?: number;
}

/**
 * 排行榜
 */
export interface Ranking {
  /** 排行榜ID */
  id: string | number;
  /** 排行榜名称 */
  title: string;
  /** 封面图片 */
  cover?: string;
  /** 描述 */
  description?: string;
  /** 歌曲列表 */
  songs?: Song[];
  /** 音源ID */
  sourceId: string;
}

/**
 * 推荐内容
 */
export interface Recommend {
  /** 推荐歌单 */
  playlists?: Playlist[];
  /** 推荐歌曲 */
  songs?: Song[];
  /** 新歌 */
  newSongs?: Song[];
  /** 排行榜 */
  rankings?: Ranking[];
}

/**
 * 搜索参数
 */
export interface SearchParams {
  /** 关键词 */
  keyword: string;
  /** 页码（从1开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 搜索类型 */
  type?: 'song' | 'album' | 'artist' | 'playlist';
}

/**
 * 音源插件配置
 */
export interface SourceConfig {
  /** 插件ID（唯一标识） */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件图标（Iconify图标名或URL） */
  icon: string;
  /** 主题色 */
  color?: string;
  /** 描述 */
  description?: string;
  /** 版本 */
  version?: string;
  /** 作者 */
  author?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 优先级（数字越大优先级越高） */
  priority?: number;
  /** 支持的功能 */
  features?: SourceFeatures;
}

/**
 * 音源支持的功能
 */
export interface SourceFeatures {
  /** 搜索歌曲 */
  search?: boolean;
  /** 获取播放地址 */
  playUrl?: boolean;
  /** 获取歌词 */
  lyric?: boolean;
  /** 获取推荐 */
  recommend?: boolean;
  /** 获取排行榜 */
  ranking?: boolean;
  /** 获取歌单详情 */
  playlistDetail?: boolean;
  /** 获取歌手信息 */
  artistInfo?: boolean;
  /** 获取专辑信息 */
  albumInfo?: boolean;
  /** 搜索歌手 */
  searchArtist?: boolean;
  /** 搜索专辑 */
  searchAlbum?: boolean;
  /** 搜索歌单 */
  searchPlaylist?: boolean;
}

/**
 * 音源插件接口
 * 所有音源插件必须实现此接口
 */
export interface ISourcePlugin extends SourceConfig {
  /**
   * 搜索
   * @param params 搜索参数
   */
  search(params: SearchParams): Promise<SearchResult>;

  /**
   * 获取播放地址
   * @param song 歌曲信息
   * @param quality 音质
   */
  getPlayUrl(song: Song, quality?: string): Promise<PlayUrl>;

  /**
   * 获取歌词
   * @param song 歌曲信息
   */
  getLyric?(song: Song): Promise<Lyric>;

  /**
   * 获取推荐内容
   */
  getRecommend?(): Promise<Recommend>;

  /**
   * 获取排行榜列表
   */
  getRankings?(): Promise<Ranking[]>;

  /**
   * 获取排行榜详情
   * @param rankingId 排行榜ID
   */
  getRankingDetail?(rankingId: string | number): Promise<Song[]>;

  /**
   * 获取歌单详情
   * @param playlistId 歌单ID
   */
  getPlaylistDetail?(playlistId: string | number): Promise<Song[]>;

  /**
   * 获取歌手信息
   * @param artistId 歌手ID
   */
  getArtistInfo?(artistId: string | number): Promise<Artist>;

  /**
   * 获取歌手歌曲
   * @param artistId 歌手ID
   */
  getArtistSongs?(artistId: string | number): Promise<Song[]>;

  /**
   * 获取专辑信息
   * @param albumId 专辑ID
   */
  getAlbumInfo?(albumId: string | number): Promise<Album>;

  /**
   * 获取专辑歌曲
   * @param albumId 专辑ID
   */
  getAlbumSongs?(albumId: string | number): Promise<Song[]>;

  /**
   * 初始化插件（可选）
   */
  init?(): Promise<void>;

  /**
   * 销毁插件（可选）
   */
  destroy?(): Promise<void>;
}

/**
 * 音源插件构造器类型
 */
export type SourcePluginConstructor = new () => ISourcePlugin;
