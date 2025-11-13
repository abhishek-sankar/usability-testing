'use client'

import { motion } from 'framer-motion'

interface TalkingSphereProps {
  isSpeaking: boolean
}

const breatheTransition = {
  duration: 2.2,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: [0.4, 0.0, 0.2, 1],
}

export default function TalkingSphere({ isSpeaking }: TalkingSphereProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="h-48 w-48 rounded-full bg-black"
        animate={isSpeaking ? { scale: [1, 1.14, 1] } : { scale: 1 }}
        transition={isSpeaking ? breatheTransition : { duration: 0.3 }}
      />
    </div>
  )
}
