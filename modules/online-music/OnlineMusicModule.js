/**
 * 在线音乐模块事件管理器
 * 负责处理在线音乐模块中的所有事件绑定和交互逻辑
 */

class OnlineMusicModule {
    constructor() {
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 初始化UI
        this.initializeUI();
    }

    bindEvents() {
        // 搜索按钮事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchMusic();
            });
        }
        
        // 搜索输入框回车事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
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
                    const songId = e.target.dataset.songId;
                    this.playSong(songId);
                }
            });
        }
    }
    
    // UI初始化方法
    initializeUI() {
        console.log('在线音乐模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
    }

    // 搜索音乐
    searchMusic() {
        const searchInput = document.querySelector('.search-input');
        const keyword = searchInput ? searchInput.value.trim() : '';
        
        if (keyword) {
            // 这里应该调用实际的搜索API
            console.log(`搜索关键词: ${keyword}`);
            this.displayResults(keyword);
        }
    }

    // 播放歌曲
    playSong(songId) {
        console.log(`播放歌曲: ${songId}`);
        // 发布事件通知播放器播放歌曲
        this.eventBus.emit('playOnlineSong', { songId });
    }

    // 显示搜索结果
    displayResults(keyword) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;
        
        // 模拟搜索结果
        const mockResults = [
            { id: 1, title: `${keyword} - 歌曲1`, artist: '艺术家1', album: '专辑1' },
            { id: 2, title: `${keyword} - 歌曲2`, artist: '艺术家2', album: '专辑2' },
            { id: 3, title: `${keyword} - 歌曲3`, artist: '艺术家3', album: '专辑3' }
        ];
        
        let html = '<h3>搜索结果</h3>';
        html += '<div class="results-list">';
        
        mockResults.forEach(song => {
            html += `
                <div class="result-item">
                    <div class="song-info">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist}</div>
                        <div class="song-album">${song.album}</div>
                    </div>
                    <button class="play-btn" data-song-id="${song.id}">播放</button>
                </div>
            `;
        });
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    }
}

// 将OnlineMusicModule挂载到window对象上
window.OnlineMusicModule = OnlineMusicModule;