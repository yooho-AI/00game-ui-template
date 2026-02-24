/**
 * [INPUT]: 依赖 @/lib/store, @/lib/parser, @/components/game/highlight-modal
 * [OUTPUT]: DialoguePanel 组件（信笺 + 场景背景 + 故事段落 + 行动选项 + 输入区）
 * [POS]: game 的 PC 端中栏，对话引擎 + 行动选项（F4+F5）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore, CHARACTER_COLORS } from '@/lib/store'
import { parseStoryParagraph, stripMarkers } from '@/lib/parser'
import HighlightModal from './highlight-modal'

// ============================================================
// 消息渲染
// ============================================================

function MessageItem({ msg }: { msg: { id: string; role: string; content: string } }) {
  if (msg.role === 'system') {
    return (
      <div className="gx-system-msg">
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    )
  }

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="gx-player-bubble">{msg.content}</div>
      </div>
    )
  }

  /* assistant */
  const cleaned = stripMarkers(msg.content)
  const { narrative, statHtml } = parseStoryParagraph(cleaned, CHARACTER_COLORS)
  return (
    <div>
      <div className="gx-story-paragraph" dangerouslySetInnerHTML={{ __html: narrative }} />
      {statHtml && (
        <div className="gx-story-paragraph" style={{ marginTop: -8, paddingTop: 8, paddingBottom: 8 }} dangerouslySetInnerHTML={{ __html: statHtml }} />
      )}
    </div>
  )
}

function StreamingMessage({ content }: { content: string }) {
  const cleaned = stripMarkers(content)
  const { narrative, statHtml } = parseStoryParagraph(cleaned, CHARACTER_COLORS)
  return (
    <div>
      <div className="gx-story-paragraph" dangerouslySetInnerHTML={{ __html: narrative }} />
      {statHtml && (
        <div className="gx-story-paragraph" style={{ marginTop: -8, paddingTop: 8, paddingBottom: 8 }} dangerouslySetInnerHTML={{ __html: statHtml }} />
      )}
      <span className="gx-typing-cursor">▍</span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="gx-story-paragraph" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <span className="gx-typing-dot" />
        <span className="gx-typing-dot" />
        <span className="gx-typing-dot" />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>正在回应...</span>
    </div>
  )
}

// ============================================================
// 行动选项
// ============================================================

function ActionOptions({ options, onSelect }: { options: string[]; onSelect: (text: string) => void }) {
  if (options.length === 0) return null

  return (
    <div className="gx-action-options">
      {options.map((opt, i) => (
        <button key={i} className="gx-action-btn" onClick={() => onSelect(opt)}>
          {opt}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// 输入区
// ============================================================

function InputArea({ onSend, isLoading }: { onSend: (text: string) => void; isLoading: boolean }) {
  const [text, setText] = useState('')
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const getCharacter = useGameStore(s => s.getCharacter)
  const char = currentCharacter ? getCharacter(currentCharacter) : undefined

  const placeholder = isLoading ? '等待回复中...' : char ? `对 ${char.name} 说...` : '输入消息...'

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
  }

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', gap: 8, padding: '14px 16px',
      borderTop: '1px solid var(--border)',
      background: 'rgba(26, 26, 26, 0.95)', backdropFilter: 'blur(8px)',
      borderRadius: '0 0 12px 12px',
    }}>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyUp={e => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        disabled={isLoading}
        className="gx-input"
      />
      <button onClick={handleSend} disabled={isLoading || !text.trim()} className="gx-send-btn">
        {isLoading ? '...' : '发送'}
      </button>
    </div>
  )
}

// ============================================================
// 开场信笺
// ============================================================

function LetterCard() {
  const getGameTitle = useGameStore(s => s.getGameTitle)
  const getGameGenre = useGameStore(s => s.getGameGenre)
  const getGameDescription = useGameStore(s => s.getGameDescription)
  const goals = useGameStore(s => s.goals)

  return (
    <div className="gx-letter-card">
      <div className="gx-letter-seal">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="10" />
          <path fill="var(--bg-card)" d="M12 6l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="gx-letter-genre">{getGameGenre()}</div>
        <h2 className="gx-letter-title">{getGameTitle()}</h2>
      </div>
      <p className="gx-letter-body">{getGameDescription()}</p>
      <div className="gx-letter-goals">
        <div className="gx-letter-goals-label">— 你的使命 —</div>
        {goals.map(goal => (
          <div key={goal.id} className="gx-letter-goal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span>{goal.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export default function DialoguePanel() {
  const messages = useGameStore(s => s.messages)
  const isTyping = useGameStore(s => s.isTyping)
  const streamingContent = useGameStore(s => s.streamingContent)
  const sendMessage = useGameStore(s => s.sendMessage)
  const currentScene = useGameStore(s => s.currentScene)
  const currentActions = useGameStore(s => s.currentActions)
  const getScene = useGameStore(s => s.getScene)
  const [showHighlight, setShowHighlight] = useState(false)

  const scene = getScene(currentScene)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const canHighlight = messages.filter(m => m.role !== 'system').length >= 5

  /* 智能滚动 */
  useEffect(() => {
    const c = containerRef.current
    if (c && isNearBottomRef.current) c.scrollTop = c.scrollHeight
  }, [messages.length, isTyping, streamingContent])

  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    const h = () => {
      const { scrollTop, scrollHeight, clientHeight } = c
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
    c.addEventListener('scroll', h)
    return () => c.removeEventListener('scroll', h)
  }, [])

  const handleSend = useCallback((text: string) => { sendMessage(text) }, [sendMessage])

  /* 场景背景：支持 URL 或 CSS 渐变 */
  const isGradient = scene?.background?.startsWith('linear-gradient')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 0 12px 12px', background: 'var(--bg-secondary)' }}>
      <div className="gx-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* 背景层 */}
        <div className="gx-dialogue-bg">
          {scene?.backgroundVideo ? (
            <video key={scene.backgroundVideo} src={scene.backgroundVideo} poster={scene.background} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : isGradient ? (
            <div style={{ width: '100%', height: '100%', background: scene?.background }} />
          ) : scene?.background ? (
            <img src={scene.background} alt={scene.name} />
          ) : null}
          <div className="gx-dialogue-bg-overlay" />
        </div>

        {/* 消息列表 */}
        <div ref={containerRef} className="gx-scrollbar" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <LetterCard />
          {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
          {isTyping && streamingContent && <StreamingMessage content={streamingContent} />}
          {isTyping && !streamingContent && <TypingIndicator />}

          {/* 行动选项 */}
          {!isTyping && currentActions.length > 0 && (
            <ActionOptions options={currentActions} onSelect={handleSend} />
          )}

          {/* 高光按钮 */}
          {canHighlight && !isTyping && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={() => setShowHighlight(true)}
                style={{
                  padding: '6px 16px', borderRadius: 99,
                  border: '1px solid var(--accent)', background: 'var(--bg-card)',
                  color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ✨ 高光时刻
              </button>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <InputArea onSend={handleSend} isLoading={isTyping} />
      </div>

      <AnimatePresence>
        {showHighlight && <HighlightModal onClose={() => setShowHighlight(false)} />}
      </AnimatePresence>
    </div>
  )
}
