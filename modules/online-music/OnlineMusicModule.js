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
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 初始化UI
        this.initializeUI();
    }

    bindEvents() {
        // 绑定标签页切换事件
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // 绑定搜索按钮事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchMusic();
            });
        }

        // 绑定回车键搜索事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.searchMusic();
                }
            });
        }

        // 使用事件委托处理播放按钮点击事件
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const songId = e.target.getAttribute('data-song-id');
                    const source = e.target.getAttribute('data-source');
                    this.playSong(songId, source);
                }
            });
        }

        // 使用事件委托处理API测试结果中的播放按钮点击事件
        const apiTestContainer = document.querySelector('.api-test-section');
        if (apiTestContainer) {
            apiTestContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('play-btn')) {
                    const url = e.target.getAttribute('data-url');
                    const songId = e.target.getAttribute('data-song-id');
                    const source = e.target.getAttribute('data-source');
                    this.playSongByUrl(url, songId, source);
                }
            });
        }

        // 绑定API测试事件
        // 搜索API测试
        const apiSearchBtn = document.querySelector('.api-search-btn');
        if (apiSearchBtn) {
            apiSearchBtn.addEventListener('click', () => {
                this.testSearchAPI();
            });
        }

        // 歌曲链接API测试
        const apiUrlBtn = document.querySelector('.api-url-btn');
        if (apiUrlBtn) {
            apiUrlBtn.addEventListener('click', () => {
                this.testUrlAPI();
            });
        }

        // 专辑图片API测试
        const apiPicBtn = document.querySelector('.api-pic-btn');
        if (apiPicBtn) {
            apiPicBtn.addEventListener('click', () => {
                this.testPicAPI();
            });
        }

        // 歌词API测试
        const apiLyricBtn = document.querySelector('.api-lyric-btn');
        if (apiLyricBtn) {
            apiLyricBtn.addEventListener('click', () => {
                this.testLyricAPI();
            });
        }

        // 在线音乐模块事件绑定逻辑
        console.log('在线音乐模块事件绑定完成');
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
                    `${this.apiBase}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=10&pages=1`
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
}