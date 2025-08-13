// 简单的HTML模块加载器
class ModuleLoader {
    static loadedModules = new Set();
    static loadedCSS = new Set();
    
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
    
    // 加载模块相关的CSS文件
    static async loadModuleCSS(modulePath) {
        // 从模块路径推断CSS路径
        const cssPath = modulePath.replace('.html', '.css');
        const moduleName = modulePath.split('/').pop().replace('.html', '');
        
        // 检查CSS文件是否存在
        if (this.loadedCSS.has(cssPath)) {
            return; // CSS已加载
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
    
    // 按需加载内容CSS
    static async loadContentCSS(contentType) {
        // 构建CSS文件路径
        let cssPath;
        switch (contentType) {
            case 'local-music':
                cssPath = './modules/local-music/local-music.css';
                break;
            case 'online-music':
                cssPath = './modules/online-music/online-music.css';
                break;
            case 'playlists':
                cssPath = './modules/playlists/playlists.css';
                break;
            case 'settings':
                cssPath = './modules/settings/settings.css';
                break;
            default:
                cssPath = `./components/css/${contentType}.css`;
        }
        
        // 检查CSS文件是否已加载
        if (this.loadedCSS.has(cssPath)) {
            return; // CSS已加载
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
}

// 将ModuleLoader挂载到window对象上
window.ModuleLoader = ModuleLoader;