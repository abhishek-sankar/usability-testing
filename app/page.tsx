'use client'

import { useMemo, useState } from 'react'
import { SessionProvider, useSessionContext } from '@/lib/session-context'
import URLInputScreen from '@/components/URLInputScreen'
import IntroScreen from '@/components/IntroScreen'
import AppFrame from '@/components/AppFrame'
import AIPanel from '@/components/AIPanel'
import PostTestSurvey from '@/components/PostTestSurvey'
import { getDemoConfig } from '@/lib/demo-config'

type FlowState = 'url-input' | 'intro' | 'testing' | 'survey'

function MainContent() {
  const { setSessionActive, setSessionStartTime } = useSessionContext()
  const [flowState, setFlowState] = useState<FlowState>('url-input')
  const [testUrl, setTestUrl] = useState<string>('')
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({})

  const demoConfig = useMemo(() => {
    if (!testUrl) return null
    return getDemoConfig(testUrl)
  }, [testUrl])

  const handleURLSubmit = (url: string) => {
    setTestUrl(url)
    setFlowState('intro')
  }

  const handleIntroContinue = () => {
    setSessionActive(true)
    setSessionStartTime(Date.now())
    setFlowState('testing')
  }

  const handleEndSession = () => {
    setSessionActive(false)
    setFlowState('survey')
  }

  const handleSurveyComplete = (answers: Record<string, number>) => {
    setSurveyAnswers(answers)
    // Could send to analytics endpoint here
    console.log('Survey completed:', answers)
    // For now, just show completion message
    alert('Thank you for completing the test!')
  }

  return (
    <div className="h-screen w-screen">
      {flowState === 'url-input' && (
        <URLInputScreen onContinue={handleURLSubmit} />
      )}

      {flowState === 'intro' && (
        <IntroScreen
          testUrl={testUrl}
          onContinue={handleIntroContinue}
          customScript={demoConfig?.introScript}
        />
      )}

      {flowState === 'testing' && (
        <div className="h-screen w-screen flex">
          <AppFrame testAppUrl={testUrl} />
          <AIPanel
            onEndSession={handleEndSession}
            testUrl={testUrl}
            walkthroughContext={demoConfig?.walkthroughContext}
          />
        </div>
      )}

      {flowState === 'survey' && (
        <PostTestSurvey onComplete={handleSurveyComplete} />
      )}
    </div>
  )
}

export default function Home() {
  return (
    <SessionProvider>
      <MainContent />
    </SessionProvider>
  )
}
