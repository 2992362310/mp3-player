// system目录统一导出文件
// 导出所有系统核心组件，方便其他模块统一导入

import FrameworkLoader from './FrameworkLoader.js';
import ModuleLoader from './ModuleLoader.js';

// 重新导出所有导入的模块
export { FrameworkLoader, ModuleLoader };

// 默认导出一个包含所有组件的对象
export default {
    FrameworkLoader,
    ModuleLoader
};