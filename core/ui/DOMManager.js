class DOMManager {
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`未找到ID为"${id}"的元素`);
        }
        return element;
    }
    
    static setElementStyle(element, style, value) {
        if (!element) return;
        element.style[style] = value;
    }
    
    static setElementText(element, text) {
        if (!element) return;
        element.textContent = text;
    }
    
    static setElementAttribute(element, attribute, value) {
        if (!element) return;
        element.setAttribute(attribute, value);
    }
    
    static addEventListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
    }
    
    static removeEventListener(element, event, handler) {
        if (!element) return;
        element.removeEventListener(event, handler);
    }
    
    static disableElement(element, disabled = true) {
        if (!element) return;
        element.disabled = disabled;
    }
    
    static createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        if (options.id) {
            element.id = options.id;
        }
        if (options.className) {
            element.className = options.className;
        }
        if (options.text) {
            element.textContent = options.text;
        }
        if (options.html) {
            element.innerHTML = options.html;
        }
        return element;
    }
}