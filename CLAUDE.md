# 创造 (chuangzhao)

> L1 | 通用游戏 UI 模板 — "一句话，一个世界"
> React 19 + Zustand + Immer + Framer Motion + Tailwind CSS v4 + Vite 7

Phase 0 通用游戏骨架：config 驱动的暗色三栏布局 + 移动端自适应。
Phase 1（规划中）将接入 Gemini 2.0 Flash 生成 WorldConfig，实现一句话创建游戏世界。

## 目录结构

```
00list-chuangzhao/
├── index.html           - SPA 入口（🎮 favicon，无 Umami）
├── package.json         - 依赖声明（react/zustand/framer-motion/tailwind）
├── vite.config.ts       - Vite 配置（react + tailwindcss + @ 别名）
├── wrangler.toml        - Cloudflare Worker 配置（chuangzhao-api）
├── worker/              - API 代理 (1 文件)
│   └── index.js         - Cloudflare Worker，转发到 shubiaobiao API
├── public/              - 静态资源
│   ├── audio/           - BGM 音频（占位）
│   ├── characters/      - 角色立绘
│   └── scenes/          - 场景背景
└── src/                 - 源码 (4 子目录)
    ├── main.tsx         - React 挂载入口
    ├── App.tsx          - 根组件：StartScreen ↔ GameScreen 状态机
    ├── config/          - 游戏配置层 (6 文件: game/characters/scenes/items/prompt/theme.css)
    ├── styles/          - 样式 (1 文件: globals.css)
    ├── lib/             - 核心逻辑 (7 文件: store/stream/parser/bgm/hooks/highlight/analytics)
    └── components/game/ - 游戏 UI (6 文件: dialogue/character/side/mobile/highlight/event-modal)
```

## 架构核心

```
用户唯一改动层: src/config/
  ├── theme.css        → CSS 变量覆盖主题色
  ├── game.ts          → WorldConfig 接口 + GAME_INFO 常量
  ├── characters.ts    → 角色数据（Character[]）
  ├── scenes.ts        → 场景数据（Scene[]）
  ├── items.ts         → 物品数据（GameItem[]）
  └── prompt.ts        → AI 指令 + 时段/属性/目标配置

Phase 1 数据流（规划中）:
  用户输入一句话 → Gemini 生成 WorldConfig → 注入 config/ → 游戏启动
```

## 数据流

```
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
```

## 视觉系统

```
风格:       暗色 Indigo 游戏主题
外壳背景:   #0f0f0f / 卡片: #242424
文字:       主 #f5f5f5 / 次 #a3a3a3 / 淡 #666
强调色:     #6366f1 (Indigo) / 辅助: #a78bfa (紫)
CSS 前缀:   gx- (game-x)
```

## 示例数据

| ID | 名称 | 身份 | 锁定 | 主题色 |
|----|------|------|------|--------|
| lina | 莉娜 | 剑士 / 冒险者公会 | 否 | #ef4444 |
| milo | 米洛 | 学者 / 星辰图书馆 | 否 | #3b82f6 |
| kael | 凯尔 | 骑士 / 守卫队长 | 是 | #f59e0b |
| yuki | 雪姬 | 异界旅人 | 是 | #a78bfa |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
