/**
 * 播放列表模块事件管理器
 * 负责处理播放列表模块中的所有事件绑定和交互逻辑
 */

import { eventBus } from '../../core/common/index.js';

export default class PlaylistsModule {
    constructor() {
        // 使用全局EventBus实例
        this.eventBus = eventBus;
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 初始化UI
        this.initializeUI();
    }

    bindEvents() {
        // 监听本地音乐扫描完成事件
        this.eventBus.on('localMusicScanned', (data) => {
            console.log('播放列表模块接收到本地音乐扫描完成事件:', data);
            // 可以在这里处理本地音乐扫描完成后的逻辑
            // 例如更新播放列表视图等
        });
        
        // 播放列表模块事件绑定逻辑
        console.log('播放列表模块事件绑定完成');
    }

    // UI初始化方法
    initializeUI() {
        console.log('播放列表模块UI初始化完成');
        // 可以在这里添加更多UI初始化逻辑
    }

    // 显示播放列表
    displayPlaylists() {
        const container = document.querySelector('.playlists-container');
        if (!container) return;
        
        // 模拟播放列表数据
        const mockPlaylists = [
            { id: 1, name: '我的最爱', count: 12, duration: '45:30' },
            { id: 2, name: '摇滚音乐', count: 24, duration: '1:30:45' },
            { id: 3, name: '流行歌曲', count: 18, duration: '1:02:20' }
        ];
        
        let html = '';
        mockPlaylists.forEach(playlist => {
            html += `
                <div class="playlist-item">
                    <div class="playlist-info">
                        <div class="playlist-name">${playlist.name}</div>
                        <div class="playlist-meta">${playlist.count} 首歌曲, ${playlist.duration}</div>
                    </div>
                    <button class="play-btn" data-playlist-id="${playlist.id}">播放</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // 创建播放列表
    createPlaylist() {
        // 发布事件通知创建播放列表
        this.eventBus.emit('createPlaylist');
    }

    // 播放播放列表
    playPlaylist(playlistId) {
        // 发布事件通知播放器播放播放列表
        this.eventBus.emit('playPlaylist', { playlistId });
    }
}