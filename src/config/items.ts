/**
 * [INPUT]: 依赖 @/config/game 的 GameItem 接口
 * [OUTPUT]: 默认物品数据 ITEMS
 * [POS]: config 的物品数据源，被 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { GameItem } from './game'

export const ITEMS: GameItem[] = [
  {
    id: 'heal-potion',
    name: '治愈药水',
    icon: '🧪',
    type: '药品',
    description: '恢复少量生命力',
    consumable: true,
  },
  {
    id: 'old-map',
    name: '残破地图',
    icon: '🗺',
    type: '线索',
    description: '标注了裂缝出现位置的手绘地图',
  },
]
