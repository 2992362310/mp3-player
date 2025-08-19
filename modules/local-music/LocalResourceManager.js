// 本地资源管理器 - 用于处理本地文件和资源
export default class LocalResourceManager {
    constructor() {
        this.localFiles = [];
        this.playlists = [];
        this.loadFromLocalStorage();
    }
    
    init() {
        // 初始化在构造函数中已完成
    }

    // 处理文件选择
    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 检查文件类型是否为音频文件
            if (this.isAudioFile(file)) {
                this.addFile(file);
            }
        }
        
        // 保存到本地存储
        this.saveToLocalStorage();
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
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac'];
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }

    // 添加文件到本地资源列表
    addFile(file) {
        // 创建文件对象
        const fileObj = {
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            url: URL.createObjectURL(file),
            file: file, // 保存原始文件对象
            path: file.path || null // 保存文件路径（如果可用）
        };

        this.localFiles.push(fileObj);
        return fileObj;
    }

    // 从本地资源列表中移除文件
    removeFile(fileId) {
        const index = this.localFiles.findIndex(file => file.id === fileId);
        if (index !== -1) {
            // 释放创建的对象URL
            URL.revokeObjectURL(this.localFiles[index].url);
            this.localFiles.splice(index, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // 获取所有本地文件
    getFiles() {
        // 返回所有文件，包括从localStorage加载的只有元数据的文件
        return this.localFiles.map(file => {
            // 为从localStorage加载的文件添加标记
            if (file.onlyMetadata) {
                return {
                    ...file,
                    requiresLocalAccess: true // 标记需要本地读取权限
                };
            }
            return file;
        });
    }

    // 根据ID获取文件
    getFileById(fileId) {
        return this.localFiles.find(file => file.id === fileId);
    }

    // 更新文件
    updateFile(fileId, newFile) {
        const index = this.localFiles.findIndex(file => file.id === fileId);
        if (index !== -1) {
            // 更新文件对象
            this.localFiles[index] = {
                id: fileId,
                name: newFile.name,
                size: newFile.size,
                type: newFile.type,
                lastModified: newFile.lastModified,
                url: URL.createObjectURL(newFile),
                file: newFile, // 保存原始文件对象
                path: newFile.path || null // 保存文件路径（如果可用）
            };
            
            // 保存到本地存储
            this.saveToLocalStorage();
            return true;
        }
        return false;
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
                lastModified: file.lastModified,
                path: file.path || null // 保存文件路径（如果可用）
            }));
            
            localStorage.setItem('localAudioFiles', JSON.stringify(fileMetadata));
        } catch (e) {
            console.warn('无法保存到本地存储:', e);
        }
    }

    // 从本地存储加载
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('localAudioFiles');
            if (data) {
                const fileMetadata = JSON.parse(data);
                // 加载文件元数据到localFiles数组
                this.localFiles = fileMetadata.map(meta => ({
                    id: meta.id,
                    name: meta.name,
                    size: meta.size,
                    type: meta.type,
                    lastModified: meta.lastModified,
                    path: meta.path || null, // 加载文件路径（如果可用）
                    // 添加onlyMetadata标志，用于UI区分从localStorage加载的文件
                    onlyMetadata: true,
                    // 注意：由于浏览器安全限制，我们无法恢复实际的文件对象和URL
                    // 这些文件需要用户重新选择才能播放
                    url: null,
                    file: null
                }));
            }
        } catch (e) {
            console.warn('无法从本地存储加载:', e);
        }
    }

    // 清空所有本地文件
    clearAll() {
        // 释放所有对象URL
        this.localFiles.forEach(file => {
            try {
                URL.revokeObjectURL(file.url);
            } catch (e) {
                console.warn('释放对象URL时出错:', e);
            }
        });
        
        this.localFiles = [];
        this.saveToLocalStorage();
    }
}