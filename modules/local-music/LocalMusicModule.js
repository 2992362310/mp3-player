import { eventBus } from '../../core/common/index.js';
import LocalResourceManager from './LocalResourceManager.js';

export default class LocalMusicModule {
    constructor() {
        this.localResourceManager = new LocalResourceManager();
        this.eventBus = eventBus;
        this.init();
    }

    init() {
        this.updateMusicList();
    }

    bindEvents() {
        this.attachScanButtonEvent();
        
        const waitForMusicTableBody = () => {
            const musicTableBody = document.getElementById('musicTableBody');
            if (musicTableBody) {
                musicTableBody.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    if (!row) return;
                    
                    if (e.target.classList.contains('play-btn')) {
                        const fileName = row.cells[1].textContent;
                        const fileSize = row.cells[5].textContent;
                        this.playFile(fileName, fileSize);
                    }
                    else if (e.target.classList.contains('reselect-btn')) {
                        const fileId = row.getAttribute('data-file-id');
                        this.reselectFile(fileId);
                    }
                });
            } else {
                setTimeout(waitForMusicTableBody, 100);
            }
        };
        
        waitForMusicTableBody();
    }
    
    attachScanButtonEvent() {
        const scanBtn = document.getElementById('scanMusicBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.scanMusic();
            });
        } else {
            setTimeout(() => this.attachScanButtonEvent(), 100);
        }
    }
    
    initializeUI() {
        const isFilePathSupported = typeof process !== 'undefined' && process.versions && process.versions.electron;
        
        if (isFilePathSupported) {
            const pathColumnHeader = document.getElementById('pathColumnHeader');
            if (pathColumnHeader) {
                pathColumnHeader.style.display = '';
            }
        }
    }

    isElectronEnvironment() {
        return typeof process !== 'undefined' && process.versions && process.versions.electron;
    }

    scanMusic() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'audio/*';

        input.onchange = (e) => {
            const files = e.target.files;
            this.localResourceManager.handleFileSelect(files);
            this.updateMusicList();

            this.eventBus.emit('localMusicScanned', {
                files: this.localResourceManager.getFiles()
            });
        };

        input.click();
    }

    playFile(fileName, fileSize) {
        const files = this.localResourceManager.getFiles();
        const file = files.find(f => f.name === fileName && this.formatFileSize(f.size) === fileSize);
        
        if (file) {
            this.eventBus.emit('playLocalFile', { file });
        } else {
            console.warn('[LocalMusicModule] 未找到匹配的文件，文件列表:', files, '查找条件:', fileName, fileSize);
        }
    }

    reselectFile(fileId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.localResourceManager.updateFile(fileId, file);
                this.updateMusicList();
                
                this.eventBus.emit('localMusicReselected', {
                    fileId: fileId,
                    file: file
                });
            }
        };

        input.click();
    }

    updateMusicList() {
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
        
        const isFilePathSupported = this.isElectronEnvironment();
        
        let html = '';
        files.forEach((file, index) => {
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}