/**
 * 本地音乐库 IndexedDB 封装
 * 持久化音频 Blob 与精简元数据
 */

const DB_NAME = 'moyun_local';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

export interface LocalTrackMeta {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  mimeType: string;
  fileName: string;
  size: number;
  addedAt: number;
  /** 配对的 LRC 原文 */
  lyricText?: string;
  /** 去重用：文件指纹 */
  fingerprint?: string;
}

export interface LocalTrackRecord extends LocalTrackMeta {
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('打开本地音乐库失败'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 操作失败'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 事务失败'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB 事务中止'));
  });
}

/** 从文件名粗解析标题与歌手：支持「歌手 - 歌名」 */
export function parseFileName(fileName: string): { title: string; artist: string } {
  const base = fileName.replace(/\.[^.]+$/, '').trim() || fileName;
  const parts = base.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (artist && title) return { title, artist };
  }
  return { title: base, artist: '本地文件' };
}

/** 用临时 Audio 探测时长（秒） */
export function probeDuration(blob: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    let settled = false;

    const finish = (duration?: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      audio.removeAttribute('src');
      audio.load();
      resolve(duration);
    };

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      finish(Number.isFinite(d) && d > 0 ? d : undefined);
    };
    audio.onerror = () => finish(undefined);
    setTimeout(() => finish(undefined), 8000);
    audio.src = url;
  });
}

export function createTrackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function fileFingerprint(file: File, pathHint?: string): string {
  return `${pathHint || file.name}|${file.size}|${file.lastModified}`;
}

export async function buildTrackFromFile(
  file: File,
  options?: { lyricText?: string; pathHint?: string; album?: string },
): Promise<LocalTrackRecord> {
  const { title, artist } = parseFileName(file.name);
  const duration = await probeDuration(file);
  return {
    id: createTrackId(),
    title,
    artist,
    album: options?.album,
    duration,
    mimeType: file.type || 'audio/mpeg',
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    blob: file,
    lyricText: options?.lyricText,
    fingerprint: fileFingerprint(file, options?.pathHint),
  };
}

export const localLibraryDB = {
  async listMeta(): Promise<LocalTrackMeta[]> {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const rows = await requestToPromise(store.getAll() as IDBRequest<LocalTrackRecord[]>);
      await transactionDone(tx);
      return (rows || [])
        .map(({ blob: _blob, ...meta }) => meta)
        .sort((a, b) => b.addedAt - a.addedAt);
    } finally {
      db.close();
    }
  },

  async getBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const row = await requestToPromise(store.get(id) as IDBRequest<LocalTrackRecord | undefined>);
      await transactionDone(tx);
      return row?.blob ?? null;
    } finally {
      db.close();
    }
  },

  async getMeta(id: string): Promise<LocalTrackMeta | null> {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const row = await requestToPromise(store.get(id) as IDBRequest<LocalTrackRecord | undefined>);
      await transactionDone(tx);
      if (!row) return null;
      const { blob: _blob, ...meta } = row;
      return meta;
    } finally {
      db.close();
    }
  },

  async putMany(tracks: LocalTrackRecord[]): Promise<void> {
    if (tracks.length === 0) return;
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const track of tracks) {
        store.put(track);
      }
      await transactionDone(tx);
    } finally {
      db.close();
    }
  },

  async remove(id: string): Promise<void> {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      await transactionDone(tx);
    } finally {
      db.close();
    }
  },

  async clear(): Promise<void> {
    const db = await openDB();
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      await transactionDone(tx);
    } finally {
      db.close();
    }
  },

  async findIdByFingerprint(fingerprint: string): Promise<string | null> {
    const metas = await this.listMeta();
    const hit = metas.find((m) => m.fingerprint === fingerprint);
    return hit?.id ?? null;
  },

  async getLyricText(id: string): Promise<string | null> {
    const meta = await this.getMeta(id);
    return meta?.lyricText || null;
  },
};

export default localLibraryDB;
