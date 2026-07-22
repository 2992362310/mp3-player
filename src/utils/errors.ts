/** 将底层异常转成用户可读提示 */
export function formatUserError(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (!msg) return fallback;

  const lower = msg.toLowerCase();

  if (msg.includes('请求频率超限') || msg.includes('频率超限')) {
    const match = msg.match(/(\d+)\s*秒/);
    if (match) return `请求太频繁了，请约 ${match[1]} 秒后再试`;
    return '请求太频繁了，请稍等一会儿再试';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network') ||
    msg.includes('网络')
  ) {
    return '网络异常，请检查连接后重试';
  }
  if (
    msg.includes('无可用地址') ||
    msg.includes('无法获取播放地址') ||
    msg.includes('版权')
  ) {
    return '暂无可用播放地址（可能无版权），试试其他版本或音源';
  }
  if (lower.includes('http error') || msg.includes('服务')) {
    return '服务暂时不可用，请稍后再试';
  }
  if (msg.includes('已禁用') || msg.includes('没有可用音源')) {
    return msg;
  }

  return fallback;
}
