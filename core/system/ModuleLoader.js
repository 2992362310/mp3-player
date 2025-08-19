import { eventBus, StringUtils } from '../common/index.js';
import CSSLoader from '../common/CSSLoader.js';

export default class ModuleLoader {
    constructor() {
        // 使用全局EventBus实例
        this.eventBus = eventBus;
        
        this.initializeElements();
        // 移除 currentContent 定义，因为它应该只在 FrameworkLoader 中管理
        this.contentCache = new Map(); // 添加内容缓存
        this.moduleManagers = new Map(); // 添加模块管理器缓存
    }
    
    initializeElements() {
        // 获取主内容区域元素
        this.mainContent = document.querySelector('.main-content');
    }
    
    // 检查必要的元素是否都存在
    elementsExist() {
        // 不再强制要求所有音频元素都存在，只检查必要的元素
        return this.mainContent;
    }
    
    // 延迟初始化，确保DOM元素已加载
    async delayInitialize() {
        // 由于app.js已经确保所有HTML模块加载完成，这里可以直接初始化
        this.initializeElements();
        if (!this.elementsExist()) {
            throw new Error('必要的UI元素未找到');
        }
        
        return Promise.resolve(true);
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
        
        // 加载并显示新内容
        await this.loadContent(target);
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
        // 使用CSSLoader加载CSS
        await CSSLoader.loadCSS(cssPath);
    }
    
    // 通用方法：加载JavaScript模块
    async loadJSModule(modulePath) {
        try {
            const module = await import(modulePath);
            return module;
        } catch (error) {
            console.error(`加载模块失败: ${modulePath}`, error);
            return null;
        }
    }
    
    // 加载内容（框架层）
    async loadContent(contentType) {
        if (!this.mainContent) {
            return;
        }
        
        try {
            // 显示加载状态
            this.mainContent.innerHTML = '<div class="loading">加载中...</div>';
            
            // 获取模块配置
            const moduleConfig = ModuleLoader.getModuleConfig(contentType);
            
            // 按需加载内容CSS
            if (moduleConfig && moduleConfig.css) {
                await this.loadCSSContent(moduleConfig.css);
            }
            
            // 加载HTML内容
            const contentPath = ModuleLoader.getContentPath(contentType);
            const content = await this.loadHTMLContent(contentPath);
            
            // 缓存内容
            this.contentCache.set(contentType, content);
            
            // 替换主内容区域的内容
            this.mainContent.innerHTML = content;
            
            // 加载并初始化模块JS（模块层）
            if (moduleConfig && moduleConfig.js) {
                const moduleInstance = await this.loadAndInitModule(contentType, moduleConfig.js);
                // 如果模块加载成功，执行模块特定的初始化方法
                if (moduleInstance) {
                    // 确保模块的事件监听器被绑定
                    if (typeof moduleInstance.bindEvents === 'function') {
                        moduleInstance.bindEvents();
                    }
                    if (typeof moduleInstance.initializeUI === 'function') {
                        moduleInstance.initializeUI();
                    }
                }
            }
        } catch (error) {
            this.mainContent.innerHTML = '<div class="error">内容加载失败</div>';
        }
    }
    
    // 加载并初始化模块（模块层）
    async loadAndInitModule(contentType, modulePath) {
        // 检查是否已经加载过该模块管理器
        if (this.moduleManagers.has(contentType)) {
            return this.moduleManagers.get(contentType);
        }
        
        // 加载模块JS文件
        const module = await this.loadJSModule(modulePath);
        
        if (module) {
            // 实例化模块管理器并传递EventBus实例
            const moduleInstance = new module.default(this.eventBus);
            // 缓存模块管理器实例
            this.moduleManagers.set(contentType, moduleInstance);
            
            return moduleInstance;
        }

        console.warn(`未找到内容：${contentType}`);
        
        return null;
    }
    
    // 转换内容类型为模块名称
    convertToModuleName(contentType) {
        // 对于带连字符的名称，需要将连字符后的首字母大写
        if (contentType.includes('-')) {
            const result = contentType
                .split('-')
                .map((part, index) => {
                    // 第一个部分首字母大写，其余部分首字母大写
                    return StringUtils.capitalize(part);
                })
                .join('');
            return result;
        }
        // 对于不带连字符的名称，直接首字母大写
        const result = StringUtils.capitalize(contentType);
        return result;
    }
    
    // 获取内容路径
    static getContentPath(contentType) {
        const modulePaths = {
            'local-music': 'modules/local-music/local-music.html',
            'online-music': 'modules/online-music/online-music.html',
            'playlists': 'modules/playlists/playlists.html',
            'settings': 'modules/settings/settings.html'
        };
        return modulePaths[contentType] || '';
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
    
    // 首字母大写工具方法（已移至StringUtils，此处保留向后兼容）
    capitalize(str) {
        return StringUtils.capitalize(str);
    }
}