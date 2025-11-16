'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import TalkingSphere from './TalkingSphere'
import { speakText, stopAudio } from '@/lib/ai-orchestrator'

interface IntroScreenProps {
  testUrl: string
  onContinue: () => void
  customScript?: string
}

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch (error) {
    return url
  }
}

const introScript = (url: string, customScript?: string) => {
  const domain = getDomain(url)

  // Use custom script if provided, otherwise use default
  if (customScript) {
    return customScript.replace(/{url}/g, url).replace(/{domain}/g, domain)
  }

  return `Hello! Welcome to AI usability testing. You're about to test ${domain}.

I'll guide you through this process. You'll be able to interact with the website freely, and I'll ask you some questions along the way about your experience.

You can speak to me naturally, and I'll listen and respond. Just explore the site as you normally would, and share your thoughts when I ask.

Ready to begin?`
}

export default function IntroScreen({ testUrl, onContinue, customScript }: IntroScreenProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const hasPlayedRef = useRef(false)
  const introSkippedRef = useRef(false)
  const scriptRef = useRef('')

  const playIntro = useCallback(async () => {
    const script = scriptRef.current
    if (!script) return

    introSkippedRef.current = false
    setAudioBlocked(false)
    setIsSpeaking(true)

    try {
      await speakText(
        script,
        () => {
          if (introSkippedRef.current) return
          setIsSpeaking(false)
          setHasPlayedIntro(true)
        },
        false,
      )
    } catch (error) {
      console.error('Error playing intro audio:', error)
      setIsSpeaking(false)
      setAudioBlocked(true)
      if (!hasPlayedIntro) {
        setHasPlayedIntro(true)
      }
    }
  }, [hasPlayedIntro])

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true

    const script = introScript(testUrl, customScript)
    scriptRef.current = script
    void playIntro()
  }, [testUrl, customScript, playIntro])

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
      {/* <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]" /> */}
      {/* <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.15),_transparent_60%)]" /> */}

      <TalkingSphere isSpeaking={isSpeaking} />

      <div className="mt-12 flex flex-col items-center space-y-4 text-center">
        {!hasPlayedIntro && (
          <Button
            variant="outline"
            onClick={() => {
              introSkippedRef.current = true
              stopAudio()
              setIsSpeaking(false)
              setHasPlayedIntro(true)
            }}
          >
            Skip introduction
          </Button>
        )}
        {audioBlocked && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-white/70 max-w-sm">
              Audio was blocked by the browser. Tap below to play the introduction.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setHasPlayedIntro(false)
                void playIntro()
              }}
            >
              Play introduction
            </Button>
          </div>
        )}
        {hasPlayedIntro && (
          <>
            <p className="text-sm text-white/70">Ready to begin testing?</p>
            <Button onClick={onContinue} size="lg" className="min-w-[220px]">
              Yes, let's start
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
