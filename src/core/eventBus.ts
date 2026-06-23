/**
 * 全局事件总线 - 单例模式
 * 用于组件间通信
 */

export interface EventBusEvents {
  switchContent: string;
  audioPlaying: { file: any };
  timeUpdate: { currentTime: number; duration: number };
  trackEnded: void;
  trackChanged: { file: any };
  playbackError: { error: Error };
  audioPlayerInitialized: void;
  searchMusic: string;
  themeChanged: { theme: string; isDark?: boolean };
  playTrack: any;
  togglePlay: void;
  localMusicScanned: { files: any[] };
  localMusicReselected: { file: any };
  playPrevTrack: void;
  playNextTrack: void;
  trackPlaying: void;
  trackPaused: void;
  showToast: { message: string; type: string };
  openPlaylist: any;
  createPlaylist: void;
  openApiPlaylist: any;
  apiPlaylistActivated: void;
  [key: string]: any;
}

export type EventCallback<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};
  private static instance: EventBus;

  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    EventBus.instance = this;
  }

  /**
   * 订阅事件
   */
  on<T extends keyof EventBusEvents>(
    eventName: T,
    callback: EventCallback<EventBusEvents[T]>,
  ): UnsubscribeFn {
    const key = eventName as string;
    if (!this.events[key]) {
      this.events[key] = [];
    }
    this.events[key].push(callback as EventCallback);
    return () => this.off(eventName, callback);
  }

  /**
   * 取消订阅事件
   */
  off<T extends keyof EventBusEvents>(
    eventName: T,
    callback: EventCallback<EventBusEvents[T]>,
  ): void {
    const key = eventName as string;
    if (!this.events[key]) return;
    const index = this.events[key].indexOf(callback as EventCallback);
    if (index > -1) {
      this.events[key].splice(index, 1);
    }
  }

  /**
   * 发布事件
   */
  emit<T extends keyof EventBusEvents>(
    eventName: T,
    data?: EventBusEvents[T],
  ): void {
    const key = eventName as string;
    if (!this.events[key]) return;
    this.events[key].forEach((callback: EventCallback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] 处理事件 ${eventName} 时出错:`, error);
      }
    });
  }

  /**
   * 订阅一次性事件
   */
  once<T extends keyof EventBusEvents>(
    eventName: T,
    callback: EventCallback<EventBusEvents[T]>,
  ): void {
    const onceWrapper = (data: EventBusEvents[T]) => {
      callback(data);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  }

  /**
   * 清空所有事件
   */
  clear(): void {
    this.events = {};
  }
}

// 导出单例实例
export const eventBus = new EventBus();
export default eventBus;
