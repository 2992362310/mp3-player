import { eventBus } from '../common/index.js';
import LocalResourceManager from '../../modules/local-music/LocalResourceManager.js';
import MusicCacheManager from '../storage/MusicCacheManager.js';

class AudioPlayer {
    constructor() {
        // 初始化事件总线
        this.eventBus = eventBus;
        
        this.audioPlayer = null;
        
        // 初始化本地资源管理器
        this.localResourceManager = new LocalResourceManager();
        
        // 初始化音乐缓存管理器
        this.musicCacheManager = new MusicCacheManager(20);
        
        // 记录当前播放的文件
        this.currentPlayingFile = null;
        
        // 用于存储当前正在下载的文件的Promise，避免重复下载
        this.pendingDownloads = new Map();
    }
    
    async init() {
        try {
            // 直接获取音频播放器元素
            this.audioPlayer = document.getElementById('audioPlayer');
            
            // 监听播放事件，用于缓存管理
            this.audioPlayer.addEventListener('play', () => {
                if (this.currentPlayingFile) {
                    // 将播放的文件加入缓存
                    this.addToCache(this.currentPlayingFile);
                }
            });
            
            // 发出事件表示音频播放器已初始化
            this.eventBus.emit('audioPlayerInitialized', { 
                cacheInfo: this.getCacheInfo() 
            });
        } catch (error) {
            // 静默处理错误
            this.eventBus.emit('audioPlayerError', { error });
        }
    }
    
    // 下载音乐文件并缓存
    async downloadAndCacheMusic(file) {
        // 如果已经在下载该文件，则返回现有的Promise
        if (this.pendingDownloads.has(file.url)) {
            return this.pendingDownloads.get(file.url);
        }
        
        // 创建新的下载Promise
        const downloadPromise = new Promise(async (resolve, reject) => {
            try {
                // 下载音乐文件
                const response = await fetch(file.url);
                if (!response.ok) {
                    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                
                // 生成缓存键
                const cacheKey = this.generateCacheKey(file);
                
                // 缓存文件
                await this.musicCacheManager.cacheMusicFile({
                    cacheKey: cacheKey,
                    url: file.url,
                    name: file.name
                }, arrayBuffer);
                
                // 清除pending状态
                this.pendingDownloads.delete(file.url);
                
                this.eventBus.emit('musicCached', { file, cacheKey });
                resolve({ arrayBuffer, cacheKey });
            } catch (error) {
                // 清除pending状态
                this.pendingDownloads.delete(file.url);
                reject(error);
            }
        });
        
        // 存储Promise以避免重复下载
        this.pendingDownloads.set(file.url, downloadPromise);
        
        return downloadPromise;
    }
    
    // 从缓存中获取音乐文件并创建Blob URL
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
    
    // 添加文件到缓存
    async addToCache(file) {
        if (file && file.url) {
            // 只有当文件是网络资源时才缓存
            if (file.url.startsWith('http')) {
                try {
                    // 检查是否已经在缓存中
                    const cacheKey = this.generateCacheKey(file);
                    const isCached = await this.musicCacheManager.isFileCached(cacheKey);
                    
                    if (!isCached) {
                        // 下载并缓存文件
                        await this.downloadAndCacheMusic(file);
                    }
                } catch (error) {
                    console.error('缓存音乐文件时出错:', error);
                }
            }
        }
    }
    
    // 生成缓存键
    generateCacheKey(file) {
        // 使用文件URL作为缓存键
        return file.url;
    }
    
    // 检查文件是否已缓存
    async isFileCached(file) {
        const cacheKey = this.generateCacheKey(file);
        return await this.musicCacheManager.isFileCached(cacheKey);
    }
    
    // 获取所有已缓存的文件信息
    getCachedFiles() {
        return this.musicCacheManager.getAllCachedFiles();
    }
    
    // 播放指定文件
    async playFile(file) {
        if (file && file.url && this.audioPlayer) {
            // 保存当前播放文件
            this.currentPlayingFile = file;
            
            try {
                // 检查是否有缓存的版本
                const cachedUrl = await this.getCachedMusicUrl(file);
                if (cachedUrl) {
                    this.audioPlayer.src = cachedUrl;
                    this.eventBus.emit('playCachedMusic', { file, cachedUrl });
                } else {
                    // 检查是否是网络资源且需要缓存
                    if (file.url.startsWith('http')) {
                        // 先播放原始链接，同时在后台缓存
                        this.audioPlayer.src = file.url;
                        this.eventBus.emit('playOriginalMusic', { file });
                        
                        // 在后台下载并缓存文件
                        this.addToCache(file).catch(error => {
                            console.error('后台缓存音乐时出错:', error);
                        });
                    } else {
                        // 本地文件直接播放
                        this.audioPlayer.src = file.url;
                        this.eventBus.emit('playLocalMusic', { file });
                    }
                }
            } catch (error) {
                console.error('播放音乐时出错:', error);
                // 出错时直接播放原始链接
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
    
    // 设置音量
    setVolume(volume) {
        if (this.audioPlayer) {
            // 确保音量值在0-1之间
            this.audioPlayer.volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    // 跳转到指定时间
    seekTo(time) {
        if (this.audioPlayer) {
            this.audioPlayer.currentTime = time;
        }
    }
    
    // 获取当前播放时间
    getCurrentTime() {
        return this.audioPlayer ? this.audioPlayer.currentTime : 0;
    }
    
    // 获取音频总时长
    getDuration() {
        return this.audioPlayer ? this.audioPlayer.duration : 0;
    }
    
    // 检查音频是否正在播放
    isPlaying() {
        return this.audioPlayer ? !this.audioPlayer.paused : false;
    }
    
    // 获取当前缓存信息
    getCacheInfo() {
        return this.musicCacheManager.getCacheInfo();
    }
    
    // 清空缓存
    async clearCache() {
        return await this.musicCacheManager.clearCache();
    }
    
    // 添加事件监听器方法
    on(eventName, callback) {
        this.eventBus.on(eventName, callback);
    }
    
    // 移除事件监听器方法
    off(eventName, callback) {
        this.eventBus.off(eventName, callback);
    }
}

// 导出 AudioPlayer 类
export { AudioPlayer };
export default AudioPlayer;