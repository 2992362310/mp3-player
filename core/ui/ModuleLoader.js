/**
 * 模块加载器
 * 负责动态加载和管理应用程序的各种模块
 */
export default class ModuleLoader {
    // 已加载的CSS文件集合，用于避免重复加载
    static loadedCSS = new Set();
    
    // 已加载的JS文件集合，用于避免重复加载
    static loadedJS = new Set();
    
    /**
     * 加载指定路径的HTML模块
     * @param {string} modulePath - 模块HTML文件路径
     * @param {string} placeholderId - 占位符元素ID
     */
    static async loadModule(modulePath, placeholderId) {
        try {
            // 获取模块HTML内容
            const response = await fetch(modulePath);
            if (!response.ok) {
                throw new Error(`模块加载失败: ${modulePath}`);
            }
            
            const html = await response.text();
            const placeholder = document.getElementById(placeholderId);
            
            if (placeholder) {
                // 替换占位符为实际模块内容
                placeholder.outerHTML = html;
                
                // 加载模块相关的CSS和JS文件
                await this.loadModuleAssets(modulePath);
                
                console.log(`模块加载完成: ${modulePath}`);
            } else {
                console.warn(`未找到占位符: ${placeholderId}`);
            }
        } catch (error) {
            console.error(`加载模块时出错 ${modulePath}:`, error);
        }
    }
    
    /**
     * 加载所有指定的模块
     * @param {Array} modules - 模块配置数组
     */
    static async loadModules(modules) {
        // 创建加载所有模块的Promise数组
        const modulePromises = modules.map(module => 
            this.loadModule(module.path, module.placeholder)
        );
        
        await Promise.all(modulePromises);
    }
    
    // 根据模块路径确定对应的CSS文件
    static getCSSFileForModule(modulePath) {
        if (modulePath.includes('top-nav')) {
            return './components/top-nav/top-nav.css';
        } else if (modulePath.includes('sidebar')) {
            return './components/sidebar/sidebar.css';
        } else if (modulePath.includes('main-content')) {
            return './components/main-content/main-content.css';
        } else if (modulePath.includes('bottom-controller')) {
            return './components/bottom-controller/bottom-controller.css';
        } else if (modulePath.includes('local-music')) {
            return './modules/local-music/local-music.css';
        } else if (modulePath.includes('settings')) {
            return './modules/settings/settings.css';
        }
        return null;
    }
    
    // 动态加载CSS文件
    static loadCSS(cssFile) {
        return new Promise((resolve, reject) => {
            // 检查CSS是否已加载
            const existingLink = document.querySelector(`link[href="${cssFile}"]`);
            if (existingLink) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${cssFile}`));
            document.head.appendChild(link);
        });
    }

    // 根据内容类型加载特定的CSS文件（按需加载）
    static async loadContentCSS(contentType) {
        // 定义各内容类型需要的CSS文件映射
        const cssMap = {
            'local-music': [
                './shared/css/layout-base.css',
                './shared/css/buttons-forms.css',
                './shared/css/cards-lists.css',
                './modules/local-music/local-music.css'
            ],
            'settings': [
                './shared/css/layout-base.css',
                './shared/css/buttons-forms.css',
                './modules/settings/settings.css'
            ]
        };
        
        // 如果没有找到对应的CSS映射，则使用默认的共享CSS
        const cssFiles = cssMap[contentType] || [
            './shared/css/layout-base.css',
            './shared/css/buttons-forms.css',
            './shared/css/cards-lists.css'
        ];
        
        // 并行加载所有需要的CSS文件
        const cssPromises = cssFiles.map(cssFile => this.loadCSS(cssFile));
        await Promise.all(cssPromises);
    }
}