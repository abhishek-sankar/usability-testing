'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { getDemoConfig } from '@/lib/demo-config'

interface TestSummaryProps {
  userEvents: any[]
  conversationHistory: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  surveyAnswers: Record<string, number>
  testUrl: string
  sessionStartTime?: number | null
  onClose: () => void
}

export default function TestSummary({
  userEvents,
  conversationHistory,
  surveyAnswers,
  testUrl,
  sessionStartTime,
  onClose,
}: TestSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const hasGeneratedRef = useRef(false)
  const demoConfig = useMemo(() => getDemoConfig(testUrl), [testUrl])
  const projectId = demoConfig?.projectId ?? process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasGeneratedRef.current) return
    hasGeneratedRef.current = true
    
    generateSummary()
  }, [])

  const generateSummary = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEvents,
          conversationHistory,
          surveyAnswers,
          testUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const result = await response.json()
      const generatedSummary = result.summary || 'No summary generated'
      setSummary(generatedSummary)
      
      // Save session to database after summary is generated
      await saveSession(generatedSummary)
    } catch (err: any) {
      console.error('Error generating summary:', err)
      setError(err.message || 'Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveSession = async (summaryText: string) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testUrl,
          userEvents,
          conversationHistory,
          surveyAnswers,
          summary: summaryText,
          sessionStartTime,
          projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save session')
      }

      const result = await response.json()
      setSessionId(result.sessionId)
    } catch (err: any) {
      console.error('Error saving session:', err)
      // Don't show error to user, just log it
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Usability Test Summary</h1>
            <p className="text-muted-foreground">
              Analysis of the testing session for {testUrl ? new URL(testUrl).hostname.replace('www.', '') : 'the website'}
            </p>
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Generating summary...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Error: {error}</p>
              <Button onClick={generateSummary} variant="outline" className="mt-2" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {summary && !isGenerating && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {summary}
                </div>
              </div>
            </div>
          )}

          {!isGenerating && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

