/** 构建时注入的应用版本信息 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;

export const UPDATE_NOTES = [
  '桌宠与贴图：可开关、拖动桌宠，贴纸可摆放与删除',
  '本地音乐：导入文件/文件夹、拖放、IndexedDB 持久化、同名 LRC 歌词',
  '歌词面板优化：点击歌词可跳转，移动端显示更稳定',
  '播放时可选保持屏幕常亮（前台生效）',
] as const;
