/**
 * 桌面歌词窗口：窗口管理与通信协议
 *
 * 优先使用 Document Picture-in-Picture（Chrome/Edge 116+、Firefox 151+），
 * 可得到真正置顶、跨标签页存活的浮动窗口；不支持时降级为普通弹窗。
 * 两种模式共用同一个 iframe 页面与 BroadcastChannel 协议，界面只有一份实现。
 */

export const LYRICS_CHANNEL = 'moyun-desktop-lyrics';

export interface DesktopLyricsLine {
  time: number;
  text: string;
  translation?: string;
}

/** 主窗口 → 歌词窗口：完整状态快照 */
export interface DesktopLyricsState {
  title: string;
  artist: string;
  lines: DesktopLyricsLine[];
  currentIndex: number;
  playing: boolean;
  accent: string;
  paper: string;
  ink: string;
  displayFont: string;
}

/** 歌词窗口 → 主窗口：用户操作 */
export type DesktopLyricsAction =
  | { type: 'playpause' }
  | { type: 'prev' }
  | { type: 'next' }
  | { type: 'close' }
  | { type: 'seek'; index: number };

export type DesktopLyricsWindowMode = 'pip' | 'popup' | null;

interface PictureInPictureHost {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
  window: Window | null;
}

let activeWindow: Window | null = null;
let activeMode: DesktopLyricsWindowMode = null;
let closeHandler: (() => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function getPipHost(): PictureInPictureHost | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as Window & { documentPictureInPicture?: PictureInPictureHost })
      .documentPictureInPicture ?? null
  );
}

/** 当前浏览器能否开启真正置顶的 Document PiP 窗口 */
export function canUseDocumentPip(): boolean {
  return getPipHost() !== null;
}

/** 歌词窗口是否仍然开启（用户可能从系统窗口边框直接关闭） */
export function isDesktopLyricsOpen(): boolean {
  return !!activeWindow && !activeWindow.closed;
}

export function getDesktopLyricsMode(): DesktopLyricsWindowMode {
  return isDesktopLyricsOpen() ? activeMode : null;
}

function notifyClosed() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  activeWindow = null;
  activeMode = null;
  closeHandler?.();
  closeHandler = null;
}

/** 注册窗口被关闭的回调（含用户从系统边框关闭的情况） */
export function onDesktopLyricsClose(handler: () => void) {
  closeHandler = handler;
}

async function openPipWindow(url: string): Promise<Window | null> {
  const host = getPipHost();
  if (!host) return null;
  try {
    const win = await host.requestWindow({ width: 480, height: 220 });
    win.document.body.style.margin = '0';
    win.document.body.style.overflow = 'hidden';
    const frame = win.document.createElement('iframe');
    frame.src = url;
    frame.title = '桌面歌词';
    frame.style.cssText =
      'display:block;width:100%;height:100%;border:0;background:transparent';
    win.document.body.appendChild(frame);
    win.addEventListener('pagehide', () => {
      if (activeWindow === win) notifyClosed();
    });
    return win;
  } catch {
    return null;
  }
}

/**
 * 打开歌词窗口。需在用户手势中调用（PiP 与弹窗都要求 transient activation）。
 * @returns 实际使用的窗口模式；null 表示被浏览器拦截或不支持
 */
export async function openDesktopLyrics(): Promise<DesktopLyricsWindowMode> {
  if (isDesktopLyricsOpen()) return activeMode;

  const url = new URL('desktop-lyrics.html', document.baseURI).href;
  const win = await openPipWindow(url);

  if (win) {
    activeWindow = win;
    activeMode = 'pip';
    return 'pip';
  }

  const popup = window.open(
    url,
    'moyun-desktop-lyrics',
    'width=480,height=220,resizable=yes,scrollbars=no',
  );
  if (!popup) return null;

  activeWindow = popup;
  activeMode = 'popup';
  // 普通弹窗无法收到 pagehide 通知，轮询 closed 状态
  pollTimer = setInterval(() => {
    if (!isDesktopLyricsOpen()) notifyClosed();
  }, 800);
  return 'popup';
}

export function closeDesktopLyrics() {
  if (activeWindow && !activeWindow.closed) {
    const wasPip = activeMode === 'pip';
    activeWindow.close();
    // PiP 窗口的 pagehide 可能不触发，主动收尾
    if (wasPip) notifyClosed();
  }
  notifyClosed();
}

/**
 * 建立与主窗口状态同步的消息通道。
 * 歌词窗口加载完成后会发 ready，主窗口据此补推一次状态，避免首帧丢失。
 */
export function createLyricsChannel(
  onAction: (action: DesktopLyricsAction) => void,
  onReady?: () => void,
) {
  const channel = new BroadcastChannel(LYRICS_CHANNEL);
  channel.onmessage = (event: MessageEvent) => {
    const data = event.data as
      | { type: 'action'; action: DesktopLyricsAction }
      | { type: 'ready' }
      | undefined;
    if (data?.type === 'action' && 'action' in data && data.action) {
      onAction(data.action);
    } else if (data?.type === 'ready') {
      onReady?.();
    }
  };
  return {
    post(state: DesktopLyricsState) {
      channel.postMessage({ type: 'state', state });
    },
    close() {
      channel.close();
    },
  };
}
