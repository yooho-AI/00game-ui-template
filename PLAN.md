# 00list-chuangzhao — 技术实施方案

> 产品文档见 PRODUCT.md，本文档是与之对齐的工程实现方案。

## 一、架构总览

```
┌─────────────────────────────────────────────────────────┐
│                       用户                               │
│                        │                                 │
│              ┌─────────▼──────────┐                     │
│              │  Phase 1            │                     │
│              │  创造终端 → 加载 → 预览│                     │
│              │  (Gemini Flash 生成) │                     │
│              └─────────┬──────────┘                     │
│                        │ WorldConfig JSON                │
│              ┌─────────▼──────────┐                     │
│              │  Phase 0            │                     │
│              │  通用游戏 UI 模板    │                     │
│              │  (config/ 驱动)     │                     │
│              └─────────┬──────────┘                     │
│                        │                                 │
│              ┌─────────▼──────────┐                     │
│              │  对话引擎           │                     │
│              │  SSE → AI API 代理  │                     │
│              │  (Cloudflare Worker)│                     │
│              └────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

**WorldConfig 是核心枢纽**：Phase 1 生成它，Phase 0 消费它，分享系统传输它。

---

## 二、数据接口设计

> 所有接口与 PRODUCT.md 三、功能数据规格完全对齐。

### 2.1 WorldConfig — AI 生成的完整世界配置

```typescript
// 这是连接 Phase 1（生成）和 Phase 0（运行）的核心数据结构
// Phase 1: Gemini Flash 输出此结构
// Phase 0: 游戏模板消费此结构
// 分享系统: 此结构压缩编码到 URL

export interface WorldConfig {
  // 基本信息
  title: string                          // "暗夜谍影"
  genre: string                          // "谍战悬疑"
  description: string                    // 开场白/世界描述
  icon: string                           // emoji
  narrativeStyle: string                 // AI 叙事风格描述

  // 主题配色
  themeColors: ThemeColors

  // 游戏机制
  maxDays: number
  maxActionPoints: number
  periods: TimePeriod[]

  // 角色
  characters: Character[]

  // 场景
  scenes: Scene[]

  // 目标
  goals: Goal[]

  // 玩家属性
  playerStats: StatConfig[]
  initialPlayerStats: Record<string, number>

  // 角色关系属性
  characterStats: StatConfig[]

  // 初始物品（可选）
  items?: GameItem[]
}

