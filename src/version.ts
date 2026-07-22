/** 构建时注入的应用版本信息 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;

export const UPDATE_NOTES = [
  '自建歌单、搜索筛选与最近播放',
  '播放会话恢复、进度拖拽与音质降级',
  '歌词面板移动端铺满与点击跳转提示',
  '请求限流冷却提示与失败自动重试',
] as const;
