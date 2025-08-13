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
        
        // 注意：不再自动调用init()，而是在index.html中手动调用
    }
    
    async init() {
        try {
            // 直接获取音频播放器元素
            this.audioPlayer = document.getElementById('audioPlayer');
            
            // 绑定事件监听器
            this.bindEvents();
        } catch (error) {
            console.error('初始化音频播放器时出错:', error);
        }
    }
    
    bindEvents() {
        // 获取所有相关元素
        const audioFile = document.getElementById('audioFile');
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        // 确保所有元素都存在
        if (!this.audioPlayer || !audioFile) {
            console.warn('部分UI元素未找到，跳过事件绑定');
            return;
        }
        
        // 文件选择事件
        audioFile.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // 拖拽上传事件
        this.setupDragAndDrop();
        
        // 播放按钮事件
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.play();
            });
        }
        
        // 暂停按钮事件
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pause();
            });
        }
        
        // 停止按钮事件
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stop();
            });
        }
        
        // 更新进度条
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        // 音频加载完成后更新总时长
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });
        
        // 音频播放结束事件
        this.audioPlayer.addEventListener('ended', () => {
            this.eventBus.emit('audioEnded');
        });
    }
    
    // 设置拖拽上传功能
    setupDragAndDrop() {
        const playerContainer = document.querySelector('.player-container');
        
        if (!playerContainer) {
            console.warn('未找到播放器容器，跳过拖拽上传功能设置');
            return;
        }
        
        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            playerContainer.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // 高亮拖拽区域
        ['dragenter', 'dragover'].forEach(eventName => {
            playerContainer.addEventListener(eventName, () => {
                playerContainer.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            playerContainer.addEventListener(eventName, () => {
                playerContainer.classList.remove('dragover');
            }, false);
        });
        
        // 处理文件拖拽
        playerContainer.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.localResourceManager.handleFileSelect(files);
            
            // 如果有文件，播放第一个文件
            if (files.length > 0) {
                const localFiles = this.localResourceManager.getFiles();
                if (localFiles.length > 0) {
                    this.playFile(localFiles[localFiles.length - 1]);
                }
            }
        }, false);
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.localResourceManager.handleFileSelect(files);
        
        // 如果有文件，播放第一个文件
        if (files.length > 0) {
            const localFiles = this.localResourceManager.getFiles();
            if (localFiles.length > 0) {
                this.playFile(localFiles[localFiles.length - 1]);
            }
        }
    }
    
    // 播放指定文件
    playFile(file) {
        if (file && file.url && this.audioPlayer) {
            this.audioPlayer.src = file.url;
            this.eventBus.emit('playbackStarted', { isPlaying: true });
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
            this.eventBus.emit('playbackPaused');
        }
    }
    
    stop() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            this.eventBus.emit('playbackStopped');
        }
    }
    
    updateProgress() {
        if (!this.audioPlayer) return;
        
        const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this.eventBus.emit('progressUpdated', { percent });
        
        // 更新时间显示
        const currentTime = this.formatTime(this.audioPlayer.currentTime);
        const duration = this.audioPlayer.duration ? this.formatTime(this.audioPlayer.duration) : null;
        this.eventBus.emit('timeUpdated', { currentTime, duration });
    }
    
    updateDuration() {
        if (this.audioPlayer && this.audioPlayer.duration) {
            const duration = this.formatTime(this.audioPlayer.duration);
            this.eventBus.emit('durationUpdated', { duration });
        }
    }
    
    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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