'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import TalkingSphere from './TalkingSphere'
import { speakText } from '@/lib/ai-orchestrator'

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
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true

    const script = introScript(testUrl, customScript)

    setIsSpeaking(true)
    // Call speakText with isMuted explicitly set to false
    speakText(script, () => {
      setIsSpeaking(false)
      setHasPlayedIntro(true)
    }, false).catch((error) => {
      console.error('Error playing intro audio:', error)
      // If audio fails, still show the continue button
      setIsSpeaking(false)
      setHasPlayedIntro(true)
    })
  }, [testUrl, customScript])

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
      {/* <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]" /> */}
      {/* <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.15),_transparent_60%)]" /> */}

      <TalkingSphere isSpeaking={isSpeaking} />

      {hasPlayedIntro && (
        <div className="mt-12 flex flex-col items-center space-y-4 text-center">
          <p className="text-sm text-white/70">Ready to begin testing?</p>
          <Button
            onClick={onContinue}
            size="lg"
            className="min-w-[220px]"
          >
            Yes, let's start
          </Button>
        </div>
      )}
    </div>
  )
}
