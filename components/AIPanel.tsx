'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSessionContext } from '@/lib/session-context'
import Transcript from './Transcript'
import TalkingSphere from './TalkingSphere'
import VoiceInput from './VoiceInput'
import { speakText } from '@/lib/ai-orchestrator'

interface AIPanelProps {
  onEndSession: () => void
  testUrl?: string
  walkthroughContext?: string
}

type AIState = 'idle' | 'listening' | 'speaking' | 'thinking'

export default function AIPanel({ onEndSession, testUrl, walkthroughContext }: AIPanelProps) {
  const { sessionActive, userEvents, setUserEvents, sessionStartTime } = useSessionContext()
  const [aiState, setAIState] = useState<AIState>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>>([])
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const questionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastEventRef = useRef<any>(null)

  // Handle user events and generate contextual questions using GPT
  useEffect(() => {
    if (!sessionActive || userEvents.length === 0) {
      console.log('No events or session inactive:', { sessionActive, eventCount: userEvents.length })
      return
    }

    // Filter out React DevTools and other non-user events
    const realUserEvents = userEvents.filter((e: any) => {
      // Skip React DevTools events
      if (e.source === 'react-devtools-bridge') return false
      // Skip question_asked events (we don't want to ask questions about asking questions)
      if (e.type === 'question_asked') return false
      // Only process events with valid types
      return e.type && typeof e.type === 'string' && e.type.length > 0
    })

    if (realUserEvents.length === 0) {
      console.log('No real user events after filtering')
      return
    }

    const latestEvent = realUserEvents[realUserEvents.length - 1]
    console.log('Latest real user event:', latestEvent)
    
    // Skip if we already processed this event
    if (latestEvent === lastEventRef.current) {
      console.log('Event already processed, skipping')
      return
    }
    lastEventRef.current = latestEvent

    // Clear any pending question timeout
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current)
    }

    // Wait 3-5 seconds after action before asking (non-intrusive)
    const delay = latestEvent.type === 'route_change' ? 2000 : 4000
    console.log(`Scheduling question for event type: ${latestEvent.type}, delay: ${delay}ms`)

    questionTimeoutRef.current = setTimeout(async () => {
      // Check state at execution time, not when scheduled
      if (isMuted || aiState === 'speaking') {
        console.log('AI is muted or speaking, skipping question')
        return
      }

      setAIState('thinking')
      console.log('Generating contextual question for event:', latestEvent.type)
      
      try {
        // Use GPT to generate contextual question based on user events
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: transcript.map((msg) => ({
              speaker: msg.speaker,
              text: msg.text,
            })),
            userEvents: realUserEvents,
            testUrl: testUrl || window.location.href,
            walkthroughContext,
            // Add context that this is an automatic question based on user action
            context: `The user just performed a ${latestEvent.type} action. Generate a brief, contextual question about their experience.`,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate question')
        }

        const result = await response.json()
        if (result.text) {
          handleAIResponse(result.text)
        } else {
          console.log('No question generated')
          setAIState('idle')
        }
      } catch (error) {
        console.error('Error generating question:', error)
        setAIState('idle')
      }
    }, delay)

    return () => {
      if (questionTimeoutRef.current) {
        clearTimeout(questionTimeoutRef.current)
      }
    }
  }, [userEvents, sessionActive, isMuted, transcript, aiState, walkthroughContext])

  const handleAIResponse = async (text: string) => {
    setCurrentQuestion(text)
    setTranscript((prev) => [
      ...prev,
      { speaker: 'ai', text, timestamp: Date.now() },
    ])

    // Mark that we asked a question
    setUserEvents((prev) => [
      ...prev,
      { type: 'question_asked', timestamp: Date.now(), elapsedTime: Date.now() - (sessionStartTime || Date.now()) },
    ])

    if (!isMuted) {
      setAIState('speaking')
      try {
        await speakText(text, () => {
          setAIState('listening')
          setTimeout(() => setAIState('idle'), 2000)
        })
      } catch (error) {
        console.error('Error speaking:', error)
        setAIState('idle')
      }
    } else {
      setAIState('idle')
    }
  }

  const handleUserMessage = async (message: string) => {
    // Add user message to transcript
    const updatedTranscript = [
      ...transcript,
      { speaker: 'user' as const, text: message, timestamp: Date.now() },
    ]
    setTranscript(updatedTranscript)

    // Generate AI response using GPT
    setAIState('thinking')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedTranscript.map((msg) => ({
            speaker: msg.speaker,
            text: msg.text,
          })),
          userEvents: userEvents,
          testUrl: testUrl || window.location.href,
          walkthroughContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()
      if (result.text) {
        handleAIResponse(result.text)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      setAIState('idle')
    }
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      setAIState('idle')
    }
  }

  return (
    <div className="w-96 h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center mb-4">
          <TalkingSphere isSpeaking={aiState === 'speaking'} />
        </div>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">Ava</h2>
          <p className="text-sm text-muted-foreground mb-3">Your UX assistant</p>
          <p className="text-xs text-muted-foreground">
            {aiState === 'idle' && 'Ready'}
            {aiState === 'listening' && 'Listening...'}
            {aiState === 'speaking' && 'Speaking...'}
            {aiState === 'thinking' && 'Thinking...'}
          </p>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-4">
        <Transcript messages={transcript} />
      </div>

      {/* Current question highlight */}
      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4"
        >
          <Card className="p-4">
            <p className="text-sm font-medium">{currentQuestion}</p>
          </Card>
        </motion.div>
      )}

      {/* Voice Input */}
      <div className="p-4 border-t border-border">
        <VoiceInput onMessage={handleUserMessage} disabled={!sessionActive} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={handleMuteToggle}
          variant={isMuted ? 'outline' : 'default'}
          className="w-full"
        >
          {isMuted ? 'Unmute AI' : 'Mute AI'}
        </Button>
        <Button
          onClick={onEndSession}
          variant="destructive"
          className="w-full"
        >
          End Test Session
        </Button>
      </div>
    </div>
  )
}
