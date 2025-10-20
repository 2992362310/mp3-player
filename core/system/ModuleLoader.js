import { eventBus, StringUtils, CSSLoader } from '../common/index.js';

export default class ModuleLoader {
    constructor() {
        this.eventBus = eventBus;
        
        this.initializeElements();
        this.contentCache = new Map();
        this.moduleManagers = new Map();
    }
    
    initializeElements() {
        this.mainContent = document.querySelector('.main-content');
    }
    
    elementsExist() {
        return this.mainContent;
    }
    
    async delayInitialize() {
        this.initializeElements();
        if (!this.elementsExist()) {
            throw new Error('必要的UI元素未找到');
        }
        
        return Promise.resolve(true);
    }
    
    initSidebarMenu() {
        if (this.sidebar) {
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
        
        this.initCurrentContent();
    }

    async initCurrentContent() {
        if (this.contentCache && this.contentCache.has(this.currentContent)) {
            this.mainContent.innerHTML = this.contentCache.get(this.currentContent);
            this.initContentLoadedContent(this.currentContent);
        } else {
            await this.loadContent(this.currentContent);
        }
    }
    
    async switchContent(target) {
        if (target === this.currentContent) {
            return;
        }
        
        this.currentContent = target;
        await this.loadContent(target);
    }
    
    async loadHTMLContent(contentPath) {
        const response = await fetch(contentPath);
        if (!response.ok) {
            throw new Error(`无法加载内容: ${contentPath}`);
        }
        return await response.text();
    }
    
    async loadCSSContent(cssPath) {
        await CSSLoader.loadCSS(cssPath);
    }
    
    async loadJSModule(modulePath) {
        try {
            const module = await import(modulePath);
            return module;
        } catch (error) {
            console.error(`加载模块失败: ${modulePath}`, error);
            return null;
        }
    }
    
    async loadContent(contentType) {
        if (!this.mainContent) {
            return;
        }
        
        try {
            this.mainContent.innerHTML = '<div class="loading">加载中...</div>';
            
            const moduleConfig = ModuleLoader.getModuleConfig(contentType);
            
            if (moduleConfig && moduleConfig.css) {
                await this.loadCSSContent(moduleConfig.css);
            }
            
            const contentPath = ModuleLoader.getContentPath(contentType);
            const content = await this.loadHTMLContent(contentPath);
            
            this.contentCache.set(contentType, content);
            this.mainContent.innerHTML = content;
            
            if (moduleConfig && moduleConfig.js) {
                const moduleInstance = await this.loadAndInitModule(contentType, moduleConfig.js);
                if (moduleInstance) {
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
    
    async loadAndInitModule(contentType, modulePath) {
        if (this.moduleManagers.has(contentType)) {
            return this.moduleManagers.get(contentType);
        }
        
        const module = await this.loadJSModule(modulePath);
        
        if (module) {
            const moduleInstance = new module.default(this.eventBus);
            this.moduleManagers.set(contentType, moduleInstance);
            return moduleInstance;
        }

        console.warn(`未找到内容：${contentType}`);
        return null;
    }
    
    convertToModuleName(contentType) {
        if (contentType.includes('-')) {
            const result = contentType
                .split('-')
                .map((part, index) => {
                    return StringUtils.capitalize(part);
                })
                .join('');
            return result;
        }
        const result = StringUtils.capitalize(contentType);
        return result;
    }
    
    static getContentPath(contentType) {
        const modulePaths = {
            'api-playlist': 'modules/api-playlist/api-playlist.html',
            'local-music': 'modules/local-music/local-music.html',
            'settings': 'modules/settings/settings.html'
        };
        return modulePaths[contentType] || '';
    }
    
    static getModuleConfig(contentType) {
        const moduleConfigs = {
            'api-playlist': {
                css: 'modules/api-playlist/api-playlist.css',
                js: '../../modules/api-playlist/ApiPlaylistModule.js',
                html: 'modules/api-playlist/api-playlist.html'
            },
            'local-music': {
                css: 'modules/local-music/local-music.css',
                js: '../../modules/local-music/LocalMusicModule.js',
                html: 'modules/local-music/local-music.html'
            },
            'settings': {
                css: 'modules/settings/settings.css',
                js: '../../modules/settings/SettingsModule.js',
                html: 'modules/settings/settings.html'
            }
        };
        return moduleConfigs[contentType];
    }
    
    capitalize(str) {
        return StringUtils.capitalize(str);
    }
}