/**
 * 底部控制器模块
 * 负责管理底部控制器的所有功能，包括播放控制、展开/收起等
 */

class BottomControllerModule {
    constructor() {
        this.eventBus = new EventBus();
        this.isExpanded = false;
        this.uiComponents = new UIComponents(); // 初始化 UIComponents
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // 使用 UIComponents 获取底部控制器相关元素
        this.bottomController = this.uiComponents.get('.bottom-controller');
        this.expandBtn = this.uiComponents.get('.expand-btn');
        this.expandContent = this.uiComponents.get('.expand-content');
        
        // 获取播放控制相关元素
        this.playBtn = this.uiComponents.get('.play-btn');
        this.prevBtn = this.uiComponents.get('.prev-btn');
        this.nextBtn = this.uiComponents.get('.next-btn');
        this.volumeSlider = this.uiComponents.get('.volume-slider');
        this.progressContainer = this.uiComponents.get('.progress-container');
        this.progress = this.uiComponents.get('.progress');
        this.currentTimeDisplay = this.uiComponents.get('.current-time');
        this.totalTimeDisplay = this.uiComponents.get('.total-time');
        this.trackTitle = this.uiComponents.get('.track-title');
        this.trackArtist = this.uiComponents.get('.track-artist');
        
        // 获取隐藏的音频元素
        this.audioPlayer = this.uiComponents.get('#audioPlayer');
        this.audioFile = this.uiComponents.get('#audioFile');
    }
    
    bindEvents() {
        // 展开/收起按钮事件
        if (this.expandBtn) {
            this.expandBtn.addEventListener('click', () => {
                this.toggleExpand();
            });
        }
        
        // 播放按钮事件
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => {
                this.togglePlay();
            });
        }
        
        // 上一首按钮事件
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.playPrev();
            });
        }
        
        // 下一首按钮事件
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.playNext();
            });
        }
        
        // 音量控制事件
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }
        
        // 进度条点击事件
        if (this.progressContainer) {
            this.progressContainer.addEventListener('click', (e) => {
                this.seekTo(e);
            });
        }
        
        // 文件选择事件
        if (this.audioFile) {
            this.audioFile.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }
        
        // 拖拽上传事件
        this.setupDragAndDrop();
        
        // 音频播放事件
        if (this.audioPlayer) {
            this.audioPlayer.addEventListener('timeupdate', () => {
                this.updateProgress();
            });
            
            this.audioPlayer.addEventListener('loadedmetadata', () => {
                this.updateDuration();
            });
            
            this.audioPlayer.addEventListener('ended', () => {
                this.handleAudioEnded();
            });
        }
    }
    
    // 切换展开/收起状态
    toggleExpand() {
        if (!this.bottomController || !this.expandBtn || !this.expandContent) return;
        
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            // 展开控制器
            this.bottomController.classList.add('expanded');
            this.expandBtn.textContent = '⬇'; // 改为向下箭头
            this.expandContent.style.display = 'block'; // 显示展开内容
        } else {
            // 收起控制器
            this.bottomController.classList.remove('expanded');
            this.expandBtn.textContent = '⬆'; // 改为向上箭头
            this.expandContent.style.display = 'none'; // 隐藏展开内容
        }
    }
    
    // 切换播放状态
    togglePlay() {
        if (!this.audioPlayer) return;
        
        if (this.audioPlayer.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
    
    // 播放音频
    play() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.play()
            .then(() => {
                this.updatePlayButtonState(true);
                this.eventBus.emit('playbackStarted', { isPlaying: true });
            })
            .catch(error => {
                console.error('播放失败:', error);
            });
    }
    
    // 暂停音频
    pause() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.pause();
        this.updatePlayButtonState(false);
        this.eventBus.emit('playbackPaused');
    }
    
    // 停止音频
    stop() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.updatePlayButtonState(false);
        this.eventBus.emit('playbackStopped');
    }
    
    // 播放上一首
    playPrev() {
        // TODO: 实现播放上一首逻辑
        this.eventBus.emit('playPrevious');
    }
    
    // 播放下一首
    playNext() {
        // TODO: 实现播放下一首逻辑
        this.eventBus.emit('playNext');
    }
    
    // 设置音量
    setVolume(value) {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.volume = value / 100;
        this.eventBus.emit('volumeChanged', { volume: value });
    }
    
    // 跳转到指定位置
    seekTo(e) {
        if (!this.audioPlayer || !this.progressContainer) return;
        
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.audioPlayer.currentTime = pos * this.audioPlayer.duration;
    }
    
    // 处理文件选择
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file || !this.audioPlayer) return;
        
        const fileURL = URL.createObjectURL(file);
        this.audioPlayer.src = fileURL;
        this.trackTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
        this.trackArtist.textContent = '本地文件';
        
        this.play();
    }
    
    // 设置拖拽上传功能
    setupDragAndDrop() {
        if (!this.bottomController) return;
        
        // 阻止默认拖拽行为
        this.bottomController.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        // 处理文件拖拽
        this.bottomController.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // 创建一个新的文件输入事件来处理文件
                const file = files[0];
                if (file.type.startsWith('audio/')) {
                    const fileURL = URL.createObjectURL(file);
                    if (this.audioPlayer) {
                        this.audioPlayer.src = fileURL;
                        this.trackTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
                        this.trackArtist.textContent = '本地文件';
                        this.play();
                    }
                }
            }
        });
    }
    
    // 更新播放按钮状态
    updatePlayButtonState(isPlaying) {
        if (!this.playBtn) return;
        
        if (isPlaying) {
            this.playBtn.textContent = '⏸';
        } else {
            this.playBtn.textContent = '▶';
        }
    }
    
    // 更新进度条
    updateProgress() {
        if (!this.audioPlayer || !this.progress || !this.currentTimeDisplay) return;
        
        const currentTime = this.audioPlayer.currentTime;
        const duration = this.audioPlayer.duration || 0;
        const percent = duration ? (currentTime / duration) * 100 : 0;
        
        this.progress.style.width = percent + '%';
        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        
        this.eventBus.emit('progressUpdated', { percent, currentTime, duration });
    }
    
    // 更新总时长
    updateDuration() {
        if (!this.audioPlayer || !this.totalTimeDisplay) return;
        
        const duration = this.audioPlayer.duration || 0;
        this.totalTimeDisplay.textContent = this.formatTime(duration);
        
        this.eventBus.emit('durationUpdated', { duration: this.formatTime(duration) });
    }
    
    // 处理音频播放结束
    handleAudioEnded() {
        this.updatePlayButtonState(false);
        this.eventBus.emit('audioEnded');
    }
    
    // 格式化时间显示
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    
    // 更新当前播放曲目信息
    updateTrackInfo(title, artist) {
        if (this.trackTitle) {
            this.trackTitle.textContent = title || '暂无播放';
        }
        if (this.trackArtist) {
            this.trackArtist.textContent = artist || '';
        }
    }
    
    // 检查模块是否已正确初始化
    isInitialized() {
        return !!this.bottomController;
    }
}

// 将BottomControllerModule挂载到window对象上
window.BottomControllerModule = BottomControllerModule;