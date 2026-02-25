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
  scriptContent?: string
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

  let prompt = `你是《${ctx.title}》的叙述者，隐身于文字背后的说书人。类型：${ctx.genre}。

## 叙事风格
${ctx.narrativeStyle}
`

  if (ctx.scriptContent) {
    prompt += `
## 游戏剧本
${ctx.scriptContent}

## 写作铁律
- 感官先行：每个场景至少三种感官（视/听/嗅/触/味），禁止"你来到了XX"式干瘪句
- 情绪物化：不说"她很伤心"，写"指节攥白了衣角"。用身体反应代替情绪名词
- 悬念埋线：每次回复至少一根暗线，前文伏笔要回收
`
  } else {
    prompt += `
## 写作规则
- 感官先行：每个场景至少三种感官（视/听/嗅/触/味），禁止"你来到了XX"式干瘪句
- 角色有声：对话即人格，每人有独特语气和小动作，不看名字也能辨认
- 节奏交替：短句=紧张，长句=氛围，断句=冲击。三者交替掌控心跳
- 情绪物化：不说"她很伤心"，写"指节攥白了衣角"。用身体反应代替情绪名词
- 冲突暗涌：每场景至少一层张力——价值碰撞、信任试探、知与不知的不对称
- 悬念埋线：每次回复至少一根暗线，前文伏笔要回收
`
  }

  prompt += `## 结构化标记（用中文全角方括号【】嵌入正文）
1. 属性变化：【属性名 +/-N】或【属性名 +/-N，属性名 +/-N】
2. 目标更新：【目标更新：标题 +N%】
3. 关键事件（每2-3回合）：【关键事件：标题】描述
4. 重大事件（每5-10回合）：【重大事件：标题】描述
5. 解锁角色：【解锁角色：名字】
6. 获得物品：【获得物品：名字 · 描述】
7. 行动选项（末尾必须）：【行动选项】1. A 2. B 3. C 4. D

## 格式
- 每次回复 600-1000 字故事正文 + 结构化标记
- 角色对话：【角色名】"对话"，动作用（）
- 第二人称"你"，有内心戏和犹豫
- 末尾必须带行动选项`

  if (char) {
    prompt += `

## 当前互动角色
- ${char.name}（${char.title}）
- ${char.description}
- 当前关系：${Object.entries(ctx.characterStats[char.id] || {}).map(([k, v]) => `${k}${v}`).join(' ')}`
  }

  /* 第一幕特殊指令 */
  if (ctx.round <= 1) {
    prompt += `

## ⚠ 第一幕
这是开篇，定义后续所有回复的品质基准。不少于 800 字。环境描写至少 5 句，引入首个角色互动，以强悬念收尾。`
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
