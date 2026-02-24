/**
 * [INPUT]: zustand, immer, @/lib/stream, @/lib/parser, @/lib/analytics, @/config/*
 * [OUTPUT]: useGameStore — 游戏全局状态 + 操作
 * [POS]: lib 的状态管理中枢，驱动整个游戏运行时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from '@/lib/stream'
import { parseStructuredMarkers } from '@/lib/parser'
import { trackGameStart, trackGameContinue } from '@/lib/analytics'
import type { Message, Goal, KeyEvent, GameItem, Character, Scene, StatConfig, TimePeriod } from '@/config/game'
import { GAME_INFO } from '@/config/game'
import { CHARACTERS, CHARACTER_MAP } from '@/config/characters'
import { SCENES, SCENE_MAP } from '@/config/scenes'
import { ITEMS } from '@/config/items'
import {
  buildSystemPrompt, PERIODS, PLAYER_STATS, CHARACTER_STATS,
  INITIAL_PLAYER_STATS, MAX_DAYS, MAX_ACTION_POINTS,
} from '@/config/prompt'

// ============================================================
// Store 接口
// ============================================================

interface GameState {
  gameStarted: boolean
  currentDay: number
  currentPeriod: number
  actionPoints: number
  currentScene: string
  currentCharacter: string | null
  round: number

  // 消息
  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string

  // 属性
  playerStats: Record<string, number>
  characterStats: Record<string, Record<string, number>>

  // 目标 / 事件 / 物品
  goals: Goal[]
  keyEvents: KeyEvent[]
  inventory: GameItem[]
  currentActions: string[]
  unlockedCharacters: Set<string>

  // 重大事件弹窗
  pendingMajorEvent: KeyEvent | null
  showEventModal: boolean

  // UI
  activePanel: string | null
}

interface GameActions {
  initGame: () => void
  selectCharacter: (id: string | null) => void
  selectScene: (id: string) => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  addSystemMessage: (content: string) => void
  dismissEventModal: () => void
  togglePanel: (panel: string) => void
  closePanel: () => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => boolean
  hasSave: () => boolean
  clearSave: () => void
  // 配置访问器（供组件读取）
  getCharacters: () => Character[]
  getScenes: () => Scene[]
  getCharacter: (id: string) => Character | undefined
  getScene: (id: string) => Scene | undefined
  getPlayerStatConfigs: () => StatConfig[]
  getCharacterStatConfigs: () => StatConfig[]
  getPeriods: () => TimePeriod[]
  getMaxDays: () => number
  getMaxActionPoints: () => number
  getGameTitle: () => string
  getGameGenre: () => string
  getGameIcon: () => string
  getGameDescription: () => string
}

type GameStore = GameState & GameActions

// ============================================================
// 工具
// ============================================================

let messageCounter = 0
function makeId() {
  return `msg-${Date.now()}-${++messageCounter}`
}

let eventCounter = 0
function makeEventId() {
  return `evt-${Date.now()}-${++eventCounter}`
}

const SAVE_KEY = 'chuangzhao-save-v1'

/* 构建初始角色关系属性 */
function buildInitialCharStats(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  for (const c of CHARACTERS) {
    result[c.id] = { ...c.initialStats }
  }
  return result
}

/* 初始解锁角色 */
function buildInitialUnlocked(): Set<string> {
  return new Set(CHARACTERS.filter(c => !c.locked).map(c => c.id))
}

/* 角色名→配色表 */
function buildCharacterColors(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of CHARACTERS) map[c.name] = c.themeColor
  return map
}

/* 所有属性名（含别名）扁平集合 */
function flatStatNames(configs: StatConfig[]): string[] {
  return configs.flatMap(s => [s.name, ...s.aliases])
}

// ============================================================
// Store
// ============================================================

