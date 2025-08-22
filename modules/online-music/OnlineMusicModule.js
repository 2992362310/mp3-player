/**
 * 在线音乐模块事件管理器
 * 负责处理在线音乐模块中的所有事件绑定和交互逻辑
 */
import { eventBus } from '../../core/common/index.js';

export default class OnlineMusicModule {
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
        
        // 绑定标签页切换事件
        const tabItems = document.querySelectorAll('.tab-item');
        this.eventHandlers.tabItemClick = (e) => {
            const tabId = e.target.getAttribute('data-tab');
            this.switchTab(tabId);
        };
        
        tabItems.forEach(item => {
            item.addEventListener('click', this.eventHandlers.tabItemClick);
        });

        // 绑定搜索按钮事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            this.eventHandlers.searchBtnClick = () => {
                this.searchMusic();
            };
            searchBtn.addEventListener('click', this.eventHandlers.searchBtnClick);
        }

        // 绑定回车键搜索事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            this.eventHandlers.searchInputKeyup = (e) => {
                if (e.key === 'Enter') {
                    this.searchMusic();
                }
            };
            searchInput.addEventListener('keyup', this.eventHandlers.searchInputKeyup);
        }

        // 使用事件委托处理播放按钮点击事件
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            this.eventHandlers.resultsContainerClick = (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const songId = e.target.getAttribute('data-song-id');
                    const source = e.target.getAttribute('data-source');
                    this.playSong(songId, source);
                }
            };
            resultsContainer.addEventListener('click', this.eventHandlers.resultsContainerClick);
        }

        // 使用事件委托处理API测试结果中的播放按钮点击事件
        const apiTestContainer = document.querySelector('.api-test-section');
        if (apiTestContainer) {
            this.eventHandlers.apiTestContainerClick = (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const url = e.target.getAttribute('data-url');
                    const songId = e.target.getAttribute('data-song-id');
                    const source = e.target.getAttribute('data-source');
                    this.playSongByUrl(url, songId, source);
                }
            };
            apiTestContainer.addEventListener('click', this.eventHandlers.apiTestContainerClick);
        }

        // 绑定API测试事件
        // 搜索API测试
        const apiSearchBtn = document.querySelector('.api-search-btn');
        if (apiSearchBtn) {
            this.eventHandlers.apiSearchBtnClick = () => {
                this.testSearchAPI();
            };
            apiSearchBtn.addEventListener('click', this.eventHandlers.apiSearchBtnClick);
        }

        // 歌曲链接API测试
        const apiUrlBtn = document.querySelector('.api-url-btn');
        if (apiUrlBtn) {
            this.eventHandlers.apiUrlBtnClick = () => {
                this.testUrlAPI();
            };
            apiUrlBtn.addEventListener('click', this.eventHandlers.apiUrlBtnClick);
        }

        // 专辑图片API测试
        const apiPicBtn = document.querySelector('.api-pic-btn');
        if (apiPicBtn) {
            this.eventHandlers.apiPicBtnClick = () => {
                this.testPicAPI();
            };
            apiPicBtn.addEventListener('click', this.eventHandlers.apiPicBtnClick);
        }

        // 歌词API测试
        const apiLyricBtn = document.querySelector('.api-lyric-btn');
        if (apiLyricBtn) {
            this.eventHandlers.apiLyricBtnClick = () => {
                this.testLyricAPI();
            };
            apiLyricBtn.addEventListener('click', this.eventHandlers.apiLyricBtnClick);
        }

        // API播放列表功能
        const apiPlaylistSearchBtn = document.querySelector('#api-playlist .api-search-btn');
        if (apiPlaylistSearchBtn) {
            this.eventHandlers.apiPlaylistSearchBtnClick = () => {
                this.searchInPlaylistTab();
            };
            apiPlaylistSearchBtn.addEventListener('click', this.eventHandlers.apiPlaylistSearchBtnClick);
        }

        // API播放列表回车搜索
        const apiPlaylistSearchInput = document.querySelector('#api-playlist .api-search-input');
        if (apiPlaylistSearchInput) {
            this.eventHandlers.apiPlaylistSearchInputKeyup = (e) => {
                if (e.key === 'Enter') {
                    this.searchInPlaylistTab();
                }
            };
            apiPlaylistSearchInput.addEventListener('keyup', this.eventHandlers.apiPlaylistSearchInputKeyup);
        }

        // 自动播放按钮
        const autoPlayBtn = document.querySelector('.playlist-auto-play-btn');
        if (autoPlayBtn) {
            this.eventHandlers.autoPlayBtnClick = () => {
                this.toggleAutoPlay();
            };
            autoPlayBtn.addEventListener('click', this.eventHandlers.autoPlayBtnClick);
        }

        // 使用事件委托处理播放列表中的播放按钮点击事件
        const playlistResultsContainer = document.querySelector('.api-playlist-results');
        if (playlistResultsContainer) {
            this.eventHandlers.playlistResultsContainerClick = (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    this.playSongFromPlaylist(index);
                }
            };
            playlistResultsContainer.addEventListener('click', this.eventHandlers.playlistResultsContainerClick);
        }

        // 在线音乐模块事件绑定逻辑
        console.log('在线音乐模块事件绑定完成');
    }
    
    // 解绑事件监听器，防止重复绑定
    unbindEvents() {
        // 解绑标签页切换事件
        const tabItems = document.querySelectorAll('.tab-item');
        if (this.eventHandlers.tabItemClick) {
            tabItems.forEach(item => {
                item.removeEventListener('click', this.eventHandlers.tabItemClick);
            });
        }

        // 解绑搜索按钮事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn && this.eventHandlers.searchBtnClick) {
            searchBtn.removeEventListener('click', this.eventHandlers.searchBtnClick);
        }

        // 解绑回车键搜索事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput && this.eventHandlers.searchInputKeyup) {
            searchInput.removeEventListener('keyup', this.eventHandlers.searchInputKeyup);
        }

        // 解绑播放按钮点击事件
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer && this.eventHandlers.resultsContainerClick) {
            resultsContainer.removeEventListener('click', this.eventHandlers.resultsContainerClick);
        }

        // 解绑API测试结果中的播放按钮点击事件
        const apiTestContainer = document.querySelector('.api-test-section');
        if (apiTestContainer && this.eventHandlers.apiTestContainerClick) {
            apiTestContainer.removeEventListener('click', this.eventHandlers.apiTestContainerClick);
        }

        // 解绑API测试事件
        const apiSearchBtn = document.querySelector('.api-search-btn');
        if (apiSearchBtn && this.eventHandlers.apiSearchBtnClick) {
            apiSearchBtn.removeEventListener('click', this.eventHandlers.apiSearchBtnClick);
        }

        const apiUrlBtn = document.querySelector('.api-url-btn');
        if (apiUrlBtn && this.eventHandlers.apiUrlBtnClick) {
            apiUrlBtn.removeEventListener('click', this.eventHandlers.apiUrlBtnClick);
        }

        const apiPicBtn = document.querySelector('.api-pic-btn');
        if (apiPicBtn && this.eventHandlers.apiPicBtnClick) {
            apiPicBtn.removeEventListener('click', this.eventHandlers.apiPicBtnClick);
        }

        const apiLyricBtn = document.querySelector('.api-lyric-btn');
        if (apiLyricBtn && this.eventHandlers.apiLyricBtnClick) {
            apiLyricBtn.removeEventListener('click', this.eventHandlers.apiLyricBtnClick);
        }

        // 解绑API播放列表功能事件
        const apiPlaylistSearchBtn = document.querySelector('#api-playlist .api-search-btn');
        if (apiPlaylistSearchBtn && this.eventHandlers.apiPlaylistSearchBtnClick) {
            apiPlaylistSearchBtn.removeEventListener('click', this.eventHandlers.apiPlaylistSearchBtnClick);
        }

        const apiPlaylistSearchInput = document.querySelector('#api-playlist .api-search-input');
        if (apiPlaylistSearchInput && this.eventHandlers.apiPlaylistSearchInputKeyup) {
            apiPlaylistSearchInput.removeEventListener('keyup', this.eventHandlers.apiPlaylistSearchInputKeyup);
        }

        // 解绑自动播放按钮
        const autoPlayBtn = document.querySelector('.playlist-auto-play-btn');
        if (autoPlayBtn && this.eventHandlers.autoPlayBtnClick) {
            autoPlayBtn.removeEventListener('click', this.eventHandlers.autoPlayBtnClick);
        }

        // 解绑播放列表中的播放按钮点击事件
        const playlistResultsContainer = document.querySelector('.api-playlist-results');
        if (playlistResultsContainer && this.eventHandlers.playlistResultsContainerClick) {
            playlistResultsContainer.removeEventListener('click', this.eventHandlers.playlistResultsContainerClick);
        }

        // 清空事件处理函数引用
        this.eventHandlers = {};
    }
    
    // UI初始化方法
    initializeUI() {
        console.log('在线音乐模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
    }

    // 标签页切换
    switchTab(tabId) {
        // 隐藏所有标签内容
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有标签项的激活状态
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(item => {
            item.classList.remove('active');
        });

        // 显示目标标签内容
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // 激活点击的标签项
        const activeTabItem = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTabItem) {
            activeTabItem.classList.add('active');
        }
    }

    // 搜索音乐
    async searchMusic() {
        const searchInput = document.querySelector('.search-input');
        const keyword = searchInput ? searchInput.value.trim() : '';
        
        if (keyword) {
            try {
                // 显示加载状态
                const resultsContainer = document.querySelector('.search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';
                }

                // 调用API搜索音乐
                const response = await fetch(
                    `${this.apiBase}?types=search&source=${this.defaultSource}&name=${encodeURIComponent(keyword)}&count=20&pages=1`
                );
                const results = await response.json();
                
                // 显示搜索结果
                this.displayResults(results);
            } catch (error) {
                console.error('搜索音乐时出错:', error);
                const resultsContainer = document.querySelector('.search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">搜索失败，请稍后重试</div>';
                }
            }
        }
    }

    // 播放歌曲
    async playSong(songId, source) {
        try {
            // 获取歌曲URL
            const response = await fetch(
                `${this.apiBase}?types=url&source=${source || this.defaultSource}&id=${songId}&br=320`
            );
            const songData = await response.json();
            
            if (songData.url) {
                // 发布事件通知播放器播放歌曲
                this.eventBus.emit('playOnlineSong', { 
                    songId,
                    url: songData.url,
                    source: source || this.defaultSource
                });
            } else {
                console.error('无法获取歌曲播放链接');
            }
        } catch (error) {
            console.error('获取歌曲播放链接时出错:', error);
        }
    }

    // 显示搜索结果
    displayResults(results) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;
        
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
            return;
        }
        
        let html = '<h3>搜索结果</h3>';
        html += '<div class="results-list">';
        
        results.forEach(song => {
            // 处理艺术家列表
            let artistNames = '';
            if (Array.isArray(song.artist)) {
                artistNames = song.artist.map(a => a.name || a).join(', ');
            } else {
                artistNames = song.artist || '未知艺术家';
            }
            
            html += `
                <div class="result-item">
                    <div class="song-info">
                        <div class="song-title">${song.name || '未知歌曲'}</div>
                        <div class="song-artist">${artistNames}</div>
                        <div class="song-album">${song.album || '未知专辑'}</div>
                    </div>
                    <button class="play-btn" data-song-id="${song.id}" data-source="${song.source || this.defaultSource}">播放</button>
                </div>
            `;
        });
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    }

    // 测试搜索API
    async testSearchAPI() {
        const keywordInput = document.querySelector('.api-search-input');
        const sourceSelect = document.querySelector('.api-source-select');
        
        const keyword = keywordInput ? keywordInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (keyword) {
            try {
                const resultsContainer = document.querySelector('.api-search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';
                }

                const response = await fetch(
                    `${this.apiBase}?types=search&source=${source}&name=${encodeURIComponent(keyword)}`
                );
                const results = await response.json();
                
                if (resultsContainer) {
                    if (!results || results.length === 0) {
                        resultsContainer.innerHTML = '<div class="no-results">未找到相关音乐</div>';
                        return;
                    }
                    
                    let html = '<h4>搜索结果:</h4>';
                    html += '<div class="results-list">';
                    results.forEach((song, index) => {
                        // 处理艺术家列表
                        let artistNames = '';
                        if (Array.isArray(song.artist)) {
                            artistNames = song.artist.map(a => a.name || a).join(', ');
                        } else {
                            artistNames = song.artist || '未知艺术家';
                        }
                        
                        html += `
                            <div class="result-item">
                                <div class="song-info">
                                    <div class="song-title">${song.name || '未知歌曲'} (ID: ${song.id})</div>
                                    <div class="song-artist">艺术家: ${artistNames}</div>
                                    <div class="song-album">专辑: ${song.album || '未知专辑'}</div>
                                    <div class="song-meta">音乐源: ${song.source || source} | Pic ID: ${song.pic_id || 'N/A'} | Lyric ID: ${song.lyric_id || 'N/A'}</div>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    resultsContainer.innerHTML = html;
                }
            } catch (error) {
                console.error('搜索API测试时出错:', error);
                const resultsContainer = document.querySelector('.api-search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">搜索失败，请稍后重试</div>';
                }
            }
        }
    }

    // 测试歌曲链接API
    async testUrlAPI() {
        const idInput = document.querySelector('.api-song-id-input');
        const sourceSelect = document.querySelector('.api-source-select:nth-child(2)'); // 第二个source select
        const qualitySelect = document.querySelector('.api-quality-select');
        
        const songId = idInput ? idInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        const quality = qualitySelect ? qualitySelect.value : '320';
        
        if (songId) {
            try {
                const resultsContainer = document.querySelector('.api-url-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">获取中...</div>';
                }

                const response = await fetch(
                    `${this.apiBase}?types=url&source=${source}&id=${songId}&br=${quality}`
                );
                const result = await response.json();
                
                if (resultsContainer) {
                    if (result && result.url) {
                        resultsContainer.innerHTML = `
                            <h4>歌曲链接信息:</h4>
                            <div class="result-item">
                                <div class="song-info">
                                    <div class="song-title">歌曲ID: ${songId}</div>
                                    <div class="song-artist">音乐源: ${source}</div>
                                    <div class="song-album">音质: ${result.br}kbps</div>
                                    <div class="song-meta">文件大小: ${result.size ? (result.size / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}</div>
                                    <div class="song-url">
                                        <button class="play-btn" data-url="${result.url}" data-song-id="${songId}" data-source="${source}">播放</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // 播放按钮将通过事件委托统一处理
                    } else {
                        resultsContainer.innerHTML = '<div class="error">无法获取歌曲链接</div>';
                    }
                }
            } catch (error) {
                console.error('歌曲链接API测试时出错:', error);
                const resultsContainer = document.querySelector('.api-url-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">获取失败，请稍后重试</div>';
                }
            }
        }
    }

    // 通过URL播放歌曲
    playSongByUrl(url, songId, source) {
        if (url) {
            // 发布事件通知播放器播放歌曲
            this.eventBus.emit('playOnlineSong', { 
                songId,
                url,
                source: source || this.defaultSource
            });
        } else {
            console.error('无法获取歌曲播放链接');
        }
    }

    // 测试专辑图片API
    async testPicAPI() {
        const idInput = document.querySelector('.api-pic-id-input');
        const sourceSelect = document.querySelector('.api-source-select:nth-child(3)'); // 第三个source select
        const sizeSelect = document.querySelector('.api-pic-size-select');
        
        const picId = idInput ? idInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        const size = sizeSelect ? sizeSelect.value : '300';
        
        if (picId) {
            try {
                const resultsContainer = document.querySelector('.api-pic-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">获取中...</div>';
                }

                const response = await fetch(
                    `${this.apiBase}?types=pic&source=${source}&id=${picId}&size=${size}`
                );
                const result = await response.json();
                
                if (resultsContainer) {
                    if (result && result.url) {
                        resultsContainer.innerHTML = `
                            <h4>专辑图片:</h4>
                            <div class="pic-container">
                                <img src="${result.url}" alt="专辑图片" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'><rect width=\\'200\\' height=\\'200\\' fill=\\'%23f0f0f0\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23999\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>图片加载失败</text></svg>'">
                                <p>图片链接: <a href="${result.url}" target="_blank">${result.url}</a></p>
                            </div>
                        `;
                    } else {
                        resultsContainer.innerHTML = '<div class="error">无法获取专辑图片</div>';
                    }
                }
            } catch (error) {
                console.error('专辑图片API测试时出错:', error);
                const resultsContainer = document.querySelector('.api-pic-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">获取失败，请稍后重试</div>';
                }
            }
        }
    }

    // 测试歌词API
    async testLyricAPI() {
        const idInput = document.querySelector('.api-lyric-id-input');
        const sourceSelect = document.querySelector('.api-source-select:nth-child(4)'); // 第四个source select
        
        const lyricId = idInput ? idInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (lyricId) {
            try {
                const resultsContainer = document.querySelector('.api-lyric-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">获取中...</div>';
                }

                const response = await fetch(
                    `${this.apiBase}?types=lyric&source=${source}&id=${lyricId}`
                );
                const result = await response.json();
                
                if (resultsContainer) {
                    if (result) {
                        let html = '<h4>歌词信息:</h4>';
                        if (result.lyric) {
                            html += `<h5>原歌词:</h5><pre>${result.lyric}</pre>`;
                        }
                        if (result.tlyric) {
                            html += `<h5>翻译歌词:</h5><pre>${result.tlyric}</pre>`;
                        }
                        if (!result.lyric && !result.tlyric) {
                            html += '<div class="no-results">未找到歌词</div>';
                        }
                        resultsContainer.innerHTML = html;
                    } else {
                        resultsContainer.innerHTML = '<div class="error">无法获取歌词</div>';
                    }
                }
            } catch (error) {
                console.error('歌词API测试时出错:', error);
                const resultsContainer = document.querySelector('.api-lyric-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">获取失败，请稍后重试</div>';
                }
            }
        }
    }

    // 在播放列表标签页中搜索
    async searchInPlaylistTab() {
        const searchInput = document.querySelector('#api-playlist .api-search-input');
        const sourceSelect = document.querySelector('#api-playlist .api-source-select');
        
        const keyword = searchInput ? searchInput.value.trim() : '';
        const source = sourceSelect ? sourceSelect.value : this.defaultSource;
        
        if (keyword) {
            try {
                const resultsContainer = document.querySelector('#api-playlist .api-search-results');
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
                    const autoPlayBtn = document.querySelector('.playlist-auto-play-btn');
                    if (autoPlayBtn) autoPlayBtn.disabled = false;
                }
            } catch (error) {
                console.error('搜索音乐时出错:', error);
                const resultsContainer = document.querySelector('#api-playlist .api-search-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="error">搜索失败，请稍后重试</div>';
                }
            }
        }
    }

    // 显示播放列表搜索结果
    displayPlaylistResults(results) {
        const searchResultsContainer = document.querySelector('#api-playlist .api-search-results');
        const playlistResultsContainer = document.querySelector('.api-playlist-results');
        
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
        const autoPlayBtn = document.querySelector('.playlist-auto-play-btn');
        if (autoPlayBtn) {
            autoPlayBtn.textContent = this.isAutoPlayEnabled ? '🔁 自动播放 (开)' : '🔁 自动播放';
        }
    }
}