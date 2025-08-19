import { eventBus, DOMManager } from '../../core/common/index.js';

/**
 * 底部控制器模块
 * 负责管理底部控制器的所有功能，包括播放控制、展开/收起等
 */

export default class BottomControllerModule {
    constructor() {
        // 使用全局EventBus实例
        this.eventBus = eventBus;
        this.audioPlayer = null;
        this.playlist = []; // 播放列表
        this.currentTrackIndex = -1; // 当前播放曲目索引
        this.init();
    }

    init() {
        this.isExpanded = false;
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // 使用 DOMManager 获取底部控制器相关元素
        this.bottomController = DOMManager.querySelector('.bottom-controller');
        this.expandBtn = DOMManager.querySelector('.expand-btn');
        this.expandContent = DOMManager.querySelector('.expand-content');
        
        // 获取播放控制相关元素
        this.playBtn = DOMManager.querySelector('.play-btn');
        this.prevBtn = DOMManager.querySelector('.prev-btn');
        this.nextBtn = DOMManager.querySelector('.next-btn');
        this.volumeSlider = DOMManager.querySelector('.volume-slider');
        this.progressContainer = DOMManager.querySelector('.progress-container');
        this.progress = DOMManager.querySelector('.progress');
        this.currentTimeDisplay = DOMManager.querySelector('.current-time');
        this.totalTimeDisplay = DOMManager.querySelector('.total-time');
        this.trackTitle = DOMManager.querySelector('.track-title');
        this.trackArtist = DOMManager.querySelector('.track-artist');
        
        // 获取播放列表相关元素
        this.playlistContainer = DOMManager.querySelector('.playlist-items');
        this.clearPlaylistBtn = DOMManager.querySelector('.clear-playlist-btn');
        
        // 获取隐藏的音频元素
        this.audioPlayer = DOMManager.querySelector('#audioPlayer');
        this.audioFile = DOMManager.querySelector('#audioFile');
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
        
        // 清空播放列表按钮事件
        if (this.clearPlaylistBtn) {
            this.clearPlaylistBtn.addEventListener('click', () => {
                this.clearPlaylist();
            });
        }
        
        // 监听本地音乐扫描完成事件
        this.eventBus.on('localMusicScanned', (data) => {
            console.log('底部控制器接收到本地音乐扫描完成事件:', data);
            // 可以在这里处理本地音乐扫描完成后的逻辑
            // 例如更新播放列表等
        });
        
        // 监听本地音乐播放事件
        this.eventBus.on('playLocalFile', (data) => {
            console.log('接收到playLocalFile事件:', data);
            if (data && data.file) {
                this.addToPlaylist({
                    id: data.file.path || data.file.name,
                    title: data.file.displayName || data.file.name.replace(/\.[^/.]+$/, ""),
                    artist: data.file.artist || '未知艺术家',
                    url: data.file.url || URL.createObjectURL(data.file),
                    file: data.file
                });
            } else {
                console.log('playLocalFile事件数据无效:', data);
            }
        });
        
        // 监听在线音乐播放事件
        this.eventBus.on('playOnlineSong', (data) => {
            console.log('接收到playOnlineSong事件:', data);
            if (data && data.url) {
                this.addToPlaylist({
                    id: data.songId,
                    title: data.title || '未知歌曲',
                    artist: data.artist || '未知艺术家',
                    url: data.url,
                    source: data.source
                });
            } else {
                console.log('playOnlineSong事件数据无效:', data);
            }
        });
        
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
        
        // 如果没有曲目在播放且播放列表不为空，播放第一首
        if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
            this.currentTrackIndex = 0;
            this.loadTrack(this.currentTrackIndex);
        }
        
