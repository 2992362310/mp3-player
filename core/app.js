// 应用主入口文件

import FrameworkLoader from './system/FrameworkLoader.js';
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
        window.appFramework = appFramework
        await appFramework.delayInitialize();
        
        
        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
}

// 页面完全加载完成后初始化应用
// 这确保了所有HTML模块和资源都已加载完成
window.addEventListener('load', () => {
    initializeApp();
});