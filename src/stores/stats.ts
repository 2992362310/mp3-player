import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song } from '../core/sources/types';
import storage from '../core/storage';

interface SongPlayRecord {
  key: string;
  title: string;
  artist: string;
  count: number;
  totalSeconds: number;
  lastPlayedAt: number;
}

interface ArtistPlayRecord {
  name: string;
  count: number;
  totalSeconds: number;
}

interface StatsData {
  totalPlays: number;
  totalSeconds: number;
  songs: Record<string, SongPlayRecord>;
  artists: Record<string, ArtistPlayRecord>;
  dailySeconds: Record<string, number>; // YYYY-MM-DD -> seconds
  startedAt: number;
}

function emptyStats(): StatsData {
  return {
    totalPlays: 0,
    totalSeconds: 0,
    songs: {},
    artists: {},
    dailySeconds: {},
    startedAt: Date.now(),
  };
}

function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useStatsStore = defineStore('stats', () => {
  const data = ref<StatsData>(loadStats());

  function loadStats(): StatsData {
    const raw = storage.get<StatsData | null>('listeningStats', null);
    if (!raw || typeof raw !== 'object') return emptyStats();
    return {
      totalPlays: raw.totalPlays || 0,
      totalSeconds: raw.totalSeconds || 0,
      songs: raw.songs || {},
      artists: raw.artists || {},
      dailySeconds: raw.dailySeconds || {},
      startedAt: raw.startedAt || Date.now(),
    };
  }

  function persist() {
    storage.set('listeningStats', data.value);
  }

  /** 记录一次播放（开始播一首歌时调用） */
  function recordPlay(song: Song) {
    const songKey = `${song.sourceId}-${song.id}`;
    const artistName = (song.artist || '未知歌手').trim();
    const now = Date.now();

    data.value.totalPlays++;

    const existing = data.value.songs[songKey];
    if (existing) {
      existing.count++;
      existing.lastPlayedAt = now;
    } else {
      data.value.songs[songKey] = {
        key: songKey,
        title: song.title || '未知歌曲',
        artist: artistName,
        count: 1,
        totalSeconds: 0,
        lastPlayedAt: now,
      };
    }

    const artistRec = data.value.artists[artistName];
    if (artistRec) {
      artistRec.count++;
    } else {
      data.value.artists[artistName] = { name: artistName, count: 1, totalSeconds: 0 };
    }

    persist();
  }

  /** 记录听歌时长（定期调用或暂停/切歌时结算） */
  function recordListenTime(song: Song | null, seconds: number) {
    if (!song || seconds <= 0) return;
    const songKey = `${song.sourceId}-${song.id}`;
    const artistName = (song.artist || '未知歌手').trim();
    const dk = dateKey();

    data.value.totalSeconds += seconds;

    const songRec = data.value.songs[songKey];
    if (songRec) songRec.totalSeconds += seconds;

    const artistRec = data.value.artists[artistName];
    if (artistRec) artistRec.totalSeconds += seconds;

    data.value.dailySeconds[dk] = (data.value.dailySeconds[dk] || 0) + seconds;

    // 只保留最近 90 天的每日数据
    const keys = Object.keys(data.value.dailySeconds).sort();
    while (keys.length > 90) {
      const old = keys.shift();
      if (old) delete data.value.dailySeconds[old];
    }

    persist();
  }

  const totalPlays = computed(() => data.value.totalPlays);
  const totalHours = computed(() => Math.round(data.value.totalSeconds / 3600 * 10) / 10);
  const totalMinutes = computed(() => Math.round(data.value.totalSeconds / 60));

  const topSongs = computed(() =>
    Object.values(data.value.songs)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  );

  const topArtists = computed(() =>
    Object.values(data.value.artists)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  );

  /** 最近 7 天听歌时长 */
  const weeklyChart = computed(() => {
    const days: { day: string; label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = dateKey(d);
      const labels = ['日', '一', '二', '三', '四', '五', '六'];
      days.push({
        day: dk,
        label: labels[d.getDay()],
        minutes: Math.round((data.value.dailySeconds[dk] || 0) / 60),
      });
    }
    return days;
  });

  const uniqueSongs = computed(() => Object.keys(data.value.songs).length);
  const uniqueArtists = computed(() => Object.keys(data.value.artists).length);

  return {
    totalPlays,
    totalHours,
    totalMinutes,
    topSongs,
    topArtists,
    weeklyChart,
    uniqueSongs,
    uniqueArtists,
    recordPlay,
    recordListenTime,
  };
});
