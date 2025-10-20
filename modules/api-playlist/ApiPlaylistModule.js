import { eventBus } from '../../core/common/index.js';

export default class ApiPlaylistModule {
    constructor() {
        this.eventBus = eventBus;
        this.apiBase = 'https://music-api.gdstudio.xyz/api.php';
        this.defaultSource = 'netease';
        this.currentPlaylist = [];
        this.currentPlayingIndex = -1;
        this.isAutoPlayEnabled = true;
        
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageSize = 20;
        this.currentKeyword = '';
        this.currentSource = '';
        
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        
        this.eventHandlers = {};
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeUI();
        this.loadSearchHistory();
        this.renderSearchHistory();
        
        this.eventBus.on('audioEnded', () => {
            if (this.isAutoPlayEnabled && this.currentPlayingIndex >= 0) {
                this.playNextSong();
            }
        });
        
        this.eventBus.on('playbackStarted', () => {
            this.preloadNextSong();
        });
        
        this.eventBus.on('playPrevTrack', () => {
            this.playPrevSong();
        });
        
        this.eventBus.on('playNextTrack', () => {
            this.playNextSong();
        });
        
        this.eventBus.on('apiPlaylistActivated', () => {
            this.refreshSearchHistory();
        });
    }

    bindEvents() {
        this.unbindEvents();
        
        const apiPlaylistSearchBtn = document.querySelector('#api-playlist-content .api-search-btn');
        if (apiPlaylistSearchBtn) {
            this.eventHandlers.apiPlaylistSearchBtnClick = () => {
                this.searchInPlaylistTab();
            };
            apiPlaylistSearchBtn.addEventListener('click', this.eventHandlers.apiPlaylistSearchBtnClick);
        }

        const apiPlaylistSearchInput = document.querySelector('#api-playlist-content .api-search-input');
        if (apiPlaylistSearchInput) {
            this.eventHandlers.apiPlaylistSearchInputKeyup = (e) => {
                if (e.key === 'Enter') {
                    this.searchInPlaylistTab();
                }
            };
            apiPlaylistSearchInput.addEventListener('keyup', this.eventHandlers.apiPlaylistSearchInputKeyup);
        }

        const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
        if (autoPlayBtn) {
            this.eventHandlers.autoPlayBtnClick = () => {
                this.toggleAutoPlay();
            };
            autoPlayBtn.addEventListener('click', this.eventHandlers.autoPlayBtnClick);
        }

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

        const prevBtn = document.querySelector('#api-playlist-content .prev-btn');
        if (prevBtn) {
            this.eventHandlers.prevBtnClick = () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            };
            prevBtn.addEventListener('click', this.eventHandlers.prevBtnClick);
        }

        const nextBtn = document.querySelector('#api-playlist-content .next-btn');
        if (nextBtn) {
            this.eventHandlers.nextBtnClick = () => {
                if (this.currentKeyword) {
                    this.goToPage(this.currentPage + 1);
                }
            };
            nextBtn.addEventListener('click', this.eventHandlers.nextBtnClick);
        }

        const historyContainer = document.querySelector('#api-playlist-content .search-history-tags');
        if (historyContainer) {
            this.eventHandlers.historyContainerClick = (e) => {
                const historyTag = e.target.closest('.history-tag');
                if (historyTag && !e.target.classList.contains('delete-history-btn')) {
                    const keyword = historyTag.getAttribute('data-keyword');
                    const source = historyTag.getAttribute('data-source');
                    
                    const searchInput = document.querySelector('#api-playlist-content .api-search-input');
                    const sourceSelect = document.querySelector('#api-playlist-content .api-source-select');
                    
                    if (searchInput) searchInput.value = keyword;
                    if (sourceSelect) sourceSelect.value = source;
                    
                    this.searchInPlaylistTab();
                }
                else if (e.target.classList.contains('delete-history-btn')) {
                    const tag = e.target.closest('.history-tag');
                    if (tag) {
                        const keyword = tag.getAttribute('data-keyword');
                        const source = tag.getAttribute('data-source');
                        
                        this.removeSearchHistory(keyword, source);
                        this.renderSearchHistory();
                    }
                }
            };
            historyContainer.addEventListener('click', this.eventHandlers.historyContainerClick);
        }

