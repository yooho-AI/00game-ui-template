# 00list-chuangzhao — 通用游戏 UI 模板方案

> 创造：从混沌中提取秩序，从重复中抽象永恒

## 一、问题的本质

5 个游戏项目共享 70-80% 代码骨架，每次新建都在重复「复制 → 批量替换前缀 → 改数据 → 改颜色」。
这不是工程问题，是**架构失语**——代码在说同一句话，却用了五种方言。

**目标：提取一套中性化、移动优先的 UI 模板，让新项目只改 `config/` 即可启动。**
**同时**：吸收 MOKU 的游戏状态面板（目标/事件/资产/行动选项），让模板具备完整的游戏深度。

---

## 二、基础项目分析（03 xindong）

### 2.1 文件清单与改造程度

| 文件 | 行数 | 改造级别 | 说明 |
|------|------|----------|------|
| `stream.ts` | 133 | ⬜ 零改 | 纯 SSE 通信，无项目耦合 |
| `bgm.ts` | 77 | ⬜ 零改 | 音频单例，完全通用 |
| `hooks.ts` | 39 | ⬜ 零改 | 响应式 hook，完全通用 |
| `vite.config.ts` | 8 | ⬜ 零改 | react + tailwind + @ 别名 |
| `worker/index.js` | 50 | ⬜ 零改 | Cloudflare API 代理 |
| `tsconfig*.json` | 3件套 | ⬜ 零改 | 标准配置 |
| `analytics.ts` | 44 | 🟡 微改 | `xd_` → `gx_` 前缀 |
| `index.html` | 30 | 🟡 微改 | 改标题/描述/favicon，去 Umami |
| `package.json` | 30 | 🟡 微改 | 改 name |
| `wrangler.toml` | 5 | 🟡 微改 | 改 Worker name |
| `highlight.ts` | 218 | 🟠 中改 | prompt 中"心动公馆"→ 从 config 读取 |
| `parser.ts` | 139 | 🔴 重构 | 扩展解析器：属性变化 + 目标更新 + 事件 + 角色解锁 + 物品获取 + 行动选项 |
| `App.tsx` | 284 | 🔴 重构 | 硬编码文案/颜色 → config 驱动 |
| `globals.css` | 1050 | 🔴 重构 | `hb-` → `gx-`，浅色 → 暗色，硬编码 → CSS 变量，新增右栏面板样式 |
| `store.ts` | 888 | 🔴 重构 | 数据外迁 config/，新增 goals/events/playerStats/actions 状态 |
| `dialogue-panel.tsx` | 307 | 🟠 中改 | `hb-` → `gx-`，新增行动选项渲染 |
| `character-panel.tsx` | 155 | 🔴 重构 | `hb-` → `gx-`，新增玩家属性面板 + 角色解锁状态 |
| `side-panel.tsx` | 133 | 🔴 重构 | 从纯背包 → 目标/事件/资产三区域面板 |
| `mobile-layout.tsx` | 566 | 🟠 中改 | `hb-` → `gx-`，新增目标/事件 Sheet |
| `highlight-modal.tsx` | 276 | 🟡 微改 | `hb-` → `gx-`，硬编码色值 → CSS 变量 |
| **新增** `event-modal.tsx` | ~80 | 🆕 新建 | 重大事件弹窗（关键剧情转折时弹出） |

### 2.2 耦合分析 — 03 项目特有的硬编码

