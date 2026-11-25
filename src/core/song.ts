import type { Song } from './sources/types';

/** 持久化用的精简歌曲结构 */
export function serializeSong(song: Song): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    sourceId: song.sourceId,
    raw: song.raw,
  };
}

export function songKey(song: Song): string {
  return `${song.sourceId}-${song.id}`;
}

/** 判断两首歌是否为同一曲（跨组件、store、composable 统一入口） */
export function isSameSong(a: Song | null | undefined, b: Song | null | undefined): boolean {
  return Boolean(a && b && a.id === b.id && a.sourceId === b.sourceId);
}
