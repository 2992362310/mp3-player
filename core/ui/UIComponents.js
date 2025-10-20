/**
 * UI组件管理器
 * 负责管理和控制应用程序的主要UI组件
 */
export default class UIComponents {
    /**
     * 构造函数
     * @param {EventBus} eventBus - 事件总线实例
     */
    constructor(eventBus) {
        // 保存对EventBus实例的引用
        this.eventBus = eventBus;
        
        // 获取页面上的主要DOM元素引用
        this.topNav = document.querySelector('.top-nav');
        this.sidebar = document.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.bottomController = document.querySelector('.bottom-controller');
        
        // 内容缓存Map，用于缓存已加载的内容
        this.contentCache = new Map();
        
        // 事件处理函数引用，用于正确地添加和移除事件监听器
        this.eventHandlers = {};
        
        // 初始化UI组件
        this.init();
    }
    
    /**
     * 初始化UI组件
     */
    init() {
        // 绑定事件监听器
        this.bindEvents();
        
        // 加载初始内容
        this.loadContent('local-music');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 清理已存在的事件监听器
        this.unbindEvents();
        
        // 绑定侧边栏导航项点击事件
        if (this.sidebar) {
            this.eventHandlers.sidebarClick = (e) => {
                // 使用事件委托处理导航项点击
                if (e.target.closest('.nav-item')) {
                    const navItem = e.target.closest('.nav-item');
                    const target = navItem.getAttribute('data-target');
                    
                    // 更新活动状态
                    this.updateActiveNav(navItem);
                    
                    // 加载对应内容
                    this.loadContent(target);
                }
            };
            this.sidebar.addEventListener('click', this.eventHandlers.sidebarClick);
        }
        
        // 绑定顶部导航搜索事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            this.eventHandlers.searchInputKeyup = (e) => {
                if (e.key === 'Enter') {
                    // 触发搜索事件
                    this.eventBus.emit('search', { query: e.target.value });
                }
            };
            searchInput.addEventListener('keyup', this.eventHandlers.searchInputKeyup);
        }
        
        // 绑定底部控制器事件
        if (this.bottomController) {
            // 播放/暂停按钮事件
            const playPauseBtn = this.bottomController.querySelector('.play-pause-btn');
            if (playPauseBtn) {
                this.eventHandlers.playPauseClick = () => {
                    // 触发播放/暂停切换事件
                    this.eventBus.emit('togglePlayPause');
                };
                playPauseBtn.addEventListener('click', this.eventHandlers.playPauseClick);
            }
            
            // 上一首按钮事件
            const prevBtn = this.bottomController.querySelector('.prev-btn');
            if (prevBtn) {
                this.eventHandlers.prevClick = () => {
                    // 触发播放上一首事件
                    this.eventBus.emit('playPrev');
                };
                prevBtn.addEventListener('click', this.eventHandlers.prevClick);
            }
            
            // 下一首按钮事件
            const nextBtn = this.bottomController.querySelector('.next-btn');
            if (nextBtn) {
                this.eventHandlers.nextClick = () => {
                    // 触发播放下一首事件
                    this.eventBus.emit('playNext');
                };
                nextBtn.addEventListener('click', this.eventHandlers.nextClick);
            }
        }
    }
    
    /**
     * 解绑事件监听器
     */
    unbindEvents() {
        // 解绑侧边栏事件
        if (this.sidebar && this.eventHandlers.sidebarClick) {
            this.sidebar.removeEventListener('click', this.eventHandlers.sidebarClick);
        }
        
        // 解绑搜索事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput && this.eventHandlers.searchInputKeyup) {
            searchInput.removeEventListener('keyup', this.eventHandlers.searchInputKeyup);
        }
        
        // 解绑底部控制器事件
        if (this.bottomController) {
            const playPauseBtn = this.bottomController.querySelector('.play-pause-btn');
            if (playPauseBtn && this.eventHandlers.playPauseClick) {
                playPauseBtn.removeEventListener('click', this.eventHandlers.playPauseClick);
            }
            
            const prevBtn = this.bottomController.querySelector('.prev-btn');
            if (prevBtn && this.eventHandlers.prevClick) {
                prevBtn.removeEventListener('click', this.eventHandlers.prevClick);
            }
            
            const nextBtn = this.bottomController.querySelector('.next-btn');
            if (nextBtn && this.eventHandlers.nextClick) {
                nextBtn.removeEventListener('click', this.eventHandlers.nextClick);
            }
        }
        
        // 清空事件处理函数引用
        this.eventHandlers = {};
    }
    
    /**
     * 更新侧边栏活动导航项
     * @param {Element} activeItem - 当前活动的导航项元素
     */
    updateActiveNav(activeItem) {
        // 移除所有导航项的活动状态
        const navItems = this.sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // 为当前导航项添加活动状态
        activeItem.classList.add('active');
    }
    
    /**
     * 加载指定类型的内容
     * @param {string} contentType - 内容类型
     */
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
            case 'settings':
                this.initSettingsContent();
                break;
            // 其他内容类型的初始化可以在这里添加
        }
    }
    
    // 初始化本地音乐内容功能
    initLocalMusicContent() {
        // 创建本地音乐管理器实例
        if (!window.localMusicManager) {
            import('./modules/local-music/LocalMusicManager.js').then((module) => {
                window.localMusicManager = new module.LocalMusicManager();
            }).catch((error) => {
                console.error('加载本地音乐管理器失败:', error);
            });
        }
    }
    
    // 初始化设置内容功能
    initSettingsContent() {
        // 使用事件委托避免重复绑定
        if (this.mainContent) {
            this.mainContent.removeEventListener('click', this.settingsEventHandler);
            this.settingsEventHandler = (e) => {
                const target = e.target;
                if (target.classList.contains('save-settings-btn')) {
                    e.stopPropagation();
                    alert('保存设置功能将在后续版本中实现');
                } else if (target.classList.contains('reset-settings-btn')) {
                    e.stopPropagation();
                    alert('重置设置功能将在后续版本中实现');
                }
            };
            this.mainContent.addEventListener('click', this.settingsEventHandler);
        }
    }
}