export interface ThemeColors {
  primary: string                        // 主色 "#6366f1"
  primaryLight: string                   // 主色浅 "rgba(99,102,241,0.1)"
  accent: string                         // 强调色
  bgPrimary: string                      // 主背景
  bgSecondary: string                    // 次背景
  bgCard: string                         // 卡片背景
  textPrimary: string                    // 主文字
  textSecondary: string                  // 次文字
}
```

### 2.2 Character — 角色/NPC

```typescript
export interface Character {
  id: string
  name: string
  avatar: string                         // emoji 或单字
  title: string                          // 身份标签
  themeColor: string
  description: string
  image?: string                         // 静态立绘路径
  video?: string                         // 动态视频路径
  initialStats: Record<string, number>   // 与玩家的关系属性
  locked?: boolean                       // 是否初始锁定
}
```

### 2.3 Scene — 场景

```typescript
export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string                     // 背景图路径（AI 生成时为渐变色值）
  backgroundVideo?: string
  characters?: string[]                  // 关联角色 ID
}
```

### 2.4 Goal — 目标

```typescript
export interface Goal {
  id: string
  title: string                          // "获取密电码"
  condition: string                      // "通过与苏晚棠建立信任，获取保险箱位置..."
  progress: number                       // 0-100
  completed: boolean
}
```

### 2.5 KeyEvent — 关键事件

```typescript
export interface KeyEvent {
  id: string
  title: string
  description: string
  round: number
  tags?: string[]                        // ["剧情"] / ["战斗"] / ["发现"]
  major: boolean                         // 是否为重大事件（触发弹窗）
}
```

### 2.6 GameItem — 物品/资产

```typescript
export interface GameItem {
  id: string
  name: string
  icon: string
  type: string
  description: string
  effects?: Record<string, Record<string, number>>
  consumable?: boolean
}
```

### 2.7 StatConfig — 数值配置

```typescript
export interface StatConfig {
  name: string                           // "忠诚"
  aliases: string[]                      // ["忠诚度","忠诚值"]
  color: string
  icon?: string                          // emoji
  dailyDecay?: number
}
```

### 2.8 TimePeriod — 时段

```typescript
export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}
```

---

## 三、Phase 0 — 通用游戏 UI 模板

> 基于 03 xindong 提取，config/ 驱动，暗色 Indigo 默认主题。

### 3.1 基础项目分析（03 xindong）

| 文件 | 行数 | 改造级别 | 说明 |
|------|------|----------|------|
| `stream.ts` | 133 | ⬜ 零改 | 纯 SSE 通信 |
| `bgm.ts` | 77 | ⬜ 零改 | 音频单例 |
| `hooks.ts` | 39 | ⬜ 零改 | 响应式 hook |
| `vite.config.ts` | 8 | ⬜ 零改 | react + tailwind + @ 别名 |
| `worker/index.js` | 50 | ⬜ 零改 | Cloudflare API 代理 |
| `tsconfig*.json` | 3件套 | ⬜ 零改 | 标准配置 |
| `analytics.ts` | 44 | 🟡 微改 | `xd_` → `gx_` |
| `index.html` | 30 | 🟡 微改 | 通用 meta，去 Umami |
| `package.json` | 30 | 🟡 微改 | 改 name |
| `wrangler.toml` | 5 | 🟡 微改 | 改 Worker name |
| `highlight.ts` | 218 | 🟠 中改 | prompt 从 config 读取 |
| `parser.ts` | 139 | 🔴 重构 | 扩展为全标记解析器 |
| `App.tsx` | 284 | 🔴 重构 | 多页面状态机 + config 驱动 |
| `globals.css` | 1050 | 🔴 重构 | `hb-` → `gx-`，暗色化，新增面板样式 |
| `store.ts` | 888 | 🔴 重构 | 数据外迁 + 新增 goals/events/playerStats |
| `dialogue-panel.tsx` | 307 | 🟠 中改 | 新增行动选项 |
| `character-panel.tsx` | 155 | 🔴 重构 | 新增玩家属性 + 角色锁定 |
| `side-panel.tsx` | 133 | 🔴 重构 | 目标/事件/资产三区域 |
| `mobile-layout.tsx` | 566 | 🟠 中改 | 新增目标/事件 Sheet |
| `highlight-modal.tsx` | 276 | 🟡 微改 | CSS 变量化 |
| **新增** `event-modal.tsx` | ~80 | 🆕 | 重大事件弹窗 |

### 3.2 store.ts 重构

**新增 state 字段**：

```typescript
interface GameStore {
  // 现有字段（通用化）
  characterStats: Record<string, Record<string, number>>
  messages: Message[]
  currentDay: number
  currentPeriod: number
  currentScene: string
  currentCharacter: string | null
  actionPoints: number
  inventory: string[]
  isStreaming: boolean

  // 新增字段
  playerStats: Record<string, number>
  goals: Goal[]
  keyEvents: KeyEvent[]
  currentActions: string[]
  round: number
  unlockedCharacters: Set<string>
  pendingMajorEvent: KeyEvent | null
  showEventModal: boolean

  // 新增 actions
  updatePlayerStat: (stat: string, delta: number) => void
  updateGoal: (goalId: string, progress: number) => void
  addKeyEvent: (event: KeyEvent) => void
  unlockCharacter: (charId: string) => void
  setCurrentActions: (actions: string[]) => void
  incrementRound: () => void
  dismissEventModal: () => void
}
```

**数据外迁**：store.ts 从 888 行 → ~500 行。CHARACTERS / SCENES / ITEMS / PERIODS / STORY_INFO / buildSystemPrompt 全部迁至 config/。

### 3.3 parser.ts — 全标记解析器

```typescript
export interface ParsedMarkers {
  playerStatChanges: Array<{ stat: string; delta: number }>
  charStatChanges: Array<{ charId: string; stat: string; delta: number }>
  goalUpdates: Array<{ title: string; delta: number }>
  newEvents: Array<{ title: string; description: string; major: boolean }>
  unlockedCharacters: string[]
  newItems: Array<{ name: string; icon: string; description: string }>
  actionOptions: string[]
}

