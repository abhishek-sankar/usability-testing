import { NextRequest, NextResponse } from 'next/server'
import { supabase, TestSession } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      testUrl,
      userEvents,
      conversationHistory,
      surveyAnswers,
      summary,
      sessionStartTime,
    } = body

    if (!testUrl) {
      return NextResponse.json(
        { error: 'testUrl is required' },
        { status: 400 }
      )
    }

    // Calculate session duration
    const sessionDuration = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime) / 1000)
      : undefined

    const sessionData: Omit<TestSession, 'id' | 'created_at'> = {
      test_url: testUrl,
      user_events: userEvents || [],
      conversation_history: conversationHistory || [],
      survey_answers: surveyAnswers || {},
      summary: summary || undefined,
      session_duration: sessionDuration,
    }

    const { data, error } = await supabase
      .from('test_sessions')
      .insert([sessionData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save session', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      sessionId: data.id,
      session: data 
    })
  } catch (error) {
    console.error('Session save error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

