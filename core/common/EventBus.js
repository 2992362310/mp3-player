// 确保只创建一个EventBus实例
let instance = null;
let instanceCount = 0;

class EventBus {
    constructor() {
        // 如果已经存在实例，直接返回
        if (instance) {
            return instance;
        }
        
        this.events = {};
        this.id = ++instanceCount; // 为每个实例分配唯一ID
        
        // 缓存实例
        instance = this;
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        const index = this.events[eventName].indexOf(callback);
        if (index > -1) {
            this.events[eventName].splice(index, 1);
        }
    }

    /**
     * 发布事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 传递的数据
     */
    emit(eventName, data) {
        if (!this.events[eventName]) {
            console.warn(`[EventBus #${this.id}] 警告: 没有找到事件 ${eventName} 的监听器`);
            return;
        }
        
        this.events[eventName].forEach((callback, index) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus #${this.id}] 处理事件 ${eventName} 时出错:`, error);
            }
        });
    }

    /**
     * 订阅一次性事件，触发后自动取消订阅
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(eventName, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(eventName, onceWrapper);
        };
        this.on(eventName, onceWrapper);
    }
    
    // 获取当前实例信息（用于调试）
    getInfo() {
        return {
            id: Math.random().toString(36).substr(2, 9),
            events: Object.keys(this.events)
        };
    }
}

// 将EventBus挂载到window对象上
window.EventBus = EventBus;

export default EventBus;