```
store.ts:
  ├── 4 个角色数据 (guqinghan/xiatian/linwei/tangtang)     → 迁至 config/characters.ts
  ├── 7 个场景数据                                          → 迁至 config/scenes.ts
  ├── 11 个物品数据                                         → 迁至 config/items.ts
  ├── 7 个时段数据                                          → 合入 config/game.ts
  ├── STORY_INFO 开场信息                                   → 合入 config/game.ts
  ├── CharacterStats = {affection, jealousy, disgust}       → Record<string, number>
  ├── buildSystemPrompt() 硬编码"心动公馆"叙述规则          → config/prompt.ts
  ├── parseStatChanges() 硬编码 '好感'/'嫉妒'/'厌恶' 映射  → 从 config 读 stat 名称
  ├── getAffectionLevel/getMood/getRelationLabel             → 通用化或迁至 config
  ├── SAVE_KEY = 'xindong-save-v1'                          → 从 config 读
  └── MAX_DAYS=30, MAX_ACTION_POINTS=8                      → 从 config 读

App.tsx:
  ├── "心动公馆"、"Heartbeat Mansion · 四重奏"               → GAME_INFO
  ├── 💕 emoji                                               → GAME_INFO.icon
  ├── #e91e8c 粉色主题色                                    → var(--primary)
  ├── #37352f / #6b6b6b / #9b9a97 文字色                    → var(--text-*)
  ├── from-[#fdf2f8] 渐变背景                               → var(--bg-start-*)
  └── char.fullImage (03特有字段名)                          → char.image (通用)

globals.css:
  ├── 93 处 `hb-` 前缀                                      → `gx-`
  ├── 27 处 `#e91e8c` 硬编码粉色                            → var(--primary)
  ├── 12 处 `#9333ea` 硬编码紫色                            → var(--accent)
  ├── 浅色底 #ffffff/#f7f6f3                                 → 暗色底 #1a1a1a/#0f0f0f
  └── rgba(255,255,255,0.x) 半透明白                        → rgba(30,30,30,0.x) 半透明黑
```

---

## 三、通用数据接口设计

### 3.1 Character — 角色/NPC

```typescript
export interface Character {
  id: string
  name: string
  avatar: string              // emoji 或单字
  title: string               // 身份标签
  themeColor: string
  description: string
  image?: string              // 静态立绘路径
  video?: string              // 动态视频路径
  initialStats: Record<string, number>  // 与玩家的关系属性 {好感: 20, ...}
  locked?: boolean            // 是否初始锁定（剧情解锁）
}
```

### 3.2 Scene — 场景

```typescript
export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  backgroundVideo?: string
  characters?: string[]       // 关联角色 ID
}
```

### 3.3 GameItem — 物品/资产

```typescript
export interface GameItem {
  id: string
  name: string
  icon: string
  type: string
  description: string
  effects?: Record<string, Record<string, number>>  // { charId: { statName: delta } }
  requiresTarget?: boolean
  dailyLimit?: number
}
```

### 3.4 Goal — 目标

```typescript
export interface Goal {
  id: string
  title: string               // 目标名称，如"获取密电码"
  condition: string            // 达成条件，告诉玩家怎样完成这个目标
  progress: number             // 0-100
  completed: boolean
}
```

### 3.5 KeyEvent — 关键事件

```typescript
export interface KeyEvent {
  id: string
  title: string
  description: string
  round: number
  tags?: string[]             // 标签，如 "剧情"、"战斗"
}
```

### 3.6 StatConfig — 数值配置

```typescript
export interface StatConfig {
  name: string                // 显示名（"忠诚"）
  aliases: string[]           // AI 输出别名
  color: string
  dailyDecay?: number
}
```

### 3.7 GameInfo — 游戏信息

```typescript
export interface GameInfo {
  id: string                  // localStorage key 前缀
  title: string
  subtitle?: string
  icon: string
  genre: string
  description: string
  maxDays: number
  maxActionPoints: number

  // 时段系统
  periods: TimePeriod[]

  // 玩家属性（与角色关系属性不同，这是玩家自身的数值）
  playerStats: StatConfig[]
  initialPlayerStats: Record<string, number>  // {生命值: 100, 法力值: 100, ...}

  // 目标系统
  initialGoals: Goal[]

