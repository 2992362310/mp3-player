class AudioPlayer {
    constructor() {
        // 检查依赖项是否存在
        if (typeof EventBus === 'undefined') {
            throw new Error('EventBus is not defined. Please load EventBus.js before AudioPlayer.js');
        }
        
        if (typeof LocalResourceManager === 'undefined') {
            throw new Error('LocalResourceManager is not defined. Please load LocalResourceManager.js before AudioPlayer.js');
        }
        
        // 初始化事件总线
        this.eventBus = new EventBus();
        
        this.audioPlayer = null;
        
        // 初始化本地资源管理器
        this.localResourceManager = new LocalResourceManager();
    }
    
    async init() {
        try {
            // 直接获取音频播放器元素
            this.audioPlayer = document.getElementById('audioPlayer');
        } catch (error) {
            console.error('初始化音频播放器时出错:', error);
        }
    }
    
    // 播放指定文件
    playFile(file) {
        if (file && file.url && this.audioPlayer) {
            this.audioPlayer.src = file.url;
            this.play();
        }
    }
    
    play() {
        if (this.audioPlayer) {
            this.audioPlayer.play().catch(error => {
                console.error('播放失败:', error);
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
    
    // 添加事件监听器方法
    on(eventName, callback) {
        this.eventBus.on(eventName, callback);
    }
    
    // 移除事件监听器方法
    off(eventName, callback) {
        this.eventBus.off(eventName, callback);
    }
}

// 将AudioPlayer挂载到window对象上
window.AudioPlayer = AudioPlayer;

// 导出 AudioPlayer 类
export { AudioPlayer };