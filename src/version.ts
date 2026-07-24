/** 构建时注入的应用版本信息 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;

export const UPDATE_NOTES = [
  '跟唱模式：全屏大字歌词、句间倒计时、可选压低原唱（K / Esc）',
  '跟唱播放时自动保持屏幕常亮；设置里可改默认压低原唱',
  '搜索：热门词、仅可播筛选、新搜索取消上一次请求',
  '主题设置器与多套风格（清风 / 小丸子 / 矩阵 / 赛博等）',
] as const;