  // 角色关系属性
  characterStats: StatConfig[]
}

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}
```

**两套属性系统**：
- `playerStats`：玩家自身的数值属性（生命值/法力值/忠诚/情报），显示在左栏
- `characterStats`：玩家与各角色的关系属性（好感/嫉妒/信任），现有系统的通用化

---

## 四、目标目录结构

```
00list-chuangzhao/
├── CLAUDE.md                   # L1 项目宪法
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / .app / .node
├── wrangler.toml
├── worker/
│   └── index.js
├── public/
│   ├── audio/bgm.mp3
│   ├── characters/
│   └── scenes/
└── src/
    ├── main.tsx
    ├── App.tsx                 # StartScreen ↔ GameScreen 状态机
    │
    ├── config/                 # ← 用户唯一需修改的目录
    │   ├── CLAUDE.md
    │   ├── theme.css           # CSS 变量覆盖
    │   ├── game.ts             # GameInfo（含时段/属性/目标配置）
    │   ├── characters.ts       # Character[]
    │   ├── scenes.ts           # Scene[]
    │   ├── items.ts            # GameItem[]
    │   └── prompt.ts           # buildSystemPrompt()
    │
    ├── styles/
    │   ├── CLAUDE.md
    │   └── globals.css         # gx- 前缀 + CSS 变量 + 暗色默认
    │
    ├── lib/
    │   ├── CLAUDE.md
    │   ├── store.ts            # 通用 Zustand（含 goals/events/playerStats）
    │   ├── stream.ts           # SSE 封装（零改）
    │   ├── parser.ts           # 文本解析（扩展：属性+目标+事件+解锁+物品+选项）
    │   ├── highlight.ts        # 高光 API
    │   ├── bgm.ts              # BGM 单例（零改）
    │   ├── hooks.ts            # useIsMobile（零改）
    │   └── analytics.ts        # Umami 埋点（gx_ 前缀）
    │
    └── components/game/
        ├── CLAUDE.md
        ├── dialogue-panel.tsx  # 中栏：对话流 + 行动选项
        ├── character-panel.tsx # 左栏：场景+角色+玩家属性
        ├── side-panel.tsx      # 右栏：目标+关键事件+资产（重构）
        ├── mobile-layout.tsx   # 移动端布局
        ├── highlight-modal.tsx # 高光弹窗
        └── event-modal.tsx     # 重大事件弹窗（新增）
```

**变化点**（对比旧方案）：
- `config/stats.ts` 和 `config/periods.ts` 合入 `config/game.ts`（6 个配置文件）
- 新增 `event-modal.tsx`（重大事件弹窗）
- `side-panel.tsx` 从"背包面板"升级为"游戏状态面板"（目标/事件/资产三区域）
- `parser.ts` 从"数值解析"升级为"全结构化标记解析器"

---

## 五、核心改造详解

### 5.1 store.ts 重构方案

**现状**：888 行，集成了类型定义 + 数据 + 工具函数 + store + prompt builder

**新增 state 字段**：

```typescript
interface GameStore {
  // === 现有字段（通用化） ===
  characterStats: Record<string, Record<string, number>>  // NPC 关系属性
  messages: Message[]
  currentDay: number
  currentPeriod: number
  currentScene: string
  currentCharacter: string | null
  actionPoints: number
  inventory: string[]
  isStreaming: boolean

  // === 新增字段 ===
  playerStats: Record<string, number>     // 玩家自身属性 {生命值: 100, ...}
  goals: Goal[]                           // 目标列表 + 进度
  keyEvents: KeyEvent[]                   // 累积的关键事件
  currentActions: string[]                // 当前 AI 建议的行动选项
  round: number                           // 回合计数器
  unlockedCharacters: Set<string>         // 已解锁的角色 ID

  // === 新增 actions ===
  updatePlayerStat: (stat: string, delta: number) => void
  updateGoal: (goalId: string, progress: number) => void
  completeGoal: (goalId: string) => void
  addKeyEvent: (event: KeyEvent) => void
  unlockCharacter: (charId: string) => void
  setCurrentActions: (actions: string[]) => void
  incrementRound: () => void
}
```

**数据外迁**：

```
Before (store.ts 888行):
  ├── CHARACTERS (80-138)          → config/characters.ts
  ├── SCENES (144-222)             → config/scenes.ts
  ├── ITEMS (228-339)              → config/items.ts
  ├── PERIODS + STORY_INFO         → config/game.ts
  ├── buildSystemPrompt (833-887)  → config/prompt.ts

