/**
 * 本地音乐库状态
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Song } from '../core/sources/types';
import {
  buildTrackFromFile,
  fileFingerprint,
  localLibraryDB,
} from '../core/local/LocalLibraryDB';
import {
  LOCAL_SOURCE_ID,
  LocalSource,
  metaToSong,
} from '../core/sources/LocalSource';
import { sourceManager } from '../core/sources/SourceManager';
import { usePlayerStore } from './player';
import { formatUserError } from '../utils/errors';
import audioEngine from '../core/audio/AudioEngine';

const AUDIO_ACCEPT = /\.(mp3|m4a|aac|flac|wav|ogg|opus|webm|wma)$/i;
const LYRIC_ACCEPT = /\.lrc$/i;

function isAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true;
  return AUDIO_ACCEPT.test(file.name);
}

function isLyricFile(file: File): boolean {
  return LYRIC_ACCEPT.test(file.name);
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '').toLowerCase();
}

function getLocalSource(): LocalSource | undefined {
  const source = sourceManager.getSource(LOCAL_SOURCE_ID);
  return source instanceof LocalSource ? source : undefined;
}

export const useLocalStore = defineStore('local', () => {
  const songs = ref<Song[]>([]);
  const loading = ref(false);
  const importing = ref(false);
  const error = ref('');
  const query = ref('');

  const count = computed(() => songs.value.length);

  const filteredSongs = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return songs.value;
    return songs.value.filter((s) => {
      const hay = `${s.title} ${s.artist} ${s.album || ''} ${s.raw?.fileName || ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const metas = await localLibraryDB.listMeta();
      songs.value = metas.map(metaToSong);
    } catch (e) {
      console.error('[Local] 加载失败:', e);
      error.value = formatUserError(e, '加载本地音乐失败');
      songs.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function importFiles(
    files: FileList | File[],
    options?: { pathHints?: Map<File, string> },
  ): Promise<{ added: number; skipped: number }> {
    const list = Array.from(files);
    if (list.length === 0) {
      error.value = '未选择文件';
      return { added: 0, skipped: 0 };
    }

    importing.value = true;
    error.value = '';
    try {
      const lyricsByBase = new Map<string, string>();
      const audioFiles: File[] = [];

      for (const file of list) {
        if (isLyricFile(file)) {
          try {
            lyricsByBase.set(baseName(file.name), await file.text());
          } catch {
            // ignore
          }
        } else if (isAudioFile(file)) {
          audioFiles.push(file);
        }
      }

      if (audioFiles.length === 0) {
        error.value = '未识别到可导入的音频文件';
        return { added: 0, skipped: 0 };
      }

      const existing = await localLibraryDB.listMeta();
      const known = new Set(
        existing.map((m) => m.fingerprint).filter((f): f is string => Boolean(f)),
      );

      const tracks = [];
      let skipped = 0;

      for (const file of audioFiles) {
        const pathHint = options?.pathHints?.get(file);
        const fingerprint = fileFingerprint(file, pathHint);
        if (known.has(fingerprint)) {
          skipped += 1;
          continue;
        }

        const folderHint = pathHint
          ? pathHint.split(/[/\\]/).slice(0, -1).filter(Boolean).pop()
          : undefined;

        const lyricText = lyricsByBase.get(baseName(file.name));
        const track = await buildTrackFromFile(file, {
          lyricText,
          pathHint,
          album: folderHint,
        });
        tracks.push(track);
        known.add(fingerprint);
      }

      if (tracks.length) {
        await localLibraryDB.putMany(tracks);
        await load();
      }

      return { added: tracks.length, skipped };
    } catch (e) {
      console.error('[Local] 导入失败:', e);
      error.value = formatUserError(e, '导入本地音乐失败');
      return { added: 0, skipped: 0 };
    } finally {
      importing.value = false;
    }
  }

  function stopIfCurrentLocal(id: string) {
    const player = usePlayerStore();
    const current = player.currentSong;
    if (!current || current.sourceId !== LOCAL_SOURCE_ID || String(current.id) !== id) {
      return;
    }
    audioEngine.unload();
    player.isPlaying = false;
    player.currentSong = null;
    player.currentIndex = -1;
    player.lyric = null;
    player.currentLyricIndex = -1;
    player.currentTime = 0;
    player.duration = 0;
    player.persistSession();
  }

  function stopIfAnyLocal() {
    const player = usePlayerStore();
    const current = player.currentSong;
    if (!current || current.sourceId !== LOCAL_SOURCE_ID) return;
    stopIfCurrentLocal(String(current.id));
  }

  async function removeSong(song: Song) {
    if (song.sourceId !== LOCAL_SOURCE_ID) return;
    const id = String(song.id);
    try {
      await localLibraryDB.remove(id);
      getLocalSource()?.revokeUrl(id);
      stopIfCurrentLocal(id);
      songs.value = songs.value.filter(
        (s) => !(s.sourceId === LOCAL_SOURCE_ID && String(s.id) === id),
      );
    } catch (e) {
      console.error('[Local] 删除失败:', e);
      error.value = formatUserError(e, '删除本地音乐失败');
    }
  }

  async function clearAll() {
    if (songs.value.length === 0) return;
    try {
      await localLibraryDB.clear();
      getLocalSource()?.revokeAll();
      stopIfAnyLocal();
      songs.value = [];
    } catch (e) {
      console.error('[Local] 清空失败:', e);
      error.value = formatUserError(e, '清空本地音乐失败');
    }
  }

  function clearError() {
    error.value = '';
  }

  return {
    songs,
    filteredSongs,
    loading,
    importing,
    error,
    query,
    count,
    load,
    importFiles,
    removeSong,
    clearAll,
    clearError,
  };
});
