// 本地资源管理器 - 用于处理本地文件和资源
class LocalResourceManager {
    constructor() {
        this.localFiles = [];
        this.playlists = [];
        this.loadFromLocalStorage();
    }
    
    init() {
        // 从本地存储加载已保存的文件信息
        this.loadFromLocalStorage();
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
            file: file // 保存原始文件对象
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
        return this.localFiles;
    }

    // 根据ID获取文件
    getFileById(fileId) {
        return this.localFiles.find(file => file.id === fileId);
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
                // 这里只加载元数据，实际文件需要重新添加
                console.log('从本地存储加载了', fileMetadata.length, '个文件的元数据');
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

// 将LocalResourceManager挂载到window对象上
window.LocalResourceManager = LocalResourceManager;

// 添加ES6默认导出以支持现代模块导入方式
export default LocalResourceManager;

// 添加命名导出以支持按需导入
export { LocalResourceManager };