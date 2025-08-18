import { EventBus, StringUtils, CSSLoader } from '../common/index.js';
import ModuleLoader from './ModuleLoader.js';

class FrameworkLoader {
    constructor() {
        // 初始化事件总线
        this.eventBus = new EventBus();
        
        this.initializeElements();
        this.currentContent = 'local-music'; // 默认显示本地音乐
        this.contentCache = new Map(); // 添加内容缓存
        this.moduleManagers = new Map(); // 添加模块管理器缓存
    }
    
    initializeElements() {
        // 获取侧边栏和主内容区域元素
        this.sidebar = document.querySelector('[data-module="sidebar"]');
        this.mainContent = document.querySelector('[data-module="main-content"]');
        // 获取顶部导航和底部控制器元素
        this.topNav = document.querySelector('[data-module="top-nav"]');
        this.bottomController = document.querySelector('[data-module="bottom-controller"]');
    }
    
    // 检查必要的元素是否都存在
    elementsExist() {
        // 不再强制要求所有音频元素都存在，只检查必要的元素
        return this.mainContent && this.sidebar && this.topNav && this.bottomController;
    }
    
    // 延迟初始化，确保DOM元素已加载
    async delayInitialize() {
        // 由于app.js已经确保所有HTML模块加载完成，这里可以直接初始化
        this.initializeElements();
        if (!this.elementsExist()) {
            throw new Error('必要的UI元素未找到');
        }
        
        // 加载框架级模块
        await this.loadFrameworkModules();
        
        // 初始化侧边栏菜单功能
        this.initSidebarMenu();
        return Promise.resolve(true);
    }
    
    // 加载框架级模块
    async loadFrameworkModules() {
        // 定义框架模块配置
        const frameworkModules = {
            'top-nav': {
                html: 'components/top-nav/top-nav.html',
                css: 'components/top-nav/top-nav.css'
            },
            'sidebar': {
                html: 'components/sidebar/sidebar.html',
                css: 'components/sidebar/sidebar.css'
            },
            'bottom-controller': {
                html: 'components/bottom-controller/bottom-controller.html',
                css: 'components/bottom-controller/bottom-controller.css',
                js: '/components/bottom-controller/BottomControllerModule.js'
            }
        };
        
        // 加载各个框架模块
        for (const [moduleType, config] of Object.entries(frameworkModules)) {
            // 加载CSS（如果存在）
            if (config.css) {
                await this.loadCSSContent(config.css);
            }
            
            // 加载HTML内容
            if (config.html) {
                // 正确映射模块类型到元素属性
                let element;
                switch (moduleType) {
                    case 'top-nav':
                        element = this.topNav;
                        break;
                    case 'sidebar':
                        element = this.sidebar;
                        break;
                    case 'bottom-controller':
                        element = this.bottomController;
                        break;
                    default:
                        element = null;
                }
                
                if (element) {
                    const response = await fetch(config.html);
                    if (response.ok) {
                        element.innerHTML = await response.text();
                    }
                }
            }
            
            // 加载JS模块（如果存在）
            if (config.js) {
                const module = await this.loadJSModule(config.js);
                if (module) {
                    // 实例化模块并传递EventBus实例
                    const moduleInstance = new module.default(this.eventBus);
                    this.moduleManagers.set(moduleType, moduleInstance);
                }
            }
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
        // 使用ModuleLoader初始化当前内容
        const moduleLoader = new ModuleLoader(this.eventBus);
        // 复制必要的属性
        moduleLoader.mainContent = this.mainContent;
        moduleLoader.contentCache = this.contentCache;
        moduleLoader.moduleManagers = this.moduleManagers;
        
        // 如果已经有缓存内容，直接使用
        if (moduleLoader.contentCache && moduleLoader.contentCache.has(this.currentContent)) {
            moduleLoader.mainContent.innerHTML = moduleLoader.contentCache.get(this.currentContent);
            // 注意：这里应该让ModuleLoader处理模块初始化
            await moduleLoader.initCurrentContent();
        } else {
            // 否则加载内容
            await moduleLoader.loadContent(this.currentContent);
        }
        
        // 更新缓存
        this.contentCache = moduleLoader.contentCache;
        this.moduleManagers = moduleLoader.moduleManagers;
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
        
        // 使用ModuleLoader加载并显示新内容
        const moduleLoader = new ModuleLoader(this.eventBus);
        // 复制必要的属性
        moduleLoader.mainContent = this.mainContent;
        moduleLoader.contentCache = this.contentCache;
        moduleLoader.moduleManagers = this.moduleManagers;
        
        await moduleLoader.loadContent(target);
        
        // 更新缓存
        this.contentCache = moduleLoader.contentCache;
        this.moduleManagers = moduleLoader.moduleManagers;
    }
    
    // 通用方法：加载HTML内容
    async loadHTMLContent(contentPath) {
        const response = await fetch(contentPath);
        if (!response.ok) {
            throw new Error(`无法加载内容: ${contentPath}`);
        }
        return await response.text();
    }
    
    // 通用方法：加载CSS样式表
    async loadCSSContent(cssPath) {
        await CSSLoader.loadCSS(cssPath);
    }
    
    // 通用方法：加载JavaScript模块
    async loadJSModule(modulePath) {
        try {
            const module = await import(modulePath);
            return module;
        } catch (error) {
            return null;
        }
    }
    
    // 加载内容（框架层）
    async loadContent(contentType) {
        if (!this.mainContent) return;
        
        try {
            // 显示加载状态
            this.mainContent.innerHTML = '<div class="loading">加载中...</div>';
            
            // 使用ModuleLoader加载业务模块内容
            const moduleLoader = new ModuleLoader(this.eventBus);
            await moduleLoader.loadContent(contentType);
            
            // 将加载的内容从moduleLoader复制到当前实例
            this.mainContent.innerHTML = moduleLoader.mainContent.innerHTML;
            this.contentCache = moduleLoader.contentCache;
            this.moduleManagers = moduleLoader.moduleManagers;
        } catch (error) {
            this.mainContent.innerHTML = '<div class="error">内容加载失败</div>';
        }
    }
    
    // 转换内容类型为模块名称
    convertToModuleName(contentType) {
        // 对于带连字符的名称，需要将连字符后的首字母大写
        if (contentType.includes('-')) {
            return contentType
                .split('-')
                .map((part, index) => {
                    // 第一个部分首字母大写，其余部分首字母大写
                    return StringUtils.capitalize(part);
                })
                .join('');
        }
        // 对于不带连字符的名称，直接首字母大写
        return StringUtils.capitalize(contentType);
    }
    
    // 获取业务模块配置
    static getModuleConfig(contentType) {
        const moduleConfigs = {
            'local-music': {
                css: 'modules/local-music/local-music.css',
                js: '../../modules/local-music/LocalMusicModule.js',
                html: 'modules/local-music/local-music.html'
            },
            'online-music': {
                css: 'modules/online-music/online-music.css',
                js: '../../modules/online-music/OnlineMusicModule.js',
                html: 'modules/online-music/online-music.html'
            },
            'playlists': {
                css: 'modules/playlists/playlists.css',
                js: '../../modules/playlists/PlaylistsModule.js',
                html: 'modules/playlists/playlists.html'
            },
            'settings': {
                css: 'modules/settings/settings.css',
                js: '../../modules/settings/SettingsModule.js',
                html: 'modules/settings/settings.html'
            }
        };
        return moduleConfigs[contentType];
    }
    
    // 获取内容路径
    getContentPath(contentType) {
        return ModuleLoader.getContentPath(contentType);
    }
}

export default FrameworkLoader;