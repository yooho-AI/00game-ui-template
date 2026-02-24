# components/game/
> L2 | 父级: /CLAUDE.md

游戏 UI 组件层 — PC 三栏布局 + 移动端自适应 + 弹窗。

## 成员清单

```
dialogue-panel.tsx   : 中间面板，场景背景 + 遮罩 + Chat Fiction 段落 + 行动选项 + 流式显示 + 输入框
character-panel.tsx  : 左侧面板 280px，场景卡片 + 角色立绘 + 简介 + 属性条 + 角色选择（含锁定态）
side-panel.tsx       : 右侧面板，图标导航栏 52px + 目标/事件/背包 三面板 260px
mobile-layout.tsx    : 移动端全屏布局，底部输入 + Sheet 抽屉（角色/目标事件/菜单）+ 浮动角色小窗
highlight-modal.tsx  : 高光时刻弹窗，AI 分析 + 选风格 + 生图/生视频 + 下载
event-modal.tsx      : 重大事件全屏弹窗，framer-motion 动画，剧情转折点仪式感呈现
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
