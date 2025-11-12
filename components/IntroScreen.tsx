'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import TalkingSphere from './TalkingSphere'
import { speakText } from '@/lib/ai-orchestrator'

interface IntroScreenProps {
  testUrl: string
  onContinue: () => void
  customScript?: string
}

const introScript = (url: string, customScript?: string) => {
  // Use custom script if provided, otherwise use default
  if (customScript) {
    const domain = new URL(url).hostname.replace('www.', '')
    return customScript.replace(/{url}/g, url).replace(/{domain}/g, domain)
  }
  
  const domain = new URL(url).hostname.replace('www.', '')
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
    speakText(script, () => {
      setIsSpeaking(false)
      setHasPlayedIntro(true)
    })
  }, [testUrl, customScript])

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-4xl p-12">
        <div className="flex flex-col items-center space-y-8">
          <TalkingSphere isSpeaking={isSpeaking} />
          
          {hasPlayedIntro && (
            <div className="w-full space-y-4">
              <p className="text-center text-muted-foreground">
                Ready to begin testing?
              </p>
              <Button
                onClick={onContinue}
                className="w-full"
                size="lg"
              >
                Yes, let's start
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

