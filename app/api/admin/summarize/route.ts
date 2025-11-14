import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'

// Middleware to check admin password
function checkAdminAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7)
  return token === adminPassword  
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { sessionIds } = body

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'sessionIds array is required' },
        { status: 400 }
      )
    }

    // Fetch all selected sessions
    const { data: sessions, error } = await supabase
      .from('test_sessions')
      .select('*')
      .in('id', sessionIds)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      )
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found' },
        { status: 404 }
      )
    }

    // Aggregate data across sessions
    const allUserEvents: any[] = []
    const allConversations: any[] = []
    const allSurveyAnswers: Record<string, number[]> = {}
    const testUrls = new Set<string>()

    sessions.forEach((session) => {
      testUrls.add(session.test_url)
      if (session.user_events) {
        allUserEvents.push(...(Array.isArray(session.user_events) ? session.user_events : []))
      }
      if (session.conversation_history) {
        allConversations.push(...(Array.isArray(session.conversation_history) ? session.conversation_history : []))
      }
      if (session.survey_answers) {
        Object.entries(session.survey_answers).forEach(([key, value]) => {
          if (!allSurveyAnswers[key]) {
            allSurveyAnswers[key] = []
          }
          allSurveyAnswers[key].push(value as number)
        })
      }
    })

    // Build summary of aggregated user actions
    const eventTypes: Record<string, number> = {}
    allUserEvents.forEach((e: any) => {
      if (e.type) {
        eventTypes[e.type] = (eventTypes[e.type] || 0) + 1
      }
    })

    const actionsSummary = Object.entries(eventTypes)
      .map(([type, count]) => `- ${type}: ${count} occurrence(s)`)
      .join('\n')

    // Build conversation summary
    const conversationSummary = allConversations
      .slice(0, 50) // Limit to first 50 messages to avoid token limits
      .map((msg: any, idx: number) => {
        const speaker = msg.speaker === 'user' ? 'User' : 'Ava'
        return `${idx + 1}. ${speaker}: ${msg.text}`
      })
      .join('\n')

    // Build survey summary
    const surveySummary = Object.entries(allSurveyAnswers)
      .map(([questionId, ratings]) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
        const questionText = getQuestionText(questionId)
        return `- ${questionText}: Average ${avg.toFixed(1)}/5 (${ratings.length} responses)`
      })
      .join('\n')

    const testUrlList = Array.from(testUrls).join(', ')

    // Generate cross-session summary using OpenAI
    const openai = new OpenAI({ apiKey })

    const prompt = `Analyze ${sessions.length} usability testing sessions for ${testUrlList} and provide a comprehensive cross-session summary.

**Aggregated User Actions (${allUserEvents.length} total):**
${actionsSummary || 'No user actions recorded.'}

**Conversation History (${allConversations.length} total messages, showing first 50):**
${conversationSummary || 'No conversation recorded.'}

**Post-Test Survey Results (${Object.keys(allSurveyAnswers).length} questions):**
${surveySummary || 'No survey responses.'}

**Individual Session Summaries:**
${sessions.map((s, idx) => `${idx + 1}. Session ${idx + 1} (${s.test_url}): ${s.summary || 'No summary available'}`).join('\n\n')}

Please provide a detailed cross-session analysis covering:
1. **Overall Patterns**: What common behaviors and patterns emerged across all sessions?
2. **Consistent Pain Points**: What issues were encountered by multiple users?
3. **Success Patterns**: What worked well across sessions?
4. **Key Insights**: What are the most important findings when looking at all sessions together?
5. **Recommendations**: What specific improvements would you suggest based on the aggregated data?

Format your response in clear sections with headers. Be specific and reference actual patterns from the data.`

    const message = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.choices[0].message.content

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      summary: summary.trim(),
      sessionCount: sessions.length,
      aggregatedData: {
        totalEvents: allUserEvents.length,
        totalConversations: allConversations.length,
        surveyResponses: Object.keys(allSurveyAnswers).length,
      }
    })
  } catch (error) {
    console.error('Cross-session summarize error:', error)
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

