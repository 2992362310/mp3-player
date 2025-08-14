// 应用主入口文件
// 统一管理所有核心模块的加载顺序和依赖关系

// 按正确顺序导入所有核心模块
import './ui/EventBus.js';
import './ui/ModuleLoader.js';
import './ui/BusinessModuleLoader.js';
import './ui/DOMManager.js';
import './storage/LocalResourceManager.js';
import './ui/AppFramework.js';
import './audio/AudioPlayer.js';

// 输出日志表明应用核心已加载
console.log('应用核心模块加载完成');

// 应用初始化函数
async function initializeApp() {
    try {
        // 确保DOM内容完全加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 初始化模块加载器，加载所有HTML模块
        if (window.ModuleLoader) {
            await window.ModuleLoader.init();
        }
        
        // 初始化应用框架（现在所有HTML模块都已加载完成）
        if (window.AppFramework) {
            window.appFramework = new window.AppFramework();
            await window.appFramework.delayInitialize();
        }
        
        // 初始化音频播放器
        if (window.AudioPlayer) {
            window.audioPlayer = new window.AudioPlayer();
            await window.audioPlayer.init();
        }
        
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

// 将核心类暴露到全局作用域（保持与之前版本的兼容性）
// 这些类已经在各自的文件中挂载到window对象，这里只是确保顺序加载