/**
 * 简易 LRC 解析（本地歌词用）
 */
export function parseLrc(lyric: string): Array<{ time: number; text: string }> {
  if (!lyric) return [];
  const lines: Array<{ time: number; text: string }> = [];
  for (const raw of lyric.split(/\r?\n/)) {
    const matches = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!matches.length) continue;
    const text = raw.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim();
    if (!text) continue;
    for (const match of matches) {
      const time = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
      lines.push({ time: Math.floor(time * 100) / 100, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}
