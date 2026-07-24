# 墨韵 MoYun

Vue 3 + Vite + Pinia 多音源在线音乐播放器，支持 PWA、歌词、自建歌单与主题设置器。

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

已支持添加到主屏幕，可像 App 一样使用（建议 HTTPS）。

1. 部署站点后用手机浏览器打开。
2. iPhone Safari：分享 →「添加到主屏幕」。
3. Android Chrome：按提示「安装应用」，或菜单中选择安装。

已包含：
- Web App Manifest（名称、PNG/SVG 图标、横竖屏 `orientation: any`）
- Service Worker（自动更新与基础缓存）
- 离线提示页 [public/offline.html](public/offline.html)
- Apple Touch Icon / 独立模式 meta

## 功能概览

- 多音源搜索（网易云、酷我、JOOX、B站等），支持音源/歌手筛选与「仅可播」探测
- 热门词快捷搜索；新搜索会取消进行中的旧请求
- 独立播放队列、会话恢复（不自动开播）、最近播放、自建歌单
- 歌词面板（移动端全屏 / 横屏紧凑布局），点击歌词跳转
- 跟唱模式：全屏大字歌词、句间倒计时、可选压低原唱
- 主题设置器：底色预设 + 风格/字体/边框/圆角/纹理/强调色
- 锁屏 Media Session（封面、进度、快进快退）
- 可选「播放时不自动息屏」（跟唱播放时也会自动常亮）

### 快捷键

| 按键 | 功能 |
|------|------|
| Space | 播放 / 暂停 |
| ← / → | 快退 / 快进 5 秒 |
| Shift + ← / → | 上一首 / 下一首 |
| ↑ / ↓ | 音量加减 |
| M | 静音 |
| L | 打开 / 关闭歌词 |
| K | 打开 / 关闭跟唱模式 |
| Esc | 退出跟唱 / 关闭歌词 |

## 核心模块

### 音频引擎 (`AudioEngine.ts`)

基于 Howler.js：加载播放、进度节流同步、音量/静音、事件回调。

### API 服务 (`GDMusicApi.ts`)

GD Music API 封装：限流（约 5 分钟 50 次）、缓存、音质降级、请求可取消（`AbortSignal`）。

### 状态与界面

- Pinia：`player` / `search` / `playlist` / `ui`
- 样式：`src/assets/styles/main.css`（CSS 变量主题，无 DaisyUI）

---

## 许可证

MIT License - 本项目仅供学习交流使用

## 致谢

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Howler.js](https://howlerjs.com/)
- [GD Music API](https://music-api.gdstudio.xyz/)

> **提示**：请合理使用 API，支持正版音乐，尊重版权。
