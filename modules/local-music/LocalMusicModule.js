/**
 * 本地音乐模块事件管理器
 * 负责处理本地音乐模块中的所有事件绑定和交互逻辑
 */

import { EventBus } from '../../core/common/index.js';
import LocalResourceManager from './LocalResourceManager.js';

export default class LocalMusicModule {
    constructor(eventBus) {
        this.localResourceManager = new LocalResourceManager();
        // 使用传入的EventBus实例或创建新的实例
        this.eventBus = eventBus || new EventBus();
        // 在构造函数中完成初始化，确保模块加载后能自动初始化
        this.init();
    }

    init() {
        // 初始化在ModuleLoader中统一处理
    }

    bindEvents() {
        // 立即尝试绑定扫描按钮事件，如果DOM还未加载完成，则使用DOMContentLoaded事件
        this.attachScanButtonEvent();
        
        // 使用事件委托处理播放列表中的播放按钮点击事件
        const waitForMusicTableBody = () => {
            const musicTableBody = document.getElementById('musicTableBody');
            if (musicTableBody) {
                musicTableBody.addEventListener('click', (e) => {
                    // 检查是否点击了播放按钮
                    if (e.target.classList.contains('play-btn')) {
                        const row = e.target.closest('tr');
                        if (row) {
                            const fileName = row.cells[1].textContent;
                            // 修复：文件大小在第6列（索引为5），而不是第3列（索引为2）
                            const fileSize = row.cells[5].textContent;
                            this.playFile(fileName, fileSize);
                        }
                    }
                });
            } else {
                // 如果元素不存在，稍后重试
                setTimeout(waitForMusicTableBody, 100);
            }
        };
        
        waitForMusicTableBody();
    }
    
    // 单独处理扫描按钮事件绑定
    attachScanButtonEvent() {
        const scanBtn = document.getElementById('scanMusicBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.scanMusic();
            });
        } else {
            // 如果按钮不存在，稍后重试
            setTimeout(() => this.attachScanButtonEvent(), 100);
        }
    }
    
    // UI初始化方法
    initializeUI() {
        // 可以在这里添加更多UI初始化逻辑
    }

    // 扫描音乐文件
    scanMusic() {
        // 创建文件选择输入框
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'audio/*';

        input.onchange = (e) => {
            const files = e.target.files;
            this.localResourceManager.handleFileSelect(files);
            this.updateMusicList();

            // 发布事件通知其他组件
            this.eventBus.emit('localMusicScanned', {
                files: this.localResourceManager.getFiles()
            });
        };

        input.click();
    }

    // 播放文件
    playFile(fileName, fileSize) {
        const files = this.localResourceManager.getFiles();
        const file = files.find(f => f.name === fileName && this.formatFileSize(f.size) === fileSize);
        
        if (file) {
            // 发布事件通知播放器播放文件
            this.eventBus.emit('playLocalFile', { file });
        } else {
            console.warn('[LocalMusicModule] 未找到匹配的文件，文件列表:', files, '查找条件:', fileName, fileSize);
        }
    }

    // 更新音乐列表UI
    updateMusicList() {
        const files = this.localResourceManager.getFiles();
        const musicTableBody = document.getElementById('musicTableBody');
        const emptyState = document.getElementById('emptyState');
        const musicList = document.getElementById('musicList');
        
        if (!musicTableBody) return;
        
        if (files.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            musicTableBody.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        if (musicList) musicList.style.display = 'block';
        
        let html = '';
        files.forEach((file, index) => {
            // 如果文件只有元数据（从localStorage加载的情况）
            if (file.onlyMetadata) {
                html += `
                    <tr>
                        <td class="index-col">${index + 1}</td>
                        <td class="title-col">${file.name}</td>
                        <td class="artist-col">${file.artist || '未知艺术家'}</td>
                        <td class="album-col">${file.album || '未知专辑'}</td>
                        <td class="duration-col">${file.duration || '00:00'}</td>
                        <td class="size-col">${file.size || '未知大小'}</td>
                        <td class="controls-col">
                            <button class="play-btn" disabled>播放（无文件）</button>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td class="index-col">${index + 1}</td>
                        <td class="title-col">${file.name}</td>
                        <td class="artist-col">未知艺术家</td>
                        <td class="album-col">未知专辑</td>
                        <td class="duration-col">00:00</td>
                        <td class="size-col">${this.formatFileSize(file.size)}</td>
                        <td class="controls-col">
                            <button class="play-btn">播放</button>
                        </td>
                    </tr>
                `;
            }
        });
        
        musicTableBody.innerHTML = html;
        
        // 如果有只有元数据的文件，显示提示信息
        const metadataOnlyFiles = files.some(file => file.onlyMetadata);
        if (metadataOnlyFiles) {
            const infoBar = document.createElement('div');
            infoBar.className = 'metadata-info';
            infoBar.textContent = '提示：列表中包含仅含元数据的文件（无实际音频文件）';
            musicList.parentNode.insertBefore(infoBar, musicList.nextSibling);
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}