// 7 种标记，7 个独立正则，平行解析不嵌套
export function parseStructuredMarkers(content: string): ParsedMarkers
```

**与 PRODUCT.md 四、AI 结构化标记汇总 完全对齐**：
| 标记 | 正则匹配 |
|------|---------|
| `【属性名 +/-N】` | `/【(.+?)\s*([+-]\d+)(?:[，,]\s*(.+?)\s*([+-]\d+))*】/g` |
| `【目标更新：标题 +N%】` | `/【目标更新[：:](.+?)\s*\+(\d+)%】/g` |
| `【关键事件：标题】描述` | `/【关键事件[：:](.+?)】(.+?)(?=【\|$)/gs` |
| `【重大事件：标题】描述` | `/【重大事件[：:](.+?)】(.+?)(?=【\|$)/gs` |
| `【解锁角色：名字】` | `/【解锁角色[：:](.+?)】/g` |
| `【获得物品：名字 · 描述】` | `/【获得物品[：:](.+?)[·](.+?)】/g` |
| `【行动选项】1. A 2. B` | `/【行动选项】([\s\S]+?)(?=【\|$)/g` |

### 3.4 组件改造

**character-panel.tsx（左栏）**：保留 SceneCard + PortraitCard + CharacterList，新增角色锁定状态 + PlayerStatsPanel。

**side-panel.tsx（右栏）**：完全重写为三区域——GoalsSection（目标+条件+进度条）/ EventsSection（时间线，新上旧下，📋普通/🚨重大）/ AssetsSection（物品卡片）。

**dialogue-panel.tsx（中栏）**：新增 ActionOptions 组件（输入框上方，3-4 按钮，可折叠）。

**event-modal.tsx（新增）**：重大事件弹窗，全屏遮罩 + 居中卡片（标签/回合/标题/描述/确认按钮），关闭后记录到右栏。

**mobile-layout.tsx**：新增 GoalsSheet + EventsSheet（或合并为一个 Sheet 内部 tab），底部导航 5 图标。

### 3.5 App.tsx 状态机

```
Phase 0 (静态 config):
  StartScreen → GameScreen

Phase 1 (AI 生成):
  CreationScreen → LoadingScreen → PreviewScreen → GameScreen
       ↑                                  │
       └──────── 重新生成 ────────────────┘

分享链接进入:
  URL 解码 WorldConfig → PreviewScreen → GameScreen
```

App.tsx 用一个 `appPhase` 状态管理页面切换：
```typescript
type AppPhase = 'creation' | 'loading' | 'preview' | 'game'
```

### 3.6 globals.css

`hb-` → `gx-`（93 处），浅色 → 暗色，硬编码 → CSS 变量。新增样式：`.gx-goals-section` / `.gx-event-item` / `.gx-event-tag` / `.gx-player-stats` / `.gx-stat-bar` / `.gx-stat-delta` / `.gx-action-options` / `.gx-action-btn` / `.gx-event-modal`。

### 3.7 默认暗色主题 (Indigo)

```css
:root {
  --primary: #6366f1;
  --primary-light: rgba(99, 102, 241, 0.1);
  --accent: #a78bfa;
  --bg-primary: #1a1a1a;
  --bg-secondary: #0f0f0f;
  --bg-card: #242424;
  --bg-overlay: rgba(0, 0, 0, 0.7);
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --text-muted: #666;
  --border: rgba(255, 255, 255, 0.08);
  --font: -apple-system, 'Noto Sans SC', sans-serif;
}
```

---

## 四、Phase 1 — AI 世界生成器

### 4.1 生成模型

**Gemini 2.0 Flash**（gemini-2.0-flash / gemini-3-flash-preview）

- 输出速度：150-300 tokens/s
- WorldConfig 约 1700 tokens → **8-12 秒**
- 使用 JSON mode（`response_mime_type: "application/json"`）保证输出合法 JSON
- 一次 API 调用，不拆分

### 4.2 生成流程

```
用户输入 prompt (1-2000字)
          ↓
构造 system prompt（含 WorldConfig JSON Schema + 示例）
          ↓
调用 Gemini Flash API
  ├── model: gemini-2.0-flash
  ├── response_mime_type: "application/json"
  ├── response_schema: WorldConfigSchema    // 可选，强制约束
  └── temperature: 1.0                      // 创意任务，温度高一点
          ↓
解析 JSON → WorldConfig 对象
          ↓
验证必要字段（title/characters/scenes/goals 非空）
          ↓
