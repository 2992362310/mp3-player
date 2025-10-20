import { eventBus, CSSLoader } from '../common/index.js';
import ModuleLoader from './ModuleLoader.js';

class FrameworkLoader {
    constructor() {
        this.eventBus = eventBus;
        
        this.initializeElements();
        this.currentContent = 'api-playlist';
        this.contentCache = new Map();
        this.moduleManagers = new Map();
    }
    
    initializeElements() {
        this.sidebar = document.querySelector('[data-module="sidebar"]');
        this.mainContent = document.querySelector('[data-module="main-content"]');
        this.topNav = document.querySelector('[data-module="top-nav"]');
        this.bottomController = document.querySelector('[data-module="bottom-controller"]');
    }
    
    elementsExist() {
        return this.mainContent && this.sidebar && this.topNav && this.bottomController;
    }
    
    async delayInitialize() {
        this.initializeElements();
        if (!this.elementsExist()) {
            throw new Error('必要的UI元素未找到');
        }
        
        await this.loadFrameworkModules();
        this.initSidebarMenu();
        return Promise.resolve(true);
    }
    
    async loadFrameworkModules() {
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
                js: '../../components/bottom-controller/BottomControllerModule.js'
            }
        };
        
        for (const [moduleType, config] of Object.entries(frameworkModules)) {
            if (config.css) {
                await this.loadCSSContent(config.css);
            }
            
            if (config.html) {
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
            
            if (config.js) {
                const module = await this.loadJSModule(config.js);
                if (module) {
                    const moduleInstance = new module.default(this.eventBus);
                    this.moduleManagers.set(moduleType, moduleInstance);
                }
            }
        }
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
                    
                    const target = link.getAttribute('data-target');
                    if (target === this.currentContent) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                }
            });
        }
        
        this.initCurrentContent();
    }

    async initCurrentContent() {
        const moduleLoader = new ModuleLoader(this.eventBus);
        moduleLoader.mainContent = this.mainContent;
        moduleLoader.contentCache = this.contentCache;
        moduleLoader.moduleManagers = this.moduleManagers;
        moduleLoader.currentContent = this.currentContent;
        
        if (moduleLoader.contentCache && moduleLoader.contentCache.has(this.currentContent)) {
            moduleLoader.mainContent.innerHTML = moduleLoader.contentCache.get(this.currentContent);
            await moduleLoader.initCurrentContent();
        } else {
            await moduleLoader.loadContent(this.currentContent);
        }
        
        this.contentCache = moduleLoader.contentCache;
        this.moduleManagers = moduleLoader.moduleManagers;
    }
    
    async switchContent(target) {
        if (target === this.currentContent) {
            return;
        }
        
        this.currentContent = target;
        
        const menuItems = this.sidebar.querySelectorAll('.nav-item');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('data-target') === target) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        const moduleLoader = new ModuleLoader(this.eventBus);
        moduleLoader.mainContent = this.mainContent;
        moduleLoader.contentCache = this.contentCache;
        moduleLoader.moduleManagers = this.moduleManagers;
        
        await moduleLoader.loadContent(target);
        
        if (target === 'api-playlist') {
            this.eventBus.emit('apiPlaylistActivated');
        }
        
        this.contentCache = moduleLoader.contentCache;
        this.moduleManagers = moduleLoader.moduleManagers;
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
}

export default FrameworkLoader;