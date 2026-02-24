/**
 * [INPUT]: 依赖 @/config/game 的接口定义
 * [OUTPUT]: buildSystemPrompt() + PERIODS + PLAYER_STATS + CHARACTER_STATS
 * [POS]: config 的 AI 对话指令构建器，被 store.ts 的 sendMessage 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Character, Scene, Goal, StatConfig, TimePeriod } from './game'

// ============================================================
// 默认时段 / 属性配置
// ============================================================

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '清晨', icon: '🌅', hours: '06:00-08:00' },
  { index: 1, name: '上午', icon: '☀️', hours: '08:00-11:00' },
  { index: 2, name: '午后', icon: '🌞', hours: '11:00-14:00' },
  { index: 3, name: '下午', icon: '⛅', hours: '14:00-17:00' },
  { index: 4, name: '傍晚', icon: '🌇', hours: '17:00-19:00' },
  { index: 5, name: '夜晚', icon: '🌙', hours: '19:00-23:00' },
  { index: 6, name: '深夜', icon: '🌃', hours: '23:00-06:00' },
]

export const PLAYER_STATS: StatConfig[] = [
  { name: '生命', aliases: ['生命值', 'HP', '体力'], color: '#ef4444', icon: '❤️' },
  { name: '智慧', aliases: ['智慧值', '智力'], color: '#6366f1', icon: '🧠' },
  { name: '勇气', aliases: ['勇气值', '胆量'], color: '#f59e0b', icon: '🔥' },
]

export const CHARACTER_STATS: StatConfig[] = [
  { name: '信任', aliases: ['信任度', '信任值'], color: '#22d3ee', icon: '🤝' },
  { name: '默契', aliases: ['默契值', '默契度'], color: '#a78bfa', icon: '💫' },
]

export const INITIAL_PLAYER_STATS: Record<string, number> = {
  '生命': 80,
  '智慧': 50,
  '勇气': 40,
}

export const MAX_DAYS = 15
export const MAX_ACTION_POINTS = 6

// ============================================================
// System Prompt 构建
// ============================================================

interface PromptContext {
  currentDay: number
  currentPeriod: number
  actionPoints: number
  currentScene: string
  currentCharacter: string | null
  playerStats: Record<string, number>
  characterStats: Record<string, Record<string, number>>
  goals: Goal[]
  round: number
  characters: Character[]
  scenes: Scene[]
  playerStatConfigs: StatConfig[]
  characterStatConfigs: StatConfig[]
  periods: TimePeriod[]
  maxDays: number
  maxActionPoints: number
  narrativeStyle: string
  title: string
  genre: string
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const period = ctx.periods[ctx.currentPeriod]
  const scene = ctx.scenes.find(s => s.id === ctx.currentScene)
  const char = ctx.currentCharacter
    ? ctx.characters.find(c => c.id === ctx.currentCharacter)
    : null

  /* 角色关系汇总 */
  const charSummary = ctx.characters
    .filter(c => !c.locked)
    .map(c => {
      const stats = ctx.characterStats[c.id]
      if (!stats) return `${c.name}: 无数据`
      const pairs = Object.entries(stats).map(([k, v]) => `${k}${v}`).join(' ')
      return `${c.name}(${c.title}): ${pairs}`
    })
    .join('\n')

  /* 玩家属性汇总 */
  const playerSummary = Object.entries(ctx.playerStats)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')

  /* 目标汇总 */
  const goalSummary = ctx.goals
    .map(g => `${g.completed ? '✅' : `${g.progress}%`} ${g.title}`)
    .join('\n')

  let prompt = `你是文字冒险游戏《${ctx.title}》的 AI 叙述者。类型：${ctx.genre}。

## 叙事风格
${ctx.narrativeStyle}

## 结构化标记规则（严格遵守）
每次回复的故事文本中，根据剧情发展插入以下标记。标记用中文全角方括号【】包裹。

1. **属性变化**：当玩家属性或角色关系发生变化时
   格式：【属性名 +/-N】或【属性名 +/-N，属性名 +/-N】
   示例：【勇气 +5，智慧 +10】

2. **目标更新**：当某个目标有了进展时
   格式：【目标更新：目标标题 +N%】
   示例：【目标更新：揭开裂缝秘密 +20%】

3. **关键事件**：发生了有意义的剧情节点（每2-3回合产生一条）
   格式：【关键事件：事件标题】事件描述（1-2句话）
   示例：【关键事件：发现线索】在古树根部找到了一块刻有符文的石板。

4. **重大事件**：剧情重大转折（稀有，每5-10回合最多一次）
   格式：【重大事件：事件标题】事件描述
   示例：【重大事件：裂缝扩张】天空撕裂出第二道裂缝，黑色闪电划破夜空。

5. **解锁角色**：新角色首次出场加入队伍时
   格式：【解锁角色：角色名】
   示例：【解锁角色：凯尔】

6. **获得物品**：玩家获得新物品时
   格式：【获得物品：物品名 · 效果描述】
   示例：【获得物品：裂缝碎片 · 蕴含异界能量】

7. **行动选项**：每次回复末尾必须提供3-4个选项
   格式：【行动选项】1. 选项A 2. 选项B 3. 选项C
   示例：【行动选项】1. 🔍 仔细检查石板符文 2. 🗣 询问米洛的看法 3. ⚔ 警惕周围动静 4. 🚶 继续深入森林

## 输出格式
- 故事文本用生动的叙事呈现，角色对话用【角色名】前缀
- 动作用（）包裹，对话用中文双引号""
- 每次回复 200-400 字的故事文本 + 上述标记
- 属性变化标记放在故事文本相关段落后
- 行动选项标记放在最末尾`

  if (char) {
    prompt += `

## 当前互动角色
- ${char.name}（${char.title}）
- ${char.description}
- 当前关系：${Object.entries(ctx.characterStats[char.id] || {}).map(([k, v]) => `${k}${v}`).join(' ')}`
  }

  prompt += `

## 当前状态
- 回合：${ctx.round} · 第 ${ctx.currentDay}/${ctx.maxDays} 天 · ${period?.name || '未知'}
- 行动力：${ctx.actionPoints}/${ctx.maxActionPoints}
- 场景：${scene?.icon || ''} ${scene?.name || '未知'} — ${scene?.description || ''}
- 玩家属性：${playerSummary}

## 角色关系
${charSummary}

## 当前目标
${goalSummary}`

  return prompt
}
