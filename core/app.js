import { FrameworkLoader, ModuleLoader } from './system/index.js';

// 应用初始化函数
async function initializeApp() {
    try {
        // 确保DOM内容完全加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 初始化框架加载器（现在所有HTML模块都已加载完成）
        const appFramework = new FrameworkLoader();
        window.appFramework = appFramework;
        await appFramework.delayInitialize();
    } catch (error) {
        // 静默处理错误
    }
}

// 页面完全加载完成后初始化应用
// 这确保了所有HTML模块和资源都已加载完成
window.addEventListener('load', () => {
    initializeApp();
});