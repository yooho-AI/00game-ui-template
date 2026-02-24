/**
 * [INPUT]: zustand store, hooks, bgm, framer-motion, creation 组件, game 组件, generator, share
 * [OUTPUT]: App 根组件 — creation → loading → preview → game 四阶段状态机
 * [POS]: 项目入口，整合 Phase 0 游戏骨架与 Phase 1 AI 创造流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { useIsMobile } from '@/lib/hooks'
import { useBgm } from '@/lib/bgm'
import { generateWorld } from '@/lib/generator'
import { getSharedConfig, buildShareUrl } from '@/lib/share'
import type { WorldConfig } from '@/config/game'
import CreationTerminal from '@/components/creation/creation-terminal'
import LoadingScreen from '@/components/creation/loading-screen'
import WorldPreview from '@/components/creation/world-preview'
import DialoguePanel from '@/components/game/dialogue-panel'
import LeftPanel from '@/components/game/character-panel'
import RightPanel from '@/components/game/side-panel'
import MobileGameLayout from '@/components/game/mobile-layout'
import EventModal from '@/components/game/event-modal'
import '@/styles/globals.css'

// ============================================================
// 主题色注入 — WorldConfig 色彩覆盖 CSS 变量
// ============================================================

function applyThemeColors(colors: WorldConfig['themeColors']) {
  const s = document.documentElement.style
  s.setProperty('--primary', colors.primary)
  s.setProperty('--primary-light', colors.primaryLight)
  s.setProperty('--accent', colors.accent)
  s.setProperty('--bg-primary', colors.bgPrimary)
  s.setProperty('--bg-secondary', colors.bgSecondary)
  s.setProperty('--bg-card', colors.bgCard)
  s.setProperty('--text-primary', colors.textPrimary)
  s.setProperty('--text-secondary', colors.textSecondary)
}

// ============================================================
// 顶部状态栏
// ============================================================

function HeaderBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { toggle, isPlaying } = useBgm()
  const currentDay = useGameStore(s => s.currentDay)
  const currentPeriod = useGameStore(s => s.currentPeriod)
  const round = useGameStore(s => s.round)
  const currentScene = useGameStore(s => s.currentScene)
  const getScene = useGameStore(s => s.getScene)
  const getPeriods = useGameStore(s => s.getPeriods)
  const getGameTitle = useGameStore(s => s.getGameTitle)
  const getGameIcon = useGameStore(s => s.getGameIcon)

  const period = getPeriods()[currentPeriod]
  const scene = getScene(currentScene)

  return (
    <header
      className="relative z-10 flex min-h-[44px] items-center justify-between px-4 py-2"
      style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        <span>{getGameIcon()} {getGameTitle()}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>回合 {round} · 第{currentDay}天 · {period?.icon} {period?.name}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>{scene?.icon} {scene?.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={e => toggle(e)}
          className="rounded px-3 py-2 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {isPlaying ? '🔊' : '🔇'}
        </button>
        <button
          onClick={onMenuClick}
          className="rounded px-3 py-2 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          ☰
        </button>
      </div>
    </header>
  )
}

// ============================================================
// 菜单弹窗
// ============================================================

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const saveGame = useGameStore(s => s.saveGame)
  const loadGame = useGameStore(s => s.loadGame)
  const resetGame = useGameStore(s => s.resetGame)

  return (
    <div className="gx-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="gx-modal"
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, margin: '0 0 16px', textAlign: 'center' }}>
          游戏菜单
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="gx-modal-btn" onClick={() => { saveGame(); onClose() }}>💾 保存游戏</button>
          <button className="gx-modal-btn" onClick={() => { loadGame(); onClose() }}>📂 读取存档</button>
          <button className="gx-modal-btn" onClick={() => resetGame()}>🏠 返回标题</button>
          <button className="gx-modal-btn" onClick={onClose}>▶️ 继续游戏</button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// PC 游戏主屏幕
// ============================================================

function GameScreen() {
  const [showMenu, setShowMenu] = useState(false)
  const [notification, setNotification] = useState<{ text: string; type: string } | null>(null)

  const showNotif = useCallback((text: string, type = 'info') => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 2000)
  }, [])
  void showNotif

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}>
      <HeaderBar onMenuClick={() => setShowMenu(true)} />

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] shrink-0">
          <LeftPanel />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DialoguePanel />
        </section>
        <aside className="shrink-0">
          <RightPanel />
        </aside>
      </main>

      <EventModal />

      <AnimatePresence>
        {showMenu && <MenuOverlay onClose={() => setShowMenu(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div key="notif" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className={`gx-notification ${notification.type}`}>
              <span>{notification.type === 'success' ? '✓' : 'ℹ'}</span>
              <span>{notification.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// App 根组件 — 四阶段状态机
// creation → loading → preview → game
// ============================================================

type AppPhase = 'creation' | 'loading' | 'preview' | 'game'

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('creation')
  const [worldConfig, setWorldConfig] = useState<WorldConfig | null>(null)
  const [generationDone, setGenerationDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameStarted = useGameStore(s => s.gameStarted)
  const loadWorldConfig = useGameStore(s => s.loadWorldConfig)
  const initGame = useGameStore(s => s.initGame)
  const loadGame = useGameStore(s => s.loadGame)
  const hasSave = useGameStore(s => s.hasSave)
  const isMobile = useIsMobile()

  /* 首次加载：检查 URL 分享参数 ?w= */
  useEffect(() => {
    const shared = getSharedConfig()
    if (shared) {
      setWorldConfig(shared)
      setPhase('preview')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  /* 同步 store.gameStarted ↔ phase */
  useEffect(() => {
    if (gameStarted && phase !== 'game') setPhase('game')
    if (!gameStarted && phase === 'game') setPhase('creation')
  }, [gameStarted, phase])

  /* 创造流：用户输入 → 生成 WorldConfig */
  const handleGenerate = useCallback(async (prompt: string) => {
    setError(null)
    setGenerationDone(false)
    setPhase('loading')
    try {
      const config = await generateWorld(prompt)
      setWorldConfig(config)
      setGenerationDone(true)
    } catch (e) {
      setPhase('creation')
      setError(e instanceof Error ? e.message : '生成失败，请重试')
    }
  }, [])

  /* loading 动画结束 → preview */
  const handleLoadingReady = useCallback(() => setPhase('preview'), [])

  /* 确认世界 → 注入配置 → 开始游戏 */
  const handleStart = useCallback(() => {
    if (!worldConfig) return
    loadWorldConfig(worldConfig)
    applyThemeColors(worldConfig.themeColors)
    initGame()
  }, [worldConfig, loadWorldConfig, initGame])

  /* 回到创造终端重新生成 */
  const handleRegenerate = useCallback(() => {
    setPhase('creation')
    setWorldConfig(null)
  }, [])

  /* 分享世界配置到剪贴板 */
  const handleShare = useCallback(() => {
    if (!worldConfig) return
    const url = buildShareUrl(worldConfig)
    navigator.clipboard.writeText(url).catch(() => {})
  }, [worldConfig])

  /* 从 localStorage 存档恢复游戏 */
  const handleContinue = useCallback(() => {
    if (loadGame()) {
      const wc = useGameStore.getState()._worldConfig
      if (wc?.themeColors) applyThemeColors(wc.themeColors)
    }
  }, [loadGame])

  return (
    <AnimatePresence mode="wait">
      {phase === 'creation' && (
        <motion.div key="creation" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <CreationTerminal onGenerate={handleGenerate} />

          {/* 生成失败提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => setError(null)}
                style={{
                  position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', zIndex: 100,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 继续上次游戏 */}
          {hasSave() && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleContinue}
              style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                padding: '8px 20px', borderRadius: 99,
                border: '1px solid var(--border)', background: 'rgba(36, 36, 36, 0.9)',
                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                backdropFilter: 'blur(8px)', zIndex: 50,
              }}
            >
              📂 继续上次游戏
            </motion.button>
          )}
        </motion.div>
      )}

      {phase === 'loading' && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <LoadingScreen done={generationDone} onReady={handleLoadingReady} />
        </motion.div>
      )}

      {phase === 'preview' && worldConfig && (
        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <WorldPreview
            config={worldConfig}
            onStart={handleStart}
            onRegenerate={handleRegenerate}
            onShare={handleShare}
          />
        </motion.div>
      )}

      {phase === 'game' && (
        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-screen">
          {isMobile ? <MobileGameLayout /> : <GameScreen />}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
