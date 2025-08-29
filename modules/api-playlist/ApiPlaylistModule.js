/**
 * API播放列表模块
 * 负责处理API播放列表模块中的所有事件绑定和交互逻辑
 */
import { eventBus } from '../../core/common/index.js';

export default class ApiPlaylistModule {
    constructor() {
        // 使用全局EventBus实例
        this.eventBus = eventBus;
        this.apiBase = 'https://music-api.gdstudio.xyz/api.php';
        this.defaultSource = 'netease'; // 默认音乐源
        this.currentPlaylist = []; // 当前播放列表
        this.currentPlayingIndex = -1; // 当前播放索引
        this.isAutoPlayEnabled = false; // 是否启用自动播放
        
        // 保存事件处理函数的引用，用于正确地添加和移除事件监听器
        this.eventHandlers = {};
        
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 初始化UI
        this.initializeUI();
        
        // 监听音频播放结束事件
        this.eventBus.on('audioEnded', () => {
            if (this.isAutoPlayEnabled && this.currentPlayingIndex >= 0) {
                this.playNextSong();
            }
        });
    }

    bindEvents() {
        // 清理已存在的事件监听器
        this.unbindEvents();
        
        // API播放列表功能
        const apiPlaylistSearchBtn = document.querySelector('#api-playlist-content .api-search-btn');
        if (apiPlaylistSearchBtn) {
            this.eventHandlers.apiPlaylistSearchBtnClick = () => {
                this.searchInPlaylistTab();
            };
            apiPlaylistSearchBtn.addEventListener('click', this.eventHandlers.apiPlaylistSearchBtnClick);
        }

        // API播放列表回车搜索
        const apiPlaylistSearchInput = document.querySelector('#api-playlist-content .api-search-input');
        if (apiPlaylistSearchInput) {
            this.eventHandlers.apiPlaylistSearchInputKeyup = (e) => {
                if (e.key === 'Enter') {
                    this.searchInPlaylistTab();
                }
            };
            apiPlaylistSearchInput.addEventListener('keyup', this.eventHandlers.apiPlaylistSearchInputKeyup);
        }

        // 自动播放按钮
        const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
        if (autoPlayBtn) {
            this.eventHandlers.autoPlayBtnClick = () => {
                this.toggleAutoPlay();
            };
            autoPlayBtn.addEventListener('click', this.eventHandlers.autoPlayBtnClick);
        }

        // 使用事件委托处理播放列表中的播放按钮点击事件
        const playlistResultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
        if (playlistResultsContainer) {
            this.eventHandlers.playlistResultsContainerClick = (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.playSongFromPlaylist(index);
                }
            };
            playlistResultsContainer.addEventListener('click', this.eventHandlers.playlistResultsContainerClick);
        }

