/**
 * [INPUT]: 依赖 @/lib/store 的 useGameStore
 * [OUTPUT]: RightPanel 组件（导航栏 + 目标/事件/背包 三面板）
 * [POS]: game 的 PC 端右侧面板，任务追踪 + 事件日志 + 物品管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore } from '@/lib/store'

// ============================================================
// 目标面板
// ============================================================

function GoalsPanel() {
  const goals = useGameStore(s => s.goals)
  const closePanel = useGameStore(s => s.closePanel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="gx-panel-header">
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>目标</span>
        <button onClick={closePanel} className="gx-panel-close">×</button>
      </div>
      <div className="gx-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {goals.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {goals.map(goal => (
              <div key={goal.id} className="gx-goal-card">
                <div className="gx-goal-header">
                  <span style={{ fontSize: 13, fontWeight: 600, color: goal.completed ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {goal.completed ? '✓' : '○'} {goal.title}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{goal.condition}</div>
                <div className="gx-goal-bar">
                  <div
                    className="gx-goal-bar-fill"
                    style={{ width: `${goal.progress}%`, background: goal.completed ? 'var(--accent)' : 'var(--primary)' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
                  {goal.progress}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gx-placeholder" style={{ height: 150 }}>
            <span style={{ fontSize: 32, opacity: 0.5 }}>🎯</span>
            <span className="gx-placeholder-text">暂无目标</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 事件面板
// ============================================================

function EventsPanel() {
  const keyEvents = useGameStore(s => s.keyEvents)
  const closePanel = useGameStore(s => s.closePanel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="gx-panel-header">
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>事件日志</span>
        <button onClick={closePanel} className="gx-panel-close">×</button>
      </div>
      <div className="gx-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {keyEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {keyEvents.map(evt => (
              <div key={evt.id} className="gx-event-item">
                <div className="gx-event-header">
                  <span style={{ fontWeight: 600, fontSize: 13, color: evt.major ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {evt.major ? '🚨' : '📌'} {evt.title}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>R{evt.round}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {evt.description}
                </div>
                {evt.tags && evt.tags.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {evt.tags.map(tag => (
                      <span key={tag} className="gx-event-tag">🏷 {tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="gx-placeholder" style={{ height: 150 }}>
            <span style={{ fontSize: 32, opacity: 0.5 }}>📜</span>
            <span className="gx-placeholder-text">尚无事件记录</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 背包面板
// ============================================================

function InventoryPanel() {
  const inventory = useGameStore(s => s.inventory)
  const closePanel = useGameStore(s => s.closePanel)

  const hasItems = inventory.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="gx-panel-header">
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>背包</span>
        <button onClick={closePanel} className="gx-panel-close">×</button>
      </div>
      <div className="gx-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {hasItems ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {inventory.map(item => (
              <div key={item.id} className="gx-item-row">
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gx-placeholder" style={{ height: 150 }}>
            <span style={{ fontSize: 32, opacity: 0.5 }}>🎒</span>
            <span className="gx-placeholder-text">背包空空如也</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 右侧面板主组件
// ============================================================

export default function RightPanel() {
  const activePanel = useGameStore(s => s.activePanel)
  const togglePanel = useGameStore(s => s.togglePanel)
  const goals = useGameStore(s => s.goals)
  const keyEvents = useGameStore(s => s.keyEvents)
  const inventory = useGameStore(s => s.inventory)

  const activeGoals = goals.filter(g => !g.completed).length

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', height: '100%',
      padding: '12px 0 12px 12px', background: 'var(--bg-secondary)',
    }}>
      {activePanel && (
        <div className="gx-detail-panel">
          <div className="gx-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activePanel === 'goals' && <GoalsPanel />}
            {activePanel === 'events' && <EventsPanel />}
            {activePanel === 'inventory' && <InventoryPanel />}
          </div>
        </div>
      )}

      <div className="gx-nav-bar" style={{ marginLeft: activePanel ? 8 : 0 }}>
        <button
          className={`gx-nav-btn ${activePanel === 'goals' ? 'active' : ''}`}
          onClick={() => togglePanel('goals')}
          style={{ position: 'relative' }}
        >
          <span className="gx-nav-icon">🎯</span>
          <span className="gx-nav-label">目标</span>
          {activeGoals > 0 && <span className="gx-nav-badge">{activeGoals}</span>}
        </button>

        <button
          className={`gx-nav-btn ${activePanel === 'events' ? 'active' : ''}`}
          onClick={() => togglePanel('events')}
          style={{ position: 'relative' }}
        >
          <span className="gx-nav-icon">📜</span>
          <span className="gx-nav-label">事件</span>
          {keyEvents.length > 0 && <span className="gx-nav-badge">{keyEvents.length}</span>}
        </button>

        <button
          className={`gx-nav-btn ${activePanel === 'inventory' ? 'active' : ''}`}
          onClick={() => togglePanel('inventory')}
          style={{ position: 'relative' }}
        >
          <span className="gx-nav-icon">🎒</span>
          <span className="gx-nav-label">背包</span>
          {inventory.length > 0 && <span className="gx-nav-badge">{inventory.length}</span>}
        </button>
      </div>
    </div>
  )
}
