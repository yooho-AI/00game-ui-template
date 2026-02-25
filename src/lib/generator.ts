/**
 * [INPUT]: 依赖 @/lib/stream 的 chat，依赖 @/config/game 的 WorldConfig 接口
 * [OUTPUT]: generateWorld() — 一句话生成 WorldConfig
 * [POS]: lib 的 AI 世界生成器，被 App.tsx 创造流消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { chat } from './stream'
import type { WorldConfig } from '@/config/game'

// ============================================================
// 生成 Prompt
// ============================================================

const GENERATION_PROMPT = `你是一个游戏世界设计师。根据用户的一句话描述，生成一个完整的文字冒险游戏世界配置。

## 输出格式
**只输出纯 JSON 对象**，不要 markdown 代码块，不要解释文字。

## JSON 结构（每个字段必须存在）

{
  "title": "游戏名称（2-6个字，有吸引力）",
  "genre": "类型标签（2-4个字，如：谍战悬疑、校园恋爱、末日求生）",
  "description": "世界观开场白（50-150字，有文学性，用第二人称'你'）",
  "icon": "一个代表游戏氛围的 emoji",
  "narrativeStyle": "叙事风格描述（80-150字，要求涵盖：叙事节奏与语气、对话特征与角色腔调、情感基调与氛围底色、偏好的文学手法如比喻/留白/意象、场景描写的感官侧重点。写得像在描述一位作家的文风，而非笼统的形容词堆砌）",

  "themeColors": {
    "primary": "主色 hex（如 #6366f1）",
    "primaryLight": "主色浅版 rgba（如 rgba(99,102,241,0.1)）",
    "accent": "强调色 hex",
    "bgPrimary": "主背景 hex（暗色系，如 #1a1a1a）",
    "bgSecondary": "次背景 hex（更深，如 #0f0f0f）",
    "bgCard": "卡片背景 hex（如 #242424）",
    "textPrimary": "主文字 hex（浅色，如 #f5f5f5）",
    "textSecondary": "次文字 hex（如 #a3a3a3）"
  },

  "maxDays": "游戏天数（8-30，数字）",
  "maxActionPoints": "每日行动力（4-8，数字）",

  "periods": [
    { "index": 0, "name": "时段名", "icon": "emoji", "hours": "HH:MM-HH:MM" }
  ],

  "characters": [
    {
      "id": "英文id",
      "name": "中文名（2-3字）",
      "avatar": "代表角色的emoji",
      "title": "身份标签（4-6字）",
      "themeColor": "角色主题色 hex",
      "description": "角色描述（30-60字，性格+背景+与主线关系）",
      "initialStats": { "属性名": 数字 },
      "locked": false
    }
  ],

  "scenes": [
    {
      "id": "英文id",
      "name": "场景名（2-4字）",
      "icon": "emoji",
      "description": "场景描述（20-40字）",
      "background": "CSS线性渐变（linear-gradient(135deg, #色1 0%, #色2 50%, #色3 100%)）",
      "characters": ["关联角色id"]
    }
  ],

  "goals": [
    {
      "id": "g1",
      "title": "目标标题（4-8字）",
      "condition": "达成条件描述（15-30字）",
      "progress": 0,
      "completed": false
    }
  ],

  "playerStats": [
    {
      "name": "属性名（2字）",
      "aliases": ["别名1", "别名2"],
      "color": "hex色值",
      "icon": "emoji"
    }
  ],

  "initialPlayerStats": { "属性名": 数字(0-100) },

  "characterStats": [
    {
      "name": "关系属性名（2字）",
      "aliases": ["别名"],
      "color": "hex色值",
      "icon": "emoji"
    }
  ],

  "items": [
    {
      "id": "英文id",
      "name": "物品名",
      "icon": "emoji",
      "type": "类型",
      "description": "效果描述"
    }
  ]
}

## 设计规则

### 配色
- 始终使用**暗色背景**（bgPrimary 在 #141414-#1e1e1e，bgSecondary 更深）
- primary 色要与游戏氛围匹配：恋爱用粉红/玫红，恐怖用暗红/血红，科幻用蓝/青，武侠用金/铜，悬疑用紫/灰
- 场景 background 用 CSS linear-gradient，3 个色阶，暗色调

### 角色
- 3-5 个角色，其中 1-2 个 locked=true（需要剧情解锁）
- 每个角色有独特 themeColor（彼此区分）
- initialStats 的 key 必须与 characterStats 的 name 一致
- 初始值范围：未锁定 15-30，锁定 5-15

### 属性
- playerStats：3-5 个（根据游戏类型选择，如武侠用内力/轻功/剑术，恋爱用魅力/情商/财富）
- characterStats：2-3 个（如信任/好感，或忠诚/默契）
- initialPlayerStats 值范围 30-80

### 目标
- 恰好 3 个目标，从易到难
- condition 要具体可衡量

### 时段
- 5-7 个时段，用 emoji 区分

### 物品
- 0-3 个初始物品

## 完整示例

用户输入："一个宁静的边境小镇被异界裂缝笼罩"

输出：
{
  "title": "裂缝边境",
  "genre": "奇幻冒险",
  "description": "一个宁静的边境小镇突然被异界裂缝笼罩。你，一个普通的旅行者，被卷入了一场跨越维度的冒险。四位命运各异的同伴将与你并肩作战，探索未知的世界，揭开裂缝背后的秘密。",
  "icon": "🌀",
  "narrativeStyle": "叙事节奏明快但张弛有度，紧张时短句如刀，舒缓时长句铺陈意境。战斗描写注重速度感与身体反应，不堆砌招式名称。角色对话各有腔调——莉娜惜字如金，米洛爱用反问句和学术比喻。情感基调是少年冒险的热血底色下隐藏着命运的沉重。偏好用天气、光影变化映射角色心境，用具体的感官细节代替抽象形容。留白多于解释，让玩家自己品味言外之意。",
  "themeColors": {
    "primary": "#6366f1",
    "primaryLight": "rgba(99,102,241,0.1)",
    "accent": "#a78bfa",
    "bgPrimary": "#1a1a1a",
    "bgSecondary": "#0f0f0f",
    "bgCard": "#242424",
    "textPrimary": "#f5f5f5",
    "textSecondary": "#a3a3a3"
  },
  "maxDays": 15,
  "maxActionPoints": 6,
  "periods": [
    { "index": 0, "name": "清晨", "icon": "🌅", "hours": "06:00-08:00" },
    { "index": 1, "name": "上午", "icon": "☀️", "hours": "08:00-11:00" },
    { "index": 2, "name": "午后", "icon": "🌞", "hours": "11:00-14:00" },
    { "index": 3, "name": "下午", "icon": "⛅", "hours": "14:00-17:00" },
    { "index": 4, "name": "傍晚", "icon": "🌇", "hours": "17:00-19:00" },
    { "index": 5, "name": "夜晚", "icon": "🌙", "hours": "19:00-23:00" },
    { "index": 6, "name": "深夜", "icon": "🌃", "hours": "23:00-06:00" }
  ],
  "characters": [
    {
      "id": "lina",
      "name": "莉娜",
      "avatar": "🗡",
      "title": "边境剑士",
      "themeColor": "#ef4444",
      "description": "沉默寡言的边境守卫，剑法凌厉。失去了家园后独自流浪，对异界裂缝有切身之痛。",
      "initialStats": { "信任": 30, "默契": 10 },
      "locked": false
    },
    {
      "id": "milo",
      "name": "米洛",
      "avatar": "📖",
      "title": "流浪学者",
      "themeColor": "#6366f1",
      "description": "博学多闻的旅行学者，总是随身带着一本厚重的笔记本。对裂缝现象有独到见解。",
      "initialStats": { "信任": 25, "默契": 15 },
      "locked": false
    },
    {
      "id": "kael",
      "name": "凯尔",
      "avatar": "🛡",
      "title": "神秘骑士",
      "themeColor": "#f59e0b",
      "description": "身披黑色铠甲的骑士，来历不明。行事果断，似乎知道裂缝的某些秘密。",
      "initialStats": { "信任": 15, "默契": 5 },
      "locked": true
    },
    {
      "id": "yuki",
      "name": "雪织",
      "avatar": "✨",
      "title": "异界旅人",
      "themeColor": "#22d3ee",
      "description": "从裂缝另一端穿越而来的少女，拥有不属于这个世界的神秘力量。记忆残缺。",
      "initialStats": { "信任": 10, "默契": 20 },
      "locked": true
    }
  ],
  "scenes": [
    {
      "id": "town-square",
      "name": "小镇广场",
      "icon": "🏘",
      "description": "边境小镇的中心广场，石板路两旁是低矮的木屋和商铺。",
      "background": "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      "characters": ["lina", "milo"]
    },
    {
      "id": "ancient-forest",
      "name": "古老森林",
      "icon": "🌲",
      "description": "小镇外围的茂密森林，树冠遮天蔽日。",
      "background": "linear-gradient(135deg, #0d1b0e 0%, #1a2f1a 50%, #2d4a2d 100%)",
      "characters": ["lina", "kael"]
    },
    {
      "id": "rift-edge",
      "name": "裂缝边缘",
      "icon": "🌀",
      "description": "异界裂缝的边缘地带，空气中弥漫着紫色的微光粒子。",
      "background": "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #4a1a8a 100%)",
      "characters": ["milo", "yuki"]
    }
  ],
  "goals": [
    { "id": "g1", "title": "揭开裂缝秘密", "condition": "收集散落的符文碎片，拼凑出裂缝成因", "progress": 0, "completed": false },
    { "id": "g2", "title": "集结同伴", "condition": "解锁所有被锁定的角色，组建冒险队伍", "progress": 0, "completed": false },
    { "id": "g3", "title": "守护小镇", "condition": "在异界入侵前完成防御准备", "progress": 0, "completed": false }
  ],
  "playerStats": [
    { "name": "生命", "aliases": ["生命值", "HP"], "color": "#ef4444", "icon": "❤️" },
    { "name": "智慧", "aliases": ["智慧值", "智力"], "color": "#6366f1", "icon": "🧠" },
    { "name": "勇气", "aliases": ["勇气值", "胆量"], "color": "#f59e0b", "icon": "🔥" }
  ],
  "initialPlayerStats": { "生命": 80, "智慧": 50, "勇气": 40 },
  "characterStats": [
    { "name": "信任", "aliases": ["信任度"], "color": "#22d3ee", "icon": "🤝" },
    { "name": "默契", "aliases": ["默契值"], "color": "#a78bfa", "icon": "💫" }
  ],
  "items": [
    { "id": "heal-potion", "name": "治愈药水", "icon": "🧪", "type": "消耗品", "description": "恢复少量生命值" }
  ]
}

现在请根据用户的描述生成。只输出 JSON，不要任何其他内容。`

// ============================================================
// 生成 + 解析 + 验证
// ============================================================

/** 从 AI 回复中提取 JSON */
function extractJson(text: string): string {
  /* 尝试剥离 markdown 代码块 */
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) return fenced[1].trim()

  /* 直接找第一个 { 到最后一个 } */
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)

  return text.trim()
}

