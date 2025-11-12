'use client'

import { motion } from 'framer-motion'

interface WaveformAnimationProps {
  isActive: boolean
}

export default function WaveformAnimation({ isActive }: WaveformAnimationProps) {
  const bars = [0, 1, 2, 3, 4]

  return (
    <div className="flex items-center gap-1 h-4">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="w-1 bg-primary-500 rounded-full"
          animate={
            isActive
              ? {
                  height: [4, 12, 8, 16, 6, 12],
                  transition: {
                    duration: 0.8,
                    repeat: Infinity,
                    delay: bar * 0.1,
                    ease: 'easeInOut',
                  },
                }
              : { height: 4 }
          }
        />
      ))}
    </div>
  )
}

