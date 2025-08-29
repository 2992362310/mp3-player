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

    // 初始化
    init() {
        this.initializeElements();
        this.bindEvents();
        this.initLyricsModal();
    }
    
    // 初始化歌词弹窗
    initLyricsModal() {
        console.log('歌词弹窗初始化完成');
    }
    
    initializeElements() {
        // 使用 DOMManager 获取底部控制器相关元素
        this.bottomController = DOMManager.querySelector('.bottom-controller');
        
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
        
        // 获取隐藏的音频元素
        this.audioPlayer = DOMManager.querySelector('#audioPlayer');
        this.audioFile = DOMManager.querySelector('#audioFile');
    }
    
    bindEvents() {
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
                // 构建歌曲信息
                const track = {
                    id: data.file.path || data.file.name,
                    title: data.file.displayName || data.file.name.replace(/\.[^/.]+$/, ""),
                    artist: data.file.artist || '未知艺术家',
                    url: data.file.url || URL.createObjectURL(data.file),
                    file: data.file
                };
                
                // 更新当前歌曲信息
                this.currentSongInfo = {
                    title: track.title,
                    artist: track.artist,
                    id: track.id
                };
                
                // 直接播放传入的歌曲
                this.playSong(track);
                
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
                
                // 直接播放传入的歌曲，不添加到播放列表
                this.playSong({
                    id: data.songId,
                    title: data.title || '未知歌曲',
                    artist: data.artist || '未知艺术家',
                    url: data.url,
                    source: data.source
                });
                
                // 更新歌词显示信息
                this.updateLyricsInfo();
                
                // 重置歌词状态
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
    
    // 切换展开内容中的歌词区域显示状态
    toggleLyricsSection() {
        if (!this.lyricsSection) return;
        
        if (this.lyricsSection.style.display === 'none' || !this.lyricsSection.style.display) {
            this.lyricsSection.style.display = 'block';
            if (this.showLyricsBtn) {
                this.showLyricsBtn.textContent = '隐藏歌词';
            }
            // 加载歌词
            this.loadLyricsIfNeeded();
        } else {
            this.lyricsSection.style.display = 'none';
            if (this.showLyricsBtn) {
                this.showLyricsBtn.textContent = '歌词';
            }
        }
    }
    
    // 更新歌曲信息显示
    updateTrackInfo() {
        if (!this.trackTitle || !this.trackArtist) return;
        
        const currentTrack = this.playlist[this.currentTrackIndex];
        if (!currentTrack) return;
        
        this.trackTitle.textContent = currentTrack.title || '未知歌曲';
        this.trackArtist.textContent = currentTrack.artist || '未知艺术家';
    }
    
    // 更新歌词显示信息
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
    
    // 加载歌词（如果需要）
    loadLyricsIfNeeded() {
        if (this.currentSongInfo && this.lyricsModal && 
            (this.lyricsModal.style.display === 'flex' || this.lyricsModal.style.display === '')) {
            this.loadLyrics(this.currentSongInfo.id, this.currentSongInfo);
        }
        
        // 同时检查展开内容中的歌词区域
        if (this.currentSongInfo && this.lyricsSection && 
            (this.lyricsSection.style.display === 'block')) {
            this.loadLyrics(this.currentSongInfo.id, this.currentSongInfo);
        }
    }
    
    // 显示歌词加载状态
    showLyricsLoading() {
        if (this.lyricsPlaceholder) {
            this.lyricsPlaceholder.innerHTML = '<p>歌词加载中...</p>';
        }
        
        // 同时更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder) {
            this.expandLyricsPlaceholder.innerHTML = '<p>歌词加载中...</p>';
        }
    }
    
    // 显示无歌词提示
    showNoLyrics() {
        if (this.lyricsPlaceholder) {
            this.lyricsPlaceholder.innerHTML = '<p>暂无歌词</p>';
        }
        
        // 同时更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder) {
            this.expandLyricsPlaceholder.innerHTML = '<p>暂无歌词</p>';
        }
    }
    
    // 显示歌词错误提示
    showLyricsError() {
        if (this.lyricsPlaceholder) {
            this.lyricsPlaceholder.innerHTML = '<p>歌词加载失败</p>';
        }
        
        // 同时更新展开内容中的歌词区域
        if (this.expandLyricsPlaceholder) {
            this.expandLyricsPlaceholder.innerHTML = '<p>歌词加载失败</p>';
        }
    }
    
    // 解析歌词
    parseLyrics(lyricsText) {
        if (!lyricsText) return [];
        
        const lines = lyricsText.split('\n');
        const parsedLyrics = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 匹配时间戳 [mm:ss.xx] 或 [mm:ss]
            const timeRegex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
            const match = line.match(timeRegex);
            
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseFloat(match[2]);
                const text = match[3].trim();
                
                const time = minutes * 60 + seconds;
                
                parsedLyrics.push({
                    time: time,
                    text: text || '...音乐播放中...'
                });
            }
        }
        
        return parsedLyrics;
    }
    
    // 显示歌词
    displayLyrics(lyricData) {
        if (!lyricData || !lyricData.lyric) {
            this.showNoLyrics();
            return;
        }
        
        const parsedLyrics = this.parseLyrics(lyricData.lyric);
        
        if (parsedLyrics.length === 0) {
            this.showNoLyrics();
            return;
        }
        
        // 构建歌词HTML
        let lyricsHtml = '';
        parsedLyrics.forEach((line, index) => {
            lyricsHtml += `<div class="lyrics-line" data-time="${line.time}">${line.text || '&nbsp;'}</div>`;
        });
        
        // 更新弹窗中的歌词显示
        if (this.lyricsContent) {
            this.lyricsContent.innerHTML = lyricsHtml;
        }
        
        // 同时更新展开内容中的歌词显示
        if (this.expandLyricsContent) {
            this.expandLyricsContent.innerHTML = lyricsHtml;
        }
        
        // 更新当前歌词
        this.currentLyrics = lyricData;
    }
    
    // 更新歌词高亮显示
    updateLyricsHighlight(currentTime) {
        if (!this.currentLyrics || !this.lyricsContent) return;
        
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
        
        // 更新弹窗中的歌词高亮
        const lyricsLines = this.lyricsContent.querySelectorAll('.lyrics-line');
        lyricsLines.forEach((line, index) => {
            if (index === currentIndex) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
        
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
        
        // 滚动弹窗中的歌词到高亮行
        if (currentIndex >= 0 && currentIndex < lyricsLines.length) {
            lyricsLines[currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
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
        
        // 直接播放当前音频源
        this.audioPlayer.play()
            .then(() => {
                this.updatePlayButtonState(true);
                this.eventBus.emit('playbackStarted', { isPlaying: true });
            })
            .catch(error => {
                console.error('播放失败:', error);
            });
    }
    
    // 播放指定歌曲
    playSong(track) {
        if (!this.audioPlayer) return;
        
        // 设置音频源
        this.audioPlayer.src = track.url;
        
        // 更新歌曲信息显示
        this.updateTrackInfoForSong(track);
        
        // 播放音频
        this.audioPlayer.play()
            .then(() => {
                this.updatePlayButtonState(true);
                this.eventBus.emit('playbackStarted', { isPlaying: true });
            })
            .catch(error => {
                console.error('播放失败:', error);
            });
    }
    
    // 为指定歌曲更新歌曲信息显示
    updateTrackInfoForSong(track) {
        if (!this.trackTitle || !this.trackArtist) return;
        
        this.trackTitle.textContent = track.title || '未知歌曲';
        this.trackArtist.textContent = track.artist || '未知艺术家';
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
        // 发出事件供 ApiPlaylistModule 监听
        this.eventBus.emit('playPrevTrack');
    }
    
    // 播放下一首
    playNext() {
        // 发出事件供 ApiPlaylistModule 监听
        this.eventBus.emit('playNextTrack');
    }
    
    // 加载指定曲目
    loadTrack(index) {
        // 不再需要加载指定曲目
        console.log('加载指定曲目功能已禁用');
    }
    
    // 更新播放列表高亮
    updatePlaylistHighlight() {
        // 不再需要更新播放列表高亮
        console.log('更新播放列表高亮功能已禁用');
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
        // 不再维护播放列表，直接播放传入的歌曲
        this.playSong(track);
    }
    
    // 渲染播放列表
    renderPlaylist() {
        // 不再需要渲染播放列表
        console.log('渲染播放列表功能已禁用');
    }
    
    // 从播放列表中移除
    removeFromPlaylist(index) {
        // 不再维护播放列表
        console.log('从播放列表移除功能已禁用');
    }
    
    // 清空播放列表
    clearPlaylist() {
        // 不再维护播放列表
        console.log('清空播放列表功能已禁用');
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