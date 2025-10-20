import { eventBus } from '../common/index.js';
import LocalResourceManager from '../../modules/local-music/LocalResourceManager.js';
import MusicCacheManager from '../storage/MusicCacheManager.js';

class AudioPlayer {
    constructor() {
        this.eventBus = eventBus;
        this.audioPlayer = null;
        this.localResourceManager = new LocalResourceManager();
        this.musicCacheManager = new MusicCacheManager(20);
        this.currentPlayingFile = null;
        this.pendingDownloads = new Map();
    }
    
    async init() {
        try {
            this.audioPlayer = document.getElementById('audioPlayer');
            this.audioPlayer.addEventListener('play', () => {
                if (this.currentPlayingFile) {
                    this.addToCache(this.currentPlayingFile);
                }
            });
            this.eventBus.emit('audioPlayerInitialized', { 
                cacheInfo: this.getCacheInfo() 
            });
        } catch (error) {
            this.eventBus.emit('audioPlayerError', { error });
        }
    }
    
    async downloadAndCacheMusic(file) {
        if (this.pendingDownloads.has(file.url)) {
            return this.pendingDownloads.get(file.url);
        }
        
        const downloadPromise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(file.url);
                if (!response.ok) {
                    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const cacheKey = this.generateCacheKey(file);
                
                await this.musicCacheManager.cacheMusicFile({
                    cacheKey: cacheKey,
                    url: file.url,
                    name: file.name
                }, arrayBuffer);
                
                this.pendingDownloads.delete(file.url);
                this.eventBus.emit('musicCached', { file, cacheKey });
                resolve({ arrayBuffer, cacheKey });
            } catch (error) {
                this.pendingDownloads.delete(file.url);
                reject(error);
            }
        });
        
        this.pendingDownloads.set(file.url, downloadPromise);
        return downloadPromise;
    }
    
    async getCachedMusicUrl(file) {
        const cacheKey = this.generateCacheKey(file);
        const isCached = await this.musicCacheManager.isFileCached(cacheKey);
        
        if (isCached) {
            try {
                const cachedData = await this.musicCacheManager.getCachedMusicFile(cacheKey);
                if (cachedData && cachedData.arrayBuffer) {
                    const blob = new Blob([cachedData.arrayBuffer]);
                    return URL.createObjectURL(blob);
                }
            } catch (error) {
                console.error('从缓存中获取音乐文件时出错:', error);
            }
        }
        
        return null;
    }
    
    async addToCache(file) {
        if (file && file.url && file.url.startsWith('http')) {
            try {
                const cacheKey = this.generateCacheKey(file);
                const isCached = await this.musicCacheManager.isFileCached(cacheKey);
                
                if (!isCached) {
                    await this.downloadAndCacheMusic(file);
                }
            } catch (error) {
                console.error('缓存音乐文件时出错:', error);
            }
        }
    }
    
    generateCacheKey(file) {
        return file.url;
    }
    
    async isFileCached(file) {
        const cacheKey = this.generateCacheKey(file);
        return await this.musicCacheManager.isFileCached(cacheKey);
    }
    
    getCachedFiles() {
        return this.musicCacheManager.getAllCachedFiles();
    }
    
    async playFile(file) {
        if (file && file.url && this.audioPlayer) {
            this.currentPlayingFile = file;
            
            try {
                const cachedUrl = await this.getCachedMusicUrl(file);
                if (cachedUrl) {
                    this.audioPlayer.src = cachedUrl;
                    this.eventBus.emit('playCachedMusic', { file, cachedUrl });
                } else {
                    if (file.url.startsWith('http')) {
                        this.audioPlayer.src = file.url;
                        this.eventBus.emit('playOriginalMusic', { file });
                        this.addToCache(file).catch(error => {
                            console.error('后台缓存音乐时出错:', error);
                        });
                    } else {
                        this.audioPlayer.src = file.url;
                        this.eventBus.emit('playLocalMusic', { file });
                    }
                }
            } catch (error) {
                console.error('播放音乐时出错:', error);
                this.audioPlayer.src = file.url;
                this.eventBus.emit('playOriginalMusic', { file });
            }
            
            this.play();
        }
    }
    
    play() {
        if (this.audioPlayer) {
            this.audioPlayer.play().catch(error => {
                this.eventBus.emit('playbackError', { error });
            });
        }
    }
    
    pause() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
    }
    
    stop() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
    }
    
    setVolume(volume) {
        if (this.audioPlayer) {
            this.audioPlayer.volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    seekTo(time) {
        if (this.audioPlayer) {
            this.audioPlayer.currentTime = time;
        }
    }
    
    getCurrentTime() {
        return this.audioPlayer ? this.audioPlayer.currentTime : 0;
    }
    
    getDuration() {
        return this.audioPlayer ? this.audioPlayer.duration : 0;
    }
    
    isPlaying() {
        return this.audioPlayer ? !this.audioPlayer.paused : false;
    }
    
    getCacheInfo() {
        return this.musicCacheManager.getCacheInfo();
    }
    
    async clearCache() {
        return await this.musicCacheManager.clearCache();
    }
    
    on(eventName, callback) {
        this.eventBus.on(eventName, callback);
    }
    
    off(eventName, callback) {
        this.eventBus.off(eventName, callback);
    }
}

export { AudioPlayer };
export default AudioPlayer;