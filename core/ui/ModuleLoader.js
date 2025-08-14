// 简单的HTML模块加载器
class ModuleLoader {
    static loadedModules = new Set();
    static loadedCSS = new Set();
    
    // 框架层面的模块配置
    static frameworkModules = {
        'top-nav': {
            html: './components/top-nav/top-nav.html',
            css: './components/top-nav/top-nav.css'
        },
        'sidebar': {
            html: './components/sidebar/sidebar.html',
            css: './components/sidebar/sidebar.css'
        },
        'main-content': {
            html: './components/main-content/main-content.html',
            css: './components/main-content/main-content.css'
        },
        'bottom-controller': {
            html: './components/bottom-controller/bottom-controller.html',
            css: './components/bottom-controller/bottom-controller.css',
            js: './components/bottom-controller/BottomControllerModule.js'
        }
    };
    
    static async init() {
        // 初始化时加载页面中指定的所有模块
        await this.loadPageModules();
        console.log('ModuleLoader 初始化完成');
    }
    
    // 加载页面中所有指定的模块
    static async loadPageModules() {
        // 加载头部模块
        const header = document.querySelector('header[data-module]');
        if (header) {
            await this.loadModuleToElement(header, header.dataset.module);
        }
        
        // 加载侧边栏模块
        const aside = document.querySelector('aside[data-module]');
        if (aside) {
            await this.loadModuleToElement(aside, aside.dataset.module);
        }
        
        // 加载主内容模块
        const main = document.querySelector('main[data-module]');
        if (main) {
            await this.loadModuleToElement(main, main.dataset.module);
        }
        
        // 加载底部控制器模块
        const footer = document.querySelector('footer[data-module]');
        if (footer) {
            await this.loadModuleToElement(footer, footer.dataset.module);
        }
    }
    
    // 将模块加载到指定元素
    static async loadModuleToElement(element, modulePath) {
        // 检查框架模块配置
        const frameworkConfig = this.frameworkModules[modulePath];
        if (frameworkConfig && frameworkConfig.html) {
            modulePath = frameworkConfig.html;
        }

        if (this.loadedModules.has(modulePath)) {
            console.log(`模块已加载: ${modulePath}`);
            return;
        }

        try {
            const response = await fetch(modulePath);
            if (!response.ok) {
                throw new Error(`无法加载模块: ${modulePath}`);
            }

            const html = await response.text();
            element.innerHTML = html;

            // 标记模块已加载
            this.loadedModules.add(modulePath);

            // 加载模块相关的CSS（如果存在）
            await this.loadModuleCSS(modulePath);

            console.log(`模块加载完成: ${modulePath}`);
        } catch (error) {
            console.error('加载模块时出错:', error);
            element.innerHTML = '<div class="error">模块加载失败</div>';
        }
    }
    
    // 加载模块事件管理器
    static async loadModuleManager(contentType) {
        // ModuleLoader只处理框架模块的JS加载（如果有）
        const frameworkConfig = this.frameworkModules[contentType];
        const moduleManagerPath = frameworkConfig && frameworkConfig.js ? frameworkConfig.js : null;

        if (!moduleManagerPath) {
            console.log(`未找到框架模块事件管理器: ${contentType}`);
            return null;
        }

        try {
            // 动态导入模块事件管理器
            const module = await import(moduleManagerPath);
            console.log(`框架模块事件管理器加载完成: ${contentType}`);
            return module;
        } catch (error) {
            console.error(`加载框架模块事件管理器时出错: ${contentType}`, error);
            return null;
        }
    }
    
    // 加载模块相关的CSS文件
    static async loadModuleCSS(modulePath) {
        // 查找框架配置中的CSS路径
        const cssPath = Object.values(this.frameworkModules)
            .find(config => config.html === modulePath)?.css;

        // 检查CSS文件是否存在
        if (this.loadedCSS.has(cssPath) || !cssPath) {
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
                this.loadedCSS.add(cssPath);
                console.log(`CSS加载完成: ${cssPath}`);
            } else {
                console.log(`CSS文件不存在: ${cssPath}`);
            }
        } catch (error) {
            console.log(`CSS文件不存在或加载失败: ${cssPath}`, error);
        }
    }
    
    // 按需加载内容CSS（框架模块）
    static async loadContentCSS(contentType) {
        // 从框架配置中获取CSS路径
        const cssPath = this.frameworkModules[contentType]?.css;

        // 检查CSS文件是否已加载
        if (this.loadedCSS.has(cssPath) || !cssPath) {
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
                this.loadedCSS.add(cssPath);
                console.log(`内容CSS加载完成: ${cssPath}`);
            } else {
                console.log(`内容CSS文件不存在: ${cssPath}`);
            }
        } catch (error) {
            console.log(`内容CSS文件不存在或加载失败: ${cssPath}`, error);
        }
    }
    
    // 获取框架模块配置
    static getFrameworkModuleConfig(moduleName) {
        return this.frameworkModules[moduleName] || null;
    }
}

// 将ModuleLoader挂载到window对象上
window.ModuleLoader = ModuleLoader;