# 创造 (chuangzhao)

> L1 | AI 驱动的文字冒险游戏引擎 — "一句话，一个世界"
> React 19 + Zustand + Immer + Framer Motion + Tailwind CSS v4 + Vite 7 + lz-string

Phase 0 通用游戏骨架：config 驱动的暗色三栏布局 + 移动端自适应。
Phase 1 AI 创造流：用户一句话 → Gemini 生成 WorldConfig → 预览确认 → 动态注入 → 游戏启动。

## 目录结构

```
00list-chuangzhao/
├── index.html           - SPA 入口（🎮 favicon，无 Umami）
├── package.json         - 依赖声明（react/zustand/framer-motion/tailwind/lz-string）
├── vite.config.ts       - Vite 配置（react + tailwindcss + @ 别名）
├── wrangler.toml        - Cloudflare Worker 配置（chuangzhao-api）
├── worker/              - API 代理 (1 文件)
│   └── index.js         - Cloudflare Worker，转发到 shubiaobiao API
├── public/              - 静态资源
│   ├── audio/           - BGM 音频（占位）
│   ├── characters/      - 角色立绘
│   └── scenes/          - 场景背景
└── src/                 - 源码 (5 子目录)
    ├── main.tsx         - React 挂载入口
    ├── App.tsx          - 根组件：creation → loading → preview → game 四阶段状态机
    ├── config/          - 游戏配置层 (6 文件: game/characters/scenes/items/prompt/theme.css)
    ├── styles/          - 样式 (1 文件: globals.css)
    ├── lib/             - 核心逻辑 (9 文件: store/stream/parser/generator/share/bgm/hooks/highlight/analytics)
    ├── components/creation/ - 创造流 UI (3 文件: terminal/loading/preview)
    └── components/game/ - 游戏 UI (6 文件: dialogue/character/side/mobile/highlight/event-modal)
```

## 架构核心

```
Phase 1 创造流（四阶段状态机）:
  creation: 用户输入一句话描述
  → loading: 调用 Gemini 生成 WorldConfig（模拟进度条）
  → preview: 世界预览卡片（确认/重新生成/分享）
  → game: 注入 WorldConfig + 主题色 → 游戏运行

动态配置注入:
  store._worldConfig: WorldConfig | null
  cfg() 闭包: 动态 WorldConfig ?? 静态 config/ fallback
  applyThemeColors(): WorldConfig.themeColors → CSS 变量覆盖 :root

分享系统:
  WorldConfig → lz-string 压缩 → ?w= URL 参数 → 接收方直接进入 preview

静态配置层（Phase 0 fallback）:
  src/config/
  ├── theme.css        → CSS 变量覆盖主题色
  ├── game.ts          → WorldConfig 接口 + GAME_INFO 常量
  ├── characters.ts    → 角色数据（Character[]）
  ├── scenes.ts        → 场景数据（Scene[]）
  ├── items.ts         → 物品数据（GameItem[]）
  └── prompt.ts        → AI 指令 + 时段/属性/目标配置
```

## 数据流

```
创造流:
  用户一句话 → generator.ts chat() → Gemini 生成 JSON
  → extractJson() + validate() + normalize() → WorldConfig
  → store.loadWorldConfig() + applyThemeColors() → initGame()

游戏流:
  用户输入 → store.sendMessage()
  → stream.ts SSE 流式请求 → api.yooho.ai
  → onChunk 实时更新 streamingContent
  → 完成后 parseStructuredMarkers() 解析 7 种标记
    ├── 属性变化 【属性名 ±N】
    ├── 目标更新 【目标更新：标题 +N%】
    ├── 关键事件 【关键事件：标题】描述
    ├── 重大事件 【重大事件：标题】描述 → 弹窗
    ├── 解锁角色 【解锁角色：名字】
    ├── 获得物品 【获得物品：名字·描述】
    └── 行动选项 【行动选项】1. xxx 2. xxx
  → 更新 playerStats/goals/keyEvents/inventory/unlockedCharacters
  → 消息 > 15 条时自动压缩历史上下文

存档系统:
  v2 格式，包含 worldConfig 字段
  resetGame() → gameStarted=false → 状态机回退到 creation
```

## 视觉系统

```
默认:     暗色 Indigo 游戏主题（CSS 变量）
动态:     WorldConfig.themeColors 覆盖 :root CSS 变量
外壳背景: #0f0f0f / 卡片: #242424
文字:     主 #f5f5f5 / 次 #a3a3a3 / 淡 #666
强调色:   #6366f1 (Indigo) / 辅助: #a78bfa (紫)
CSS 前缀: gx- (game-x)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
