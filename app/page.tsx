'use client'

import { useMemo, useState } from 'react'
import { SessionProvider, useSessionContext } from '@/lib/session-context'
import URLInputScreen from '@/components/URLInputScreen'
import IntroScreen from '@/components/IntroScreen'
import AppFrame from '@/components/AppFrame'
import AIPanel from '@/components/AIPanel'
import PostTestSurvey from '@/components/PostTestSurvey'
import TestSummary from '@/components/TestSummary'
import { getDemoConfig } from '@/lib/demo-config'

type FlowState = 'url-input' | 'intro' | 'testing' | 'survey' | 'summary'

function MainContent() {
  const { setSessionActive, setSessionStartTime, userEvents } = useSessionContext()
  const [flowState, setFlowState] = useState<FlowState>('url-input')
  const [testUrl, setTestUrl] = useState<string>('')
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({})
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>>([])

  const demoConfig = useMemo(() => {
    if (!testUrl) return null
    return getDemoConfig(testUrl)
  }, [testUrl])

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

  const handleEndSession = (conversation: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>) => {
    setSessionActive(false)
    setConversationHistory(conversation)
    setFlowState('survey')
  }

  const handleSurveyComplete = (answers: Record<string, number>) => {
    setSurveyAnswers(answers)
    // Move to summary generation after survey
    setFlowState('summary')
  }

  const handleSummaryClose = () => {
    // Could navigate to a new test or home screen
    setFlowState('url-input')
    setTestUrl('')
    setSurveyAnswers({})
    setConversationHistory([])
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

      {flowState === 'summary' && (
        <TestSummary
          userEvents={userEvents}
          conversationHistory={conversationHistory}
          surveyAnswers={surveyAnswers}
          testUrl={testUrl}
          onClose={handleSummaryClose}
        />
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