After (store.ts ~500行):
  ├── 从 config/* 导入所有数据
  ├── 通用工具函数（parseStatChanges 扩展为 parseStructuredMarkers）
  ├── Store 定义（含新增字段）
  └── sendMessage()（扩展：解析 AI 输出 → 自动更新 goals/events/stats/actions）
```

**关键改造：parseStructuredMarkers()**

原来的 `parseStatChanges()` 只解析 `【好感 +10】`。扩展为统一的结构化标记解析器：

```typescript
interface ParsedMarkers {
  statChanges: Array<{ charId: string; stat: string; delta: number }>
  playerStatChanges: Array<{ stat: string; delta: number }>
  goalUpdates: Array<{ goalId: string; progress: number }>
  newEvents: Array<{ title: string; description: string }>
  unlockedCharacters: string[]
  newItems: Array<{ name: string; icon: string; description: string }>
  actionOptions: string[]
}

function parseStructuredMarkers(content: string): ParsedMarkers {
  // 统一解析所有 【...】 标记
}
```

**在 `sendMessage()` 的 `onComplete` 回调中**：

```typescript
const markers = parseStructuredMarkers(fullText)
// 更新玩家属性
markers.playerStatChanges.forEach(...)
// 更新角色关系
markers.statChanges.forEach(...)
// 更新目标进度
markers.goalUpdates.forEach(...)
// 添加关键事件（触发弹窗）
markers.newEvents.forEach(...)
// 解锁角色
markers.unlockedCharacters.forEach(...)
// 获得物品
markers.newItems.forEach(...)
// 设置行动选项
if (markers.actionOptions.length) setCurrentActions(markers.actionOptions)
```

#### CharacterStats 通用化

```typescript
// Before
interface CharacterStats { affection: number; jealousy: number; disgust: number }

// After
characterStats: Record<string, Record<string, number>>
// 初始化时从 CHARACTERS[id].initialStats 填充
```

stat key 直接用中文名。AI prompt 用中文，AI 输出用中文，config 用中文，前端显示用中文——一条直线，零翻译层。

#### buildSystemPrompt() 可配置

`config/prompt.ts` 导出完整函数。默认实现需在 prompt 中告知 AI 使用结构化标记格式：

```
你是一个 AI 游戏叙事引擎。在回复中，你需要：
1. 用生动的文字推进故事
2. 在适当时机使用结构化标记：
   - 【属性变化：忠诚 -5，情报 +10】
   - 【目标更新：获取密电码 +20%】
   - 【关键事件：事件标题】事件描述
   - 【解锁角色：角色名】
   - 【获得物品：物品名 · 效果描述】
   - 【行动选项】1. 选项A 2. 选项B 3. 选项C
```

#### 存档系统通用化

```typescript
// SAVE_KEY = `${GAME_INFO.id}-save-v1`
// 存档内容新增：playerStats, goals, keyEvents, unlockedCharacters, round
```

### 5.2 parser.ts 重构方案

从单一的 stat 解析器 → 全标记解析器。

```typescript
// 新增导出
export function parseStructuredMarkers(content: string): ParsedMarkers { ... }

// 保留原有导出（用于渲染）
export function parseStoryParagraph(html: string): StoryParagraph[] { ... }

// 渲染层增强：
// 属性变化标记在故事文本中高亮显示（已有）
// 其他标记在渲染前被移除（不显示在对话流中，只更新状态面板）
```

### 5.3 globals.css 重构方案

改造量：1050 行，93 处 `hb-` 前缀，27+ 处硬编码颜色

**策略**：

1. `hb-` → `gx-` 全局替换
2. 浅色 → 暗色，硬编码 → CSS 变量
3. **新增右栏面板样式**：

```css
/* 目标区域 */
.gx-goals-section { ... }
.gx-goal-item { ... }
.gx-goal-progress { ... }      /* 进度条 */

/* 关键事件区域 */
.gx-events-section { ... }
.gx-event-item { ... }
.gx-event-tag { ... }          /* 标签如"剧情"、"战斗" */

/* 资产区域 */
.gx-assets-section { ... }

/* 玩家属性（左栏） */
.gx-player-stats { ... }
.gx-stat-bar { ... }
.gx-stat-delta { ... }         /* +5/-5 动画 */

/* 行动选项（中栏） */
.gx-action-options { ... }
.gx-action-btn { ... }

