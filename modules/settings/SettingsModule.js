/**
 * 设置模块事件管理器
 * 负责处理设置模块中的所有事件绑定和交互逻辑
 */

class SettingsModule {
    constructor() {
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
    }

    bindEvents() {
        // 缓存清理按钮事件
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }
        
        // 数据清理按钮事件
        const clearStorageBtn = document.getElementById('clearStorageBtn');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', () => {
                this.clearStorage();
            });
        }
        
        // 检查更新按钮事件
        const checkUpdateBtn = document.getElementById('checkUpdateBtn');
        if (checkUpdateBtn) {
            checkUpdateBtn.addEventListener('click', () => {
                this.checkUpdate();
            });
        }
        
        // 使用事件委托处理开关变化事件
        const settingsContainer = document.querySelector('.settings-container');
        if (settingsContainer) {
            settingsContainer.addEventListener('change', (e) => {
                // 检查是否是开关变化
                if (e.target.type === 'checkbox' && e.target.closest('.switch')) {
                    const switchElem = e.target.closest('.switch');
                    const settingLabel = switchElem.closest('.setting-item').querySelector('.setting-label').textContent;
                    const isEnabled = e.target.checked;
                    this.toggleSetting(settingLabel, isEnabled);
                }
                // 检查是否是选择框变化
                else if (e.target.classList.contains('setting-select')) {
                    const settingLabel = e.target.closest('.setting-item').querySelector('.setting-label').textContent;
                    const selectedValue = e.target.value;
                    this.changeSetting(settingLabel, selectedValue);
                }
            });
        }
    }

    // 清理缓存
    clearCache() {
        // 发布事件通知清理缓存
        this.eventBus.emit('clearCache');
        console.log('清理缓存');
        alert('缓存清理功能将在后续版本中实现');
    }

    // 清理数据存储
    clearStorage() {
        // 发布事件通知清理数据存储
        this.eventBus.emit('clearStorage');
        console.log('清理数据存储');
        alert('数据清理功能将在后续版本中实现');
    }

    // 检查更新
    checkUpdate() {
        // 发布事件通知检查更新
        this.eventBus.emit('checkUpdate');
        console.log('检查更新');
        alert('检查更新功能将在后续版本中实现');
    }

    // 切换设置开关
    toggleSetting(settingLabel, isEnabled) {
        // 发布事件通知切换设置
        this.eventBus.emit('toggleSetting', { setting: settingLabel, enabled: isEnabled });
        console.log(`${settingLabel} 设置已${isEnabled ? '启用' : '禁用'}`);
    }

    // 更改设置选项
    changeSetting(settingLabel, selectedValue) {
        // 发布事件通知更改设置
        this.eventBus.emit('changeSetting', { setting: settingLabel, value: selectedValue });
        console.log(`${settingLabel} 设置已更改为: ${selectedValue}`);
    }
}

// 将SettingsModule挂载到window对象上
window.SettingsModule = SettingsModule;