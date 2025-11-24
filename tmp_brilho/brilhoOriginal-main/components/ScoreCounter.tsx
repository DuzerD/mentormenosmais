"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ScoreCounterProps {
  targetScore: number
  duration?: number
}

export default function ScoreCounter({ targetScore, duration = 2000 }: ScoreCounterProps) {
  const [currentScore, setCurrentScore] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startScore = 0

    const updateScore = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const newScore = Math.round(startScore + (targetScore - startScore) * easeOutQuart)

      setCurrentScore(newScore)

      if (progress < 1) {
        requestAnimationFrame(updateScore)
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(updateScore)
    }, 500) // Delay before starting animation

    return () => clearTimeout(timer)
  }, [targetScore, duration])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-amber-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-orange-400"
    return "text-red-400"
  }

  const getCircleColor = (score: number) => {
    if (score >= 80) return "#fbbf24" // amber-400
    if (score >= 60) return "#f59e0b" // yellow-500
    if (score >= 40) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (currentScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-32 h-32 flex items-center justify-center"
    >
      {/* Background circle */}
      <svg className="w-full h-full absolute transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getCircleColor(currentScore)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: duration / 1000, ease: "easeOut" }}
        />
      </svg>

      {/* Score text */}
      <div className="text-center">
        <motion.span
          className={`text-4xl font-bold ${getScoreColor(currentScore)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {currentScore}
        </motion.span>
        <motion.div
          className="text-white/60 text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          /100
        </motion.div>
      </div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${getCircleColor(currentScore)}20 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: currentScore > 0 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  )
}
