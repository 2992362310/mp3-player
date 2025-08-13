class UIComponents {
    constructor() {
        // 检查依赖项是否存在
        if (typeof EventBus === 'undefined') {
            throw new Error('EventBus is not defined. Please load EventBus.js before UIComponents.js');
        }
        
        // 初始化事件总线
        this.eventBus = new EventBus();
        
        this.initializeElements();
        this.isBottomControllerExpanded = false; // 添加底部控制器展开状态
        this.currentContent = 'local-music'; // 默认显示本地音乐
        this.contentCache = new Map(); // 添加内容缓存
        
        // 绑定事件监听器
        this.bindEventListeners();
    }
    
    initializeElements() {
        // 获取音频播放相关元素（使用更宽松的查找方式）
        this.audioPlayer = document.getElementById('audioPlayer') || null;
        this.audioFile = document.getElementById('audioFile') || null;
        this.playBtn = document.getElementById('playBtn') || null;
        this.pauseBtn = document.getElementById('pauseBtn') || null;
        this.stopBtn = document.getElementById('stopBtn') || null;
        this.progress = document.getElementById('progress') || null;
        this.currentTimeDisplay = document.getElementById('currentTime') || null;
        this.durationDisplay = document.getElementById('duration') || null;
        
        // 获取底部控制器相关元素
        this.bottomController = document.querySelector('.bottom-controller');
        this.expandBtn = document.querySelector('.expand-btn');
        this.controllerContainer = document.querySelector('.controller-container');
        this.expandContent = document.querySelector('.expand-content');
        
        // 获取侧边栏和主内容区域元素
        this.sidebar = document.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content');
    }
    
    // 检查必要的元素是否都存在
    elementsExist() {
        // 不再强制要求所有音频元素都存在，只检查必要的元素
        return this.mainContent && this.sidebar;
    }
    
    // 延迟初始化，确保DOM元素已加载
    delayInitialize() {
        return new Promise((resolve) => {
            const checkElements = () => {
                this.initializeElements();
                if (this.elementsExist()) {
                    // 初始化侧边栏菜单功能
                    this.initSidebarMenu();
                    resolve(true);
                } else {
                    setTimeout(checkElements, 100);
                }
            };
            checkElements();
        });
    }
    
    // 绑定事件监听器
    bindEventListeners() {
        // 监听播放状态变化事件
        this.eventBus.on('playbackStarted', (data) => {
            this.updateButtonStates(data.isPlaying);
        });
        
        this.eventBus.on('playbackPaused', () => {
            this.updateButtonStates(false);
        });
        
        this.eventBus.on('playbackStopped', () => {
            this.updateButtonStates(false);
            this.resetUI();
        });
        
        // 监听进度更新事件
        this.eventBus.on('progressUpdated', (data) => {
            this.updateProgress(data.percent);
        });
        
        // 监听时间更新事件
        this.eventBus.on('timeUpdated', (data) => {
            this.updateTimeDisplays(data.currentTime, data.duration);
        });
        
        // 监听时长更新事件
        this.eventBus.on('durationUpdated', (data) => {
            if (this.durationDisplay) {
                this.durationDisplay.textContent = data.duration;
            }
        });
        
        // 监听播放结束事件
        this.eventBus.on('audioEnded', () => {
            this.handleAudioEnded();
        });
    }
    
    // 处理音频播放结束事件
    handleAudioEnded() {
        this.updateButtonStates(false);
        if (this.progress) {
            this.progress.style.width = '0%';
        }
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = '00:00';
        }
    }
    
    // 绑定导航菜单事件（用于优化事件处理）
    bindNavEvents() {
        // 使用事件委托处理导航点击
        const navMenu = this.sidebar?.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const targetLink = e.target.closest('.nav-item a');
                if (targetLink) {
                    const target = targetLink.dataset.target;
                    if (target && target !== this.currentContent) {
                        // 更新活动状态
                        document.querySelectorAll('.nav-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        targetLink.closest('.nav-item').classList.add('active');
                        
                        // 加载内容
                        await this.loadContent(target);
                    }
                }
            });
        }
    }
    
    // 初始化侧边栏菜单功能
    initSidebarMenu() {
        if (this.sidebar) {
            // 为侧边栏菜单项添加点击事件
            const menuItems = this.sidebar.querySelectorAll('.nav-item');
            menuItems.forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const target = link.getAttribute('data-target');
                        this.switchContent(target);
                    });
                }
            });
        }
        
        // 初始化当前内容
        this.initCurrentContent();
    }

    // 初始化当前内容
    async initCurrentContent() {
        // 如果已经有缓存内容，直接使用
        if (this.contentCache && this.contentCache.has(this.currentContent)) {
            this.mainContent.innerHTML = this.contentCache.get(this.currentContent);
            this.initContentLoadedContent(this.currentContent);
        } else {
            // 否则加载内容
            await this.loadContent(this.currentContent);
        }
    }
    
    // 切换内容显示
    async switchContent(target) {
        // 如果是相同的内容类型，直接返回
        if (target === this.currentContent) {
            return;
        }
        
        // 更新当前内容标识
        this.currentContent = target;
        
        // 更新侧边栏活动状态
        const menuItems = this.sidebar.querySelectorAll('.nav-item');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('data-target') === target) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 加载并显示新内容
        await this.loadContent(target);
    }
    
    // 加载内容
    async loadContent(contentType) {
        if (!this.mainContent) return;
        
        try {
            // 显示加载状态
            this.mainContent.innerHTML = '<div class="loading">加载中...</div>';
            
            // 按需加载内容CSS
            await ModuleLoader.loadContentCSS(contentType);
            
            // 构建内容文件路径
            const contentPath = this.getContentPath(contentType);
            
            // 获取内容
            const response = await fetch(contentPath);
            if (!response.ok) {
                throw new Error(`无法加载内容: ${contentPath}`);
            }
            
            const content = await response.text();
            
            // 缓存内容
            this.contentCache.set(contentType, content);
            
            // 替换主内容区域的内容
            this.mainContent.innerHTML = content;
            
            // 初始化新加载内容中的任何必要功能
            this.initContentLoadedContent(contentType);
            
            console.log(`内容加载完成: ${contentType}`);
        } catch (error) {
            console.error('加载内容时出错:', error);
            this.mainContent.innerHTML = '<div class="error">内容加载失败</div>';
        }
    }
    
    // 获取内容路径
    getContentPath(contentType) {
        // 根据内容类型返回对应的文件路径
        const contentPaths = {
            'local-music': './modules/local-music/local-music.html', // 修正本地音乐内容的加载路径
            'online-music': './modules/online-music/online-music.html', // 修正在线音乐内容的加载路径
            'playlists': './modules/playlists/playlists.html', // 修正播放列表内容的加载路径
            'settings': './modules/settings/settings.html' // 修正设置内容的加载路径
        };
        
        return contentPaths[contentType] || `./components/html/${contentType}.html`;
    }
    
    // 初始化加载内容后需要的功能
    initContentLoadedContent(contentType) {
        // 根据内容类型初始化特定功能
        switch (contentType) {
            case 'local-music':
                this.initLocalMusicContent();
                break;
            case 'online-music':
                this.initOnlineMusicContent();
                break;
            case 'playlists':
                this.initPlaylistsContent();
                break;
            case 'settings':
                this.initSettingsContent();
                break;
            // 其他内容类型的初始化可以在这里添加
        }
    }
    
    // 初始化本地音乐内容功能
    initLocalMusicContent() {
        const scanBtn = document.getElementById('scanMusicBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                alert('扫描功能将在后续版本中实现');
            });
        }
    }
    
    // 初始化在线音乐内容功能
    initOnlineMusicContent() {
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                alert('搜索功能将在后续版本中实现');
            });
        }
        
        const playBtns = document.querySelectorAll('.play-btn');
        playBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert('播放功能将在后续版本中实现');
            });
        });
        
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                alert('分类浏览功能将在后续版本中实现');
            });
        });
    }
    
    // 初始化播放列表内容功能
    initPlaylistsContent() {
        const createBtn = document.getElementById('createPlaylistBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                alert('创建播放列表功能将在后续版本中实现');
            });
        }
        
        // 为播放列表中的播放按钮添加事件监听器
        const playlistPlayBtns = document.querySelectorAll('.playlist-item .play-btn');
        playlistPlayBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistTitle = e.target.closest('.playlist-item').querySelector('.playlist-title').textContent;
                alert(`播放列表 "${playlistTitle}" 功能将在后续版本中实现`);
            });
        });
        
        // 为更多按钮添加事件监听器
        const moreBtns = document.querySelectorAll('.playlist-item .more-btn');
        moreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistTitle = e.target.closest('.playlist-item').querySelector('.playlist-title').textContent;
                alert(`播放列表 "${playlistTitle}" 的更多操作功能将在后续版本中实现`);
            });
        });
        
        // 为最近播放列表项添加点击事件
        const recentPlaylists = document.querySelectorAll('.recent-playlist-item');
        recentPlaylists.forEach(item => {
            item.addEventListener('click', () => {
                const playlistTitle = item.querySelector('.recent-playlist-title').textContent;
                alert(`播放最近播放列表 "${playlistTitle}" 功能将在后续版本中实现`);
            });
        });
    }
    
    // 初始化设置内容功能
    initSettingsContent() {
        // 为缓存清理按钮添加事件监听器
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                alert('缓存清理功能将在后续版本中实现');
            });
        }
        
        // 为数据清理按钮添加事件监听器
        const clearStorageBtn = document.getElementById('clearStorageBtn');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', () => {
                alert('数据清理功能将在后续版本中实现');
            });
        }
        
        // 为检查更新按钮添加事件监听器
        const checkUpdateBtn = document.getElementById('checkUpdateBtn');
        if (checkUpdateBtn) {
            checkUpdateBtn.addEventListener('click', () => {
                alert('检查更新功能将在后续版本中实现');
            });
        }
        
        // 为所有开关添加事件监听器
        const switches = document.querySelectorAll('.switch input');
        switches.forEach(switchElem => {
            switchElem.addEventListener('change', (e) => {
                const settingLabel = e.target.closest('.setting-item').querySelector('.setting-label').textContent;
                const isEnabled = e.target.checked;
                console.log(`${settingLabel} 设置已${isEnabled ? '启用' : '禁用'}`);
            });
        });
        
        // 为所有选择框添加事件监听器
        const selects = document.querySelectorAll('.setting-select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const settingLabel = e.target.closest('.setting-item').querySelector('.setting-label').textContent;
                const selectedValue = e.target.value;
                console.log(`${settingLabel} 设置已更改为: ${selectedValue}`);
            });
        });
    }
    
    // 初始化底部控制器展开功能
    initBottomControllerExpand() {
        if (this.expandBtn && this.bottomController) {
            this.expandBtn.addEventListener('click', () => {
                this.toggleBottomController();
            });
        }
    }
    
    // 切换底部控制器展开状态
    toggleBottomController() {
        if (!this.bottomController || !this.expandBtn || !this.expandContent) return;
        
        this.isBottomControllerExpanded = !this.isBottomControllerExpanded;
        
        if (this.isBottomControllerExpanded) {
            // 展开控制器
            this.bottomController.classList.add('expanded');
            if (this.expandBtn) {
                this.expandBtn.textContent = '⬇'; // 改为向下箭头
            }
            if (this.expandContent) {
                this.expandContent.style.display = 'block'; // 显示展开内容
            }
            
            // 增加控制器高度以显示更多内容
            // 这里可以根据需要添加更多详细内容
        } else {
            // 收起控制器
            this.bottomController.classList.remove('expanded');
            if (this.expandBtn) {
                this.expandBtn.textContent = '⬆'; // 改为向上箭头
            }
            if (this.expandContent) {
                this.expandContent.style.display = 'none'; // 隐藏展开内容
            }
        }
    }
    
    // 更新按钮状态
    updateButtonStates(isPlayingFile) {
        // 只在元素存在时更新状态
        if (this.playBtn) {
            this.playBtn.disabled = !isPlayingFile;
        }
        if (this.pauseBtn) {
            this.pauseBtn.disabled = !isPlayingFile;
        }
        if (this.stopBtn) {
            this.stopBtn.disabled = !isPlayingFile;
        }
    }
    
    // 更新进度条显示
    updateProgress(percent) {
        if (this.progress) {
            this.progress.style.width = percent + '%';
        }
    }
    
    // 更新时间显示
    updateTimeDisplays(currentTime, duration) {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = currentTime;
        }
        if (duration && this.durationDisplay) {
            this.durationDisplay.textContent = duration;
        }
    }
    
    // 重置播放器UI
    resetUI() {
        if (this.progress) {
            this.progress.style.width = '0%';
        }
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = '00:00';
        }
    }
    
    // 获取音频播放器元素
    getAudioPlayer() {
        return this.audioPlayer;
    }
    
    // 获取文件选择元素
    getAudioFile() {
        return this.audioFile;
    }
    
    // 获取按钮元素
    getPlayButton() {
        return this.playBtn;
    }
    
    getPauseButton() {
        return this.pauseBtn;
    }
    
    getStopButton() {
        return this.stopBtn;
    }
    
    // 获取进度和时间显示元素
    getProgressElement() {
        return this.progress;
    }
    
    getCurrentTimeDisplay() {
        return this.currentTimeDisplay;
    }
    
    getDurationDisplay() {
        return this.durationDisplay;
    }
    
    // 添加事件监听器方法
    on(eventName, callback) {
        this.eventBus.on(eventName, callback);
    }
    
    // 移除事件监听器方法
    off(eventName, callback) {
        this.eventBus.off(eventName, callback);
    }
}

// 将UIComponents挂载到window对象上
window.UIComponents = UIComponents;