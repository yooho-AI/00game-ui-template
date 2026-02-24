/**
 * [INPUT]: 接收 progress (0-100) 和 stage 文案
 * [OUTPUT]: LoadingScreen 组件 — 世界生成加载动画
 * [POS]: creation 的第二屏，展示模拟进度和阶段文字
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  { text: '正在分析剧本…', target: 15 },
  { text: '正在构思世界观…', target: 30 },
  { text: '正在创造角色…', target: 55 },
  { text: '正在布置场景…', target: 72 },
  { text: '正在规划目标…', target: 88 },
  { text: '正在调配色彩…', target: 95 },
]

export default function LoadingScreen({ done, onReady }: {
  done: boolean
  onReady: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  /* 模拟进度推进 */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const stage = STAGES[stageIdx]
        if (!stage) return prev
        if (prev >= stage.target) {
          if (stageIdx < STAGES.length - 1) setStageIdx(s => s + 1)
          return prev
        }
        return prev + 0.5
      })
    }, 100)

    return () => clearInterval(timerRef.current)
  }, [stageIdx])

  /* API 返回后跳到 100% */
  useEffect(() => {
    if (!done) return
    clearInterval(timerRef.current)
    setProgress(100)
    setStageIdx(STAGES.length - 1)

    const t = setTimeout(onReady, 600)
    return () => clearTimeout(t)
  }, [done, onReady])

  const stage = STAGES[stageIdx]

  return (
    <div className="flex h-screen flex-col items-center justify-center" style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm px-6 text-center"
      >
        {/* 旋转 icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="mb-8 text-5xl"
        >
          🌀
        </motion.div>

        {/* 阶段文字 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {progress >= 100 ? '世界已就绪！' : stage?.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 进度条 */}
        <div style={{
          height: 4, borderRadius: 2, overflow: 'hidden',
          background: 'var(--bg-card)',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {Math.round(progress)}%
        </p>
      </motion.div>
    </div>
  )
}
