/**
 * 本地音乐音源插件
 * 从 IndexedDB 读取 Blob，通过 object URL 供播放器使用
 */

import type {
  ISourcePlugin,
  Song,
  Lyric,
  PlayUrl,
  SearchResult,
  SearchParams,
} from './types';
import { localLibraryDB, type LocalTrackMeta } from '../local/LocalLibraryDB';
import { parseLrc } from '../local/parseLrc';

export const LOCAL_SOURCE_ID = 'local';

export function metaToSong(meta: LocalTrackMeta): Song {
  return {
    id: meta.id,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    duration: meta.duration,
    sourceId: LOCAL_SOURCE_ID,
    raw: {
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      size: meta.size,
      addedAt: meta.addedAt,
    },
  };
}

export class LocalSource implements ISourcePlugin {
  id = LOCAL_SOURCE_ID;
  name = '本地音乐';
  icon = 'folder';
  color = '#6b6b6b';
  description = '本机导入的音频文件';
  version = '1.0.0';
  author = 'MoYun';
  enabled = true;
  priority = 0;

  features = {
    search: true,
    playUrl: true,
    lyric: true,
    recommend: false,
    ranking: false,
    playlistDetail: false,
    artistInfo: false,
    albumInfo: false,
    searchArtist: false,
    searchAlbum: false,
    searchPlaylist: false,
  };

  private urlCache = new Map<string, string>();

  async search(params: SearchParams): Promise<SearchResult> {
    const keyword = (params.keyword || '').trim().toLowerCase();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const metas = await localLibraryDB.listMeta();

    const filtered = keyword
      ? metas.filter(
          (m) =>
            m.title.toLowerCase().includes(keyword)
            || m.artist.toLowerCase().includes(keyword)
            || m.fileName.toLowerCase().includes(keyword),
        )
      : metas;

    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    return {
      songs: slice.map(metaToSong),
      total: filtered.length,
      hasMore: start + slice.length < filtered.length,
    };
  }

  async getPlayUrl(song: Song): Promise<PlayUrl> {
    const id = String(song.id);
    const format = guessAudioFormat(song.raw?.mimeType || song.raw?.mime, song.raw?.fileName);
    const cached = this.urlCache.get(id);
    if (cached) return { url: cached, format };

    const blob = await localLibraryDB.getBlob(id);
    if (!blob) throw new Error('本地文件不存在或已被删除');

    // IndexedDB 取出的 Blob 可能丢失 type，补上以便 Howler / 浏览器识别
    const mime = song.raw?.mimeType || song.raw?.mime || blob.type || mimeFromFormat(format);
    const playBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });
    const url = URL.createObjectURL(playBlob);
    this.urlCache.set(id, url);
    return {
      url,
      format,
      size: playBlob.size,
    };
  }

  async getLyric(song: Song): Promise<Lyric> {
    const text = (await localLibraryDB.getLyricText(String(song.id))) || '';
    if (!text) return { text: '', lines: [] };
    return { text, lines: parseLrc(text) };
  }

  revokeUrl(id: string): void {
    const url = this.urlCache.get(id);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.urlCache.delete(id);
  }

  revokeAll(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.urlCache.clear();
  }

  async destroy(): Promise<void> {
    this.revokeAll();
  }
}

function guessAudioFormat(mime?: string, fileName?: string): string {
  const fromMime: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/opus': 'opus',
  };
  if (mime && fromMime[mime.toLowerCase()]) return fromMime[mime.toLowerCase()];

  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext === 'mp4' ? 'm4a' : ext;
  return 'mp3';
}

function mimeFromFormat(format: string): string {
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    flac: 'audio/flac',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    opus: 'audio/ogg',
  };
  return map[format] || 'audio/mpeg';
}

export default LocalSource;
