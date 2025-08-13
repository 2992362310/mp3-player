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
        const footer = document.querySelector('.content-wrapper > footer[data-module]');
        if (footer) {
            await this.loadModuleToElement(footer, footer.dataset.module);
        }
    }
    
    // 将模块加载到指定元素
    static async loadModuleToElement(element, modulePath) {
        try {
            const response = await fetch(modulePath);
            if (!response.ok) {
                throw new Error(`无法加载模块: ${modulePath}`);
            }
            
            const htmlContent = await response.text();
            element.innerHTML = htmlContent;
            
            // 提取组件名称并加载相应CSS
            const componentName = modulePath.split('/').slice(-1)[0].replace('.html', '');
            await this.loadComponentCSS(componentName);
            
            console.log(`模块 ${modulePath} 加载完成`);
        } catch (error) {
            console.error(`加载模块 ${modulePath} 失败:`, error);
        }
    }
    
    // 加载组件（HTML + CSS）
    static async loadComponent(componentName) {
        try {
            // 加载组件的 CSS
            await this.loadComponentCSS(componentName);
            
            // 加载组件的 HTML
            await this.loadComponentHTML(componentName);
            
            this.loadedModules.add(componentName);
            console.log(`组件 ${componentName} 加载完成`);
        } catch (error) {
            console.error(`加载组件 ${componentName} 失败:`, error);
        }
    }
    
    // 加载组件的 HTML
    static async loadComponentHTML(componentName) {
        const componentPath = `./components/${componentName}/${componentName}.html`;
        const containerId = this.getComponentContainerId(componentName);
        
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`无法加载组件 HTML: ${componentPath}`);
        }
        
        const htmlContent = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = htmlContent;
        } else {
            console.warn(`未找到容器: ${containerId}`);
        }
    }
    
    // 加载组件的 CSS
    static async loadComponentCSS(componentName) {
        if (this.loadedCSS.has(componentName)) {
            return; // 已加载则直接返回
        }
        
        const cssPath = `./components/${componentName}/${componentName}.css`;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        
        // 等待样式表加载完成
        const loadPromise = new Promise((resolve, reject) => {
            link.onload = () => {
                this.loadedCSS.add(componentName);
                resolve();
            };
            link.onerror = reject;
        });
        
        document.head.appendChild(link);
        await loadPromise;
    }
    
    // 加载内容区域的 CSS
    static async loadContentCSS(contentType) {
        const cssPath = `./modules/${contentType}/${contentType}.css`;
        
        // 检查是否已加载
        if (this.loadedCSS.has(contentType)) {
            return;
        }
        
        // 检查文件是否存在
        try {
            const response = await fetch(cssPath, { method: 'HEAD' });
            if (!response.ok) {
                console.log(`内容 CSS 文件不存在: ${cssPath}`);
                return;
            }
        } catch (error) {
            console.log(`无法访问内容 CSS 文件: ${cssPath}`);
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        
        // 等待样式表加载完成
        const loadPromise = new Promise((resolve, reject) => {
            link.onload = () => {
                this.loadedCSS.add(contentType);
                resolve();
            };
            link.onerror = reject;
        });
        
        document.head.appendChild(link);
        await loadPromise;
    }
    
    // 获取组件容器 ID
    static getComponentContainerId(componentName) {
        const containerIds = {
            'bottom-controller': 'bottomControllerContainer'
            // 可以添加更多组件容器映射
        };
        
        return containerIds[componentName] || componentName;
    }
}

// 为了向后兼容，也可以将类赋值给全局变量
window.ModuleLoader = ModuleLoader;

// 页面加载完成后处理模块
document.addEventListener('DOMContentLoaded', async function() {
    // 注意：由于这是静态HTML文件，我们需要使用JavaScript来模拟模块包含
    // 在实际项目中，这应该由服务器端模板引擎或构建工具处理
    
    console.log('模块加载完成');
});