/** 验证 WorldConfig 必要字段 */
function validate(config: WorldConfig): string[] {
  const errors: string[] = []

  if (!config.title) errors.push('缺少 title')
  if (!config.genre) errors.push('缺少 genre')
  if (!config.description) errors.push('缺少 description')
  if (!config.icon) errors.push('缺少 icon')
  if (!config.characters?.length) errors.push('缺少 characters')
  if (!config.scenes?.length) errors.push('缺少 scenes')
  if (!config.goals?.length) errors.push('缺少 goals')
  if (!config.playerStats?.length) errors.push('缺少 playerStats')
  if (!config.characterStats?.length) errors.push('缺少 characterStats')
  if (!config.periods?.length) errors.push('缺少 periods')
  if (!config.themeColors?.primary) errors.push('缺少 themeColors')
  if (!config.initialPlayerStats) errors.push('缺少 initialPlayerStats')
  if (!config.narrativeStyle) errors.push('缺少 narrativeStyle')

  return errors
}

/** 补全缺失的可选字段 */
function normalize(config: WorldConfig): WorldConfig {
  /* 确保 maxDays / maxActionPoints 有默认值 */
  if (!config.maxDays || config.maxDays < 1) config.maxDays = 15
  if (!config.maxActionPoints || config.maxActionPoints < 1) config.maxActionPoints = 6

  /* 确保 goals 有正确结构 */
  config.goals = config.goals.map((g, i) => ({
    id: g.id || `g${i + 1}`,
    title: g.title || '未命名目标',
    condition: g.condition || '',
    progress: g.progress ?? 0,
    completed: g.completed ?? false,
  }))

  /* 确保 characters 有正确结构 */
  config.characters = config.characters.map(c => ({
    ...c,
    initialStats: c.initialStats || {},
    locked: c.locked ?? false,
  }))

  /* 确保 items 是数组 */
  if (!config.items) config.items = []

  /* 确保 scriptContent 有默认值 */
  if (!config.scriptContent) config.scriptContent = ''

  /* 确保 periods 有 index */
  config.periods = config.periods.map((p, i) => ({
    ...p,
    index: p.index ?? i,
  }))

  return config
}

// ============================================================
// 公开 API
// ============================================================

export class GenerationError extends Error {
  readonly retriable: boolean
  constructor(message: string, retriable = true) {
    super(message)
    this.retriable = retriable
  }
}

/**
 * 一句话生成 WorldConfig
 * 内部含一次自动重试
 */
export async function generateWorld(userPrompt: string): Promise<WorldConfig> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat([
        { role: 'system', content: GENERATION_PROMPT },
        { role: 'user', content: userPrompt },
      ])

      if (!raw.trim()) {
        throw new GenerationError('AI 未返回内容')
      }

      const jsonStr = extractJson(raw)
      const config = JSON.parse(jsonStr) as WorldConfig

      const errors = validate(config)
      if (errors.length > 0) {
        throw new GenerationError(`配置不完整: ${errors.join(', ')}`)
      }

      const result = normalize(config)

      /* 直通管道：长输入直接作为 scriptContent，零损耗注入 system prompt */
      if (userPrompt.length >= 200) result.scriptContent = userPrompt

      return result
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      /* 第一次失败自动重试 */
    }
  }

  throw new GenerationError(
    `世界生成失败: ${lastError?.message || '未知错误'}`,
    false
  )
}
