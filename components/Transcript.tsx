'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface TranscriptProps {
  messages: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
}

export default function Transcript({ messages }: TranscriptProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">Conversation will appear here...</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                message.speaker === 'ai'
                  ? 'bg-muted'
                  : 'bg-foreground text-background'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  )
}
