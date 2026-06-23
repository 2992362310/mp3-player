/**
 * 均衡器 — 基于 Web Audio API
 * 10 频段 BiquadFilter 均衡器，支持预设和自定义调节
 */

export interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
  type: BiquadFilterType;
}

export interface EQPreset {
  name: string;
  label: string;
  bands: number[]; // 10 个增益值 (dB)
}

// 10 频段中心频率 (Hz)
const FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// 预设
export const EQ_PRESETS: EQPreset[] = [
  { name: 'flat',      label: '平坦',     bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'pop',       label: '流行',     bands: [-1, 2, 4, 4, 2, -1, -1, -1, 1, 2] },
  { name: 'rock',      label: '摇滚',     bands: [4, 3, 1, -1, -2, 1, 3, 4, 4, 4] },
  { name: 'classical', label: '古典',     bands: [3, 2, 1, 1, -1, -1, 0, 1, 2, 3] },
  { name: 'jazz',      label: '爵士',     bands: [2, 1, 0, 2, -1, -1, 0, 1, 2, 3] },
  { name: 'bass',      label: '低音增强', bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'vocal',     label: '人声增强', bands: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1] },
];

class Equalizer {
  private filters: BiquadFilterNode[] = [];
  private source: AudioNode | null = null;
  private destination: AudioNode | null = null;
  private context: AudioContext | null = null;
  private _enabled = false;
  private _currentPreset = 'flat';
  private _gains: number[] = new Array(10).fill(0);

  /** 初始化均衡器链 */
  init(ctx: AudioContext, source: AudioNode, destination: AudioNode): void {
    this.destroy();
    this.context = ctx;
    this.source = source;
    this.destination = destination;

    // 创建 10 个滤波器
    this.filters = FREQUENCIES.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = this._gains[i];
      return filter;
    });

    // 串联滤波器
    this._connectChain();
    this._enabled = true;
  }

  private _connectChain(): void {
    if (!this.source || !this.destination || this.filters.length === 0) return;

    // 断开现有连接
    this.source.disconnect();
    this.filters.forEach((f) => f.disconnect());

    // source -> filter[0] -> ... -> filter[9] -> destination
    this.source.connect(this.filters[0]);
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
    this.filters[this.filters.length - 1].connect(this.destination);
  }

  /** 旁路：直接连接 source -> destination */
  private _bypass(): void {
    if (!this.source || !this.destination) return;
    this.source.disconnect();
    this.filters.forEach((f) => f.disconnect());
    this.source.connect(this.destination);
  }

  /** 设置单个频段增益 */
  setBand(index: number, gain: number): void {
    if (index < 0 || index >= 10) return;
    gain = Math.max(-12, Math.min(12, gain));
    this._gains[index] = gain;
    if (this.filters[index]) {
      this.filters[index].gain.value = gain;
    }
  }

  /** 获取频段增益 */
  getBand(index: number): number {
    return this._gains[index] ?? 0;
  }

  /** 应用预设 */
  applyPreset(name: string): void {
    const preset = EQ_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    this._currentPreset = name;
    preset.bands.forEach((gain, i) => this.setBand(i, gain));
  }

  /** 获取所有频段增益 */
  getGains(): number[] {
    return [...this._gains];
  }

  /** 设置所有频段增益 */
  setGains(gains: number[]): void {
    gains.forEach((g, i) => this.setBand(i, g));
  }

  /** 启用/禁用均衡器 */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (enabled) this._connectChain();
    else this._bypass();
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  getCurrentPreset(): string {
    return this._currentPreset;
  }

  getFrequencies(): number[] {
    return [...FREQUENCIES];
  }

  destroy(): void {
    if (this.source && this.destination && this._enabled) {
      try {
        this.source.disconnect();
        this.source.connect(this.destination);
      } catch { /* ignore */ }
    }
    this.filters.forEach((f) => {
      try { f.disconnect(); } catch { /* ignore */ }
    });
    this.filters = [];
    this._enabled = false;
  }
}

export const equalizer = new Equalizer();
export default equalizer;
