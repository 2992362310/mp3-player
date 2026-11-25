/**
 * 调试日志
 * 仅在开发环境输出，生产构建自动静默
 */
export function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}