        // API播放列表模块事件绑定逻辑
        console.log('API播放列表模块事件绑定完成');
    }
    
    // 解绑事件监听器，防止重复绑定
    unbindEvents() {
        // 解绑API播放列表功能事件
        const apiPlaylistSearchBtn = document.querySelector('#api-playlist-content .api-search-btn');
        if (apiPlaylistSearchBtn && this.eventHandlers.apiPlaylistSearchBtnClick) {
            apiPlaylistSearchBtn.removeEventListener('click', this.eventHandlers.apiPlaylistSearchBtnClick);
        }

        const apiPlaylistSearchInput = document.querySelector('#api-playlist-content .api-search-input');
        if (apiPlaylistSearchInput && this.eventHandlers.apiPlaylistSearchInputKeyup) {
            apiPlaylistSearchInput.removeEventListener('keyup', this.eventHandlers.apiPlaylistSearchInputKeyup);
        }

        // 解绑自动播放按钮
        const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
        if (autoPlayBtn && this.eventHandlers.autoPlayBtnClick) {
            autoPlayBtn.removeEventListener('click', this.eventHandlers.autoPlayBtnClick);
        }

        // 解绑播放列表中的播放按钮点击事件
        const playlistResultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
        if (playlistResultsContainer && this.eventHandlers.playlistResultsContainerClick) {
            playlistResultsContainer.removeEventListener('click', this.eventHandlers.playlistResultsContainerClick);
        }

        // 清空事件处理函数引用
        this.eventHandlers = {};
    }
    
    // UI初始化方法
    initializeUI() {
        console.log('API播放列表模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
    }

    // 在播放列表标签页中搜索
    async searchInPlaylistTab() {
        const searchInput = document.querySelector('#api-playlist-content .api-search-input');
        const sourceSelect = document.querySelector('#api-playlist-content .api-source-select');
        
        const keyword = searchInput ? searchInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (keyword) {
            try {
                const resultsContainer = document.querySelector('#api-playlist-content .api-search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';
                }

                const response = await fetch(
                    `${this.apiBase}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=20&pages=1`
                );
                const results = await response.json();
                
                if (resultsContainer) {
                    if (!results || results.length === 0) {
                        resultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
                        return;
                    }
                    
                    // 更新播放列表
                    this.currentPlaylist = results;
                    this.currentPlayingIndex = -1;
                    
                    // 显示搜索结果
                    this.displayPlaylistResults(results);
                    
                    // 启用播放按钮
                    const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
                    if (autoPlayBtn) autoPlayBtn.disabled = false;
                }
            } catch (error) {
                console.error('搜索音乐时出错:', error);
                const resultsContainer = document.querySelector('#api-playlist-content .api-search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">搜索失败，请稍后重试</div>';
                }
            }
        }
    }

    // 显示播放列表搜索结果
    displayPlaylistResults(results) {
        const searchResultsContainer = document.querySelector('#api-playlist-content .api-search-results');
        const playlistResultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
        
        if (!searchResultsContainer || !playlistResultsContainer) return;
        
        if (!results || results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
            playlistResultsContainer.innerHTML = '';
            return;
        }
        
        // 显示搜索结果（简略）
        let searchHtml = '<h4>搜索结果:</h4>';
        searchHtml += `<div>找到 ${results.length} 首歌曲</div>`;
        searchResultsContainer.innerHTML = searchHtml;
        
        // 显示播放列表（详细）
        let playlistHtml = '<div class="results-list">';
        results.forEach((song, index) => {
            // 处理艺术家列表
            let artistNames = '';
            if (Array.isArray(song.artist)) {
                artistNames = song.artist.map(a => a.name || a).join(', ');
            } else {
                artistNames = song.artist || '未知艺术家';
            }
            
            const isPlaying = this.currentPlayingIndex === index;
            
            playlistHtml += `
                <div class="playlist-item ${isPlaying ? 'playing' : ''}">
                    <div class="playlist-song-info">
                        <div class="playlist-song-title">${song.name || '未知歌曲'}</div>
                        <div class="playlist-song-artist">${artistNames}</div>
                    </div>
                    ${isPlaying ? '<span class="playing-indicator">▶</span>' : ''}
                    <button class="play-btn" data-song-id="${song.id}" data-source="${song.source || this.defaultSource}" data-index="${index}">播放</button>
                </div>
            `;
        });
        playlistHtml += '</div>';
        playlistResultsContainer.innerHTML = playlistHtml;
    }

    // 播放播放列表中的歌曲
    async playSongFromPlaylist(index) {
        if (index < 0 || index >= this.currentPlaylist.length) return;
        
        const song = this.currentPlaylist[index];
        this.currentPlayingIndex = index;
        
        try {
            // 获取歌曲URL
            const response = await fetch(
                `${this.apiBase}?types=url&source=${song.source || this.defaultSource}&id=${song.id}&br=320`
            );
            const songData = await response.json();
            
            if (songData.url) {
                // 发布事件通知播放器播放歌曲
                this.eventBus.emit('playOnlineSong', { 
                    songId: song.id,
                    url: songData.url,
                    source: song.source || this.defaultSource,
                    title: song.name,
                    artist: Array.isArray(song.artist) ? song.artist.map(a => a.name || a).join(', ') : song.artist
                });
                
                // 更新播放列表显示
                this.displayPlaylistResults(this.currentPlaylist);
            } else {
                console.error('无法获取歌曲播放链接');
            }
        } catch (error) {
            console.error('获取歌曲播放链接时出错:', error);
        }
    }

    // 播放全部歌曲
    playAllSongs() {
        if (this.currentPlaylist.length > 0) {
            this.playSongFromPlaylist(0);
        }
    }

    // 播放下一首歌曲
    playNextSong() {
        if (this.currentPlaylist.length > 0) {
            const nextIndex = (this.currentPlayingIndex + 1) % this.currentPlaylist.length;
            this.playSongFromPlaylist(nextIndex);
        }
    }

    // 切换自动播放
    toggleAutoPlay() {
        this.isAutoPlayEnabled = !this.isAutoPlayEnabled;
        const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
        if (autoPlayBtn) {
            autoPlayBtn.textContent = this.isAutoPlayEnabled ? '🔁 自动播放 (开)' : '🔁 自动播放';
        }
    }
}