失败 → 重试一次（换 seed）
成功 → 注入到游戏模板，进入 PreviewScreen
```

### 4.3 生成 Prompt 设计

```
你是一个游戏世界设计师。根据用户的描述，生成一个完整的文字冒险游戏世界配置。

用户描述：{userPrompt}

请生成一个 JSON 对象，包含以下字段：
- title: 游戏名称（2-6个字，有吸引力）
- genre: 类型标签（2-4个字）
- description: 世界观开场白（50-150字，有文学性）
- icon: 一个代表游戏氛围的 emoji
- narrativeStyle: AI 叙事风格描述（30-50字）
- themeColors: 主题配色（根据游戏氛围选色）
- characters: 3-5个角色（部分 locked=true，剧情中解锁）
- scenes: 3-5个场景
- goals: 3个目标（含 condition 达成条件描述）
- playerStats: 3-6个玩家属性维度（根据游戏类型选择）
- initialPlayerStats: 各属性初始值
- characterStats: 角色关系属性维度
- periods: 时段列表
- items: 0-3个初始物品（可选）
- maxDays: 游戏天数
- maxActionPoints: 每日行动力

{具体的 JSON Schema 定义}

{一个完整的示例 WorldConfig}
```

### 4.4 API 代理

复用现有 Cloudflare Worker（worker/index.js），新增一个路径 `/api/generate` 代理到 Gemini API：

```javascript
// worker/index.js 新增
if (path === '/api/generate') {
  // 转发到 Gemini API
  // https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
}
```

### 4.5 前端加载动画

进度条是**模拟的**（Gemini 不返回实际进度），用定时器推进：

```typescript
const stages = [
  { text: '正在分析剧本…', target: 15 },
  { text: '正在构思世界观…', target: 30 },
  { text: '正在创造角色…', target: 55 },
  { text: '正在布置场景…', target: 72 },
  { text: '正在规划目标…', target: 88 },
  { text: '正在调配色彩…', target: 95 },
]
// API 返回后直接跳到 100%
```

---

## 五、Phase 1 — 创造流 UI 组件

### 5.1 creation-terminal.tsx（F1 创造终端）

```
全屏暗色背景 + 中央输入区域

├── 标题："用一句话，描述你想玩的游戏"
├── textarea（柔光边框，max 2000 字，右下角字数统计）
├── 灵感提示轮播（3-5 条，点击填入输入框）
└── "创造世界" 按钮（primary 渐变色）
```

### 5.2 loading-screen.tsx（F2 世界生成加载）

```
全屏暗色背景 + 中央进度区

├── 阶段文字（6 个阶段，淡入淡出切换）
├── 进度条（0-100%，定时器模拟 + API 返回时跳满）
└── 微妙氛围效果（粒子/渐变动画，不喧宾夺主）
```

### 5.3 world-preview.tsx（F3 世界预览）

```
世界卡片（居中，max-width 720px）

├── 游戏标题 + 类型标签 + emoji
├── 世界描述文字
├── 角色卡片横排（亮色=可用，灰色"？"=锁定）
├── 场景列表（icon + 名称）
├── 目标列表（标题 + 达成条件）
├── 玩家属性预览（名称 + 初始值）
├── 主题色预览
└── 两个按钮："开始游戏" / "重新生成"
```

---

## 六、分享系统技术方案

### 6.1 编码

```typescript
import pako from 'pako'

function encodeWorldConfig(config: WorldConfig): string {
  const json = JSON.stringify(config)
  const compressed = pako.gzip(json)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(compressed)))
  return base64
}

// URL: https://xxx.pages.dev?w={base64}
```

### 6.2 解码（页面加载时）

```typescript
function decodeWorldConfig(base64: string): WorldConfig {
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const json = pako.ungzip(binary, { to: 'string' })
  return JSON.parse(json)
}
```

### 6.3 流程

```
URL 有 ?w= 参数？
  ├── 是 → 解码 WorldConfig → 直接跳到 PreviewScreen
  └── 否 → URL 有存档？
              ├── 是 → 弹窗"继续上次冒险？"
              └── 否 → CreationScreen
