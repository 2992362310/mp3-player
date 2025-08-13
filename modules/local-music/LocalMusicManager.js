/**
 * 本地音乐管理器
 * 该文件属于local-music模块，负责本地音乐文件的扫描、播放和管理
 */

class LocalMusicManager {
    constructor() {
        this.localResourceManager = new LocalResourceManager();
        this.ui = new UIComponents();
        this.bottomControllerPlayer = null;
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
        
        // 尝试获取底部控制器播放器
        this.bottomControllerPlayer = window.bottomControllerPlayer;
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
        const musicList = document.getElementById('musicList');
        if (musicList) {
            musicList.addEventListener('click', (e) => {
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
            
            // 将文件列表传递给底部控制器播放器
            if (this.bottomControllerPlayer) {
                this.bottomControllerPlayer.setLocalFiles(this.localResourceManager.getFiles());
            }
        };
        
        input.click();
    }

    // 处理文件选择
    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 检查文件是否为音频文件
            if (this.isAudioFile(file)) {
                this.addFile(file);
            }
        }
        
        // 保存到本地存储
        this.saveToLocalStorage();
        
        // 更新UI
        this.updateMusicList();
        
        // 如果这是第一次添加文件，自动播放第一个文件
        if (this.localFiles.length > 0 && !this.currentPlayingFile) {
            this.playFile(this.localFiles[0]);
        }
    }

    // 检查文件是否为音频文件
    isAudioFile(file) {
        const audioTypes = [
            'audio/mpeg', 
            'audio/mp3', 
            'audio/wav', 
            'audio/ogg', 
            'audio/aac',
            'audio/flac'
        ];
        
        // 检查 MIME 类型
        if (audioTypes.includes(file.type)) {
            return true;
        }
        
        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }

    // 添加文件到本地音乐列表
    addFile(file) {
        // 检查文件是否已存在
        const existingFile = this.localFiles.find(f => 
            f.name === file.name && 
            f.size === file.size && 
            f.lastModified === file.lastModified
        );
        
        if (existingFile) {
            // 文件已存在，更新URL
            URL.revokeObjectURL(existingFile.url);
            existingFile.url = URL.createObjectURL(file);
            existingFile.file = file;
            return existingFile;
        }
        
        // 创建文件对象
        const fileObj = {
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            url: URL.createObjectURL(file),
            file: file
        };

        this.localFiles.push(fileObj);
        return fileObj;
    }

    // 根据ID播放文件
    playFile(fileName, fileSize) {
        const files = this.localResourceManager.getFiles();
        const file = files.find(f => f.name === fileName && this.formatFileSize(f.size) === fileSize);
        
        if (file && this.bottomControllerPlayer) {
            this.bottomControllerPlayer.playFile(file);
        }
    }

    // 更新播放器UI
    updatePlayerUI(file) {
        // 更新底部控制器中的歌曲信息
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');
        
        if (trackTitle) {
            trackTitle.textContent = file.name.replace(/\.[^/.]+$/, ""); // 移除文件扩展名
        }
        
        if (trackArtist) {
            // 简单地从文件名中提取艺术家信息（实际应用中可能需要读取ID3标签）
            trackArtist.textContent = '未知艺术家';
        }
        
        // 更新播放按钮状态
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.textContent = '⏸'; // 切换为暂停图标
        }
    }

    // 更新音乐列表UI
    updateMusicList() {
        const files = this.localResourceManager.getFiles();
        const musicList = document.getElementById('musicList');
        const emptyState = document.getElementById('emptyState');
        
        if (!musicList) return;
        
        if (files.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            musicList.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        let html = '';
        files.forEach((file, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${file.name}</td>
                    <td>${this.formatFileSize(file.size)}</td>
                    <td>
                        <button class="play-btn">▶</button>
                    </td>
                </tr>
            `;
        });
        
        musicList.innerHTML = html;
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 保存到本地存储
    saveToLocalStorage() {
        try {
            // 只保存文件元数据，不保存实际文件内容
            const fileMetadata = this.localFiles.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }));
            
            localStorage.setItem('localMusicFiles', JSON.stringify(fileMetadata));
        } catch (e) {
            console.warn('无法保存到本地存储:', e);
        }
    }


    // 获取所有本地文件
    getFiles() {
        return this.localResourceManager.getFiles();
    }
}