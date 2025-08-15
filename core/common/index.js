// common目录统一导出文件
// 导出所有公共工具类，方便其他模块统一导入

import EventBus from './EventBus.js';
import StringUtils from './StringUtils.js';
import CSSLoader from './CSSLoader.js';
import DOMManager from './DOMManager.js';

// 重新导出所有导入的模块
export { EventBus, StringUtils, CSSLoader, DOMManager };

// 默认导出一个包含所有工具的对象
export default {
    EventBus,
    StringUtils,
    CSSLoader,
    DOMManager
};