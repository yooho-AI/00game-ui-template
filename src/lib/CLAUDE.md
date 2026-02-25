# lib/
> L2 | 父级: /CLAUDE.md

核心逻辑层 — 状态管理 + 网络通信 + 文本解析 + AI 生成 + 分享编码 + 工具函数。

## 成员清单

```
store.ts      : Zustand+Immer 游戏状态中枢，cfg() 动态配置解析（含 scriptContent 直通），_worldConfig 注入，存档 v2，getCharacterColors()
generator.ts  : AI 世界生成器 — chat() 调用 Gemini，extractJson/validate/normalize，generateWorld() 含自动重试 + 直通管道（>=200字用户输入零损耗存为 scriptContent）
share.ts      : 分享编解码 — lz-string 压缩 WorldConfig 到 URL ?w= 参数，encodeWorldConfig/decodeWorldConfig/getSharedConfig/buildShareUrl
stream.ts     : SSE 流式请求封装（streamChat）+ 普通请求（chat），StreamMessage 类型
parser.ts     : AI 回复解析器 — parseStructuredMarkers() 7 种标记 + stripMarkers() + parseStoryParagraph() HTML 化
highlight.ts  : 高光时刻 API — AI 分析对话 + 火山方舟生图/生视频 + prompt 构建
bgm.ts        : BGM 音频单例 + useBgm() hook
hooks.ts      : useMediaQuery + useIsMobile (768px 断点)
analytics.ts  : Umami 埋点封装，gx_ 前缀事件名
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
