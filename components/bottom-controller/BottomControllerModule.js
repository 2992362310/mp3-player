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
        this.lyricsCache = {}; // 歌词缓存
        this.currentLyrics = null; // 修改此处：将初始化值由 '' 改为 null
        this.currentSongInfo = null; // 当前歌曲信息
        this.init();
    }

    init() {
        this.isExpanded = false;
        this.initializeElements();
        this.bindEvents();
        this.initLyricsModal();
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
        this.showLyricsBtn = DOMManager.querySelector('.show-lyrics-btn');
        
        // 获取歌词按钮和弹窗元素
        this.lyricsBtn = DOMManager.querySelector('.lyrics-btn');
        this.lyricsModal = DOMManager.querySelector('.lyrics-modal');
        this.lyricsModalClose = DOMManager.querySelector('.lyrics-modal-close');
        this.lyricsTitle = DOMManager.querySelector('.lyrics-title');
        this.lyricsArtist = DOMManager.querySelector('.lyrics-artist');
        this.lyricsContent = DOMManager.querySelector('.lyrics-modal .lyrics-content');
        this.lyricsPlaceholder = DOMManager.querySelector('.lyrics-modal .lyrics-placeholder');
        
        // 获取展开内容中的歌词区域
        this.showLyricsBtn = DOMManager.querySelector('.show-lyrics-btn');
        this.lyricsSection = DOMManager.querySelector('.lyrics-section');
        this.expandLyricsContent = DOMManager.querySelector('.lyrics-section .lyrics-content');
        this.expandLyricsPlaceholder = DOMManager.querySelector('.lyrics-section .lyrics-placeholder');
        
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
        
        // 显示歌词按钮事件
        if (this.showLyricsBtn) {
            this.showLyricsBtn.addEventListener('click', () => {
                this.toggleLyricsSection();
            });
        }
        
        // 歌词按钮事件
        if (this.lyricsBtn) {
            this.lyricsBtn.addEventListener('click', () => {
                this.toggleLyricsModal();
            });
        }
        
        // 歌词弹窗关闭事件
        if (this.lyricsModalClose) {
            this.lyricsModalClose.addEventListener('click', () => {
                this.hideLyricsModal();
            });
        }
        
        // 点击弹窗背景关闭弹窗
        if (this.lyricsModal) {
            this.lyricsModal.addEventListener('click', (e) => {
                if (e.target === this.lyricsModal) {
                    this.hideLyricsModal();
                }
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
                
                // 更新当前歌曲信息
                this.currentSongInfo = {
                    title: data.file.displayName || data.file.name.replace(/\.[^/.]+$/, ""),
                    artist: data.file.artist || '未知艺术家',
                    id: data.file.path || data.file.name
                };
                
                // 更新歌曲信息显示
                this.updateTrackInfo();
                
                // 更新歌词显示信息
                this.updateLyricsInfo();
                
                // 加载歌词
                this.loadLyrics(this.currentSongInfo.id, this.currentSongInfo);
            } else {
                console.log('playLocalFile事件数据无效:', data);
            }
        });
        
        // 监听在线音乐播放事件
        this.eventBus.on('playOnlineSong', (data) => {
            console.log('接收到playOnlineSong事件:', data);
            if (data && data.url) {
                // 更新当前歌曲信息
                this.currentSongInfo = {
                    title: data.title || '未知歌曲',
                    artist: data.artist || '未知艺术家',
                    id: data.songId,
                    source: data.source
                };
                
                this.addToPlaylist({
                    id: data.songId,
                    title: data.title || '未知歌曲',
                    artist: data.artist || '未知艺术家',
                    url: data.url,
                    source: data.source
                });
                
                // 更新歌曲信息显示
                this.updateTrackInfo();
                
                // 更新歌词显示信息
                this.updateLyricsInfo();
                
                // 重置歌词状态，以便在下次打开歌词界面时重新加载
                this.currentLyrics = null;
                
                // 不再在这里加载歌词，只在需要显示歌词时加载
            } else {
                console.log('playOnlineSong事件数据无效:', data);
            }
        });
        
        // 监听播放进度事件
        this.eventBus.on('playProgress', (currentTime) => {
            this.updateLyricsHighlight(currentTime);
        });
        
        // 拖拽上传事件
        this.setupDragAndDrop();
        
        // 音频播放事件
        if (this.audioPlayer) {
            this.audioPlayer.addEventListener('timeupdate', () => {
                this.updateProgress();
                // 发布播放进度事件
                if (this.audioPlayer) {
                    this.eventBus.emit('playProgress', this.audioPlayer.currentTime);
                }
            });
            
            this.audioPlayer.addEventListener('loadedmetadata', () => {
                this.updateDuration();
            });
            
            this.audioPlayer.addEventListener('ended', () => {
                this.handleAudioEnded();
            });
        }
    }
    
    // 初始化歌词弹窗
    initLyricsModal() {
        console.log('歌词弹窗初始化完成');
    }
    
    // 切换歌词弹窗显示状态
    toggleLyricsModal() {
        if (!this.lyricsModal) return;
        
        if (this.lyricsModal.style.display === 'none' || !this.lyricsModal.style.display) {
            this.showLyricsModal();
            // 在显示歌词弹窗时加载歌词
            this.loadLyricsIfNeeded();
        } else {
            this.hideLyricsModal();
        }
    }
    
    // 显示歌词弹窗
    showLyricsModal() {
        if (!this.lyricsModal) return;
        
        this.lyricsModal.style.display = 'flex';
        // 更新歌词信息
        this.updateLyricsInfo();
        // 注意：不在这里加载歌词，而是在toggleLyricsModal中加载
    }
    
    // 隐藏歌词弹窗
    hideLyricsModal() {
        if (!this.lyricsModal) return;
        
        this.lyricsModal.style.display = 'none';
    }
    
    // 更新歌词信息显示
    updateLyricsInfo() {
        if (!this.lyricsTitle || !this.lyricsArtist) return;
        
        if (this.currentSongInfo) {
            this.lyricsTitle.textContent = this.currentSongInfo.title || '未知歌曲';
            this.lyricsArtist.textContent = this.currentSongInfo.artist || '未知艺术家';
        } else {
            this.lyricsTitle.textContent = '暂无歌曲播放';
            this.lyricsArtist.textContent = '未知艺术家';
        }
    }
    
    // 切换展开内容中的歌词区域
    toggleLyricsSection() {
        const playlistContainer = DOMManager.querySelector('.playlist-container');
        const lyricsSection = DOMManager.querySelector('.lyrics-section');
        
        if (lyricsSection && playlistContainer) {
            if (lyricsSection.style.display === 'none') {
                // 显示歌词区域，隐藏播放列表
                playlistContainer.style.display = 'none';
                lyricsSection.style.display = 'block';
                this.showLyricsBtn.textContent = '播放列表';
                
                // 更新歌词信息并在需要时加载歌词
                this.updateExpandLyricsInfo();
                this.loadLyricsIfNeeded();
            } else {
                // 显示播放列表，隐藏歌词区域
                playlistContainer.style.display = 'block';
                lyricsSection.style.display = 'none';
                this.showLyricsBtn.textContent = '歌词';
            }
        }
    }
    
    // 在需要时加载歌词
    loadLyricsIfNeeded() {
        // 只有在当前有歌曲且尚未加载过歌词时才加载
        if (this.currentSongInfo && !this.currentLyrics) {
            this.loadLyrics(this.currentSongInfo.id, this.currentSongInfo);
        } else if (this.currentSongInfo && this.currentLyrics) {
            // 如果歌词已经加载过，直接显示
            this.displayLyrics(this.currentLyrics);
        }
    }
    
    // 更新展开内容中的歌词信息
    updateExpandLyricsInfo() {
        // 这里可以添加更新展开内容中歌词信息的逻辑
        console.log('更新展开内容中的歌词信息');
    }
    
    // 加载歌词
    async loadLyrics(songId, songInfo) {
        // 检查缓存
        if (this.lyricsCache[songId]) {
            this.currentLyrics = this.lyricsCache[songId];
            this.displayLyrics(this.currentLyrics);
            return;
        }
        
        // 如果是本地音乐，暂时不加载歌词
        if (!songInfo.source) {
            this.showNoLyrics();
            return;
        }
        
        try {
            // 显示加载状态
            this.showLyricsLoading();
            
            // 请求歌词数据
            const response = await fetch(
                `https://music-api.gdstudio.xyz/api.php?types=lyric&source=${songInfo.source}&id=${songId}`
            );
            const lyricData = await response.json();
            
            if (lyricData) {
                // 缓存歌词
                this.lyricsCache[songId] = lyricData;
                
                // 设置当前歌词
                this.currentLyrics = lyricData;
                
                // 显示歌词
                this.displayLyrics(lyricData);
            } else {
                this.showNoLyrics();
            }
        } catch (error) {
            console.error('加载歌词时出错:', error);
            this.showLyricsError();
        }
    }
    
    // 显示歌词加载状态
    showLyricsLoading() {
        if (this.lyricsPlaceholder && this.lyricsContent) {
            this.lyricsPlaceholder.innerHTML = '<p>歌词加载中...</p>';
            this.lyricsContent.innerHTML = '';
        }
        
        // 同时更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder && this.expandLyricsContent) {
            this.expandLyricsPlaceholder.innerHTML = '<p>歌词加载中...</p>';
            this.expandLyricsContent.innerHTML = '';
        }
    }
    
    // 显示无歌词提示
    showNoLyrics() {
        // 更新弹窗歌词内容
        if (this.lyricsPlaceholder && this.lyricsContent) {
            this.lyricsPlaceholder.innerHTML = '<p>暂无歌词</p>';
            this.lyricsContent.innerHTML = '';
        }

        // 更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder && this.expandLyricsContent) {
            this.expandLyricsPlaceholder.innerHTML = '<p>暂无歌词</p>';
            this.expandLyricsContent.innerHTML = '';
        }
    }
    
    // 显示歌词加载错误
    showLyricsError() {
        // 更新弹窗歌词内容
        if (this.lyricsPlaceholder && this.lyricsContent) {
            this.lyricsPlaceholder.innerHTML = '<p>歌词加载失败</p>';
            this.lyricsContent.innerHTML = '';
        }

        // 更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder && this.expandLyricsContent) {
            this.expandLyricsPlaceholder.innerHTML = '<p>歌词加载失败</p>';
            this.expandLyricsContent.innerHTML = '';
        }
    }
    
    // 显示歌词
    displayLyrics(lyricData) {
        if (!this.lyricsContent || !this.lyricsPlaceholder) return;
        
        // 解析歌词
        const parsedLyrics = this.parseLyrics(lyricData.lyric);
        
        if (parsedLyrics.length === 0) {
            this.showNoLyrics();
            return;
        }
        
        // 隐藏占位符
        this.lyricsPlaceholder.style.display = 'none';
        
        // 构建歌词HTML
        let lyricsHtml = '';
        parsedLyrics.forEach((line, index) => {
            lyricsHtml += `<div class="lyrics-line" data-time="${line.time}">${line.text}</div>`;
        });
        
        // 更新弹窗歌词内容
        this.lyricsContent.innerHTML = lyricsHtml;
        
        // 同时更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder && this.expandLyricsContent) {
            this.expandLyricsPlaceholder.style.display = 'none';
            this.expandLyricsContent.innerHTML = lyricsHtml;
        }
    }
    
    // 解析歌词
    parseLyrics(lyricText) {
        if (!lyricText) return [];
        
        const lines = lyricText.split('\n');
        const parsedLyrics = [];
        
        for (const line of lines) {
            // 匹配时间标签 [mm:ss.xx]
            const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
            if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const milliseconds = parseInt(timeMatch[3]);
                const totalTime = minutes * 60 + seconds + milliseconds / 1000;
                
                // 提取歌词文本（去掉时间标签）
                const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
                
                if (text) {
                    parsedLyrics.push({
                        time: totalTime,
                        text: text
                    });
                }
            }
        }
        
        return parsedLyrics;
    }
    
    // 更新歌词高亮
    updateLyricsHighlight(currentTime) {
        if (!this.currentLyrics || !this.lyricsContent) return;
        
        const lyricsLines = this.lyricsContent.querySelectorAll('.lyrics-line');
        if (lyricsLines.length === 0) return;
        
        // 解析歌词时间
        const parsedLyrics = this.parseLyrics(this.currentLyrics.lyric);
        if (parsedLyrics.length === 0) return;
        
        // 找到当前时间对应的歌词行
        let currentIndex = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (parsedLyrics[i].time <= currentTime) {
                currentIndex = i;
            } else {
                break;
            }
        }
        
        // 更新高亮显示
        lyricsLines.forEach((line, index) => {
            if (index === currentIndex) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
        
        // 滚动到高亮行
        if (currentIndex >= 0 && currentIndex < lyricsLines.length) {
            lyricsLines[currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
        
        // 同时更新展开内容中的歌词高亮
        if (this.expandLyricsContent) {
            const expandLyricsLines = this.expandLyricsContent.querySelectorAll('.lyrics-line');
            expandLyricsLines.forEach((line, index) => {
                if (index === currentIndex) {
                    line.classList.add('active');
                } else {
                    line.classList.remove('active');
                }
            });
            
            // 滚动到高亮行
            if (currentIndex >= 0 && currentIndex < expandLyricsLines.length) {
                expandLyricsLines[currentIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
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
        
        if (this.playBtn) {
            this.playBtn.textContent = '▶'; // 改为播放图标
        }
        
        this.eventBus.emit('playbackPaused');
    }
    
    // 播放上一首
    playPrev() {
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex--;
        if (this.currentTrackIndex < 0) {
            this.currentTrackIndex = this.playlist.length - 1;
        }
        
        this.loadTrack(this.currentTrackIndex);
        this.play();
    }
    
    // 播放下一首
    playNext() {
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.playlist.length) {
            this.currentTrackIndex = 0;
        }
        
        this.loadTrack(this.currentTrackIndex);
        this.play();
    }
    
    // 加载指定曲目
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        const track = this.playlist[index];
        if (!track || !this.audioPlayer) return;
        
        this.audioPlayer.src = track.url;
        this.currentTrackIndex = index;
        
        // 更新歌曲信息显示
        this.updateTrackInfo();
        
        // 更新播放列表高亮
        this.updatePlaylistHighlight();
        
        // 重置歌词状态，以便在下次打开歌词界面时重新加载
        this.currentLyrics = null;
        
        // 不再在这里加载歌词，只在需要显示歌词时加载
        // 如果是在线音乐，加载歌词的逻辑应该移到显示歌词时执行
    }
    
    // 更新歌曲信息显示
    updateTrackInfo() {
        if (!this.trackTitle || !this.trackArtist) return;
        
        const currentTrack = this.playlist[this.currentTrackIndex];
        if (!currentTrack) return;
        
        this.trackTitle.textContent = currentTrack.title || '未知歌曲';
        this.trackArtist.textContent = currentTrack.artist || '未知艺术家';
    }
    
    // 更新播放列表高亮
    updatePlaylistHighlight() {
        const playlistItems = this.playlistContainer.querySelectorAll('.playlist-item');
        playlistItems.forEach((item, index) => {
            if (index === this.currentTrackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // 设置音量
    setVolume(value) {
        if (!this.audioPlayer) return;
        
        const volume = value / 100;
        this.audioPlayer.volume = volume;
        
        if (this.volumeSlider) {
            this.volumeSlider.value = value;
        }
    }
    
    // 跳转到指定位置
    seekTo(e) {
        if (!this.audioPlayer || !this.progressContainer) return;
        
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const duration = this.audioPlayer.duration;
        
        if (!isNaN(duration)) {
            this.audioPlayer.currentTime = pos * duration;
        }
    }
    
    // 更新进度显示
    updateProgress() {
        if (!this.audioPlayer || !this.progress || !this.currentTimeDisplay) return;
        
        const currentTime = this.audioPlayer.currentTime;
        const duration = this.audioPlayer.duration;
        
        if (!isNaN(duration)) {
            const progressPercent = (currentTime / duration) * 100;
            this.progress.style.width = `${progressPercent}%`;
            
            // 更新时间显示
            this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        }
    }
    
    // 更新总时长显示
    updateDuration() {
        if (!this.audioPlayer || !this.totalTimeDisplay) return;
        
        const duration = this.audioPlayer.duration;
        if (!isNaN(duration)) {
            this.totalTimeDisplay.textContent = this.formatTime(duration);
        }
    }
    
    // 格式化时间显示
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 处理音频播放结束
    handleAudioEnded() {
        this.eventBus.emit('audioEnded');
        
        // 自动播放下一首
        this.playNext();
    }
    
    // 处理文件选择
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        this.addToPlaylist({
            id: file.name,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: '本地音乐',
            url: URL.createObjectURL(file),
            file: file
        });
        
        // 如果当前没有播放曲目，则播放刚添加的曲目
        if (this.currentTrackIndex === -1) {
            this.currentTrackIndex = this.playlist.length - 1;
            this.loadTrack(this.currentTrackIndex);
            this.play();
        }
    }
    
    // 添加到播放列表
    addToPlaylist(track) {
        // 确保playlist是一个数组
        if (!Array.isArray(this.playlist)) {
            this.playlist = [];
        }
        
        // 检查是否已存在
        const existingIndex = this.playlist.findIndex(item => item.id === track.id);
        if (existingIndex === -1) {
            // 添加到播放列表
            this.playlist.push(track);
            this.renderPlaylist();
            
            // 如果当前没有播放曲目，则播放刚添加的曲目
            if (this.currentTrackIndex === -1) {
                this.currentTrackIndex = this.playlist.length - 1;
                this.loadTrack(this.currentTrackIndex);
                this.play();
            }
        } else {
            // 如果已存在，直接播放
            this.currentTrackIndex = existingIndex;
            this.loadTrack(this.currentTrackIndex);
            this.play();
        }
    }
    
    // 渲染播放列表
    renderPlaylist() {
        if (!this.playlistContainer) return;
        
        this.playlistContainer.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
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
                if (!e.target.classList.contains('playlist-item-remove')) {
                    this.currentTrackIndex = index;
                    this.loadTrack(this.currentTrackIndex);
                    this.play();
                }
            });
            
            // 添加删除按钮事件
            const removeBtn = li.querySelector('.playlist-item-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromPlaylist(index);
            });
            
            this.playlistContainer.appendChild(li);
        });
    }
    
    // 从播放列表中移除
    removeFromPlaylist(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        // 如果正在播放被删除的曲目
        if (index === this.currentTrackIndex) {
            if (this.playlist.length > 1) {
                // 播放下一首
                this.playNext();
            } else {
                // 停止播放
                this.stop();
                this.currentTrackIndex = -1;
            }
        } else if (index < this.currentTrackIndex) {
            // 如果删除的是当前播放曲目之前的曲目，需要调整索引
            this.currentTrackIndex--;
        }
        
        // 从播放列表中移除
        this.playlist.splice(index, 1);
        
        // 重新渲染播放列表
        this.renderPlaylist();
    }
    
    // 清空播放列表
    clearPlaylist() {
        this.stop();
        this.playlist = [];
        this.currentTrackIndex = -1;
        
        if (this.playlistContainer) {
            this.playlistContainer.innerHTML = '';
        }
        
        // 重置歌曲信息显示
        if (this.trackTitle) this.trackTitle.textContent = '暂无播放';
        if (this.trackArtist) this.trackArtist.textContent = '';
    }
    
    // 停止播放
    stop() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        
        if (this.playBtn) {
            this.playBtn.textContent = '▶';
        }
    }
    
    // 更新播放按钮状态
    updatePlayButtonState(isPlaying) {
        if (!this.playBtn) return;
        
        this.playBtn.textContent = isPlaying ? '⏸' : '▶';
    }
    
    // 设置拖拽上传
    setupDragAndDrop() {
        // 可以在这里实现拖拽上传功能
        console.log('拖拽上传功能初始化');
    }
}