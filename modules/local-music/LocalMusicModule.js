/**
 * 本地音乐模块事件管理器
 * 负责处理本地音乐模块中的所有事件绑定和交互逻辑
 */

class LocalMusicModule {
    constructor() {
        this.localResourceManager = new LocalResourceManager();
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
    }

    bindEvents() {
        // 扫描音乐按钮事件
        const scanBtn = document.getElementById('scanMusicBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.scanMusic();
            });
        }
        
        // 使用事件委托处理播放列表中的播放按钮点击事件
        const musicTableBody = document.getElementById('musicTableBody');
        if (musicTableBody) {
            musicTableBody.addEventListener('click', (e) => {
                // 检查是否点击了播放按钮
                if (e.target.classList.contains('play-btn')) {
                    const row = e.target.closest('tr');
                    if (row) {
                        const fileName = row.cells[1].textContent;
                        const fileSize = row.cells[2].textContent;
                        this.playFile(fileName, fileSize);
                    }
                }
            });
        }
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
            html += `
                <tr>
                    <td class="index-col">${index + 1}</td>
                    <td class="title-col">${file.name}</td>
                    <td class="artist-col">未知艺术家</td>
                    <td class="album-col">未知专辑</td>
                    <td class="duration-col">00:00</td>
                </tr>
            `;
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

// 将LocalMusicModule挂载到window对象上
window.LocalMusicModule = LocalMusicModule;