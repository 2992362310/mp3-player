// 音乐文件缓存管理器 - 使用LRU算法管理已播放音乐文件的缓存
export default class MusicCacheManager {
    constructor(maxSize = 20) {
        this.maxSize = maxSize; // 最大缓存数量
        this.cache = new Map(); // 使用Map来存储缓存，保证插入顺序
        this.db = null;
        this.initDB().then(() => {
            // 初始化时加载已缓存的文件信息
            this.loadCachedFiles();
        });
    }

    // 初始化IndexedDB数据库
    async initDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('当前浏览器不支持IndexedDB');
                reject('IndexedDB not supported');
                return;
            }

            const request = indexedDB.open('MusicCacheDB', 1);
            
            request.onerror = (event) => {
                console.error('无法打开IndexedDB', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // 创建对象存储空间
                if (!this.db.objectStoreNames.contains('musicFiles')) {
                    const objectStore = this.db.createObjectStore('musicFiles', { keyPath: 'id' });
                    objectStore.createIndex('url', 'url', { unique: true });
                    objectStore.createIndex('cachedAt', 'cachedAt', { unique: false });
                }
            };
        });
    }

    // 初始化时加载已缓存的文件信息
    async loadCachedFiles() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['musicFiles'], 'readonly');
            const objectStore = transaction.objectStore('musicFiles');
            
            const request = objectStore.getAll();
            
            request.onsuccess = (event) => {
                const files = event.target.result;
                // 按缓存时间排序，确保LRU顺序正确
                files.sort((a, b) => a.cachedAt - b.cachedAt);
                
                // 填充缓存Map
                files.forEach(file => {
                    this.cache.set(file.id, {
                        id: file.id,
                        url: file.url,
                        name: file.name,
                        cachedAt: file.cachedAt,
                        size: file.size
                    });
                });
                
                resolve(files);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 将音乐文件缓存到IndexedDB
    async cacheMusicFile(fileInfo, arrayBuffer) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['musicFiles'], 'readwrite');
            const objectStore = transaction.objectStore('musicFiles');
            
            const musicData = {
                id: fileInfo.cacheKey,
                url: fileInfo.url,
                name: fileInfo.name,
                arrayBuffer: arrayBuffer,
                cachedAt: Date.now(),
                size: arrayBuffer.byteLength
            };
            
            const request = objectStore.put(musicData);
            
            request.onsuccess = () => {
                // 更新LRU记录
                this.cache.set(fileInfo.cacheKey, {
                    id: fileInfo.cacheKey,
                    url: fileInfo.url,
                    name: fileInfo.name,
                    cachedAt: Date.now(),
                    size: arrayBuffer.byteLength
                });
                
                // 如果超过最大缓存数，删除最久未使用的项
                if (this.cache.size > this.maxSize) {
                    const firstKey = this.cache.keys().next().value;
                    this.removeCachedFile(firstKey);
                }
                
                resolve(musicData);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 从缓存中获取音乐文件
    async getCachedMusicFile(cacheKey) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['musicFiles'], 'readonly');
            const objectStore = transaction.objectStore('musicFiles');
            
            const request = objectStore.get(cacheKey);
            
            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    // 更新LRU记录
                    const fileInfo = this.cache.get(cacheKey);
                    if (fileInfo) {
                        this.cache.delete(cacheKey);
                        this.cache.set(cacheKey, fileInfo);
                    }
                    resolve(result);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 检查文件是否已缓存
    async isFileCached(cacheKey) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['musicFiles'], 'readonly');
            const objectStore = transaction.objectStore('musicFiles');
            
            const request = objectStore.getKey(cacheKey);
            
            request.onsuccess = (event) => {
                resolve(event.target.result !== undefined);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 删除缓存的文件
    async removeCachedFile(cacheKey) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            // 从LRU记录中删除
            this.cache.delete(cacheKey);
            
            // 从数据库中删除
            const transaction = this.db.transaction(['musicFiles'], 'readwrite');
            const objectStore = transaction.objectStore('musicFiles');
            
            const request = objectStore.delete(cacheKey);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 获取缓存统计信息
    getCacheInfo() {
        const keys = Array.from(this.cache.keys());
        const totalSize = Array.from(this.cache.values())
            .reduce((sum, item) => sum + (item.size || 0), 0);
        
        return {
            count: this.cache.size,
            maxSize: this.maxSize,
            keys: keys,
            totalSize: totalSize
        };
    }

    // 清空所有缓存
    async clearCache() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            // 清空LRU记录
            this.cache.clear();
            
            // 清空数据库
            const transaction = this.db.transaction(['musicFiles'], 'readwrite');
            const objectStore = transaction.objectStore('musicFiles');
            
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 获取所有缓存项的元数据
    getAllCachedFiles() {
        return Array.from(this.cache.values());
    }
}