export { type Message, type Goal, type KeyEvent, type GameItem }

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // --- 初始状态 ---
    gameStarted: false,
    currentDay: 1,
    currentPeriod: 0,
    actionPoints: MAX_ACTION_POINTS,
    currentScene: SCENES[0]?.id || '',
    currentCharacter: null,
    round: 0,

    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',

    playerStats: { ...INITIAL_PLAYER_STATS },
    characterStats: buildInitialCharStats(),

    goals: [
      { id: 'g1', title: '揭开裂缝秘密', condition: '收集散落在各处的符文碎片，拼凑出裂缝的成因，找到关闭裂缝的方法。', progress: 0, completed: false },
      { id: 'g2', title: '集结同伴', condition: '通过探索和对话解锁所有被锁定的角色，让他们加入你的冒险队伍。', progress: 0, completed: false },
      { id: 'g3', title: '守护小镇', condition: '在异界生物入侵前完成防御准备，保护边境小镇的居民安全。', progress: 0, completed: false },
    ],
    keyEvents: [],
    inventory: ITEMS.map(i => ({ ...i })),
    currentActions: [],
    unlockedCharacters: buildInitialUnlocked(),

    pendingMajorEvent: null,
    showEventModal: false,

    activePanel: null,

    // --- 配置访问器 ---
    getCharacters: () => CHARACTERS,
    getScenes: () => SCENES,
    getCharacter: (id) => CHARACTER_MAP[id],
    getScene: (id) => SCENE_MAP[id],
    getPlayerStatConfigs: () => PLAYER_STATS,
    getCharacterStatConfigs: () => CHARACTER_STATS,
    getPeriods: () => PERIODS,
    getMaxDays: () => MAX_DAYS,
    getMaxActionPoints: () => MAX_ACTION_POINTS,
    getGameTitle: () => GAME_INFO.title,
    getGameGenre: () => GAME_INFO.genre,
    getGameIcon: () => GAME_INFO.icon,
    getGameDescription: () => GAME_INFO.description,

    // --- 操作 ---
    initGame: () => {
      set(s => {
        s.gameStarted = true
        s.currentDay = 1
        s.currentPeriod = 0
        s.actionPoints = MAX_ACTION_POINTS
        s.currentScene = SCENES[0]?.id || ''
        s.currentCharacter = null
        s.round = 0
        s.messages = []
        s.historySummary = ''
        s.streamingContent = ''
        s.playerStats = { ...INITIAL_PLAYER_STATS }
        s.characterStats = buildInitialCharStats()
        s.goals = [
          { id: 'g1', title: '揭开裂缝秘密', condition: '收集散落在各处的符文碎片，拼凑出裂缝的成因，找到关闭裂缝的方法。', progress: 0, completed: false },
          { id: 'g2', title: '集结同伴', condition: '通过探索和对话解锁所有被锁定的角色，让他们加入你的冒险队伍。', progress: 0, completed: false },
          { id: 'g3', title: '守护小镇', condition: '在异界生物入侵前完成防御准备，保护边境小镇的居民安全。', progress: 0, completed: false },
        ]
        s.keyEvents = []
        s.inventory = ITEMS.map(i => ({ ...i }))
        s.currentActions = []
        s.unlockedCharacters = buildInitialUnlocked()
        s.pendingMajorEvent = null
        s.showEventModal = false
        s.activePanel = null
      })
      trackGameStart()
    },

    selectCharacter: (id) => {
      set(s => { s.currentCharacter = id })
    },

    selectScene: (id) => {
      const scene = SCENE_MAP[id]
      if (!scene) return
      set(s => {
        s.currentScene = id
        s.currentCharacter = null
      })
      get().addSystemMessage(`你来到了${scene.icon} ${scene.name}。${scene.description}`)
    },

    togglePanel: (panel) => {
      set(s => { s.activePanel = s.activePanel === panel ? null : panel })
    },

    closePanel: () => {
      set(s => { s.activePanel = null })
    },

    dismissEventModal: () => {
      set(s => {
        s.pendingMajorEvent = null
        s.showEventModal = false
      })
    },

    sendMessage: async (text: string) => {
      const state = get()
      const char = state.currentCharacter ? CHARACTER_MAP[state.currentCharacter] : null

      set(s => {
        s.messages.push({ id: makeId(), role: 'user', content: text, timestamp: Date.now() })
        s.isTyping = true
        s.streamingContent = ''
        s.round++
      })

      try {
        // 上下文压缩
        let { historySummary } = state
        let recentMessages = state.messages.slice(-20)

        if (state.messages.length > 15 && !historySummary) {
          const oldMessages = state.messages.slice(0, -10)
          const summaryText = oldMessages
            .map(m => `[${m.role}]: ${m.content.slice(0, 200)}`)
            .join('\n')

          try {
            historySummary = await chat([{
              role: 'user',
              content: `请用200字以内概括以下游戏对话历史，保留关键剧情和数值变化：\n\n${summaryText}`,
            }])
            set(s => { s.historySummary = historySummary })
            recentMessages = state.messages.slice(-10)
          } catch {
            // 压缩失败，使用原始消息
          }
        }

        const systemPrompt = buildSystemPrompt({
          currentDay: get().currentDay,
          currentPeriod: get().currentPeriod,
          actionPoints: get().actionPoints,
          currentScene: get().currentScene,
          currentCharacter: get().currentCharacter,
          playerStats: get().playerStats,
          characterStats: get().characterStats,
          goals: get().goals,
          round: get().round,
          characters: CHARACTERS,
          scenes: SCENES,
          playerStatConfigs: PLAYER_STATS,
          characterStatConfigs: CHARACTER_STATS,
          periods: PERIODS,
          maxDays: MAX_DAYS,
          maxActionPoints: MAX_ACTION_POINTS,
          narrativeStyle: GAME_INFO.narrativeStyle,
          title: GAME_INFO.title,
          genre: GAME_INFO.genre,
        })

        const apiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...(historySummary ? [{ role: 'system' as const, content: `[历史摘要] ${historySummary}` }] : []),
          ...recentMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
          { role: 'user' as const, content: text },
        ]

        let fullContent = ''

        await streamChat(
          apiMessages,
          chunk => {
            fullContent += chunk
            set(s => { s.streamingContent = fullContent })
          },
          () => {}
        )

        if (!fullContent) {
          fullContent = char
            ? `【${char.name}】（看了你一眼）"你说什么？"`
            : '四周一片寂静，只有远处传来若有若无的风声。'
        }

        // 解析结构化标记
        const markers = parseStructuredMarkers(
          fullContent,
          CHARACTERS,
          flatStatNames(PLAYER_STATS),
          flatStatNames(CHARACTER_STATS)
        )

        set(s => {
          // 玩家属性变化
          for (const c of markers.playerStatChanges) {
            // 属性名→配置名映射
            const config = PLAYER_STATS.find(ps =>
              ps.name === c.stat || ps.aliases.includes(c.stat)
            )
            if (config) {
              s.playerStats[config.name] = Math.max(0, Math.min(100,
                (s.playerStats[config.name] || 0) + c.delta
              ))
            }
          }

          // 目标更新
          for (const g of markers.goalUpdates) {
            const goal = s.goals.find(gl => gl.title === g.title)
            if (goal && !goal.completed) {
              goal.progress = Math.min(100, goal.progress + g.delta)
              if (goal.progress >= 100) goal.completed = true
            }
          }

          // 关键事件 / 重大事件
          for (const e of markers.newEvents) {
            const event: KeyEvent = {
              id: makeEventId(),
              title: e.title,
              description: e.description,
              round: s.round,
              tags: ['剧情'],
              major: e.major,
            }
            s.keyEvents.unshift(event)
            if (e.major) {
              s.pendingMajorEvent = event
              s.showEventModal = true
            }
          }

          // 解锁角色
          for (const name of markers.unlockedCharacters) {
            const c = CHARACTERS.find(ch => ch.name === name)
            if (c) s.unlockedCharacters.add(c.id)
          }

          // 获得物品
          for (const item of markers.newItems) {
            s.inventory.push({
              id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: item.name,
              icon: item.icon,
              type: '获得',
              description: item.description,
            })
          }

          // 行动选项
          s.currentActions = markers.actionOptions

          // 存消息（故事文本，剥离标记）
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: fullContent,
            character: state.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.isTyping = false
          s.streamingContent = ''
        })

        get().saveGame()
      } catch {
        set(s => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: char
              ? `【${char.name}】（似乎在思考什么）"抱歉，我刚才走神了。你说什么？"`
              : '一阵奇怪的风吹过，似乎什么也没有发生。',
            character: state.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.isTyping = false
          s.streamingContent = ''
        })
      }
    },

    advanceTime: () => {
      set(s => {
        s.currentPeriod++
        if (s.currentPeriod >= PERIODS.length) {
          s.currentPeriod = 0
          s.currentDay++
          s.actionPoints = MAX_ACTION_POINTS
        }
      })
      const state = get()
      const period = PERIODS[state.currentPeriod]
      get().addSystemMessage(`时间来到了第 ${state.currentDay} 天 · ${period?.name}`)
    },

    addSystemMessage: (content) => {
      set(s => {
        s.messages.push({ id: makeId(), role: 'system', content, timestamp: Date.now() })
      })
    },

    resetGame: () => {
      set(s => {
        s.gameStarted = false
        s.messages = []
        s.historySummary = ''
        s.streamingContent = ''
      })
      get().clearSave()
    },

    // --- 存档 ---
    saveGame: () => {
      const s = get()
      const data = {
        version: 1,
        currentDay: s.currentDay,
        currentPeriod: s.currentPeriod,
        actionPoints: s.actionPoints,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        round: s.round,
        playerStats: s.playerStats,
        characterStats: s.characterStats,
        goals: s.goals,
        keyEvents: s.keyEvents,
        inventory: s.inventory,
        currentActions: s.currentActions,
        unlockedCharacters: [...s.unlockedCharacters],
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        const data = JSON.parse(raw)
        if (data.version !== 1) return false

        set(s => {
          s.gameStarted = true
          s.currentDay = data.currentDay
          s.currentPeriod = data.currentPeriod
          s.actionPoints = data.actionPoints
          s.currentScene = data.currentScene
          s.currentCharacter = data.currentCharacter
          s.round = data.round || 0
          s.playerStats = data.playerStats
          s.characterStats = data.characterStats
          s.goals = data.goals || []
          s.keyEvents = data.keyEvents || []
          s.inventory = data.inventory || []
          s.currentActions = data.currentActions || []
          s.unlockedCharacters = new Set(data.unlockedCharacters || [])
          s.messages = data.messages
          s.historySummary = data.historySummary || ''
        })
        trackGameContinue()
        return true
      } catch {
        return false
      }
    },

    hasSave: () => {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        return JSON.parse(raw).version === 1
      } catch {
        return false
      }
    },

    clearSave: () => {
      localStorage.removeItem(SAVE_KEY)
    },
  }))
)

/* 导出角色配色表供 parser 使用 */
export const CHARACTER_COLORS = buildCharacterColors()