/* 重大事件弹窗 */
.gx-event-modal { ... }
.gx-event-modal-tag { ... }
```

### 5.4 App.tsx 通用化

```
替换清单：
├── "心动公馆"         → GAME_INFO.title
├── "Heartbeat Mansion" → GAME_INFO.subtitle
├── 💕                  → GAME_INFO.icon
├── 描述文案            → GAME_INFO.description
├── #e91e8c 系颜色      → var(--primary)
├── char.fullImage      → char.image
├── hb-*                → gx-*
├── StartScreen 渐变背景 → CSS 变量控制
└── 新增：StartScreen 展示目标预览
```

### 5.5 组件改造

#### character-panel.tsx（左栏 — 重构）

```
现有保留：
├── SceneCard（场景卡片）
├── PortraitCard（角色立绘/视频）
├── CharacterList（2x2 角色选择网格）

新增：
├── 角色锁定状态（locked 角色显示"？"占位，不可点击）
├── PlayerStatsPanel（玩家属性面板）
│   ├── 属性名 + 数值 + 进度条
│   ├── 变化时显示 +N/-N 动画
│   └── 从 store.playerStats 读取

布局调整：
  SceneCard → PortraitCard → CharacterList → PlayerStatsPanel
  （从上到下，角色之后加玩家属性）
```

#### side-panel.tsx（右栏 — 重构）

```
现有的图标导航栏(52px) 保留，内容区完全重写：

┌─ GoalsSection ─────────┐
│ 📋 目标 (N)             │   可折叠，每个目标：标题+描述+进度条
│ ├ Goal 1  ████▓░  35%  │   进度条颜色 = var(--primary)
│ └ Goal 2  ██░░░░  20%  │   已完成的目标：绿色 ✓ + 100%
└─────────────────────────┘

┌─ EventsSection ────────┐
│ ⚡ 关键事件 (N)          │   时间线样式，最新在上
│ ├ 📋 事件标题            │   每条显示：标题+回合+摘要
│ │  ○ 回合 5              │   点击可展开完整描述
│ │  摘要文字...           │
│ └ 📋 事件标题            │
│    ○ 回合 1              │
└─────────────────────────┘

┌─ AssetsSection ────────┐
│ 🎒 资产 (N)             │   = 现有 InventoryPanel 进化
│ ├ 🔮 金箍棒  攻击力+50  │   物品卡片，显示 icon+名称+效果
│ └ 💊 仙丹    生命+30    │   可交互（使用/装备）
└─────────────────────────┘
```

#### dialogue-panel.tsx（中栏 — 中改）

```
现有保留：
├── LetterCard（开场信函）
├── MessageItem（对话气泡）
├── StreamingMessage（流式显示）
├── InputArea（输入框）

新增：
├── ActionOptions（行动选项面板）
│   ├── 位于输入框上方
│   ├── 折叠/展开切换（"展开行动选项 4 ▼"）
│   ├── 3-4 个按钮，点击即发送对应文本
│   └── 从 store.currentActions 读取
│
├── 数值变化渲染增强
│   ├── 属性变化已有（保留）
│   └── 其他标记（目标/事件/物品）从显示文本中移除，只更新面板
```

#### event-modal.tsx（新增）

```
重大事件弹窗组件：

├── 触发：store.keyEvents 新增时，如果事件带 major: true 标记
├── 布局：全屏遮罩 + 居中卡片
│   ├── 标签（🏷 剧情 / 战斗 / 发现）
│   ├── 回合标记（○ 回合 N）
│   ├── 事件标题
│   ├── 事件描述
│   └── 确认按钮（"朕知道了" / "继续" — 文案从 config 可配）
├── 动画：淡入 + 从下滑入
└── 关闭后事件记录在右栏时间线
```

#### mobile-layout.tsx（移动端 — 中改）

```
现有保留：
├── MobileHeader
├── MobileDialogue（浮动角色窗）
├── MobileInputBar
├── CharacterSheet（角色 BottomSheet）
├── InventorySheet（背包 BottomSheet）
├── MobileMenu

