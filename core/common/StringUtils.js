/**
 * 字符串工具类
 * 提供常用的字符串处理方法
 */

class StringUtils {
    /**
     * 首字母大写
     * @param {string} str - 输入字符串
     * @returns {string} 首字母大写的字符串
     */
    static capitalize(str) {
        if (!str || typeof str !== 'string') {
            return str;
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 检查字符串是否为空或仅包含空白字符
     * @param {string} str - 输入字符串
     * @returns {boolean} 如果字符串为空或仅包含空白字符则返回true
     */
    static isBlank(str) {
        return !str || typeof str !== 'string' || str.trim() === '';
    }

    /**
     * 安全获取字符串，如果输入不是字符串则返回默认值
     * @param {*} input - 输入值
     * @param {string} defaultValue - 默认值
     * @returns {string} 字符串值
     */
    static safeString(input, defaultValue = '') {
        if (typeof input === 'string') {
            return input;
        }
        return defaultValue;
    }
}

// 将StringUtils挂载到window对象上
window.StringUtils = StringUtils;

export default StringUtils;