import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Song } from '../core/sources/types';
import storage from '../core/storage';
import { songKey } from '../core/song';

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
  /** YYYY-MM-DD -> 秒 */
  dailySeconds: Record<string, number>;
  startedAt: number;
}

const STORAGE_KEY = 'listeningStats';
/** 每日数据保留天数 */
const DAILY_RETENTION_DAYS = 90;
/** 榜单展示条数 */
const TOP_LIMIT = 5;
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

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

function loadStats(): StatsData {
  const raw = storage.get<StatsData | null>(STORAGE_KEY, null);
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

function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function artistNameOf(song: Song): string {
  return (song.artist || '未知歌手').trim();
}

export const useStatsStore = defineStore('stats', () => {
  const data = ref<StatsData>(loadStats());

  function persist() {
    storage.set(STORAGE_KEY, data.value);
  }

  /** 记录一次播放（一首歌开始播放时调用） */
  function recordPlay(song: Song) {
    const key = songKey(song);
    const artist = artistNameOf(song);
    const now = Date.now();

    data.value.totalPlays++;

    const songRec = data.value.songs[key];
    if (songRec) {
      songRec.count++;
      songRec.lastPlayedAt = now;
    } else {
      data.value.songs[key] = {
        key,
        title: song.title || '未知歌曲',
        artist,
        count: 1,
        totalSeconds: 0,
        lastPlayedAt: now,
      };
    }

    const artistRec = data.value.artists[artist];
    if (artistRec) {
      artistRec.count++;
    } else {
      data.value.artists[artist] = { name: artist, count: 1, totalSeconds: 0 };
    }

    persist();
  }

  /** 记录听歌时长（每 60 秒或暂停/切歌时结算） */
  function recordListenTime(song: Song | null, seconds: number) {
    if (!song || seconds <= 0) return;
    const key = songKey(song);
    const artist = artistNameOf(song);
    const today = dateKey();

    data.value.totalSeconds += seconds;
    const songRec = data.value.songs[key];
    if (songRec) songRec.totalSeconds += seconds;
    const artistRec = data.value.artists[artist];
    if (artistRec) artistRec.totalSeconds += seconds;
    data.value.dailySeconds[today] = (data.value.dailySeconds[today] || 0) + seconds;

    // 只保留最近 N 天的每日数据
    const days = Object.keys(data.value.dailySeconds);
    if (days.length > DAILY_RETENTION_DAYS) {
      days.sort().slice(0, days.length - DAILY_RETENTION_DAYS).forEach((day) => {
        delete data.value.dailySeconds[day];
      });
    }

    persist();
  }

  const totalPlays = computed(() => data.value.totalPlays);
  const totalHours = computed(() => Math.round((data.value.totalSeconds / 3600) * 10) / 10);
  const totalMinutes = computed(() => Math.round(data.value.totalSeconds / 60));

  const topSongs = computed(() =>
    Object.values(data.value.songs)
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_LIMIT),
  );

  const topArtists = computed(() =>
    Object.values(data.value.artists)
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_LIMIT),
  );

  /** 最近 7 天听歌时长（分钟） */
  const weeklyChart = computed(() => {
    const days: Array<{ day: string; label: string; minutes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      days.push({
        day: key,
        label: WEEKDAY_LABELS[d.getDay()],
        minutes: Math.round((data.value.dailySeconds[key] || 0) / 60),
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
