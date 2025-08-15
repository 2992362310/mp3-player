// DOM管理器 - 用于处理DOM操作和事件
class DOMManager {
    // 创建元素的便捷方法
    static createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        element.textContent = textContent;
        return element;
    }
    
    // 为元素添加事件监听器
    static addEventListener(element, event, handler, options = {}) {
        if (element && element.addEventListener) {
            element.addEventListener(event, handler, options);
        }
    }
    
    // 从父元素中移除元素
    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    // 清空元素的内容
    static clearElement(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    }
    
    // 切换元素的CSS类
    static toggleClass(element, className) {
        if (element && element.classList) {
            element.classList.toggle(className);
        }
    }
    
    // 添加CSS类到元素
    static addClass(element, className) {
        if (element && element.classList) {
            element.classList.add(className);
        }
    }
    
    // 从元素中移除CSS类
    static removeClass(element, className) {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    }
    
    // 检查元素是否包含特定CSS类
    static hasClass(element, className) {
        if (element && element.classList) {
            return element.classList.contains(className);
        }
        return false;
    }
    
    // 设置元素的样式
    static setStyle(element, styles) {
        if (element && styles) {
            Object.keys(styles).forEach(property => {
                element.style[property] = styles[property];
            });
        }
    }
    
    // 获取元素的计算样式
    static getComputedStyle(element, property) {
        if (element) {
            const computedStyle = window.getComputedStyle(element);
            return computedStyle.getPropertyValue(property);
        }
        return null;
    }
    
    // 查找元素
    static querySelector(selector, parent = document) {
        return parent.querySelector(selector);
    }
    
    // 查找多个元素
    static querySelectorAll(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }
    
    // 获取元素的属性值
    static getAttribute(element, attribute) {
        if (element) {
            return element.getAttribute(attribute);
        }
        return null;
    }
    
    // 设置元素的属性值
    static setAttribute(element, attribute, value) {
        if (element) {
            element.setAttribute(attribute, value);
        }
    }
    
    // 移除元素的属性
    static removeAttribute(element, attribute) {
        if (element) {
            element.removeAttribute(attribute);
        }
    }
}

// 将DOMManager挂载到window对象上
window.DOMManager = DOMManager;

export default DOMManager;