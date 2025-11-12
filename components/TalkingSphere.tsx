'use client'

import { motion } from 'framer-motion'

interface TalkingSphereProps {
  isSpeaking: boolean
}

export default function TalkingSphere({ isSpeaking }: TalkingSphereProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="w-32 h-32 rounded-full bg-foreground"
        animate={
          isSpeaking
            ? {
                scale: [1, 1.08, 1],
              }
            : {
                scale: 1,
              }
        }
        transition={{
          duration: 1.2,
          repeat: isSpeaking ? Infinity : 0,
          ease: [0.4, 0, 0.2, 1], // Custom easing curve
        }}
      />
    </div>
  )
}
