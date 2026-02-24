/**
 * [INPUT]: 依赖 @/lib/store 的 useGameStore (pendingMajorEvent, showEventModal, dismissEventModal)
 * [OUTPUT]: EventModal 组件 — 重大事件全屏弹窗
 * [POS]: game 的重大事件弹窗，剧情转折点仪式感呈现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'

export default function EventModal() {
  const event = useGameStore(s => s.pendingMajorEvent)
  const show = useGameStore(s => s.showEventModal)
  const dismiss = useGameStore(s => s.dismissEventModal)

  return (
    <AnimatePresence>
      {show && event && (
        <motion.div
          className="gx-event-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="gx-event-modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="gx-event-modal-icon">🚨</div>
            <div className="gx-event-modal-label">重大事件</div>
            {event.tags?.[0] && (
              <span className="gx-event-tag" style={{ marginBottom: 8, display: 'inline-block' }}>
                🏷 {event.tags[0]}
              </span>
            )}
            <div className="gx-event-modal-round">○ 回合 {event.round}</div>
            <div className="gx-event-modal-title">{event.title}</div>
            <div className="gx-event-modal-desc">{event.description}</div>
            <button className="gx-event-modal-btn" onClick={dismiss}>
              继续
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
