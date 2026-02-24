/**
 * [INPUT]: 依赖 @/lib/store 的 useGameStore
 * [OUTPUT]: LeftPanel 组件（场景卡片 + 角色立绘 + 简介 + 角色列表 + 玩家属性）
 * [POS]: game 的 PC 端左栏，场景/角色/属性面板（F6+F7+F8）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore } from '@/lib/store'

// ============================================================
// 场景卡片
// ============================================================

function SceneCard() {
  const currentScene = useGameStore(s => s.currentScene)
  const getScene = useGameStore(s => s.getScene)
  const getScenes = useGameStore(s => s.getScenes)
  const selectScene = useGameStore(s => s.selectScene)
  const scene = getScene(currentScene)
  const scenes = getScenes()

  const isGradient = scene?.background?.startsWith('linear-gradient')

  return (
    <div className="gx-card gx-scene-card" style={{ cursor: 'pointer' }}>
      {scene?.backgroundVideo ? (
        <video key={scene.backgroundVideo} src={scene.backgroundVideo} poster={scene.background} autoPlay loop muted playsInline />
      ) : isGradient ? (
        <div style={{ width: '100%', height: '100%', background: scene?.background }} />
      ) : scene?.background ? (
        <img src={scene.background} alt={scene.name} />
      ) : (
        <div className="gx-placeholder" style={{ background: 'var(--bg-card)' }}>
          <span className="gx-placeholder-icon">🏘</span>
        </div>
      )}
      <div className="gx-scene-tag">
        <span style={{ fontSize: 14 }}>{scene?.icon || '📍'}</span>
        {scene?.name || '未知'}
        {scenes.length > 1 && (
          <select
            value={currentScene}
            onChange={e => selectScene(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', color: 'inherit',
              fontSize: 12, cursor: 'pointer', outline: 'none', marginLeft: 4,
            }}
          >
            {scenes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 角色立绘
// ============================================================

function PortraitCard() {
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const getCharacter = useGameStore(s => s.getCharacter)
  const char = currentCharacter ? getCharacter(currentCharacter) : undefined

  return (
    <div className="gx-card gx-portrait-card">
      {char?.video ? (
        <video key={char.video} src={char.video} poster={char.image} autoPlay loop muted playsInline />
      ) : char?.image ? (
        <img src={char.image} alt={char.name} />
      ) : char ? (
        <div className="gx-placeholder" style={{ fontSize: 64 }}>
          {char.avatar}
        </div>
      ) : (
        <div className="gx-placeholder" style={{ paddingBottom: 40 }}>
          <span className="gx-placeholder-icon">👤</span>
          <span className="gx-placeholder-text">选择角色开始</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 角色简介
// ============================================================

function InfoCard() {
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const getCharacter = useGameStore(s => s.getCharacter)
  const characterStats = useGameStore(s => s.characterStats)
  const getCharacterStatConfigs = useGameStore(s => s.getCharacterStatConfigs)
  const char = currentCharacter ? getCharacter(currentCharacter) : undefined

  if (!char) return null

  const stats = characterStats[char.id]
  const statConfigs = getCharacterStatConfigs()

  return (
    <div className="gx-card gx-info-card">
      <div className="gx-info-title" style={{ color: char.themeColor }}>{char.avatar} {char.name}</div>
      <div className="gx-info-meta">
        <span>{char.title}</span>
      </div>
      <div className="gx-info-desc">{char.description}</div>
      {stats && (
        <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
          {statConfigs.map(sc => (
            <div key={sc.name} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {sc.icon} {sc.name} <span style={{ color: sc.color, fontWeight: 600 }}>{stats[sc.name] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 角色选择列表（含锁定态）
// ============================================================

function CharacterList() {
  const currentCharacter = useGameStore(s => s.currentCharacter)
  const selectCharacter = useGameStore(s => s.selectCharacter)
  const getCharacters = useGameStore(s => s.getCharacters)
  const unlockedCharacters = useGameStore(s => s.unlockedCharacters)

  const characters = getCharacters()

  return (
    <div className="gx-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>角色</span>
      </div>
      <div className="gx-char-list" style={{ flex: 1, alignContent: 'center' }}>
        {characters.map(char => {
          const isLocked = !unlockedCharacters.has(char.id)
          const isActive = currentCharacter === char.id

          return (
            <button
              key={char.id}
              className={`gx-char-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && selectCharacter(isActive ? null : char.id)}
              title={isLocked ? '随剧情解锁' : char.title}
            >
              {isLocked ? '?' : char.avatar} {isLocked ? '???' : char.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 玩家属性面板
// ============================================================

function PlayerStatsPanel() {
  const playerStats = useGameStore(s => s.playerStats)
  const getPlayerStatConfigs = useGameStore(s => s.getPlayerStatConfigs)
  const configs = getPlayerStatConfigs()

  return (
    <div className="gx-card gx-player-stats">
      <div className="gx-player-stats-title">⚔ 属性</div>
      {configs.map(sc => {
        const value = playerStats[sc.name] ?? 0
        return (
          <div key={sc.name} className="gx-stat-row">
            <span className="gx-stat-icon">{sc.icon}</span>
            <span className="gx-stat-name">{sc.name}</span>
            <div className="gx-stat-bar">
              <div className="gx-stat-bar-fill" style={{ width: `${value}%`, background: sc.color }} />
            </div>
            <span className="gx-stat-value">{value}</span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// 左侧面板主组件
// ============================================================

export default function LeftPanel() {
  return (
    <div
      className="gx-scrollbar"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '12px 0 12px 12px', height: '100%',
        background: 'var(--bg-secondary)', overflowY: 'auto',
      }}
    >
      <SceneCard />
      <PortraitCard />
      <InfoCard />
      <PlayerStatsPanel />
      <CharacterList />
    </div>
  )
}
