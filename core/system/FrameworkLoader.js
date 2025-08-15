import { EventBus } from '../common/index.js';
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
            try {
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
                        // 实例化模块
                        const moduleName = `${this.capitalize(moduleType.replace('-', ''))}Module`;
                        if (module[moduleName]) {
                            const moduleInstance = new module[moduleName]();
                            this.moduleManagers.set(moduleType, moduleInstance);
                        }
                    }
                }
                
                console.log(`框架模块加载完成: ${moduleType}`);
            } catch (error) {
                console.error(`框架模块加载失败: ${moduleType}`, error);
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
            console.log(`JS模块加载完成: ${modulePath}`);
            return module;
        } catch (error) {
            console.error(`JS模块加载失败: ${modulePath}`, error);
            return null;
        }
    }
    
    // 加载内容（框架层）
    async loadContent(contentType) {
        if (!this.mainContent) return;
        
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
                if (moduleInstance && typeof moduleInstance.initializeUI === 'function') {
                    moduleInstance.initializeUI();
                }
            }
            
            console.log(`内容加载完成: ${contentType}`);
        } catch (error) {
            console.error('加载内容时出错:', error);
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
            // 实例化模块管理器
            const moduleName = `${StringUtils.capitalize(contentType)}Module`;
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
    
    // 获取内容路径
    getContentPath(contentType) {
        return ModuleLoader.getContentPath(contentType);
    }
    
    // 首字母大写工具方法（已移至StringUtils，此处保留向后兼容）
    capitalize(str) {
        return StringUtils.capitalize(str);
    }
}

// 将FrameworkLoader挂载到window对象上
window.FrameworkLoader = FrameworkLoader;

export default FrameworkLoader;