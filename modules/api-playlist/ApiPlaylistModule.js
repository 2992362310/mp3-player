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
        this.isAutoPlayEnabled = true; // 是否启用自动播放，默认开启
        
        // 分页相关属性
        this.currentPage = 1;       // 当前页码
        this.totalPages = 1;        // 总页数
        this.pageSize = 20;         // 每页显示条目数
        this.currentKeyword = '';   // 当前搜索关键词
        this.currentSource = '';    // 当前音乐源
        
        // 搜索历史相关属性
        this.searchHistory = [];    // 搜索历史记录
        this.maxHistoryItems = 10;  // 最大历史记录数
        
        // 保存事件处理函数的引用，用于正确地添加和移除事件监听器
        this.eventHandlers = {};
        
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 初始化UI
        this.initializeUI();
        
        // 加载搜索历史
        this.loadSearchHistory();
        this.renderSearchHistory();
        
        // 监听音频播放结束事件
        this.eventBus.on('audioEnded', () => {
            if (this.isAutoPlayEnabled && this.currentPlayingIndex >= 0) {
                this.playNextSong();
            }
        });
        
        // 监听音频开始播放事件
        this.eventBus.on('playbackStarted', () => {
            // 当音频开始播放时，预加载下一首歌曲
            this.preloadNextSong();
        });
        
        // 监听底部控制器的上一首按钮事件
        this.eventBus.on('playPrevTrack', () => {
            this.playPrevSong();
        });
        
        // 监听底部控制器的下一首按钮事件
        this.eventBus.on('playNextTrack', () => {
            this.playNextSong();
        });
        
        // 监听模块激活事件，用于在页面切换回来时重新加载历史记录
        this.eventBus.on('apiPlaylistActivated', () => {
            this.refreshSearchHistory();
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

        // 分页按钮事件
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
                // 允许导航到下一页，即使可能没有更多数据
                if (this.currentKeyword) {
                    this.goToPage(this.currentPage + 1);
                }
            };
            nextBtn.addEventListener('click', this.eventHandlers.nextBtnClick);
        }

        // 搜索历史标签点击事件（使用事件委托）
        const historyContainer = document.querySelector('#api-playlist-content .search-history-tags');
        if (historyContainer) {
            this.eventHandlers.historyContainerClick = (e) => {
                // 处理搜索历史标签点击（点击在.history-tag元素或其子元素上）
                const historyTag = e.target.closest('.history-tag');
                if (historyTag && !e.target.classList.contains('delete-history-btn')) {
                    const keyword = historyTag.getAttribute('data-keyword');
                    const source = historyTag.getAttribute('data-source');
                    
                    // 设置搜索框和源选择器的值
                    const searchInput = document.querySelector('#api-playlist-content .api-search-input');
                    const sourceSelect = document.querySelector('#api-playlist-content .api-source-select');
                    
                    if (searchInput) searchInput.value = keyword;
                    if (sourceSelect) sourceSelect.value = source;
                    
                    // 执行搜索
                    this.searchInPlaylistTab();
                }
                // 处理删除按钮点击
                else if (e.target.classList.contains('delete-history-btn')) {
                    const tag = e.target.closest('.history-tag');
                    if (tag) {
                        const keyword = tag.getAttribute('data-keyword');
                        const source = tag.getAttribute('data-source');
                        
                        // 删除历史记录
                        this.removeSearchHistory(keyword, source);
                        
                        // 重新渲染搜索历史
                        this.renderSearchHistory();
                    }
                }
            };
            historyContainer.addEventListener('click', this.eventHandlers.historyContainerClick);
        }

        // API播放列表模块事件绑定逻辑
        console.log('API播放列表模块事件绑定完成');
    }
    
    // 解绑事件监听器，防止重复绑定
    unbindEvents() {
        // 定义选择器和事件处理函数的映射关系
        const selectorHandlerMap = {
            '#api-playlist-content .api-search-btn': 'apiPlaylistSearchBtnClick',
            '#api-playlist-content .api-search-input': 'apiPlaylistSearchInputKeyup',
            '#api-playlist-content .playlist-auto-play-btn': 'autoPlayBtnClick',
            '#api-playlist-content .api-playlist-results': 'playlistResultsContainerClick',
            '#api-playlist-content .prev-btn': 'prevBtnClick',
            '#api-playlist-content .next-btn': 'nextBtnClick',
            '#api-playlist-content .search-history-tags': 'historyContainerClick'
        };

        // 遍历映射关系，解绑事件
        Object.entries(selectorHandlerMap).forEach(([selector, handlerKey]) => {
            const element = document.querySelector(selector);
            if (element && this.eventHandlers[handlerKey]) {
                element.removeEventListener('click', this.eventHandlers[handlerKey]);
            }
        });

        // 清空事件处理函数引用
        this.eventHandlers = {};
    }
    
    // UI初始化方法
    initializeUI() {
        console.log('API播放列表模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
        // 确保每次UI初始化时都刷新搜索历史
        this.refreshSearchHistory();
    }

    // 在播放列表标签页中搜索
    async searchInPlaylistTab() {
        const searchInput = document.querySelector('#api-playlist-content .api-search-input');
        const sourceSelect = document.querySelector('#api-playlist-content .api-source-select');
        
        const keyword = searchInput ? searchInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (keyword) {
            // 保存搜索历史
            this.saveSearchHistory(keyword, source);
            this.renderSearchHistory();
            
            // 重置页码
            this.currentPage = 1;
            this.currentKeyword = keyword;
            this.currentSource = source;
            
            await this.performSearch(keyword, source, this.currentPage);
        }
    }

    // 执行搜索
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
                // 尝试从响应头或结果中获取总数信息
                // 如果API不返回总数，我们假设如果有完整页的数据就可能还有下一步
                if (results && Array.isArray(results)) {
                    this.totalPages = page; // 默认当前页为最后一页
                    // 如果结果数量等于页面大小，可能还有更多页面
                    if (results.length >= this.pageSize) {
                        this.totalPages = page + 1; // 假设还有下一页
                    }
                    
                    // 如果是第一页且结果少于页面大小，则只有一页
                    if (page === 1 && results.length < this.pageSize) {
                        this.totalPages = page;
                    }
                } else {
                    this.totalPages = 1;
                }
                
                // 更新分页控件
                this.updatePagination();
                
                if (!results || !Array.isArray(results) || results.length === 0) {
                    resultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
                    return;
                }
                
                // 更新播放列表
                this.currentPlaylist = results;
                
                // 显示搜索结果
                this.displayPlaylistResults(results);
                
                // 启用播放按钮
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

    // 跳转到指定页
    async goToPage(page) {
        if (page >= 1 && this.currentKeyword) {
            this.currentPage = page;
            await this.performSearch(this.currentKeyword, this.currentSource, this.currentPage);
        }
    }

    // 更新分页控件
    updatePagination() {
        const prevBtn = document.querySelector('#api-playlist-content .prev-btn');
        const nextBtn = document.querySelector('#api-playlist-content .next-btn');
        const currentPageEl = document.querySelector('#api-playlist-content .current-page');
        const totalPagesEl = document.querySelector('#api-playlist-content .total-pages');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            // 只有当没有执行搜索时才禁用下一页按钮
            // 或者当前页面远大于可能的总页数时禁用
            nextBtn.disabled = !this.currentKeyword || this.currentPage > this.totalPages + 3;
        }
        
        if (currentPageEl) {
            currentPageEl.textContent = this.currentPage;
        }
        
        if (totalPagesEl) {
            // 显示一个合理的总页数估计
            const displayTotal = Math.max(this.totalPages, this.currentPage);
            totalPagesEl.textContent = displayTotal;
        }
    }

    // 显示播放列表搜索结果
    displayPlaylistResults(results) {
        const playlistResultsContainer = document.querySelector('#api-playlist-content .api-playlist-results');
        
        if (!playlistResultsContainer) return;
        
        if (!results || results.length === 0) {
            playlistResultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
            return;
        }
        
        // 更新播放列表
        this.currentPlaylist = results;
        
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
            
            // 计算全局索引（考虑分页）
            const globalIndex = (this.currentPage - 1) * this.pageSize + index;
            const isPlaying = this.currentPlayingIndex === globalIndex;
            
            playlistHtml += `
                <div class="playlist-item ${isPlaying ? 'playing' : ''}">
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

    // 播放播放列表中的歌曲
    async playSongFromPlaylist(index) {
        // 计算歌曲在当前播放列表中的页码和索引
        const pageIndex = index % this.pageSize;
        const pageNum = Math.floor(index / this.pageSize) + 1;
        
        // 如果请求的歌曲不在当前页，需要切换到对应页面
        if (pageNum !== this.currentPage) {
            this.currentPage = pageNum;
            await this.performSearch(this.currentKeyword, this.currentSource, this.currentPage);
            // 重新计算页面内索引
            const newPageIndex = index % this.pageSize;
            if (newPageIndex < 0 || newPageIndex >= this.currentPlaylist.length) return;
            
            const song = this.currentPlaylist[newPageIndex];
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
        } else {
            // 歌曲在当前页
            if (pageIndex < 0 || pageIndex >= this.currentPlaylist.length) return;
            
            const song = this.currentPlaylist[pageIndex];
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
    }
    
    // 预加载下一首歌曲
    async preloadNextSong() {
        // 计算下一首歌曲的索引
        const nextIndex = this.currentPlayingIndex + 1;
        
        // 如果有下一首歌曲，则预加载
        if (nextIndex < this.currentPlaylist.length) {
            const nextSong = this.currentPlaylist[nextIndex];
            try {
                // 获取下一首歌曲的URL
                const response = await fetch(
                    `${this.apiBase}?types=url&source=${nextSong.source || this.defaultSource}&id=${nextSong.id}&br=320`
                );
                const songData = await response.json();
                
                if (songData.url) {
                    // 创建一个隐藏的audio元素来预加载音频
                    const preloadAudio = new Audio();
                    preloadAudio.src = songData.url;
                    preloadAudio.preload = 'auto';
                    // 不播放，只预加载
                }
            } catch (error) {
                console.error('预加载下一首歌曲时出错:', error);
            }
        } else if (this.isAutoPlayEnabled && this.currentPage < this.totalPages) {
            // 如果是最后一首歌且启用了自动播放并且还有下一页，则预加载下一页的第一首歌
            try {
                // 获取下一页数据
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
                        // 创建一个隐藏的audio元素来预加载音频
                        const preloadAudio = new Audio();
                        preloadAudio.src = songData.url;
                        preloadAudio.preload = 'auto';
                        // 不播放，只预加载
                    }
                }
            } catch (error) {
                console.error('预加载下一页第一首歌曲时出错:', error);
            }
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
            const nextIndex = this.currentPlayingIndex + 1;
            
            // 计算下一首歌曲应在的页码
            const nextPageNum = Math.floor(nextIndex / this.pageSize) + 1;
            
            if (nextPageNum === this.currentPage && 
                nextIndex % this.pageSize < this.currentPlaylist.length) {
                // 在当前页内播放下一首
                this.playSongFromPlaylist(nextIndex);
            } else if (this.isAutoPlayEnabled) {
                // 如果启用了自动播放并且需要切换页面
                if (this.currentKeyword && nextPageNum <= this.totalPages) {
                    // 加载对应页面
                    this.goToPage(nextPageNum);
                } else if (this.currentKeyword && this.currentPage < this.totalPages) {
                    // 如果已经是最后一页但还有下一页
                    this.goToPage(this.currentPage + 1);
                } else {
                    // 没有更多歌曲，重新从第一首开始播放
                    this.playSongFromPlaylist(0);
                }
            } else {
                // 没有启用自动播放，重新从第一首开始播放
                this.playSongFromPlaylist(0);
            }
        }
    }
    
    // 播放上一首歌曲
    playPrevSong() {
        if (this.currentPlaylist.length > 0) {
            const prevIndex = this.currentPlayingIndex - 1;
            
            // 计算上一首歌曲应在的页码
            const prevPageNum = prevIndex >= 0 ? Math.floor(prevIndex / this.pageSize) + 1 : 1;
            
            if (prevIndex >= 0 && prevPageNum === this.currentPage) {
                // 在当前页内播放上一首
                this.playSongFromPlaylist(prevIndex);
            } else if (prevIndex >= 0) {
                // 需要切换到指定页面
                this.goToPage(prevPageNum);
            } else {
                // 如果是第一首歌，则播放当前播放列表的最后一首歌
                // 计算最后一首歌的索引
                const lastPageIndex = this.currentPlaylist.length - 1;
                const lastSongGlobalIndex = (this.currentPage - 1) * this.pageSize + lastPageIndex;
                this.playSongFromPlaylist(lastSongGlobalIndex);
            }
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

    // 保存搜索历史
    saveSearchHistory(keyword, source) {
        // 检查是否已存在相同的搜索历史
        const existingIndex = this.searchHistory.findIndex(item => 
            item.keyword === keyword && item.source === source);
        
        // 如果已存在，则移除旧的记录
        if (existingIndex !== -1) {
            this.searchHistory.splice(existingIndex, 1);
        }
        
        // 将新的搜索记录添加到开头
        this.searchHistory.unshift({
            keyword: keyword,
            source: source,
            timestamp: Date.now()
        });
        
        // 限制历史记录数量为10条
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        // 保存到localStorage
        try {
            localStorage.setItem('apiPlaylistSearchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('保存搜索历史失败:', e);
        }
    }

    // 删除指定的搜索历史记录
    removeSearchHistory(keyword, source) {
        // 过滤掉匹配的记录
        this.searchHistory = this.searchHistory.filter(item => 
            !(item.keyword === keyword && item.source === source));
        
        // 保存到localStorage
        try {
            localStorage.setItem('apiPlaylistSearchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('保存搜索历史失败:', e);
        }
    }

    // 加载搜索历史
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

    // 渲染搜索历史
    renderSearchHistory() {
        const historyContainer = document.querySelector('#api-playlist-content .search-history-tags');
        if (!historyContainer) return;
        
        if (this.searchHistory.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">暂无搜索历史</div>';
            return;
        }
        
        let html = '';
        this.searchHistory.forEach(item => {
            // 获取源的可读名称
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

    // 刷新搜索历史记录显示
    refreshSearchHistory() {
        // 重新加载搜索历史
        this.loadSearchHistory();
        // 重新渲染搜索历史
        this.renderSearchHistory();
    }
}