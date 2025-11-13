'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface TestSummaryProps {
  userEvents: any[]
  conversationHistory: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  surveyAnswers: Record<string, number>
  testUrl: string
  onClose: () => void
}

export default function TestSummary({
  userEvents,
  conversationHistory,
  surveyAnswers,
  testUrl,
  onClose,
}: TestSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasGeneratedRef = useRef(false)

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
      setSummary(result.summary || 'No summary generated')
    } catch (err: any) {
      console.error('Error generating summary:', err)
      setError(err.message || 'Failed to generate summary')
    } finally {
      setIsGenerating(false)
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

