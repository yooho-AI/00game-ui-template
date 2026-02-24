/**
 * [INPUT]: 接收 WorldConfig 对象
 * [OUTPUT]: WorldPreview 组件 — 世界预览卡片
 * [POS]: creation 的第三屏，展示 AI 生成的世界配置，用户确认后开始游戏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion'
import type { WorldConfig } from '@/config/game'

export default function WorldPreview({ config, onStart, onRegenerate, onShare }: {
  config: WorldConfig
  onStart: () => void
  onRegenerate: () => void
  onShare?: () => void
}) {
  const unlockedChars = config.characters.filter(c => !c.locked)
  const lockedChars = config.characters.filter(c => c.locked)

  return (
    <div className="flex min-h-screen items-center justify-center py-12" style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl px-6"
      >
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}>
          {/* 头部 */}
          <div style={{
            padding: '28px 28px 20px', textAlign: 'center',
            background: `linear-gradient(135deg, ${config.themeColors.primary}22 0%, transparent 100%)`,
          }}>
            <div className="mb-2 text-4xl">{config.icon}</div>
            <h1 className="mb-1 text-xl font-bold" style={{ color: config.themeColors.textPrimary || 'var(--text-primary)' }}>
              {config.title}
            </h1>
            <span className="text-xs font-medium" style={{ color: config.themeColors.primary || 'var(--primary)' }}>
              {config.genre}
            </span>
          </div>

          {/* 内容区 */}
          <div style={{ padding: '0 28px 28px' }}>
            {/* 描述 */}
            <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {config.description}
            </p>

            {/* 角色预览 */}
            <Section title="角色">
              <div className="flex flex-wrap gap-3">
                {unlockedChars.map((char, i) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10,
                      border: `1px solid ${char.themeColor}33`,
                      background: `${char.themeColor}0a`,
                    }}
                  >
                    <span className="text-xl">{char.avatar}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: char.themeColor }}>{char.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{char.title}</div>
                    </div>
                  </motion.div>
                ))}
                {lockedChars.map(char => (
                  <div
                    key={char.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10,
                      border: '1px solid var(--border)',
                      opacity: 0.5,
                    }}
                  >
                    <span className="text-xl">❓</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>???</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>随剧情解锁</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 场景 */}
            <Section title="场景">
              <div className="flex flex-wrap gap-2">
                {config.scenes.map(scene => (
                  <div
                    key={scene.id}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-secondary)',
                    }}
                  >
                    {scene.icon} {scene.name}
                  </div>
                ))}
              </div>
            </Section>

            {/* 目标 */}
            <Section title="你的使命">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {config.goals.map((goal, i) => (
                  <div key={goal.id} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{i + 1}.</span>
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{goal.title}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>— {goal.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 属性预览 */}
            <Section title="属性">
              <div className="flex flex-wrap gap-3">
                {config.playerStats.map(stat => (
                  <span key={stat.name} style={{ fontSize: 13, color: stat.color }}>
                    {stat.icon} {stat.name} {config.initialPlayerStats[stat.name] ?? 0}
                  </span>
                ))}
              </div>
            </Section>

            {/* 主题色预览 */}
            <Section title="色调">
              <div className="flex gap-2">
                {[config.themeColors.primary, config.themeColors.accent, config.themeColors.bgPrimary, config.themeColors.bgCard].map((color, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: color, border: '1px solid var(--border)',
                  }} title={color} />
                ))}
              </div>
            </Section>
          </div>

          {/* 按钮区 */}
          <div style={{
            padding: '16px 28px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10,
          }}>
            <button
              onClick={onRegenerate}
              className="flex-1 rounded-full border px-6 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}
            >
              🔄 重新生成
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="flex-[2] rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${config.themeColors.primary} 0%, ${config.themeColors.accent} 100%)`,
                border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 16px ${config.themeColors.primary}44`,
              }}
            >
              开始游戏
            </motion.button>
          </div>

          {/* 分享 */}
          {onShare && (
            <div style={{ padding: '0 28px 20px', textAlign: 'center' }}>
              <button
                onClick={onShare}
                className="text-xs"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🔗 分享这个世界给朋友
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</div>
      {children}
    </div>
  )
}