        console.log('API播放列表模块事件绑定完成');
    }
    
    unbindEvents() {
        const selectorHandlerMap = {
            '#api-playlist-content .api-search-btn': 'apiPlaylistSearchBtnClick',
            '#api-playlist-content .api-search-input': 'apiPlaylistSearchInputKeyup',
            '#api-playlist-content .playlist-auto-play-btn': 'autoPlayBtnClick',
            '#api-playlist-content .api-playlist-results': 'playlistResultsContainerClick',
            '#api-playlist-content .prev-btn': 'prevBtnClick',
            '#api-playlist-content .next-btn': 'nextBtnClick',
            '#api-playlist-content .search-history-tags': 'historyContainerClick'
        };

        Object.entries(selectorHandlerMap).forEach(([selector, handlerKey]) => {
            const element = document.querySelector(selector);
            if (element && this.eventHandlers[handlerKey]) {
                element.removeEventListener('click', this.eventHandlers[handlerKey]);
            }
        });

        this.eventHandlers = {};
    }
    
    initializeUI() {
        console.log('API播放列表模块UI初始化完成');
        this.refreshSearchHistory();
    }

    async searchInPlaylistTab() {
        const searchInput = document.querySelector('#api-playlist-content .api-search-input');
        const sourceSelect = document.querySelector('#api-playlist-content .api-source-select');
        
        const keyword = searchInput ? searchInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (keyword) {
            this.saveSearchHistory(keyword, source);
            this.renderSearchHistory();
            
            this.currentPage = 1;
            this.currentKeyword = keyword;
            this.currentSource = source;
            
            await this.performSearch(keyword, source, this.currentPage);
        }
    }

    async performSearch(keyword, source, page) {
        try {
            const resultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';
            }

            const response = await fetch(
                `${this.apiBase}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=${this.pageSize}&pages=${page}`
            );
            const results = await response.json();
            
            if (resultsContainer) {
                if (results && Array.isArray(results)) {
                    this.totalPages = page;
                    if (results.length >= this.pageSize) {
                        this.totalPages = page + 1;
                    }
                    
                    if (page === 1 && results.length < this.pageSize) {
                        this.totalPages = page;
                    }
                } else {
                    this.totalPages = 1;
                }
                
                this.updatePagination();
                
                if (!results || !Array.isArray(results) || results.length === 0) {
                    resultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
                    return;
                }
                
                this.currentPlayingIndex = -1;
                this.currentPlaylist = results;
                this.displayPlaylistResults(results);
                
                const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
                if (autoPlayBtn) autoPlayBtn.disabled = false;
            }
        } catch (error) {
            console.error('搜索音乐时出错:', error);
            const resultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="error">搜索失败，请稍后重试</div>';
            }
        }
    }

    async goToPage(page) {
        if (page >= 1 && this.currentKeyword) {
            this.currentPage = page;
            await this.performSearch(this.currentKeyword, this.currentSource, this.currentPage);
        }
    }

    updatePagination() {
        const prevBtn = document.querySelector('#api-playlist-content .prev-btn');
        const nextBtn = document.querySelector('#api-playlist-content .next-btn');
        const currentPageEl = document.querySelector('#api-playlist-content .current-page');
        const totalPagesEl = document.querySelector('#api-playlist-content .total-pages');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = !this.currentKeyword || this.currentPage > this.totalPages + 3;
        }
        
        if (currentPageEl) {
            currentPageEl.textContent = this.currentPage;
        }
        
        if (totalPagesEl) {
            const displayTotal = Math.max(this.totalPages, this.currentPage);
            totalPagesEl.textContent = displayTotal;
        }
    }

    displayPlaylistResults(results) {
        const playlistResultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
        
        if (!playlistResultsContainer) return;
        
        if (!results || results.length === 0) {
            playlistResultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
            return;
        }
        
        this.currentPlaylist = results;
        
        let playlistHtml = '<div class="results-list">';
        results.forEach((song, index) => {
            let artistNames = '';
            if (Array.isArray(song.artist)) {
                artistNames = song.artist.map(a => a.name || a).join(', ');
            } else {
                artistNames = song.artist || '未知艺术家';
            }
            
            const globalIndex = (this.currentPage - 1) * this.pageSize + index;
            const isPlaying = this.currentPlayingIndex === globalIndex;
            const displayIndex = globalIndex + 1;
            
            playlistHtml += `
                <div class="playlist-item ${isPlaying ? 'playing' : ''}">
                    <div class="playlist-song-index">${displayIndex}</div>
                    <div class="playlist-song-info">
                        <div class="playlist-song-title">${song.name || '未知歌曲'}</div>
                        <div class="playlist-song-artist">${artistNames}</div>
                    </div>
                    ${isPlaying ? '<span class="playing-indicator">▶</span>' : ''}
                    <button class="play-btn" data-song-id="${song.id}" data-source="${song.source || this.defaultSource}" data-index="${globalIndex}">播放</button>
                </div>
            `;
        });
        playlistHtml += '</div>';
        playlistResultsContainer.innerHTML = playlistHtml;
    }

    async playSongFromPlaylist(index) {
        const pageIndex = index % this.pageSize;
        const pageNum = Math.floor(index / this.pageSize) + 1;
        
        if (pageNum !== this.currentPage) {
            this.currentPage = pageNum;
            await this.performSearch(this.currentKeyword, this.currentSource, this.currentPage);
            
            const newPageIndex = index % this.pageSize;
            if (newPageIndex < 0 || newPageIndex >= this.currentPlaylist.length) return;
            
            this.currentPlayingIndex = index;
            
            const song = this.currentPlaylist[newPageIndex];
            await this.playSong(song);
            
            this.displayPlaylistResults(this.currentPlaylist);
        } else {
            if (pageIndex < 0 || pageIndex >= this.currentPlaylist.length) return;
            
            this.currentPlayingIndex = index;
            
            const song = this.currentPlaylist[pageIndex];
            await this.playSong(song);
            
            this.displayPlaylistResults(this.currentPlaylist);
        }
    }
    
    async playSong(song) {
        try {
            const response = await fetch(
                `${this.apiBase}?types=url&source=${song.source || this.defaultSource}&id=${song.id}&br=320`
            );
            const songData = await response.json();
            
            if (songData.url) {
                this.eventBus.emit('playOnlineSong', { 
                    songId: song.id,
                    url: songData.url,
                    source: song.source || this.defaultSource,
                    title: song.name,
                    artist: Array.isArray(song.artist) ? song.artist.map(a => a.name || a).join(', ') : song.artist
                });
            } else {
                console.error('无法获取歌曲播放链接');
            }
        } catch (error) {
            console.error('获取歌曲播放链接时出错:', error);
        }
    }
    
    async preloadNextSong() {
        const nextIndex = this.currentPlayingIndex + 1;
        
        if (nextIndex < this.currentPlaylist.length) {
            const nextSong = this.currentPlaylist[nextIndex];
            try {
                const response = await fetch(
                    `${this.apiBase}?types=url&source=${nextSong.source || this.defaultSource}&id=${nextSong.id}&br=320`
                );
                const songData = await response.json();
                
                if (songData.url) {
                    const preloadAudio = new Audio();
                    preloadAudio.src = songData.url;
                    preloadAudio.preload = 'auto';
                }
            } catch (error) {
                console.error('预加载下一首歌曲时出错:', error);
            }
        } else if (this.isAutoPlayEnabled && this.currentPage < this.totalPages) {
            try {
                const response = await fetch(
                    `${this.apiBase}?types=search&source=${this.currentSource}&name=${encodeURIComponent(this.currentKeyword)}&count=${this.pageSize}&pages=${this.currentPage + 1}`
                );
                const results = await response.json();
                
                if (results && Array.isArray(results) && results.length > 0) {
                    const nextSong = results[0];
                    const songResponse = await fetch(
                        `${this.apiBase}?types=url&source=${nextSong.source || this.defaultSource}&id=${nextSong.id}&br=320`
                    );
                    const songData = await songResponse.json();
                    
                    if (songData.url) {
                        const preloadAudio = new Audio();
                        preloadAudio.src = songData.url;
                        preloadAudio.preload = 'auto';
                    }
                }
            } catch (error) {
                console.error('预加载下一页第一首歌曲时出错:', error);
            }
        }
    }

    playAllSongs() {
        if (this.currentPlaylist.length > 0) {
            this.playSongFromPlaylist(0);
        }
    }

    playNextSong() {
        if (this.currentPlaylist.length > 0) {
            const nextIndex = this.currentPlayingIndex + 1;
            
            const nextPageNum = Math.floor(nextIndex / this.pageSize) + 1;
            
            if (nextPageNum === this.currentPage && 
                nextIndex % this.pageSize < this.currentPlaylist.length) {
                this.playSongFromPlaylist(nextIndex);
            } 
            else if (this.isAutoPlayEnabled && this.currentKeyword) {
                if (nextPageNum <= this.totalPages) {
                    this.goToPage(nextPageNum);
                } 
                else if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                } 
                else {
                    this.playSongFromPlaylist(0);
                }
            } 
            else {
                this.playSongFromPlaylist(0);
            }
        }
    }
    
    playPrevSong() {
        if (this.currentPlaylist.length > 0) {
            const prevIndex = this.currentPlayingIndex - 1;
            
            const prevPageNum = prevIndex >= 0 ? Math.floor(prevIndex / this.pageSize) + 1 : 1;
            
            if (prevIndex >= 0 && prevPageNum === this.currentPage) {
                this.playSongFromPlaylist(prevIndex);
            } else if (prevIndex >= 0) {
                this.goToPage(prevPageNum);
            } else {
                const lastPageIndex = this.currentPlaylist.length - 1;
                const lastSongGlobalIndex = (this.currentPage - 1) * this.pageSize + lastPageIndex;
                this.playSongFromPlaylist(lastSongGlobalIndex);
            }
        }
    }

    toggleAutoPlay() {
        this.isAutoPlayEnabled = !this.isAutoPlayEnabled;
        const autoPlayBtn = document.querySelector('#api-playlist-content .playlist-auto-play-btn');
        if (autoPlayBtn) {
            autoPlayBtn.textContent = this.isAutoPlayEnabled ? '🔁 自动播放 (开)' : '🔁 自动播放';
        }
    }

    saveSearchHistory(keyword, source) {
        const existingIndex = this.searchHistory.findIndex(item => 
            item.keyword === keyword && item.source === source);
        
        if (existingIndex !== -1) {
            this.searchHistory.splice(existingIndex, 1);
        }
        
        this.searchHistory.unshift({
            keyword: keyword,
            source: source,
            timestamp: Date.now()
        });
        
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        try {
            localStorage.setItem('apiPlaylistSearchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('保存搜索历史失败:', e);
        }
    }

    removeSearchHistory(keyword, source) {
        this.searchHistory = this.searchHistory.filter(item => 
            !(item.keyword === keyword && item.source === source));
        
        try {
            localStorage.setItem('apiPlaylistSearchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('保存搜索历史失败:', e);
        }
    }

    loadSearchHistory() {
        try {
            const history = localStorage.getItem('apiPlaylistSearchHistory');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }
        } catch (e) {
            console.error('加载搜索历史失败:', e);
            this.searchHistory = [];
        }
    }

    renderSearchHistory() {
        const historyContainer = document.querySelector('#api-playlist-content .search-history-tags');
        if (!historyContainer) return;
        
        if (this.searchHistory.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">暂无搜索历史</div>';
            return;
        }
        
        let html = '';
        this.searchHistory.forEach(item => {
            const sourceNames = {
                'netease': '网易云',
                'kuwo': '酷我',
                'joox': 'JOOX',
                'tencent': 'QQ音乐',
                'kugou': '酷狗'
            };
            
            const sourceName = sourceNames[item.source] || item.source;
            
            html += `<div class="history-tag" data-keyword="${item.keyword}" data-source="${item.source}">`;
            html += `<div class="history-content">`;
            html += `<span class="history-keyword">${item.keyword}</span>`;
            html += `<span class="history-source">${sourceName}</span>`;
            html += `</div>`;
            html += '<span class="delete-history-btn" title="删除此记录">×</span>';
            html += `</div>`;
        });
        
        historyContainer.innerHTML = html;
    }

    refreshSearchHistory() {
        this.loadSearchHistory();
        this.renderSearchHistory();
    }
}