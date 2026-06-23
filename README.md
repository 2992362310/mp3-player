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

## 🔧 核心模块说明

### 1. 音频引擎 (`AudioEngine.ts`)

基于 Howler.js 的音频播放引擎，提供：
- **音频加载和播放**: 支持淡入淡出效果
- **播放控制**: 播放、暂停、停止、续播
- **进度管理**: 获取/设置播放进度
- **音量控制**: 音量调节和静音
- **播放速率**: 支持调整播放速度
- **事件系统**: 播放、暂停、结束、错误事件


### 2. API 服务 (`GDMusicApi.ts`)

GD Music API 的封装和优化：
- **请求频率限制**: 5分钟内最多50次请求
- **缓存机制**: 5分钟缓存
- **多音质支持**: 128k/192k/320k/740k/999k
- **错误处理**: 自动重试和错误提示
- **跨域处理**: CORS 友好的请求

---

## 📜 许可证

MIT License - 本项目仅供学习交流使用

---

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [DaisyUI](https://daisyui.com/) - Tailwind CSS 组件库
- [GD Music API](https://music-api.gdstudio.xyz/) - 音乐 API 服务

---

> ⚔️ **温馨提示**: 请合理使用 API 服务，支持正版音乐，尊重音乐版权！