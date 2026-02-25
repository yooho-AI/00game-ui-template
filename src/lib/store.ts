/**
 * [INPUT]: zustand, immer, @/lib/stream, @/lib/parser, @/lib/analytics, @/config/*
 * [OUTPUT]: useGameStore — 游戏全局状态 + 操作（支持动态 WorldConfig）
 * [POS]: lib 的状态管理中枢，驱动整个游戏运行时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from '@/lib/stream'
import { parseStructuredMarkers } from '@/lib/parser'
import { trackGameStart, trackGameContinue } from '@/lib/analytics'
import type { Message, Goal, KeyEvent, GameItem, Character, StatConfig, TimePeriod, WorldConfig } from '@/config/game'
import { GAME_INFO } from '@/config/game'
import { CHARACTERS } from '@/config/characters'
import { SCENES } from '@/config/scenes'
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

  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string

  playerStats: Record<string, number>
  characterStats: Record<string, Record<string, number>>

  goals: Goal[]
  keyEvents: KeyEvent[]
  inventory: GameItem[]
  currentActions: string[]
  unlockedCharacters: Set<string>

  pendingMajorEvent: KeyEvent | null
  showEventModal: boolean

  activePanel: string | null

  /* Phase 1: 动态世界配置（null = 使用静态 config/） */
  _worldConfig: WorldConfig | null
}

interface GameActions {
  loadWorldConfig: (config: WorldConfig) => void
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
  /* 配置访问器（动态 WorldConfig 优先，否则 fallback 静态 config） */
  getCharacters: () => Character[]
  getScenes: () => import('@/config/game').Scene[]
  getCharacter: (id: string) => Character | undefined
  getScene: (id: string) => import('@/config/game').Scene | undefined
  getPlayerStatConfigs: () => StatConfig[]
  getCharacterStatConfigs: () => StatConfig[]
  getPeriods: () => TimePeriod[]
  getMaxDays: () => number
  getMaxActionPoints: () => number
  getGameTitle: () => string
  getGameGenre: () => string
  getGameIcon: () => string
  getGameDescription: () => string
  getCharacterColors: () => Record<string, string>
  getWorldConfig: () => WorldConfig | null
}

type GameStore = GameState & GameActions

// ============================================================
// 工具
// ============================================================

let messageCounter = 0
function makeId() { return `msg-${Date.now()}-${++messageCounter}` }

let eventCounter = 0
function makeEventId() { return `evt-${Date.now()}-${++eventCounter}` }

const SAVE_KEY = 'chuangzhao-save-v2'

function buildCharStats(chars: Character[]): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  for (const c of chars) result[c.id] = { ...c.initialStats }
  return result
}

function buildUnlocked(chars: Character[]): Set<string> {
  return new Set(chars.filter(c => !c.locked).map(c => c.id))
}

function flatStatNames(configs: StatConfig[]): string[] {
  return configs.flatMap(s => [s.name, ...s.aliases])
}

// ============================================================
// Store
// ============================================================

export { type Message, type Goal, type KeyEvent, type GameItem }

