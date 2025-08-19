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

        // 在线音乐模块事件绑定逻辑
        console.log('在线音乐模块事件绑定完成');
    }
    
    // UI初始化方法
    initializeUI() {
        console.log('在线音乐模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
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
}