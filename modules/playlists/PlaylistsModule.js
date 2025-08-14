/**
 * 播放列表模块事件管理器
 * 负责处理播放列表模块中的所有事件绑定和交互逻辑
 */

class PlaylistsModule {
    constructor() {
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
    }

    bindEvents() {
        // 创建播放列表按钮事件
        const createBtn = document.getElementById('createPlaylistBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createPlaylist();
            });
        }
        
        // 使用事件委托处理播放列表项的播放按钮点击事件
        const playlistContainer = document.querySelector('.playlists-container');
        if (playlistContainer) {
            playlistContainer.addEventListener('click', (e) => {
                // 检查是否点击了播放按钮
                if (e.target.classList.contains('play-btn')) {
                    const playlistItem = e.target.closest('.playlist-item');
                    if (playlistItem) {
                        const playlistTitle = playlistItem.querySelector('.playlist-title').textContent;
                        this.playPlaylist(playlistTitle);
                    }
                }
                // 检查是否点击了更多按钮
                else if (e.target.classList.contains('more-btn')) {
                    const playlistItem = e.target.closest('.playlist-item');
                    if (playlistItem) {
                        const playlistTitle = playlistItem.querySelector('.playlist-title').textContent;
                        this.showPlaylistOptions(playlistTitle);
                    }
                }
            });
        }
        
        // 使用事件委托处理最近播放列表项点击事件
        const recentPlaylists = document.querySelector('.recent-playlists');
        if (recentPlaylists) {
            recentPlaylists.addEventListener('click', (e) => {
                const recentItem = e.target.closest('.recent-playlist-item');
                if (recentItem) {
                    const playlistTitle = recentItem.querySelector('.recent-playlist-title').textContent;
                    this.playRecentPlaylist(playlistTitle);
                }
            });
        }
    }

    // 创建播放列表
    createPlaylist() {
        // 发布事件通知创建播放列表
        this.eventBus.emit('createPlaylist');
        console.log('创建播放列表');
    }

    // 播放播放列表
    playPlaylist(playlistTitle) {
        // 发布事件通知播放播放列表
        this.eventBus.emit('playPlaylist', { playlist: playlistTitle });
        console.log(`播放播放列表: ${playlistTitle}`);
    }

    // 显示播放列表选项
    showPlaylistOptions(playlistTitle) {
        // 发布事件通知显示播放列表选项
        this.eventBus.emit('showPlaylistOptions', { playlist: playlistTitle });
        console.log(`显示播放列表选项: ${playlistTitle}`);
    }

    // 播放最近播放列表
    playRecentPlaylist(playlistTitle) {
        // 发布事件通知播放最近播放列表
        this.eventBus.emit('playRecentPlaylist', { playlist: playlistTitle });
        console.log(`播放最近播放列表: ${playlistTitle}`);
    }
}

// 将PlaylistsModule挂载到window对象上
window.PlaylistsModule = PlaylistsModule;