export const useGameStore = create<GameStore>()(
  immer((set, get) => {
    /* 活跃配置快捷取值 */
    const cfg = () => {
      const wc = get()._worldConfig
      return {
        characters: wc?.characters ?? CHARACTERS,
        scenes: wc?.scenes ?? SCENES,
        items: wc?.items ?? ITEMS,
        goals: wc?.goals ?? [],
        playerStats: wc?.playerStats ?? PLAYER_STATS,
        characterStats: wc?.characterStats ?? CHARACTER_STATS,
        periods: wc?.periods ?? PERIODS,
        maxDays: wc?.maxDays ?? MAX_DAYS,
        maxAP: wc?.maxActionPoints ?? MAX_ACTION_POINTS,
        initPS: wc?.initialPlayerStats ?? INITIAL_PLAYER_STATS,
        title: wc?.title ?? GAME_INFO.title,
        genre: wc?.genre ?? GAME_INFO.genre,
        icon: wc?.icon ?? GAME_INFO.icon,
        description: wc?.description ?? GAME_INFO.description,
        narrativeStyle: wc?.narrativeStyle ?? GAME_INFO.narrativeStyle,
        scriptContent: wc?.scriptContent ?? '',
      }
    }

    /* 默认目标（静态 config 用） */
    const defaultGoals: Goal[] = [
      { id: 'g1', title: '揭开裂缝秘密', condition: '收集散落在各处的符文碎片，拼凑出裂缝的成因。', progress: 0, completed: false },
      { id: 'g2', title: '集结同伴', condition: '解锁所有被锁定的角色，组建冒险队伍。', progress: 0, completed: false },
      { id: 'g3', title: '守护小镇', condition: '在异界入侵前完成防御准备。', progress: 0, completed: false },
    ]

    return {
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
      characterStats: buildCharStats(CHARACTERS),

      goals: defaultGoals.map(g => ({ ...g })),
      keyEvents: [],
      inventory: ITEMS.map(i => ({ ...i })),
      currentActions: [],
      unlockedCharacters: buildUnlocked(CHARACTERS),

      pendingMajorEvent: null,
      showEventModal: false,
      activePanel: null,
      _worldConfig: null,

      // --- Phase 1: 动态配置注入 ---
      loadWorldConfig: (config) => {
        set(s => { s._worldConfig = config as any })
      },

      getWorldConfig: () => get()._worldConfig,

      // --- 配置访问器（动态优先） ---
      getCharacters: () => cfg().characters,
      getScenes: () => cfg().scenes,
      getCharacter: (id) => cfg().characters.find(c => c.id === id),
      getScene: (id) => cfg().scenes.find(s => s.id === id),
      getPlayerStatConfigs: () => cfg().playerStats,
      getCharacterStatConfigs: () => cfg().characterStats,
      getPeriods: () => cfg().periods,
      getMaxDays: () => cfg().maxDays,
      getMaxActionPoints: () => cfg().maxAP,
      getGameTitle: () => cfg().title,
      getGameGenre: () => cfg().genre,
      getGameIcon: () => cfg().icon,
      getGameDescription: () => cfg().description,

      getCharacterColors: () => {
        const map: Record<string, string> = {}
        for (const c of cfg().characters) map[c.name] = c.themeColor
        return map
      },

      // --- 操作 ---
      initGame: () => {
        const c = cfg()
        const goals = c.goals.length > 0
          ? c.goals.map(g => ({ ...g, progress: 0, completed: false }))
          : defaultGoals.map(g => ({ ...g }))

        set(s => {
          s.gameStarted = true
          s.currentDay = 1
          s.currentPeriod = 0
          s.actionPoints = c.maxAP
          s.currentScene = c.scenes[0]?.id || ''
          s.currentCharacter = null
          s.round = 0
          s.messages = []
          s.historySummary = ''
          s.streamingContent = ''
          s.playerStats = { ...c.initPS }
          s.characterStats = buildCharStats(c.characters)
          s.goals = goals
          s.keyEvents = []
          s.inventory = (c.items ?? []).map(i => ({ ...i }))
          s.currentActions = []
          s.unlockedCharacters = buildUnlocked(c.characters)
          s.pendingMajorEvent = null
          s.showEventModal = false
          s.activePanel = null
        })
        trackGameStart()

        /* 自动触发开场叙事 — 让 AI 第一条回复就是长篇开场，定住后续输出基准 */
        setTimeout(() => get().sendMessage('开始游戏'), 50)
      },

      selectCharacter: (id) => {
        set(s => { s.currentCharacter = id })
      },

      selectScene: (id) => {
        const scene = cfg().scenes.find(s => s.id === id)
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
        const c = cfg()
        const char = state.currentCharacter
          ? c.characters.find(ch => ch.id === state.currentCharacter)
          : null

        set(s => {
          s.messages.push({ id: makeId(), role: 'user', content: text, timestamp: Date.now() })
          s.isTyping = true
          s.streamingContent = ''
          s.round++
        })

        try {
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
            } catch { /* 压缩失败 */ }
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
            characters: c.characters,
            scenes: c.scenes,
            playerStatConfigs: c.playerStats,
            characterStatConfigs: c.characterStats,
            periods: c.periods,
            maxDays: c.maxDays,
            maxActionPoints: c.maxAP,
            narrativeStyle: c.narrativeStyle,
            scriptContent: c.scriptContent,
            title: c.title,
            genre: c.genre,
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
            chunk => { fullContent += chunk; set(s => { s.streamingContent = fullContent }) },
            () => {},
            { max_tokens: 4096 }
          )

          if (!fullContent) {
            fullContent = char
              ? `【${char.name}】（看了你一眼）"你说什么？"`
              : '四周一片寂静，只有远处传来若有若无的风声。'
          }

          const markers = parseStructuredMarkers(
            fullContent,
            c.characters,
            flatStatNames(c.playerStats),
            flatStatNames(c.characterStats)
          )

          set(s => {
            for (const mc of markers.playerStatChanges) {
              const pc = c.playerStats.find(ps => ps.name === mc.stat || ps.aliases.includes(mc.stat))
              if (pc) {
                s.playerStats[pc.name] = Math.max(0, Math.min(100, (s.playerStats[pc.name] || 0) + mc.delta))
              }
            }

            for (const g of markers.goalUpdates) {
              const goal = s.goals.find(gl => gl.title === g.title)
              if (goal && !goal.completed) {
                goal.progress = Math.min(100, goal.progress + g.delta)
                if (goal.progress >= 100) goal.completed = true
              }
            }

            for (const e of markers.newEvents) {
              const event: KeyEvent = {
                id: makeEventId(), title: e.title, description: e.description,
                round: s.round, tags: ['剧情'], major: e.major,
              }
              s.keyEvents.unshift(event)
              if (e.major) { s.pendingMajorEvent = event; s.showEventModal = true }
            }

            for (const name of markers.unlockedCharacters) {
              const ch = c.characters.find(x => x.name === name)
              if (ch) s.unlockedCharacters.add(ch.id)
            }

            for (const item of markers.newItems) {
              s.inventory.push({
                id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: item.name, icon: item.icon, type: '获得', description: item.description,
              })
            }

            s.currentActions = markers.actionOptions
            s.messages.push({
              id: makeId(), role: 'assistant', content: fullContent,
              character: state.currentCharacter ?? undefined, timestamp: Date.now(),
            })
            s.isTyping = false
            s.streamingContent = ''
          })

          get().saveGame()
        } catch {
          set(s => {
            s.messages.push({
              id: makeId(), role: 'assistant',
              content: char
                ? `【${char.name}】（似乎在思考什么）"抱歉，我刚才走神了。你说什么？"`
                : '一阵奇怪的风吹过，似乎什么也没有发生。',
              character: state.currentCharacter ?? undefined, timestamp: Date.now(),
            })
            s.isTyping = false
            s.streamingContent = ''
          })
        }
      },

      advanceTime: () => {
        const c = cfg()
        set(s => {
          s.currentPeriod++
          if (s.currentPeriod >= c.periods.length) {
            s.currentPeriod = 0
            s.currentDay++
            s.actionPoints = c.maxAP
          }
        })
        const state = get()
        const period = c.periods[state.currentPeriod]
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

      // --- 存档（含 WorldConfig） ---
      saveGame: () => {
        const s = get()
        const data = {
          version: 2,
          worldConfig: s._worldConfig,
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
          if (data.version !== 2) return false

          set(s => {
            if (data.worldConfig) s._worldConfig = data.worldConfig
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
          return JSON.parse(raw).version === 2
        } catch {
          return false
        }
      },

      clearSave: () => {
        localStorage.removeItem(SAVE_KEY)
      },
    }
  }))

