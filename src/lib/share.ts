/**
 * [INPUT]: 依赖 lz-string，依赖 @/config/game 的 WorldConfig 接口
 * [OUTPUT]: encodeWorldConfig / decodeWorldConfig / getSharedConfig / buildShareUrl
 * [POS]: lib 的分享编解码器，WorldConfig 压缩到 URL 参数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import LZString from 'lz-string'
import type { WorldConfig } from '@/config/game'

/**
 * WorldConfig → URL-safe 压缩字符串
 * lz-string 的 compressToEncodedURIComponent 直接输出 URL 安全字符
 */
export function encodeWorldConfig(config: WorldConfig): string {
  const json = JSON.stringify(config)
  return LZString.compressToEncodedURIComponent(json)
}

/**
 * URL-safe 压缩字符串 → WorldConfig
 * 解码失败返回 null
 */
export function decodeWorldConfig(encoded: string): WorldConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const config = JSON.parse(json) as WorldConfig
    if (!config.title || !config.characters?.length) return null
    return config
  } catch {
    return null
  }
}

/**
 * 从当前 URL 提取分享的 WorldConfig
 * 检查 ?w= 参数
 */
export function getSharedConfig(): WorldConfig | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('w')
  if (!encoded) return null
  return decodeWorldConfig(encoded)
}

/**
 * 构建分享 URL
 */
export function buildShareUrl(config: WorldConfig): string {
  const encoded = encodeWorldConfig(config)
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('w', encoded)
  return url.toString()
}
