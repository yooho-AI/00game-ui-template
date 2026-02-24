# components/creation/
> L2 | 父级: /CLAUDE.md

创造流 UI 组件层 — Phase 1 AI 世界生成的三阶段界面。

## 成员清单

```
creation-terminal.tsx : 创造终端，全屏输入界面，textarea + 灵感标签 + 创造按钮，onGenerate 回调上抛
loading-screen.tsx    : 加载动画，6 阶段模拟进度条，done=true 跳至 100% 后 600ms 触发 onReady
world-preview.tsx     : 世界预览卡片，展示 WorldConfig 全部字段，确认/重新生成/分享三按钮
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