        // 只有在有曲目时才播放
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
            this.audioPlayer.play()
                .then(() => {
                    this.updatePlayButtonState(true);
                    this.eventBus.emit('playbackStarted', { isPlaying: true });
                })
                .catch(error => {
                    console.error('播放失败:', error);
                });
        }
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
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.currentTrackIndex);
        this.play();
    }
    
    // 播放下一首
    playNext() {
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(this.currentTrackIndex);
        this.play();
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
        
        // 添加到播放列表而不是直接播放
        this.addToPlaylist({
            id: file.path || file.name,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: '本地文件',
            url: URL.createObjectURL(file),
            file: file
        });
    }
    
    // 播放本地文件
    playLocalFile(file) {
        if (!file || !this.audioPlayer) return;
        
        // 添加到播放列表而不是直接播放
        this.addToPlaylist({
            id: file.path || file.name,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: '本地文件',
            url: URL.createObjectURL(file),
            file: file
        });
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
                    // 添加到播放列表而不是直接播放
                    this.addToPlaylist({
                        id: file.path || file.name,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        artist: '本地文件',
                        url: URL.createObjectURL(file),
                        file: file
                    });
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
    }
    
    // 更新总时长
    updateDuration() {
        if (!this.audioPlayer || !this.totalTimeDisplay) return;
        
        const duration = this.audioPlayer.duration || 0;
        this.totalTimeDisplay.textContent = this.formatTime(duration);
    }
    
    // 处理音频播放结束
    handleAudioEnded() {
        this.updatePlayButtonState(false);
        this.eventBus.emit('audioEnded');
        // 自动播放下一首
        this.playNext();
    }
    
    // 格式化时间显示
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    
    // 添加到播放列表
    addToPlaylist(track) {
        // 检查曲目是否已在播放列表中
        const existingIndex = this.playlist.findIndex(item => item.id === track.id);
        
        if (existingIndex >= 0) {
            // 如果已在播放列表中，直接播放该曲目
            this.currentTrackIndex = existingIndex;
            this.loadTrack(this.currentTrackIndex);
            this.play();
        } else {
            // 添加到播放列表
            this.playlist.push(track);
            this.currentTrackIndex = this.playlist.length - 1;
            this.loadTrack(this.currentTrackIndex);
            this.play();
        }
        
        // 更新播放列表显示
        this.updatePlaylistDisplay();
    }
    
    // 加载曲目
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length || !this.audioPlayer) return;
        
        const track = this.playlist[index];
        this.audioPlayer.src = track.url;
        this.updateTrackInfo(track.title, track.artist);
        
        // 更新播放列表高亮显示
        this.highlightCurrentTrack();
    }
    
    // 更新播放列表显示
    updatePlaylistDisplay() {
        if (!this.playlistContainer) return;
        
        // 清空现有列表
        this.playlistContainer.innerHTML = '';
        
        // 添加所有曲目
        this.playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.dataset.index = index;
            
            if (index === this.currentTrackIndex) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-artist">${track.artist}</div>
                </div>
                <div class="playlist-item-actions">
                    <button class="playlist-item-remove" data-index="${index}">×</button>
                </div>
            `;
            
            // 添加点击事件
            li.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，不播放曲目
                if (e.target.classList.contains('playlist-item-remove')) {
                    return;
                }
                
                this.currentTrackIndex = parseInt(li.dataset.index);
                this.loadTrack(this.currentTrackIndex);
                this.play();
            });
            
            this.playlistContainer.appendChild(li);
        });
        
        // 为删除按钮添加事件
        const removeButtons = this.playlistContainer.querySelectorAll('.playlist-item-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFromPlaylist(index);
                e.stopPropagation();
            });
        });
    }
    
    // 从播放列表中移除曲目
    removeFromPlaylist(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        // 如果正在播放被移除的曲目，先停止播放
        if (index === this.currentTrackIndex) {
            this.stop();
        }
        
        // 从播放列表中移除
        this.playlist.splice(index, 1);
        
        // 调整当前曲目索引
        if (this.currentTrackIndex > index) {
            this.currentTrackIndex--;
        } else if (this.currentTrackIndex >= this.playlist.length) {
            this.currentTrackIndex = this.playlist.length - 1;
        }
        
        // 更新播放列表显示
        this.updatePlaylistDisplay();
    }
    
    // 清空播放列表
    clearPlaylist() {
        this.stop();
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.updateTrackInfo('暂无播放', '');
        this.updatePlaylistDisplay();
    }
    
    // 高亮显示当前播放曲目
    highlightCurrentTrack() {
        if (!this.playlistContainer) return;
        
        // 移除所有高亮
        const items = this.playlistContainer.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // 高亮当前曲目
        const currentItem = this.playlistContainer.querySelector(`.playlist-item[data-index="${this.currentTrackIndex}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
        }
    }
}

// 将BottomControllerModule挂载到window对象上
window.BottomControllerModule = BottomControllerModule;
