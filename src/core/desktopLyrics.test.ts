import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LYRICS_CHANNEL,
  createLyricsChannel,
  type DesktopLyricsState,
} from './desktopLyrics';

const state: DesktopLyricsState = {
  title: '测试歌曲',
  artist: '测试歌手',
  lines: [{ time: 0, text: '第一行' }],
  currentIndex: 0,
  playing: true,
  accent: '#5b57d1',
  paper: '#faf7f0',
  ink: '#2d2d2d',
  displayFont: 'cursive',
};

interface FakeChannel {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

describe('桌面歌词通信协议', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('状态快照带上协议标记发往固定通道', () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    vi.stubGlobal('BroadcastChannel', class {
      constructor(name: string) {
        expect(name).toBe(LYRICS_CHANNEL);
      }
      postMessage = postMessage;
      close = close;
    });

    const channel = createLyricsChannel(() => {});
    channel.post(state);

    expect(postMessage).toHaveBeenCalledWith({ type: 'state', state });
    channel.close();
    expect(close).toHaveBeenCalled();
  });

  it('只把 action 消息转成用户操作，忽略其他消息', () => {
    const instances: FakeChannel[] = [];
    vi.stubGlobal('BroadcastChannel', class implements FakeChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage = vi.fn();
      close = vi.fn();
      constructor() {
        instances.push(this);
      }
    });

    const received: string[] = [];
    const channel = createLyricsChannel((action) => received.push(action.type));
    const fake = instances[0];
    expect(fake?.onmessage).toBeTypeOf('function');

    const emit = (data: unknown) =>
      fake?.onmessage?.({ data } as MessageEvent);

    emit({ type: 'state', state }); // 主窗口发的镜像消息应被忽略
    emit({ type: 'action', action: { type: 'next' } });
    emit({ type: 'action', action: { type: 'seek', index: 2 } });
    emit(null);

    expect(received).toEqual(['next', 'seek']);
    channel.close();
  });

  it('窗口就绪后触发补推回调', () => {
    const instances: FakeChannel[] = [];
    vi.stubGlobal('BroadcastChannel', class implements FakeChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage = vi.fn();
      close = vi.fn();
      constructor() {
        instances.push(this);
      }
    });

    let readyCount = 0;
    const channel = createLyricsChannel(() => {}, () => {
      readyCount++;
    });
    instances[0].onmessage?.({ data: { type: 'state', state } } as MessageEvent);
    instances[0].onmessage?.({ data: { type: 'ready' } } as MessageEvent);

    expect(readyCount).toBe(1);
    channel.close();
  });
});
