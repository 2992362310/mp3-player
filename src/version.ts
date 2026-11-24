/** 构建时注入的应用版本信息 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;

export const UPDATE_NOTES = [
  '睡眠定时：15/30/60/90 分钟定时关闭，支持渐弱音量',
  '播放队列面板：查看待播列表、点击切歌、移除/清空',
  '歌单导入导出：JSON 备份与恢复，跨设备迁移',
  '听歌统计：播放次数、时长、最常听歌曲/歌手、7 日趋势',
] as const;
