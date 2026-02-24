# lib/
> L2 | 父级: /CLAUDE.md

核心逻辑层 — 状态管理 + 网络通信 + 文本解析 + 工具函数。

## 成员清单

```
store.ts      : Zustand+Immer 游戏状态中枢，从 config/ 读数据，7 种标记处理，存档/读档，CHARACTER_COLORS 导出
stream.ts     : SSE 流式请求封装（streamChat）+ 普通请求（chat），StreamMessage 类型
parser.ts     : AI 回复解析器 — parseStructuredMarkers() 7 种标记 + stripMarkers() + parseStoryParagraph() HTML 化
highlight.ts  : 高光时刻 API — AI 分析对话 + 火山方舟生图/生视频 + prompt 构建
bgm.ts        : BGM 音频单例 + useBgm() hook
hooks.ts      : useMediaQuery + useIsMobile (768px 断点)
analytics.ts  : Umami 埋点封装，gx_ 前缀事件名
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