```

### 6.4 大小预估

WorldConfig JSON 原始约 3-5KB → gzip 后约 1-2KB → Base64 后约 1.5-3KB → URL 长度安全范围内（浏览器 URL 限制通常 2KB-8KB）。

如果超限，备用方案：用 `lz-string` 替代 pako（更适合短文本压缩）。

---

## 七、目录结构

```
00list-chuangzhao/
├── CLAUDE.md
├── index.html
├── package.json                       # + pako 依赖
├── vite.config.ts
├── tsconfig.json / .app / .node
├── wrangler.toml
├── worker/
│   └── index.js                       # + /api/generate 路径
├── public/
│   ├── audio/bgm.mp3
│   ├── characters/
│   └── scenes/
└── src/
    ├── main.tsx
    ├── App.tsx                        # 多页面状态机
    │
    ├── config/                        # ← Phase 0: 静态配置（被 AI 生成的 WorldConfig 替代时可不用）
    │   ├── theme.css
    │   ├── game.ts
    │   ├── characters.ts
    │   ├── scenes.ts
    │   ├── items.ts
    │   └── prompt.ts                  # buildSystemPrompt()
    │
    ├── styles/
    │   └── globals.css
    │
    ├── lib/
    │   ├── store.ts                   # Zustand（含全部游戏状态）
    │   ├── stream.ts                  # SSE 封装
    │   ├── parser.ts                  # 全标记解析器
    │   ├── generator.ts               # Phase 1: AI 世界生成器（调 Gemini）
    │   ├── share.ts                   # 分享编码/解码
    │   ├── highlight.ts               # 高光 API
    │   ├── bgm.ts                     # BGM 单例
    │   ├── hooks.ts                   # useIsMobile
    │   └── analytics.ts               # gx_ 前缀
    │
    └── components/
        ├── creation/                  # Phase 1: 创造流
        │   ├── creation-terminal.tsx  # F1 输入框+灵感提示
        │   ├── loading-screen.tsx     # F2 进度条+阶段文字
        │   └── world-preview.tsx      # F3 世界预览卡片
        │
        └── game/                      # Phase 0: 游戏界面
            ├── dialogue-panel.tsx     # 中栏：对话+行动选项
            ├── character-panel.tsx    # 左栏：场景+角色+玩家属性
            ├── side-panel.tsx         # 右栏：目标+事件+资产
            ├── mobile-layout.tsx      # 移动端布局
            ├── highlight-modal.tsx    # 高光弹窗
            └── event-modal.tsx        # 重大事件弹窗
```

---

## 八、实施步骤

### Phase 0: 游戏 UI 模板

**Step 1: 项目脚手架**
- [x] 创建 `00list-chuangzhao/` 目录
- [ ] 从 03 复制 package.json / vite.config.ts / tsconfig 三件套
- [ ] 创建 index.html（通用 meta，🎮 favicon，无 Umami）
- [ ] 复制 wrangler.toml + worker/index.js
- [ ] 创建 public/ 目录结构 + src/main.tsx

**Step 2: config/ 配置层**
- [ ] config/theme.css — 暗色 Indigo 变量
- [ ] config/game.ts — GameInfo + TimePeriod + StatConfig + Goal 接口定义 + 示例数据
- [ ] config/characters.ts — Character 接口 + 4 个中性角色（2 锁定）
- [ ] config/scenes.ts — Scene 接口 + 3 个通用场景
- [ ] config/items.ts — GameItem 接口 + 示例物品
- [ ] config/prompt.ts — buildSystemPrompt()（含 7 种结构化标记使用说明）

**Step 3: lib/ 核心逻辑**
- [ ] 零改复制：stream.ts / bgm.ts / hooks.ts
- [ ] 改造 analytics.ts — `xd_` → `gx_`
- [ ] 重构 parser.ts — parseStructuredMarkers() 7 种标记解析
- [ ] 改造 highlight.ts — prompt 从 config 读取
- [ ] 重构 store.ts — 数据外迁 + playerStats/goals/keyEvents/currentActions/round/unlockedCharacters/pendingMajorEvent

**Step 4: styles/globals.css**
- [ ] `hb-` → `gx-` 全局替换
- [ ] 浅色 → 暗色，硬编码 → CSS 变量
- [ ] 新增：目标/事件/玩家属性/行动选项/重大事件弹窗 样式

**Step 5: App.tsx + 组件**
- [ ] App.tsx — 多页面状态机 + config 驱动
- [ ] dialogue-panel.tsx — 新增 ActionOptions
- [ ] character-panel.tsx — 新增 PlayerStatsPanel + 角色锁定
- [ ] side-panel.tsx — 重写为目标/事件/资产三区域
- [ ] mobile-layout.tsx — 新增 GoalsSheet / EventsSheet
- [ ] event-modal.tsx — 新建重大事件弹窗
- [ ] highlight-modal.tsx — CSS 变量化

**Step 6: Build 验证**
- [ ] `npm install && npm run build` — 零报错

**Step 7: GEB 文档**
- [ ] L1/L2/L3 完整

### Phase 1: AI 世界生成器 + 创造流

**Step 8: 生成器核心**
- [ ] lib/generator.ts — Gemini Flash API 调用，JSON mode，WorldConfig 解析+验证
- [ ] worker/index.js — 新增 `/api/generate` 路由代理到 Gemini API
- [ ] 生成 Prompt 设计 + 调优（含 WorldConfig Schema + 示例）

**Step 9: 创造流 UI**
- [ ] components/creation/creation-terminal.tsx — F1 输入框+灵感提示
- [ ] components/creation/loading-screen.tsx — F2 进度条+模拟阶段
- [ ] components/creation/world-preview.tsx — F3 预览卡片

**Step 10: 分享系统**
- [ ] lib/share.ts — WorldConfig 编码/解码（pako gzip + Base64）
- [ ] App.tsx — URL 参数检测，有 `?w=` 则跳转 PreviewScreen

**Step 11: 集成 + 联调**
- [ ] App.tsx 状态机：creation → loading → preview → game
- [ ] WorldConfig 动态注入 store（替代静态 config/）
- [ ] 端到端测试：输入→生成→预览→游玩→存档→分享→朋友打开

### Git 提交

```bash
# Phase 0 完成后
git add -A && git commit -m "WIP(claude): Phase 0 — 通用游戏 UI 模板"

