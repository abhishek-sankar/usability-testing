import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEvents, conversationHistory, surveyAnswers, testUrl } = body

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Extract domain from test URL
    let domain = 'the website'
    try {
      if (testUrl) {
        domain = new URL(testUrl).hostname.replace('www.', '')
      }
    } catch (e) {
      // Invalid URL, use default
    }

    // Filter out non-user events (DevTools, question_asked, etc.)
    const realUserEvents = (userEvents || []).filter((e: any) => {
      if (e.source === 'react-devtools-bridge') return false
      if (e.type === 'question_asked') return false
      return e.type && typeof e.type === 'string' && e.type.length > 0
    })

    // Build summary of user actions
    const actionsSummary = realUserEvents.map((e: any, idx: number) => {
      const time = Math.round((e.elapsedTime || 0) / 1000) // Convert to seconds
      return `${idx + 1}. [${time}s] ${e.type}${e.data ? `: ${JSON.stringify(e.data)}` : ''}`
    }).join('\n')

    // Build conversation summary
    const conversationSummary = (conversationHistory || [])
      .map((msg: any, idx: number) => {
        const speaker = msg.speaker === 'user' ? 'User' : 'Ava'
        return `${idx + 1}. ${speaker}: ${msg.text}`
      })
      .join('\n')

    // Build survey summary
    const surveySummary = Object.entries(surveyAnswers || {})
      .map(([questionId, rating]) => {
        const questionText = getQuestionText(questionId)
        return `- ${questionText}: ${rating}/5`
      })
      .join('\n')

    const systemPrompt = `You are an expert UX researcher analyzing usability test results. Your task is to provide a comprehensive, insightful summary of a usability testing session.`

    const userPrompt = `Analyze this usability testing session for ${domain} and provide a comprehensive summary.

**User Actions Performed:**
${actionsSummary || 'No user actions recorded.'}

**Conversation History:**
${conversationSummary || 'No conversation recorded.'}

**Post-Test Survey Results:**
${surveySummary || 'No survey responses.'}

Please provide a detailed analysis covering:
1. **Overall Experience**: What was the user's overall experience? What were their main goals?
2. **Intuitive Flows**: Which parts of the website were easy to use? What worked well?
3. **Pain Points**: Where did the user struggle? What was confusing or difficult?
4. **Key Insights**: What are the most important findings from this test?
5. **Recommendations**: What specific improvements would you suggest?

Format your response in clear sections with headers. Be specific and reference actual user actions and quotes from the conversation.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages,
        max_completion_tokens: 2000, // Longer summary
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate summary', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    const summary = result.choices?.[0]?.message?.content || ''

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary: summary.trim() })
  } catch (error) {
    console.error('Summary route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to get question text from ID
function getQuestionText(questionId: string): string {
  const questions: Record<string, string> = {
    '1': 'How likely are you to recommend this website to a friend?',
    '2': 'How easy was it to find what you were looking for?',
    '3': 'How likely are you to return to this website?',
    '4': 'How satisfied were you with the overall experience?',
    '5': 'How likely are you to complete a purchase or sign up?',
  }
  return questions[questionId] || `Question ${questionId}`
}

