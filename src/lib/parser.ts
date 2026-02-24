/**
 * [INPUT]: 依赖 @/config/game 的 Character 接口
 * [OUTPUT]: parseStructuredMarkers, parseStoryParagraph, parseInlineContent, escapeHtml
 * [POS]: lib 的 AI 回复解析器，7 种标记 + 故事文本 HTML 化，被 store.ts 和组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Character } from '@/config/game'

// ============================================================
// 结构化标记解析（7 种标记，与 PRODUCT.md 四、AI 结构化标记汇总 完全对齐）
// ============================================================

export interface ParsedMarkers {
  playerStatChanges: Array<{ stat: string; delta: number }>
  charStatChanges: Array<{ charId: string; stat: string; delta: number }>
  goalUpdates: Array<{ title: string; delta: number }>
  newEvents: Array<{ title: string; description: string; major: boolean }>
  unlockedCharacters: string[]
  newItems: Array<{ name: string; icon: string; description: string }>
  actionOptions: string[]
}

/**
 * 从 AI 回复中解析全部结构化标记
 * 7 种标记 × 7 个独立正则，平行解析不嵌套
 */
export function parseStructuredMarkers(
  content: string,
  characters: Character[],
  playerStatNames: string[],
  charStatNames: string[]
): ParsedMarkers {
  const result: ParsedMarkers = {
    playerStatChanges: [],
    charStatChanges: [],
    goalUpdates: [],
    newEvents: [],
    unlockedCharacters: [],
    newItems: [],
    actionOptions: [],
  }

  /* 名字 → ID 映射 */
  const nameToId: Record<string, string> = {}
  const charNames = new Set<string>()
  for (const c of characters) {
    nameToId[c.name] = c.id
    charNames.add(c.name)
  }

  /* 属性名集合（含别名） */
  const allPlayerStats = new Set(playerStatNames)
  const allCharStats = new Set(charStatNames)

  // --- 1. 属性变化 【属性名 +/-N】 ---
  const statRegex = /【([^】]+?)([+-]\d+)(?:[，,]\s*([^】]+?)([+-]\d+))*】/g
  let m: RegExpExecArray | null
  while ((m = statRegex.exec(content)) !== null) {
    const fullMatch = m[0]
    // 逐对解析
    const pairRegex = /([^\s，,+\-【】]+)\s*([+-]\d+)/g
    let pair: RegExpExecArray | null
    while ((pair = pairRegex.exec(fullMatch)) !== null) {
      const name = pair[1]
      const delta = parseInt(pair[2])
      if (allPlayerStats.has(name)) {
        result.playerStatChanges.push({ stat: name, delta })
      } else if (allCharStats.has(name)) {
        // 角色属性需要匹配角色名——向前搜索角色名
        // 暂时归类为 player stat，store 层再做二次匹配
        result.playerStatChanges.push({ stat: name, delta })
      }
    }
  }

  // --- 2. 目标更新 【目标更新：标题 +N%】 ---
  const goalRegex = /【目标更新[：:](.+?)\s*\+(\d+)%】/g
  while ((m = goalRegex.exec(content)) !== null) {
    result.goalUpdates.push({ title: m[1].trim(), delta: parseInt(m[2]) })
  }

  // --- 3 & 4. 关键事件 / 重大事件 ---
  const eventRegex = /【(关键事件|重大事件)[：:](.+?)】([^【]*)/g
  while ((m = eventRegex.exec(content)) !== null) {
    result.newEvents.push({
      title: m[2].trim(),
      description: m[3].trim(),
      major: m[1] === '重大事件',
    })
  }

  // --- 5. 解锁角色 ---
  const unlockRegex = /【解锁角色[：:](.+?)】/g
  while ((m = unlockRegex.exec(content)) !== null) {
    result.unlockedCharacters.push(m[1].trim())
  }

  // --- 6. 获得物品 ---
  const itemRegex = /【获得物品[：:](.+?)[·](.+?)】/g
  while ((m = itemRegex.exec(content)) !== null) {
    result.newItems.push({
      name: m[1].trim(),
      icon: '📦',
      description: m[2].trim(),
    })
  }

  // --- 7. 行动选项 ---
  const actionRegex = /【行动选项】([\s\S]+?)(?=【|$)/g
  while ((m = actionRegex.exec(content)) !== null) {
    const optText = m[1].trim()
    const opts = optText.split(/\d+[.、]\s*/).filter(Boolean).map(s => s.trim())
    result.actionOptions = opts
  }

  return result
}

/**
 * 从 AI 回复中剥离所有结构化标记，只留故事文本
 */
