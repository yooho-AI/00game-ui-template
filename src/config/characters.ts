/**
 * [INPUT]: 依赖 @/config/game 的 Character 接口
 * [OUTPUT]: 默认角色数据 CHARACTERS + CHARACTER_MAP
 * [POS]: config 的角色数据源，被 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Character } from './game'

export const CHARACTERS: Character[] = [
  {
    id: 'lina',
    name: '莉娜',
    avatar: '🗡',
    title: '边境剑士',
    themeColor: '#ef4444',
    description: '沉默寡言的边境守卫，剑法凌厉。失去了家园后独自流浪，对异界裂缝有切身之痛。',
    initialStats: { 信任: 30, 默契: 10 },
  },
  {
    id: 'milo',
    name: '米洛',
    avatar: '📖',
    title: '流浪学者',
    themeColor: '#6366f1',
    description: '博学多闻的旅行学者，总是随身带着一本厚重的笔记本。对裂缝现象有独到见解。',
    initialStats: { 信任: 25, 默契: 15 },
  },
  {
    id: 'kael',
    name: '凯尔',
    avatar: '🛡',
    title: '神秘骑士',
    themeColor: '#f59e0b',
    description: '身披黑色铠甲的骑士，来历不明。行事果断，似乎知道裂缝的某些秘密。',
    initialStats: { 信任: 15, 默契: 5 },
    locked: true,
  },
  {
    id: 'yuki',
    name: '雪织',
    avatar: '✨',
    title: '异界旅人',
    themeColor: '#22d3ee',
    description: '从裂缝另一端穿越而来的少女，拥有不属于这个世界的神秘力量。记忆残缺。',
    initialStats: { 信任: 10, 默契: 20 },
    locked: true,
  },
]

/* id → Character 快速查找 */
export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map(c => [c.id, c])
)
