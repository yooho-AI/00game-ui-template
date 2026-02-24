# config/
> L2 | 父级: /CLAUDE.md

游戏配置层 — 用户唯一需要修改的目录。新项目只改此处即可换皮。

## 成员清单

```
theme.css       : CSS 变量覆盖，:root 声明主题色/背景/文字色，被 globals.css @import
game.ts         : 全部 TypeScript 接口（WorldConfig/Character/Scene/Goal/KeyEvent/GameItem/StatConfig/TimePeriod/Message）+ GAME_INFO 常量
characters.ts   : Character[] 角色数据 + CHARACTER_MAP 索引，含 locked 状态和 initialStats
scenes.ts       : Scene[] 场景数据 + SCENE_MAP 索引，支持 CSS 渐变和图片/视频背景
items.ts        : GameItem[] 初始物品数据
prompt.ts       : buildSystemPrompt() AI 指令构建器 + PERIODS/PLAYER_STATS/CHARACTER_STATS/INITIAL_PLAYER_STATS/MAX_DAYS/MAX_ACTION_POINTS
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
