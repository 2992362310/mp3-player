export default class LocalResourceManager {
    constructor() {
        this.localFiles = [];
        this.playlists = [];
        this.loadFromLocalStorage();
    }
    
    init() {
    }

    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (this.isAudioFile(file)) {
                this.addFile(file);
            }
        }
        
        this.saveToLocalStorage();
    }

    isAudioFile(file) {
        const audioTypes = [
            'audio/mpeg', 
            'audio/mp3', 
            'audio/wav', 
            'audio/ogg', 
            'audio/aac',
            'audio/flac'
        ];
        
        if (audioTypes.includes(file.type)) {
            return true;
        }
        
        const fileName = file.name.toLowerCase();
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac'];
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }

    addFile(file) {
        const fileObj = {
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            url: URL.createObjectURL(file),
            file: file,
            path: file.path || null
        };

        this.localFiles.push(fileObj);
        return fileObj;
    }

    removeFile(fileId) {
        const index = this.localFiles.findIndex(file => file.id === fileId);
        if (index !== -1) {
            URL.revokeObjectURL(this.localFiles[index].url);
            this.localFiles.splice(index, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    getFiles() {
        return this.localFiles.map(file => {
            if (file.onlyMetadata) {
                return {
                    ...file,
                    requiresLocalAccess: true
                };
            }
            return file;
        });
    }

    getFileById(fileId) {
        return this.localFiles.find(file => file.id === fileId);
    }

    updateFile(fileId, newFile) {
        const index = this.localFiles.findIndex(file => file.id === fileId);
        if (index !== -1) {
            this.localFiles[index] = {
                id: fileId,
                name: newFile.name,
                size: newFile.size,
                type: newFile.type,
                lastModified: newFile.lastModified,
                url: URL.createObjectURL(newFile),
                file: newFile,
                path: newFile.path || null
            };
            
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveToLocalStorage() {
        try {
            const fileMetadata = this.localFiles.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                path: file.path || null
            }));
            
            localStorage.setItem('localAudioFiles', JSON.stringify(fileMetadata));
        } catch (e) {
            console.warn('无法保存到本地存储:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('localAudioFiles');
            if (data) {
                const fileMetadata = JSON.parse(data);
                this.localFiles = fileMetadata.map(meta => ({
                    id: meta.id,
                    name: meta.name,
                    size: meta.size,
                    type: meta.type,
                    lastModified: meta.lastModified,
                    path: meta.path || null,
                    onlyMetadata: true,
                    url: null,
                    file: null
                }));
            }
        } catch (e) {
            console.warn('无法从本地存储加载:', e);
        }
    }

    clearAll() {
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