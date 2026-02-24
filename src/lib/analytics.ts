/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 trackEvent 及预定义事件追踪函数
 * [POS]: lib 的数据统计模块，gx_ 前缀事件，被 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number>) => void
    }
  }
}

export function trackEvent(name: string, data?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(name, data)
  }
}

// ============================================================
// 预定义事件
// ============================================================

export function trackGameStart() {
  trackEvent('gx_game_start')
}

export function trackGameContinue() {
  trackEvent('gx_game_continue')
}

export function trackTimeAdvance(day: number, period: string) {
  trackEvent('gx_time_advance', { day, period })
}
