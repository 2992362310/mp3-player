// 业务模块加载器
class BusinessModuleLoader {
    static loadedCSS = new Set();
    
    // 业务模块配置
    static businessModules = {
        'local-music': {
            html: '../../modules/local-music/local-music.html',
            css: '../../modules/local-music/local-music.css',
            js: '../../modules/local-music/LocalMusicModule.js'
        },
        'online-music': {
            html: '../../modules/online-music/online-music.html',
            css: '../../modules/online-music/online-music.css',
            js: '../../modules/online-music/OnlineMusicModule.js'
        },
        'playlists': {
            html: '../../modules/playlists/playlists.html',
            css: '../../modules/playlists/playlists.css',
            js: '../../modules/playlists/PlaylistsModule.js'
        },
        'settings': {
            html: '../../modules/settings/settings.html',
            css: '../../modules/settings/settings.css',
            js: '../../modules/settings/SettingsModule.js'
        }
    };
    
    // 获取内容路径
    static getContentPath(contentType) {
        // 优先从模块配置中获取路径
        const moduleConfig = this.businessModules[contentType];
        if (moduleConfig && moduleConfig.html) {
            return moduleConfig.html;
        }
        
        // 默认路径
        const defaultPaths = {
            'local-music': '../../modules/local-music/local-music.html',
            'online-music': '../../modules/online-music/online-music.html',
            'playlists': '../../modules/playlists/playlists.html',
            'settings': '../../modules/settings/settings.html'
        };
        
        return defaultPaths[contentType] || `./components/html/${contentType}.html`;
    }
    
    // 按需加载内容CSS（业务模块）
    static async loadContentCSS(contentType) {
        // 获取CSS路径
        const moduleConfig = this.businessModules[contentType];
        const cssPath = moduleConfig && moduleConfig.css ? moduleConfig.css : null;
        
        // 如果没有CSS路径或已加载，直接返回
        if (!cssPath || this.loadedCSS.has(cssPath)) {
            return;
        }
        
        try {
            // 检查CSS文件是否存在
            const response = await fetch(cssPath, { method: 'HEAD' });
            
            if (response.ok) {
                // 创建并配置样式表链接元素
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                
                // 添加样式表并记录已加载
                document.head.appendChild(link);
                this.loadedCSS.add(cssPath);
                
                console.log(`业务模块CSS加载完成: ${cssPath}`);
            } else {
                console.log(`业务模块CSS文件不存在: ${cssPath}`);
            }
        } catch (error) {
            console.error(`业务模块CSS文件加载失败: ${cssPath}`, error);
        }
    }
    
    // 加载业务模块事件管理器
    static async loadModuleManager(contentType) {
        // 获取JS路径
        const moduleConfig = this.businessModules[contentType];
        const moduleManagerPath = moduleConfig && moduleConfig.js ? moduleConfig.js : null;
        
        if (!moduleManagerPath) {
            console.warn(`未找到业务模块事件管理器: ${contentType}`);
            return null;
        }
        
        try {
            // 动态导入模块
            const module = await import(moduleManagerPath);
            console.info(`业务模块事件管理器加载完成: ${contentType}`);
            return module;
        } catch (error) {
            console.error(`加载业务模块事件管理器失败: ${contentType}`, error);
            return null;
        }
    }
    
    // 获取业务模块配置
    static getBusinessModuleConfig(moduleName) {
        return this.businessModules[moduleName] || null;
    }
    
    // 首字母大写工具方法
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// 将BusinessModuleLoader挂载到window对象上
window.BusinessModuleLoader = BusinessModuleLoader;