# Phase 1 完成后
git add -A && git commit -m "WIP(claude): Phase 1 — AI 世界生成器 + 创造流"
```

---

## 九、风险点与决策

### 9.1 两套属性系统混淆
**风险**：playerStats vs characterStats
**决策**：prompt 中明确区分，左栏只显示 playerStats，角色面板显示 characterStats

### 9.2 结构化标记可靠性
**风险**：AI 不总按格式输出
**决策**：正则宽松容错，prompt 用 few-shot 强化，解析失败静默忽略

### 9.3 Gemini JSON 格式稳定性
**风险**：Flash 级模型偶尔输出非法 JSON
**决策**：使用 JSON mode（`response_mime_type`），前端 `try/catch` + 重试一次

### 9.4 WorldConfig URL 编码大小
**风险**：压缩后可能超 URL 长度限制
**决策**：gzip + Base64 预估 1.5-3KB，在安全范围。超限时备用 lz-string

### 9.5 side-panel 复杂度
**风险**：133 行 → 300+ 行
**决策**：三个 Section 内聚独立，超 400 行再考虑拆文件

### 9.6 mobile 面板数量
**风险**：底部 Sheet 从 3 增至 5
**决策**：目标+事件合并为一个 Sheet（内部 tab），保持 5 个导航图标

---

## 十、验证清单

### Phase 0
- [ ] `npm run build` 零报错
- [ ] PC 三栏：左（场景+角色+属性）+ 中（对话+选项）+ 右（目标+事件+资产）
- [ ] 移动端 (<768px) 自动切换 + BottomSheet
- [ ] 角色锁定（显示"？"）+ 解锁动画
- [ ] 玩家属性 +/- 变化动画
- [ ] 目标进度条更新（含达成条件展示）
- [ ] 关键事件时间线累积（新上旧下）
- [ ] 重大事件弹窗弹出/关闭
- [ ] 行动选项显示/点击/折叠
- [ ] 资产面板物品卡片
- [ ] 存档/读档（含全部新字段）
- [ ] 修改 theme.css → 主题色立即生效

### Phase 1
- [ ] 创造终端输入 + 灵感提示
- [ ] 加载动画 6 阶段 + 进度条
- [ ] Gemini Flash 生成 WorldConfig（< 15 秒）
- [ ] 世界预览展示全部配置
- [ ] "重新生成"保留原始输入
- [ ] 生成 → 预览 → 游玩完整链路
- [ ] 分享链接编码/解码正常
- [ ] 朋友打开链接 → 直接进预览页
