/** 构建时注入的应用版本信息 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;

export const UPDATE_NOTES = [
  '歌词面板优化：点击歌词可跳转，移动端显示更稳定',
  '播放时可选保持屏幕常亮（前台生效）',
  '搜索：热门词、仅可播筛选、新搜索取消上一次请求',
  '主题设置器与多套风格（清风 / 小丸子 / 矩阵 / 赛博等）',
] as const;