export function stripMarkers(content: string): string {
  return content
    .replace(/【目标更新[：:].+?】/g, '')
    .replace(/【(关键事件|重大事件)[：:].+?】[^【]*/g, '')
    .replace(/【解锁角色[：:].+?】/g, '')
    .replace(/【获得物品[：:].+?】/g, '')
    .replace(/【行动选项】[\s\S]+?(?=【|$)/g, '')
    .trim()
}

// ============================================================
// 故事文本 → HTML（视觉渲染用）
// ============================================================

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function parseInlineContent(text: string): string {
  if (!text) return ''
  let result = ''
  let remaining = text
  let safety = 0

  while (remaining.length > 0 && safety < 100) {
    safety++
    remaining = remaining.trim()
    if (!remaining) break

    /* （动作） */
    const actionMatch = remaining.match(/^[（(]([^）)]+)[）)]/)
    if (actionMatch) {
      result += `<span class="action">（${escapeHtml(actionMatch[1])}）</span>`
      remaining = remaining.slice(actionMatch[0].length)
      continue
    }

    /* *动作* */
    const starMatch = remaining.match(/^\*([^*]+)\*/)
    if (starMatch) {
      result += `<span class="action">*${escapeHtml(starMatch[1])}*</span>`
      remaining = remaining.slice(starMatch[0].length)
      continue
    }

    /* "对话" */
    const dialogueMatch = remaining.match(/^[""\u201c]([^""\u201d]+)[""\u201d]/)
    if (dialogueMatch) {
      result += `<span class="dialogue">\u201c${escapeHtml(dialogueMatch[1])}\u201d</span>`
      remaining = remaining.slice(dialogueMatch[0].length)
      continue
    }

    /* 下一个特殊标记 */
    const nextAction = remaining.search(/[（(]/)
    const nextStar = remaining.search(/\*/)
    const nextDialogue = remaining.search(/[""\u201c]/)
    const positions = [nextAction, nextStar, nextDialogue].filter(p => p > 0)

    if (positions.length > 0) {
      const nextPos = Math.min(...positions)
      const plain = remaining.slice(0, nextPos).trim()
      if (plain) result += `<span class="plain-text">${escapeHtml(plain)}</span>`
      remaining = remaining.slice(nextPos)
    } else {
      const plain = remaining.trim()
      if (plain) result += `<span class="plain-text">${escapeHtml(plain)}</span>`
      break
    }
  }
  return result
}

export function parseStoryParagraph(
  content: string,
  characterColors: Record<string, string>
): { narrative: string; statHtml: string } {
  if (!content) return { narrative: '', statHtml: '' }

  // 先剥离非属性标记
  const cleaned = stripMarkers(content)

  const lines = cleaned.split('\n').filter(l => l.trim())
  const storyParts: string[] = []
  const statChanges: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    /* 属性变化行 【xxx+N】 */
    const statMatch = trimmed.match(/^【([^】]*[+-]\d+[^】]*)】$/)
    if (statMatch) {
      statChanges.push(statMatch[1])
      continue
    }

    /* 【角色名】开头 */
    const charMatch = trimmed.match(/^【([^】]+)】(.*)/)
    if (charMatch) {
      const charName = charMatch[1]
      const rest = charMatch[2].trim()
      if (charName.match(/[+-]\d+/)) {
        statChanges.push(charName)
        continue
      }
      const color = characterColors[charName] || 'var(--primary)'
      const lineHtml = parseInlineContent(rest)
      storyParts.push(
        `<p class="dialogue-line"><span class="char-name" style="color:${color}">【${escapeHtml(charName)}】</span>${lineHtml}</p>`
      )
      continue
    }

    /* 纯旁白 vs 混合内容 */
    const hasDialogue = trimmed.match(/[""\u201c][^""\u201d]+[""\u201d]/)
    const hasAction = trimmed.match(/[（(][^）)]+[）)]/) || trimmed.match(/\*[^*]+\*/)
    if (!hasDialogue && !hasAction) {
      storyParts.push(`<p class="narration">${escapeHtml(trimmed)}</p>`)
    } else {
      const lineHtml = parseInlineContent(trimmed)
      if (lineHtml) storyParts.push(`<p class="dialogue-line">${lineHtml}</p>`)
    }
  }

  let statHtml = ''
  if (statChanges.length > 0) {
    const statText = statChanges
      .map(s => `<span style="color:var(--accent)">【${escapeHtml(s)}】</span>`)
      .join(' ')
    statHtml = `<p class="narration" style="font-style:normal;border-left:none;padding-left:0;margin-bottom:0;font-size:13px">${statText}</p>`
  }

  return { narrative: storyParts.join(''), statHtml }
}
