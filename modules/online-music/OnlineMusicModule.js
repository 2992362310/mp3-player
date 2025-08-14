/**
 * 在线音乐模块事件管理器
 * 负责处理在线音乐模块中的所有事件绑定和交互逻辑
 */

class OnlineMusicModule {
    constructor() {
        this.eventBus = new EventBus();
        this.init();
    }

    init() {
        // 初始化事件监听器
        this.bindEvents();
    }

    bindEvents() {
        // 搜索按钮事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchMusic();
            });
        }
        
        // 搜索输入框回车事件
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchMusic();
                }
            });
        }
        
        // 使用事件委托处理分类点击事件
        const categoryList = document.querySelector('.category-list');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                const categoryItem = e.target.closest('.category-item');
                if (categoryItem) {
                    const categoryName = categoryItem.querySelector('.category-name').textContent;
                    this.selectCategory(categoryName);
                }
            });
        }
        
        // 使用事件委托处理卡片点击事件
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer) {
            cardContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) {
                    const cardTitle = card.querySelector('.card-title').textContent;
                    this.selectCard(cardTitle);
                }
            });
        }
    }

    // 搜索音乐
    searchMusic() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            const keyword = searchInput.value.trim();
            if (keyword) {
                // 发布事件通知执行搜索
                this.eventBus.emit('onlineMusicSearch', { keyword });
                console.log(`搜索音乐: ${keyword}`);
            }
        }
    }

    // 选择分类
    selectCategory(categoryName) {
        // 发布事件通知选择了分类
        this.eventBus.emit('onlineMusicCategorySelected', { category: categoryName });
        console.log(`选择了音乐分类: ${categoryName}`);
    }

    // 选择卡片
    selectCard(cardTitle) {
        // 发布事件通知选择了卡片
        this.eventBus.emit('onlineMusicCardSelected', { card: cardTitle });
        console.log(`选择了卡片: ${cardTitle}`);
    }
}

// 将OnlineMusicModule挂载到window对象上
window.OnlineMusicModule = OnlineMusicModule;