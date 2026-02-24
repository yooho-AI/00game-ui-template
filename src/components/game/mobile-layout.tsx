/**
 * [INPUT]: 依赖 @/lib/store, @/lib/parser, @/lib/bgm, framer-motion
 * [OUTPUT]: 对外提供 MobileGameLayout 组件
 * [POS]: 移动端完整布局，被 App.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { parseStoryParagraph, stripMarkers } from '@/lib/parser'
import { useBgm } from '@/lib/bgm'
import HighlightModal from './highlight-modal'
import EventModal from './event-modal'

// ============================================================
// 移动端顶栏
// ============================================================

function MobileHeader({
  onCharClick,
  onMenuClick,
}: {
  onCharClick: () => void
  onMenuClick: () => void
}) {
  const currentDay = useGameStore(s => s.currentDay)
  const currentPeriod = useGameStore(s => s.currentPeriod)
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const getPeriods = useGameStore(s => s.getPeriods)
  const getCharacter = useGameStore(s => s.getCharacter)
  const getGameIcon = useGameStore(s => s.getGameIcon)
  const round = useGameStore(s => s.round)
  const { isPlaying, toggle } = useBgm()

  const period = getPeriods()[currentPeriod]
  const char = currentCharacter ? getCharacter(currentCharacter) : undefined

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <span className="mobile-header-stage">{getGameIcon()} R{round}</span>
        <span className="mobile-header-scene">第{currentDay}天</span>
        <span className="mobile-header-scene">{period?.icon} {period?.name}</span>
        <button
          onClick={e => toggle(e)}
          style={{
            background: 'var(--primary-light)', border: '1px solid var(--border)',
            borderRadius: 6, fontSize: 14, cursor: 'pointer', padding: '4px 10px',
          }}
        >
          {isPlaying ? '🔊' : '🔇'}
        </button>
      </div>
      <div className="mobile-header-right">
        <button className="mobile-header-npc" onClick={onCharClick}>
          {char ? (
            <span style={{ color: char.themeColor }}>{char.name}</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>选择角色</span>
          )}
          <span className="mobile-header-arrow">▼</span>
        </button>
        <button className="mobile-header-menu" onClick={onMenuClick}>☰</button>
      </div>
    </header>
  )
}

// ============================================================
// 移动端信笺
// ============================================================

function MobileLetterCard() {
  const getGameTitle = useGameStore(s => s.getGameTitle)
  const getGameGenre = useGameStore(s => s.getGameGenre)
  const getGameDescription = useGameStore(s => s.getGameDescription)
  const getGameIcon = useGameStore(s => s.getGameIcon)

  return (
    <div className="mobile-letter-card">
      <div className="mobile-letter-icon">{getGameIcon()}</div>
      <div className="mobile-letter-genre">{getGameGenre()}</div>
      <h2 className="mobile-letter-title">{getGameTitle()}</h2>
      <p className="mobile-letter-body">{getGameDescription()}</p>
    </div>
  )
}

// ============================================================
// 移动端对话区
// ============================================================

function MobileDialogue({ onCharClick }: { onCharClick: () => void }) {
  const messages = useGameStore(s => s.messages)
  const isTyping = useGameStore(s => s.isTyping)
  const streamingContent = useGameStore(s => s.streamingContent)
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const currentActions = useGameStore(s => s.currentActions)
  const sendMessage = useGameStore(s => s.sendMessage)
  const getCharacter = useGameStore(s => s.getCharacter)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const characterColors = useGameStore(s => s.getCharacterColors)()
  const char = currentCharacter ? getCharacter(currentCharacter) : undefined
  const hasUserMessage = messages.some(m => m.role === 'user')

  useEffect(() => {
    const container = scrollRef.current
    if (container && isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isTyping, streamingContent])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={scrollRef} className="mobile-dialogue gx-scrollbar" style={{ position: 'relative' }}>
      {/* 浮动角色小窗 */}
      {char && hasUserMessage && (
        <div
          onClick={onCharClick}
          style={{
            position: 'sticky', top: 8, float: 'right',
            width: 80, height: 106, borderRadius: 10, overflow: 'hidden',
            zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginRight: 4,
          }}
        >
          {char.video ? (
            <video key={currentCharacter} src={char.video} poster={char.image} autoPlay loop muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : char.image ? (
            <img src={char.image} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-card)', fontSize: 40,
            }}>
              {char.avatar}
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '14px 4px 4px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            fontSize: 10, fontWeight: 600, color: '#fff', textAlign: 'center',
          }}>
            {char.name}
          </div>
        </div>
      )}

      {messages.length === 0 && <MobileLetterCard />}

      {messages.map(msg => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="mobile-msg-user">
              <div className="mobile-bubble-user">{msg.content}</div>
            </div>
          )
        }

        if (msg.role === 'system') {
          return (
            <div key={msg.id} className="mobile-msg-system">{msg.content}</div>
          )
        }

        const cleaned = stripMarkers(msg.content)
        const { narrative, statHtml } = parseStoryParagraph(cleaned, characterColors)
        return (
          <div key={msg.id}>
            <div className="mobile-msg-ai">
              <div className="mobile-bubble-ai" dangerouslySetInnerHTML={{ __html: narrative }} />
            </div>
            {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
          </div>
        )
      })}

      {isTyping && streamingContent && (() => {
        const cleaned = stripMarkers(streamingContent)
        const { narrative, statHtml } = parseStoryParagraph(cleaned, characterColors)
        return (
          <div>
            <div className="mobile-msg-ai">
              <div className="mobile-bubble-ai" dangerouslySetInnerHTML={{ __html: narrative }} />
            </div>
            {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
          </div>
        )
      })()}

      {isTyping && !streamingContent && (
        <div className="mobile-msg-ai">
          <div className="mobile-bubble-ai mobile-typing">
            <span className="mobile-typing-dot" />
            <span className="mobile-typing-dot" />
            <span className="mobile-typing-dot" />
          </div>
        </div>
      )}

      {/* 行动选项 */}
      {!isTyping && currentActions.length > 0 && (
        <div className="gx-action-options">
          {currentActions.map((opt, i) => (
            <button key={i} className="gx-action-btn" onClick={() => sendMessage(opt)}>{opt}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 移动端输入栏
// ============================================================

function MobileInputBar({ onGoalsClick }: { onGoalsClick: () => void }) {
  const [input, setInput] = useState('')
  const [showHighlight, setShowHighlight] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = useGameStore(s => s.messages)
  const isTyping = useGameStore(s => s.isTyping)
  const sendMessage = useGameStore(s => s.sendMessage)
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const getCharacter = useGameStore(s => s.getCharacter)

  const char = currentCharacter ? getCharacter(currentCharacter) : undefined
  const canHighlight = messages.filter(m => m.role !== 'system').length >= 5

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="mobile-input-bar" style={{ flexDirection: 'column', gap: 0 }}>
      {/* 快捷操作 */}
      <div className="flex gap-2 overflow-x-auto px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onGoalsClick}
          className="shrink-0 rounded-full border px-3 py-1 text-xs"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'transparent' }}
        >
          🎯 目标
        </button>
        {canHighlight && (
          <button
            onClick={() => setShowHighlight(true)}
            className="shrink-0 rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }}
          >
            ✨ 高光
          </button>
        )}
      </div>

      <AnimatePresence>
        {showHighlight && <HighlightModal onClose={() => setShowHighlight(false)} />}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2">
        <form onSubmit={handleSubmit} className="mobile-input-form">
          <input
            ref={inputRef}
            type="text"
            className="mobile-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={char ? `对${char.name}说...` : '说点什么...'}
            disabled={isTyping}
          />
          <button type="submit" className="mobile-send-btn" disabled={isTyping || !input.trim()}>
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// 角色选择面板
// ============================================================

function CharacterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const characterStats = useGameStore(s => s.characterStats)
  const selectCharacter = useGameStore(s => s.selectCharacter)
  const unlockedCharacters = useGameStore(s => s.unlockedCharacters)
  const getCharacters = useGameStore(s => s.getCharacters)
  const getCharacterStatConfigs = useGameStore(s => s.getCharacterStatConfigs)

  const characters = getCharacters()
  const statConfigs = getCharacterStatConfigs()

  const handleSelect = (id: string) => {
    if (!unlockedCharacters.has(id)) return
    selectCharacter(currentCharacter === id ? null : id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-title">选择角色</div>
            <div className="mobile-char-grid">
              {characters.map(char => {
                const isLocked = !unlockedCharacters.has(char.id)
                const isSelected = currentCharacter === char.id
                const stats = characterStats[char.id]
                return (
                  <button
                    key={char.id}
                    className={`mobile-char-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                    style={{ borderColor: isSelected ? char.themeColor : 'transparent', opacity: isLocked ? 0.5 : 1 }}
                    onClick={() => handleSelect(char.id)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' }}>
                      {isLocked ? (
                        <div style={{
                          width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-card)', fontSize: 24, color: 'var(--text-muted)',
                        }}>?</div>
                      ) : char.video ? (
                        <video src={char.video} poster={char.image} autoPlay loop muted playsInline
                          style={{ width: 48, height: 48, objectFit: 'cover' }} />
                      ) : char.image ? (
                        <img src={char.image} alt={char.name} style={{ width: 48, height: 48, objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-card)', fontSize: 24,
                        }}>{char.avatar}</div>
                      )}
                    </div>
                    <span className="mobile-char-name" style={{ color: isLocked ? 'var(--text-muted)' : char.themeColor }}>
                      {isLocked ? '???' : char.name}
                    </span>
                    {!isLocked && stats && (
                      <div className="mobile-char-stats">
                        {statConfigs.map(sc => (
                          <span key={sc.name}>{sc.icon} {stats[sc.name] ?? 0}</span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 目标/事件面板
// ============================================================

function GoalsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const goals = useGameStore(s => s.goals)
  const keyEvents = useGameStore(s => s.keyEvents)
  const [tab, setTab] = useState<'goals' | 'events'>('goals')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="mobile-sheet-handle" />

            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setTab('goals')}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: tab === 'goals' ? 'var(--primary)' : 'transparent',
                  color: tab === 'goals' ? '#fff' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                🎯 目标
              </button>
              <button
                onClick={() => setTab('events')}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: tab === 'events' ? 'var(--primary)' : 'transparent',
                  color: tab === 'events' ? '#fff' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                📜 事件 {keyEvents.length > 0 && `(${keyEvents.length})`}
              </button>
            </div>

            <div className="gx-scrollbar" style={{ maxHeight: '50vh', overflowY: 'auto', padding: 16 }}>
              {tab === 'goals' ? (
                goals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {goals.map(goal => (
                      <div key={goal.id} style={{
                        padding: 12, borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: goal.completed ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                          {goal.completed ? '✓' : '○'} {goal.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{goal.condition}</div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.completed ? 'var(--accent)' : 'var(--primary)', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{goal.progress}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>暂无目标</div>
                )
              ) : (
                keyEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {keyEvents.map(evt => (
                      <div key={evt.id} style={{
                        padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: evt.major ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {evt.major ? '🚨' : '📌'} {evt.title}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>R{evt.round}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{evt.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>尚无事件</div>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 移动端菜单
// ============================================================

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resetGame = useGameStore(s => s.resetGame)
  const saveGame = useGameStore(s => s.saveGame)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mobile-menu-title">游戏菜单</div>
            <button className="mobile-menu-btn" onClick={() => { saveGame(); onClose() }}>💾 保存游戏</button>
            <button className="mobile-menu-btn" onClick={() => resetGame()}>🏠 返回标题</button>
            <button className="mobile-menu-btn" onClick={onClose}>▶️ 继续游戏</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 移动端游戏主布局
// ============================================================

export default function MobileGameLayout() {
  const [showChar, setShowChar] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const currentScene = useGameStore(s => s.currentScene)
  const getScene = useGameStore(s => s.getScene)

  const scene = getScene(currentScene)
  const isGradient = scene?.background?.startsWith('linear-gradient')

  return (
    <div className="mobile-game" style={{ position: 'relative' }}>
      {/* 场景背景 */}
      {scene?.backgroundVideo ? (
        <video key={scene.backgroundVideo} src={scene.backgroundVideo} poster={scene.background}
          autoPlay loop muted playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        />
      ) : isGradient ? (
        <div style={{ position: 'absolute', inset: 0, background: scene?.background, zIndex: 0, pointerEvents: 'none' }} />
      ) : scene?.background ? (
        <img src={scene.background} alt={scene.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        />
      ) : null}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,15,15,0.65)', zIndex: 0, pointerEvents: 'none' }} />

      <MobileHeader onCharClick={() => setShowChar(true)} onMenuClick={() => setShowMenu(true)} />
      <MobileDialogue onCharClick={() => setShowChar(true)} />
      <MobileInputBar onGoalsClick={() => setShowGoals(true)} />

      {/* 重大事件弹窗 */}
      <EventModal />

      <CharacterSheet open={showChar} onClose={() => setShowChar(false)} />
      <GoalsSheet open={showGoals} onClose={() => setShowGoals(false)} />
      <MobileMenu open={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  )
}
