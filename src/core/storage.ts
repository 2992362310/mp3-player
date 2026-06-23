/**
 * 本地存储统一封装
 * 提供类型安全的 localStorage 读写，支持 JSON 序列化
 */

const PREFIX = 'moyun_';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`[Storage] 保存 ${key} 失败:`, e);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    });
  },
};

export default storage;
