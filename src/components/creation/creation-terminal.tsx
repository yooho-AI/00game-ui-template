/**
 * [INPUT]: 无外部依赖（纯 UI 组件，回调上抛）
 * [OUTPUT]: CreationTerminal 组件 — 创造终端输入界面
 * [POS]: creation 的第一屏，用户输入一句话描述想要的游戏世界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

const INSPIRATIONS = [
  '一个宁静的边境小镇被异界裂缝笼罩',
  '民国上海滩，三方势力暗流涌动',
  '末日后的地下避难所，物资即将耗尽',
  '唐朝长安城，一场惊天谋反正在酝酿',
  '赛博朋克都市，AI 觉醒引发连锁反应',
  '一所闹鬼的贵族学院，每晚都有学生失踪',
  '星际殖民船上，冬眠舱出了故障',
]

export default function CreationTerminal({ onGenerate }: { onGenerate: (prompt: string) => void }) {
  const [text, setText] = useState('')
  const [inspirationIdx, setInspirationIdx] = useState(
    () => Math.floor(Math.random() * INSPIRATIONS.length)
  )

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onGenerate(trimmed)
  }

  const handleInspiration = () => {
    setText(INSPIRATIONS[inspirationIdx])
    setInspirationIdx((inspirationIdx + 1) % INSPIRATIONS.length)
  }

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg px-6"
      >
        {/* 标题 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-8 text-center"
        >
          <div className="mb-3 text-5xl">🎮</div>
          <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>创造</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>用一句话，描述你想玩的游戏世界</p>
        </motion.div>

        {/* 输入区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{
            position: 'relative', borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            boxShadow: '0 0 40px rgba(99,102,241,0.08)',
          }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="例如：一个宁静的边境小镇被异界裂缝笼罩..."
              maxLength={2000}
              rows={4}
              style={{
                width: '100%', padding: '16px 18px', paddingBottom: 40,
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6,
                fontFamily: 'var(--font)',
              }}
            />
            <div style={{
              position: 'absolute', bottom: 10, left: 18, right: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {text.length}/2000
              </span>
              <button
                onClick={handleInspiration}
                style={{
                  fontSize: 12, color: 'var(--accent)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '2px 8px',
                }}
              >
                💡 来点灵感
              </button>
            </div>
          </div>

          {/* 创造按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="mt-4 w-full rounded-full px-8 py-3.5 text-sm font-semibold text-white"
            style={{
              background: text.trim()
                ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)'
                : 'var(--bg-card)',
              color: text.trim() ? '#fff' : 'var(--text-muted)',
              boxShadow: text.trim() ? '0 4px 20px var(--primary-glow)' : 'none',
              cursor: text.trim() ? 'pointer' : 'default',
              border: 'none',
              transition: 'all 0.2s',
            }}
          >
            创造世界
          </motion.button>
        </motion.div>

        {/* 灵感标签 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {INSPIRATIONS.slice(0, 4).map((ins, i) => (
            <button
              key={i}
              onClick={() => setText(ins)}
              className="rounded-full px-3 py-1 text-xs transition-colors"
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {ins.slice(0, 12)}...
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
