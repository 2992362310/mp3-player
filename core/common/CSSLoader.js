/**
 * CSS加载工具类
 * 提供统一的CSS文件加载功能
 */

class CSSLoader {
    static loadedCSS = new Set();

    /**
     * 加载CSS文件
     * @param {string} cssPath - CSS文件路径
     * @returns {Promise<boolean>} 加载成功返回true，失败返回false
     */
    static async loadCSS(cssPath) {
        // 检查CSS文件是否已加载
        if (this.loadedCSS.has(cssPath) || !cssPath) {
            return true;
        }

        try {
            // 检查CSS文件是否存在
            const response = await fetch(cssPath, { method: 'HEAD' });
            
            if (response.ok) {
                // CSS文件存在，加载它
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                document.head.appendChild(link);
                this.loadedCSS.add(cssPath);
                console.log(`CSS加载完成: ${cssPath}`);
                return true;
            } else {
                console.log(`CSS文件不存在: ${cssPath}`);
                return false;
            }
        } catch (error) {
            console.log(`CSS文件不存在或加载失败: ${cssPath}`, error);
            return false;
        }
    }

    /**
     * 检查CSS是否已加载
     * @param {string} cssPath - CSS文件路径
     * @returns {boolean} 已加载返回true，否则返回false
     */
    static isLoaded(cssPath) {
        return this.loadedCSS.has(cssPath);
    }

    /**
     * 获取已加载的CSS文件列表
     * @returns {Set} 已加载的CSS文件路径集合
     */
    static getLoadedCSS() {
        return new Set(this.loadedCSS);
    }
}

// 将CSSLoader挂载到window对象上
window.CSSLoader = CSSLoader;

export default CSSLoader;