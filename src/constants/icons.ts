/**
 * 项目图标常量
 * 使用 Iconify 图标集：https://icon-sets.iconify.design/
 *
 * 常用图标集:
 * - mdi: Material Design Icons
 * - ri: Remix Icon
 * - ph: Phosphor Icons
 * - heroicons: Heroicons
 * - carbon: Carbon Design System
 * - tabler: Tabler Icons
 */

export const Icons = {
  // 音乐相关
  MUSIC: "mdi:music-note",
  MUSIC_OFF: "mdi:music-note-off",
  PLAY: "mdi:play",
  PAUSE: "mdi:pause",
  SKIP_PREV: "mdi:skip-previous",
  SKIP_NEXT: "mdi:skip-next",
  VOLUME_HIGH: "mdi:volume-high",
  VOLUME_MEDIUM: "mdi:volume-medium",
  VOLUME_LOW: "mdi:volume-low",
  VOLUME_OFF: "mdi:volume-off",
  LYRICS: "mdi:format-quote-open",
  ALBUM: "mdi:album",

  // 导航相关
  MENU: "mdi:menu",
  HOME: "mdi:home",
  SEARCH: "mdi:magnify",
  SETTINGS: "mdi:cog",
  GLOBE: "mdi:web",
  FOLDER: "mdi:folder",
  FOLDER_MUSIC: "mdi:folder-music",

  // 操作相关
  PLUS: "mdi:plus",
  CLOSE: "mdi:close",
  CHECK: "mdi:check",
  DELETE: "mdi:delete",
  EDIT: "mdi:pencil",
  FAVORITE: "mdi:heart",
  FAVORITE_OUTLINE: "mdi:heart-outline",
  SHARE: "mdi:share",
  DOWNLOAD: "mdi:download",
  UPLOAD: "mdi:upload",

  // 主题相关
  SUN: "mdi:weather-sunny",
  MOON: "mdi:weather-night",

  // 播放模式
  REPEAT: "mdi:repeat",
  REPEAT_ONCE: "mdi:repeat-once",
  SHUFFLE: "mdi:shuffle",

  // 状态
  LOADING: "mdi:loading",
  ERROR: "mdi:alert-circle",
  INFO: "mdi:information",
  SUCCESS: "mdi:check-circle",

  // 通知
  BELL: "mdi:bell-outline",
  BELL_RING: "mdi:bell-ring",

  // 推荐
  STAR: "mdi:star-circle",
  FLOWER: "mdi:flower",
  CLOUD: "mdi:cloud",
  RECORD: "mdi:record",
  LIGHTNING: "mdi:lightning-bolt",
  MOVIE: "mdi:movie",
} as const;

export type IconName = keyof typeof Icons;
