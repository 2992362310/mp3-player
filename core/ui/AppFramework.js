class AppFramework {
    constructor() {
        // 检查依赖项是否存在
        if (typeof EventBus === 'undefined') {
            throw new Error('EventBus is not defined. Please load EventBus.js before AppFramework.js');
        }
        
        // 初始化事件总线
        this.eventBus = new EventBus();
        
        
        this.initializeElements();
        this.currentContent = 'local-music'; // 默认显示本地音乐
        this.contentCache = new Map(); // 添加内容缓存
        this.moduleManagers = new Map(); // 添加模块管理器缓存
        
        // 绑定事件监听器
        this.bindEventListeners();
    }
    
    initializeElements() {
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
    async delayInitialize() {
        // 由于app.js已经确保所有HTML模块加载完成，这里可以直接初始化
        this.initializeElements();
        if (!this.elementsExist()) {
            throw new Error('必要的UI元素未找到');
        }
        
        
        // 初始化侧边栏菜单功能
        this.initSidebarMenu();
        return Promise.resolve(true);
    }
    
    // 绑定事件监听器
    bindEventListeners() {
        // AppFramework不再直接处理播放相关的事件，这些由BottomControllerModule处理
        // 但保留一些通用的UI事件监听
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
            await BusinessModuleLoader.loadContentCSS(contentType);
            
            // 构建内容文件路径
            const contentPath = BusinessModuleLoader.getContentPath(contentType);
            
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
            
            // 按需加载并初始化模块事件管理器
            await this.initModuleManager(contentType);
            
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
        // 从业务模块配置中获取HTML路径
        const moduleConfig = this.businessModules[contentType];
        if (moduleConfig && moduleConfig.html) {
            return moduleConfig.html;
        }
        
        // 根据内容类型返回对应的文件路径
        const contentPaths = {
            'local-music': './modules/local-music/local-music.html',
            'online-music': './modules/online-music/online-music.html',
            'playlists': './modules/playlists/playlists.html',
            'settings': './modules/settings/settings.html'
        };
        
        return contentPaths[contentType] || `./components/html/${contentType}.html`;
    }
    
    // 按需加载内容CSS（业务模块）
    async loadContentCSS(contentType) {
        // 从业务模块配置中获取CSS路径
        const moduleConfig = this.businessModules[contentType];
        const cssPath = moduleConfig && moduleConfig.css ? moduleConfig.css : null;
        
        // 检查CSS文件是否已加载
        if (!cssPath || ModuleLoader.loadedCSS.has(cssPath)) {
            return; // CSS已加载或没有配置CSS路径
        }
        
        try {
            const response = await fetch(cssPath, { method: 'HEAD' });
            if (response.ok) {
                // CSS文件存在，加载它
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                document.head.appendChild(link);
                ModuleLoader.loadedCSS.add(cssPath);
                console.log(`内容CSS加载完成: ${cssPath}`);
            } else {
                console.log(`内容CSS文件不存在: ${cssPath}`);
            }
        } catch (error) {
            console.log(`内容CSS文件不存在或加载失败: ${cssPath}`, error);
        }
    }
    
    // 首字母大写工具方法
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // 初始化模块事件管理器
    async initModuleManager(contentType) {
        // 检查是否已经加载过该模块管理器
        if (this.moduleManagers.has(contentType)) {
            return this.moduleManagers.get(contentType);
        }
        
        // 使用BusinessModuleLoader加载业务模块事件管理器
        const module = await BusinessModuleLoader.loadModuleManager(contentType);
        if (module) {
            // 实例化模块管理器
            const moduleName = `${this.capitalize(contentType)}Module`;
            if (module[moduleName]) {
                const moduleInstance = new module[moduleName]();
                
                // 缓存模块管理器实例
                this.moduleManagers.set(contentType, moduleInstance);
                
                console.log(`模块事件管理器初始化完成: ${contentType}`);
                return moduleInstance;
            }
        }
        
        return null;
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
    
    // 初始化本地音乐内容功能（保留部分UI初始化逻辑）
    initLocalMusicContent() {
        // 这里只保留一些必要的UI初始化逻辑
        // 具体的事件处理已移到LocalMusicModule中
        console.log('初始化本地音乐内容UI');
    }

    // 初始化在线音乐内容功能（保留部分UI初始化逻辑）
    initOnlineMusicContent() {
        // 这里只保留一些必要的UI初始化逻辑
        // 具体的事件处理已移到OnlineMusicModule中
        console.log('初始化在线音乐内容UI');
    }

    // 初始化播放列表内容功能（保留部分UI初始化逻辑）
    initPlaylistsContent() {
        // 这里只保留一些必要的UI初始化逻辑
        // 具体的事件处理已移到PlaylistsModule中
        console.log('初始化播放列表内容UI');
    }

    // 初始化设置内容功能（保留部分UI初始化逻辑）
    initSettingsContent() {
        // 这里只保留一些必要的UI初始化逻辑
        // 具体的事件处理已移到SettingsModule中
        console.log('初始化设置内容UI');
    }
    
}

// 将AppFramework挂载到window对象上
window.AppFramework = AppFramework;