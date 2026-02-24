/**
 * [INPUT]: zustand store, hooks, bgm, framer-motion, 游戏组件
 * [OUTPUT]: App 根组件 — StartScreen ↔ GameScreen 状态机
 * [POS]: 项目入口，Phase 0 用静态 config，Phase 1 将扩展为多页面状态机
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { useIsMobile } from '@/lib/hooks'
import { useBgm } from '@/lib/bgm'
import DialoguePanel from '@/components/game/dialogue-panel'
import LeftPanel from '@/components/game/character-panel'
import RightPanel from '@/components/game/side-panel'
import MobileGameLayout from '@/components/game/mobile-layout'
import EventModal from '@/components/game/event-modal'
import '@/styles/globals.css'

// ============================================================
// 开始界面
// ============================================================

function StartScreen() {
  const initGame = useGameStore(s => s.initGame)
  const loadGame = useGameStore(s => s.loadGame)
  const hasSave = useGameStore(s => s.hasSave)
  const getCharacters = useGameStore(s => s.getCharacters)
  const getGameTitle = useGameStore(s => s.getGameTitle)
  const getGameIcon = useGameStore(s => s.getGameIcon)
  const getGameGenre = useGameStore(s => s.getGameGenre)
  const getGameDescription = useGameStore(s => s.getGameDescription)
  const { toggle, isPlaying } = useBgm()

  const characters = getCharacters()
  const unlocked = characters.filter(c => !c.locked)

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mb-6 text-5xl"
        >
          {getGameIcon()}
        </motion.div>
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{getGameTitle()}</h1>
        <p className="mb-1 text-sm" style={{ color: 'var(--primary)', opacity: 0.8 }}>{getGameGenre()}</p>
        <p className="mb-8 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {getGameDescription()}
        </p>

        {/* 角色预览 */}
        <div className="mb-8 flex justify-center gap-4">
          {unlocked.map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center"
            >
              <div
                className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                style={{ border: `2px solid ${char.themeColor}`, background: 'var(--bg-card)' }}
              >
                {char.image ? (
                  <img src={char.image} alt={char.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  char.avatar
                )}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{char.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{char.title}</div>
            </motion.div>
          ))}
        </div>

        {/* 按钮 */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => initGame()}
            className="w-full rounded-full px-8 py-3 text-sm font-medium text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)`,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            开始游戏
          </motion.button>

          {hasSave() && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadGame()}
              className="w-full rounded-full border px-8 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--border-light)', color: 'var(--primary)' }}
            >
              继续游戏
            </motion.button>
          )}
        </div>

        <button
          onClick={e => toggle(e)}
          className="mt-4 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {isPlaying ? '🔊 音乐开' : '🔇 音乐关'}
        </button>
      </motion.div>
    </div>
  )
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

      {/* 重大事件弹窗 */}
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
// App 根组件
// ============================================================

export default function App() {
  const gameStarted = useGameStore(s => s.gameStarted)
  const isMobile = useIsMobile()

  return (
    <AnimatePresence mode="wait">
      {gameStarted ? (
        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-screen">
          {isMobile ? <MobileGameLayout /> : <GameScreen />}
        </motion.div>
      ) : (
        <motion.div key="start" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <StartScreen />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
