/**
 * [INPUT]: 无
 * [OUTPUT]: 全部游戏类型接口 + WorldConfig + GAME_INFO 常量
 * [POS]: config 的类型中枢，所有模块共享的数据契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 核心接口
// ============================================================

export interface ThemeColors {
  primary: string
  primaryLight: string
  accent: string
  bgPrimary: string
  bgSecondary: string
  bgCard: string
  textPrimary: string
  textSecondary: string
}

export interface Character {
  id: string
  name: string
  avatar: string
  title: string
  themeColor: string
  description: string
  image?: string
  video?: string
  initialStats: Record<string, number>
  locked?: boolean
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  backgroundVideo?: string
  characters?: string[]
}

export interface Goal {
  id: string
  title: string
  condition: string
  progress: number
  completed: boolean
}

export interface KeyEvent {
  id: string
  title: string
  description: string
  round: number
  tags?: string[]
  major: boolean
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: string
  description: string
  effects?: Record<string, Record<string, number>>
  consumable?: boolean
}

export interface StatConfig {
  name: string
  aliases: string[]
  color: string
  icon?: string
  dailyDecay?: number
}

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
}

// ============================================================
// WorldConfig — Phase 1 生成 / Phase 0 消费 / 分享系统传输
// ============================================================

export interface WorldConfig {
  title: string
  genre: string
  description: string
  icon: string
  narrativeStyle: string
  themeColors: ThemeColors
  maxDays: number
  maxActionPoints: number
  periods: TimePeriod[]
  characters: Character[]
  scenes: Scene[]
  goals: Goal[]
  playerStats: StatConfig[]
  initialPlayerStats: Record<string, number>
  characterStats: StatConfig[]
  items?: GameItem[]
}

// ============================================================
// 默认游戏信息（静态 config 模式）
// ============================================================

export const GAME_INFO = {
  title: '冒险旅途',
  genre: '奇幻冒险',
  icon: '🎮',
  description:
    '一个宁静的边境小镇突然被异界裂缝笼罩。你，一个普通的旅行者，' +
    '被卷入了一场跨越维度的冒险。四位命运各异的同伴将与你并肩作战，' +
    '探索未知的世界，揭开裂缝背后的秘密。',
  narrativeStyle:
    '叙事风格轻快明朗，战斗描写简练有力，角色对话个性鲜明。' +
    '用第二人称"你"拉近沉浸感，场景描写注重氛围渲染。',
}
