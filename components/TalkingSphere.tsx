'use client'

import { motion } from 'framer-motion'

interface TalkingSphereProps {
  isSpeaking: boolean
}

export default function TalkingSphere({ isSpeaking }: TalkingSphereProps) {
  const variants = {
    idle: {
      scale: [1, 1.02, 1],
      filter: ['blur(0px)', 'blur(0.5px)', 'blur(0px)'],
      boxShadow: [
        '0 0 60px rgba(59,130,246,0.25)',
        '0 0 90px rgba(129,140,248,0.35)',
        '0 0 60px rgba(59,130,246,0.25)',
      ],
    },
    speaking: {
      scale: [1, 1.08, 1.02, 1.1, 1],
      filter: ['blur(0px)', 'blur(1px)', 'blur(0.6px)', 'blur(1px)', 'blur(0px)'],
      boxShadow: [
        '0 0 80px rgba(99,102,241,0.45)',
        '0 0 120px rgba(59,130,246,0.55)',
        '0 0 100px rgba(129,140,248,0.5)',
        '0 0 140px rgba(59,130,246,0.65)',
        '0 0 80px rgba(99,102,241,0.45)',
      ],
    },
  }

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative h-48 w-48 rounded-full bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.85),_rgba(59,130,246,0.6)_35%,_rgba(15,23,42,0.9))]"
        animate={isSpeaking ? 'speaking' : 'idle'}
        variants={variants}
        transition={{
          duration: isSpeaking ? 3.5 : 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.25),_transparent_55%)] blur-md" />
        <div className="absolute inset-0 rounded-full border border-white/20" />
      </motion.div>
    </div>
  )
}
