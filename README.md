# 手绘播放器 - 云听音乐聚合平台

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview
```

### PWA 安装（iOS/Android）

本项目已支持 PWA，可在移动端“添加到主屏幕”后像 App 一样打开。

1. 先部署站点（推荐 HTTPS，GitHub Pages 也可）。
2. iPhone Safari 打开站点，点击分享按钮，选择“添加到主屏幕”。
3. Android Chrome 打开站点，按提示“安装应用”或在菜单里选择“安装应用”。

已包含：
- Web App Manifest（应用名称、图标、启动模式）
- Service Worker（自动更新与基础缓存）
- 离线提示页 [public/offline.html](public/offline.html)

## 核心模块说明

### 1. 音频引擎 (`AudioEngine.ts`)

基于 Howler.js 的音频播放引擎，提供：
- **音频加载和播放**: 支持立即播放或静默加载（用于恢复会话）
- **播放控制**: 播放、暂停、跳转进度
- **进度管理**: 节流同步到界面（约 250ms）
- **音量控制**: 音量调节和静音
- **事件系统**: 播放、暂停、结束、错误事件

### 2. API 服务 (`GDMusicApi.ts`)

GD Music API 的封装和优化：
- **请求频率限制**: 5分钟内最多50次请求
- **缓存机制**: 5分钟 TTL，最多保留约 80 条缓存
- **多音质支持**: 128k / 192k / 320k / 无损，可按偏好降级
- **错误处理**: 播放失败会尝试同名单曲或自动下一首
- **稳定音源**: 网易云、酷我、JOOX、B站

### 3. 播放体验

- 独立播放队列（与搜索结果解耦）
- 恢复上次播放位置（不自动开播，需手动继续）
- 最近播放历史、自建歌单
- 搜索结果按音源 / 歌手筛选
- 进度条拖拽定位
- 快捷键：空格播放/暂停，方向键调节进度/音量，`L` 歌词，`M` 静音

---

## 许可证

MIT License - 本项目仅供学习交流使用

---

## 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [DaisyUI](https://daisyui.com/) - Tailwind CSS 组件库
- [GD Music API](https://music-api.gdstudio.xyz/) - 音乐 API 服务

---

> **温馨提示**: 请合理使用 API 服务，支持正版音乐，尊重音乐版权！