新增/改造：
├── ActionOptions（行动选项 — 在输入框上方）
├── CharacterSheet 增加玩家属性区域
├── GoalsSheet（目标 BottomSheet — 新增）
│   └── 从底部滑出，展示目标列表+进度
├── EventsSheet（事件 BottomSheet — 新增）
│   └── 从底部滑出，展示事件时间线
├── InventorySheet → AssetsSheet（重命名 + 资产卡片样式）
├── 底部导航新增图标：📋目标 / ⚡事件
```

### 5.6 highlight.ts 通用化

```typescript
// "心动公馆恋爱模拟游戏" → GAME_INFO.title + GAME_INFO.genre
// "精致洋房" → 通用场景描述从 config 读
```

---

## 六、config/ 示例数据

### 6.1 config/game.ts

```typescript
export const GAME_INFO: GameInfo = {
  id: 'chuangzhao',
  title: '创造',
  subtitle: 'Game UI Template',
  icon: '🎮',
  genre: '冒险模拟',
  description: '这是一个通用游戏模板。修改 config/ 目录下的文件，即可创建你自己的游戏。',
  maxDays: 30,
  maxActionPoints: 8,

  periods: [
    { index: 0, name: '清晨', icon: '🌅', hours: '06:00-08:00' },
    { index: 1, name: '上午', icon: '☀️', hours: '08:00-11:00' },
    { index: 2, name: '午后', icon: '🌤', hours: '11:00-14:00' },
    { index: 3, name: '下午', icon: '⛅', hours: '14:00-17:00' },
    { index: 4, name: '傍晚', icon: '🌇', hours: '17:00-19:00' },
    { index: 5, name: '夜晚', icon: '🌙', hours: '19:00-22:00' },
    { index: 6, name: '深夜', icon: '🌑', hours: '22:00-06:00' },
  ],

  // 玩家自身属性
  playerStats: [
    { name: '体力', aliases: ['体力值'], color: '#ef4444' },
    { name: '智慧', aliases: ['智慧值'], color: '#3b82f6' },
    { name: '声望', aliases: ['声望值', '名望'], color: '#f59e0b' },
  ],
  initialPlayerStats: { 体力: 100, 智慧: 50, 声望: 0 },

  // 角色关系属性
  characterStats: [
    { name: '信任', aliases: ['信任度'], color: '#6366f1' },
    { name: '默契', aliases: ['默契度'], color: '#a78bfa' },
  ],

  // 初始目标
  initialGoals: [
    {
      id: 'explore',
      title: '探索世界',
      condition: '访问所有可用场景，与场景中的角色交谈，了解这个世界的全貌。',
      progress: 0,
      completed: false,
    },
    {
      id: 'ally',
      title: '结交盟友',
      condition: '通过反复对话和赠送礼物，与至少两个角色建立深度信任关系（信任度 > 60）。',
      progress: 0,
      completed: false,
    },
    {
      id: 'secret',
      title: '揭开秘密',
      condition: '通过收集线索、触发关键事件，逐步发现隐藏在这个世界背后的真相。',
      progress: 0,
      completed: false,
    },
  ],
}
```

### 6.2 config/characters.ts

```typescript
export const CHARACTERS: Record<string, Character> = {
  alpha: {
    id: 'alpha',
    name: 'Alpha',
    avatar: 'α',
    title: '领航者',
    themeColor: '#6366f1',
    description: '团队中沉稳可靠的领导者。',
    initialStats: { 信任: 20, 默契: 0 },
  },
  beta: {
    id: 'beta',
    name: 'Beta',
    avatar: 'β',
    title: '策略师',
    themeColor: '#8b5cf6',
    description: '擅长分析和规划的战略家。',
    initialStats: { 信任: 15, 默契: 0 },
  },
  gamma: {
    id: 'gamma',
    name: 'Gamma',
    avatar: 'γ',
    title: '执行者',
    themeColor: '#a78bfa',
    description: '行动派，说干就干。',
    initialStats: { 信任: 25, 默契: 0 },
    locked: true,               // ← 初始锁定，剧情中解锁
  },
  delta: {
    id: 'delta',
    name: 'Delta',
    avatar: 'δ',
    title: '观察者',
    themeColor: '#c4b5fd',
    description: '沉默寡言但洞察力惊人。',
    initialStats: { 信任: 10, 默契: 0 },
    locked: true,
  },
}
```

### 6.3 config/scenes.ts

```typescript
export const SCENES: Record<string, Scene> = {
  'main-hall': {
    id: 'main-hall',
    name: '大厅',
    icon: '🏛️',
    description: '宽敞的公共区域。',
    background: '/scenes/main-hall.jpg',
    characters: ['alpha', 'beta'],
  },
  courtyard: {
    id: 'courtyard',
    name: '庭院',
    icon: '🌿',
    description: '安静的户外空间。',
    background: '/scenes/courtyard.jpg',
    characters: ['alpha', 'gamma'],
  },
  library: {
    id: 'library',
    name: '书房',
    icon: '📚',
    description: '堆满书籍的房间。',
    background: '/scenes/library.jpg',
    characters: ['beta', 'delta'],
  },
}
```

### 6.4 config/items.ts

```typescript
export const ITEMS: Record<string, GameItem> = {
  gift: {
    id: 'gift',
    name: '礼物',
    icon: '🎁',
    type: 'item',
    description: '一份精心准备的礼物。',
    effects: {
      alpha: { 信任: 10, 默契: 5 },
      beta: { 信任: 5, 默契: 10 },
    },
  },
}
```

### 6.5 config/prompt.ts

```typescript
export function buildSystemPrompt(state, char): string {
  // 从 GAME_INFO / CHARACTERS / SCENES 动态构建
  // 包含结构化标记使用说明
  // 用户可完全重写
}
```

---

## 七、默认暗色主题 (Indigo)

### config/theme.css

```css
:root {
  --primary: #6366f1;
  --primary-light: rgba(99, 102, 241, 0.1);
  --primary-border: rgba(99, 102, 241, 0.2);
  --accent: #a78bfa;
  --gradient: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
  --bg-primary: #1a1a1a;
  --bg-secondary: #0f0f0f;
  --bg-card: #242424;
  --bg-hover: rgba(99, 102, 241, 0.08);
  --bg-active: rgba(99, 102, 241, 0.12);
  --bg-overlay: rgba(0, 0, 0, 0.7);
  --bg-start-from: #0f0f23;
  --bg-start-via: #1a1a2e;
  --bg-start-to: #16213e;
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --text-muted: #666;
  --border: rgba(255, 255, 255, 0.08);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.4);
  --font: -apple-system, 'Noto Sans SC', sans-serif;
}
```

---

## 八、实施步骤

### Step 1: 项目脚手架
- [x] 创建 `00list-chuangzhao/` 目录
- [ ] 从 03 复制 package.json / vite.config.ts / tsconfig 三件套
- [ ] 创建 index.html（通用 meta，🎮 favicon，无 Umami）
- [ ] 复制 wrangler.toml + worker/index.js
- [ ] 创建 public/ 目录结构
- [ ] 复制 src/main.tsx

### Step 2: config/ 配置层
- [ ] config/theme.css — 暗色 Indigo 变量
- [ ] config/game.ts — GameInfo（含时段/属性/目标）
- [ ] config/characters.ts — Character 接口 + 4 个中性角色（2 锁定）
- [ ] config/scenes.ts — Scene 接口 + 3 个通用场景
- [ ] config/items.ts — GameItem 接口 + 示例物品
- [ ] config/prompt.ts — 通用 buildSystemPrompt（含结构化标记说明）

### Step 3: lib/ 核心逻辑
- [ ] 复制零改文件：stream.ts / bgm.ts / hooks.ts
- [ ] 改造 analytics.ts — `xd_` → `gx_`
- [ ] **重构 parser.ts** — 新增 parseStructuredMarkers()，统一解析所有 【】 标记
- [ ] 改造 highlight.ts — prompt 从 GAME_INFO 读取
- [ ] **重构 store.ts** — 数据外迁 + 新增 playerStats/goals/events/actions/round + parseStructuredMarkers 集成

### Step 4: styles/globals.css
- [ ] 从 03 复制 → `hb-` → `gx-` 全局替换
- [ ] 浅色 → 暗色，硬编码 → CSS 变量
- [ ] 新增样式：目标区域 / 事件区域 / 玩家属性 / 行动选项 / 重大事件弹窗

### Step 5: App.tsx 通用化
- [ ] 硬编码文案 → GAME_INFO
- [ ] `hb-` → `gx-`，颜色 → CSS 变量
- [ ] StartScreen 展示目标预览

### Step 6: components/game/ 组件
- [ ] dialogue-panel.tsx — `hb-` → `gx-`，新增 ActionOptions
- [ ] character-panel.tsx — `hb-` → `gx-`，新增 PlayerStatsPanel + 角色锁定
- [ ] side-panel.tsx — 重写为三区域面板（目标/事件/资产）
- [ ] mobile-layout.tsx — `hb-` → `gx-`，新增 GoalsSheet / EventsSheet
- [ ] highlight-modal.tsx — `hb-` → `gx-`
- [ ] **新建 event-modal.tsx** — 重大事件弹窗

### Step 7: Build 验证
```bash
npm install && npm run build
```

### Step 8: GEB 文档系统
- [ ] L1: /CLAUDE.md
- [ ] L2: config/ / lib/ / styles/ / components/game/
- [ ] L3: 所有 .ts/.tsx 文件头部 INPUT/OUTPUT/POS

### Step 9: Git + 推送
```bash
git add -A && git commit -m "WIP(claude): 通用游戏 UI 模板初始化"
gh repo create yooho-AI/00list-chuangzhao --public --source=.
git push -u origin main
```

---

## 九、风险点与决策

### 9.1 两套属性系统的清晰度

**风险**：playerStats（玩家自身）和 characterStats（与角色关系）可能让用户/AI 混淆
**决策**：prompt 中明确区分。左栏只显示 playerStats，角色面板显示 characterStats。AI 标记也不同：`【属性变化：忠诚 -5】` vs `【好感变化：苏晚棠 好感 +10】`

### 9.2 结构化标记的可靠性

**风险**：AI 不一定总按格式输出 `【目标更新：xxx +20%】`
**决策**：parser 做容错匹配（正则宽松），prompt 中用 few-shot 示例强化。标记解析失败时静默忽略，不影响主流程。

### 9.3 side-panel 从 133 行 → 预估 300+ 行

**风险**：右栏复杂度大增
**决策**：三个 Section 各自独立，内部简单。GoalsSection / EventsSection / AssetsSection 可以是同一文件内的三个子组件。如果超 400 行再考虑拆分。

### 9.4 mobile 端面板数量增加

**风险**：底部 Sheet 从 3 个增至 5 个（角色/目标/事件/资产/菜单），导航混乱
**决策**：底部图标栏最多 5 个：💬对话 / 👥角色 / 📋目标+事件（合并为一个 Sheet，内部 tab 切换）/ 🎒资产 / ☰菜单

### 9.5 parser.ts 复杂度

**风险**：从 139 行 → 预估 250+ 行
**决策**：每种标记用独立正则，parseStructuredMarkers() 内部是 6 个平行的 parse 函数调用，不嵌套。

---

## 十、验证清单

- [ ] `npm run build` TypeScript 零报错 + Vite 构建成功
- [ ] PC 三栏布局：左（角色+属性）+ 中（对话+选项）+ 右（目标+事件+资产）
- [ ] 移动端 (<768px)：自动切换单栏 + BottomSheet
- [ ] StartScreen 从 config 读取标题/目标/角色
- [ ] 修改 config/theme.css → 主题色立即生效
- [ ] 角色选择正常，锁定角色显示"？"
- [ ] 玩家属性面板显示正常，+/- 变化有动画
- [ ] 目标进度条正常更新
- [ ] 关键事件时间线正常累积
- [ ] 重大事件弹窗正常弹出/关闭
- [ ] 行动选项正常显示，点击即发送
- [ ] 资产面板正常展示物品
- [ ] SSE 流式对话正常
- [ ] 存档/读档/重置正常（含新字段）
- [ ] GEB 文档完整（L1/L2/L3）
