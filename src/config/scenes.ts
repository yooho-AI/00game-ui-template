/**
 * [INPUT]: 依赖 @/config/game 的 Scene 接口
 * [OUTPUT]: 默认场景数据 SCENES + SCENE_MAP
 * [POS]: config 的场景数据源，被 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Scene } from './game'

export const SCENES: Scene[] = [
  {
    id: 'town-square',
    name: '小镇广场',
    icon: '🏘',
    description: '边境小镇的中心广场，石板路两旁是低矮的木屋和商铺。裂缝出现后人烟渐稀。',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    characters: ['lina', 'milo'],
  },
  {
    id: 'ancient-forest',
    name: '古老森林',
    icon: '🌲',
    description: '小镇外围的茂密森林，树冠遮天蔽日。据说裂缝最先出现在森林深处。',
    background: 'linear-gradient(135deg, #0d1b0e 0%, #1a2f1a 50%, #2d4a2d 100%)',
    characters: ['lina', 'kael'],
  },
  {
    id: 'rift-edge',
    name: '裂缝边缘',
    icon: '🌀',
    description: '异界裂缝的边缘地带，空气中弥漫着紫色的微光粒子，现实在这里变得模糊。',
    background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #4a1a8a 100%)',
    characters: ['milo', 'yuki'],
  },
]

/* id → Scene 快速查找 */
export const SCENE_MAP: Record<string, Scene> = Object.fromEntries(
  SCENES.map(s => [s.id, s])
)
