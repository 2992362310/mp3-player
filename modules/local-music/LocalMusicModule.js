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
        // 从本地存储加载数据后，更新UI
        this.updateMusicList();
    }

    bindEvents() {
        // 立即尝试绑定扫描按钮事件，如果DOM还未加载完成，则使用DOMContentLoaded事件
        this.attachScanButtonEvent();
        
        // 使用事件委托处理播放列表中的播放按钮点击事件
        const waitForMusicTableBody = () => {
            const musicTableBody = document.getElementById('musicTableBody');
            if (musicTableBody) {
                musicTableBody.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    if (!row) return;
                    
                    // 检查是否点击了播放按钮
                    if (e.target.classList.contains('play-btn')) {
                        const fileName = row.cells[1].textContent;
                        // 修复：文件大小在第6列（索引为5），而不是第3列（索引为2）
                        const fileSize = row.cells[5].textContent;
                        this.playFile(fileName, fileSize);
                    }
                    // 检查是否点击了重新选择按钮
                    else if (e.target.classList.contains('reselect-btn')) {
                        const fileId = row.getAttribute('data-file-id');
                        this.reselectFile(fileId);
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
        // 检查是否在支持文件路径的环境中（如Electron）
        const isFilePathSupported = typeof process !== 'undefined' && process.versions && process.versions.electron;
        
        // 如果支持文件路径显示，则显示路径列
        if (isFilePathSupported) {
            const pathColumnHeader = document.getElementById('pathColumnHeader');
            if (pathColumnHeader) {
                pathColumnHeader.style.display = '';
            }
        }
        // 可以在这里添加更多UI初始化逻辑
    }

    // 检查是否在Electron环境中
    isElectronEnvironment() {
        return typeof process !== 'undefined' && process.versions && process.versions.electron;
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

    // 重新选择文件
    reselectFile(fileId) {
        // 创建文件选择输入框
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // 更新文件资源管理器中的文件
                this.localResourceManager.updateFile(fileId, file);
                // 更新音乐列表显示
                this.updateMusicList();
                
                // 发布事件通知其他组件
                this.eventBus.emit('localMusicReselected', {
                    fileId: fileId,
                    file: file
                });
            }
        };

        input.click();
    }

    // 更新音乐列表UI
    updateMusicList() {
        // 先初始化UI（包括检查是否显示路径列）
        this.initializeUI();
        
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
        
        // 检查是否在支持文件路径的环境中
        const isFilePathSupported = this.isElectronEnvironment();
        
        let html = '';
        files.forEach((file, index) => {
            // 如果文件只有元数据（从localStorage加载的情况）
            if (file.onlyMetadata) {
                html += `
                    <tr data-file-id="${file.id}">
                        <td class="index-col">${index + 1}</td>
                        <td class="title-col">${file.name}</td>
                        <td class="artist-col">${file.artist || '未知艺术家'}</td>
                        <td class="album-col">${file.album || '未知专辑'}</td>
                        <td class="duration-col">${file.duration || '00:00'}</td>
                        <td class="size-col">${file.size || '未知大小'}</td>
                        ${isFilePathSupported ? `<td class="path-col">${file.path || '未知路径'}</td>` : ''}
                        <td class="controls-col">
                            <button class="reselect-btn" title="重新选择文件">🔄</button>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr data-file-id="${file.id}">
                        <td class="index-col">${index + 1}</td>
                        <td class="title-col">${file.name}</td>
                        <td class="artist-col">未知艺术家</td>
                        <td class="album-col">未知专辑</td>
                        <td class="duration-col">00:00</td>
                        <td class="size-col">${this.formatFileSize(file.size)}</td>
                        ${isFilePathSupported ? `<td class="path-col">${file.path || '未知路径'}</td>` : ''}
                        <td class="controls-col">
                            <button class="play-btn" title="播放">▶️</button>
                        </td>
                    </tr>
                `;
            }
        });
        
        musicTableBody.innerHTML = html;
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