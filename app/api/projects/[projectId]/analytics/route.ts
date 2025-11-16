import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isAuthorized(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === adminPassword
}

interface RouteParams {
  params: {
    projectId: string
  }
}

type RatingDistribution = Record<string, number>

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const { projectId } = params

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found', details: projectError?.message },
        { status: 404 }
      )
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      return NextResponse.json(
        {
          error: 'Failed to load sessions',
          details: sessionsError.message,
        },
        { status: 500 }
      )
    }

    const totalSessions = sessions?.length || 0
    const totalDuration = sessions?.reduce((acc, session) => {
      return acc + (session.session_duration || 0)
    }, 0) || 0

    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

    const ratingDistribution: RatingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    const ratingsByQuestion: Record<
      string,
      { total: number; responses: number }
    > = {}

    sessions?.forEach((session) => {
      const answers = session.survey_answers || {}
      Object.entries(answers).forEach(([questionId, value]) => {
        const rating = Number(value)
        if (!Number.isFinite(rating)) return

        const key = rating.toString()
        if (ratingDistribution[key] !== undefined) {
          ratingDistribution[key] += 1
        } else {
          ratingDistribution[key] = 1
        }

        if (!ratingsByQuestion[questionId]) {
          ratingsByQuestion[questionId] = { total: 0, responses: 0 }
        }

        ratingsByQuestion[questionId].total += rating
        ratingsByQuestion[questionId].responses += 1
      })
    })

    const questionAverages = Object.entries(ratingsByQuestion).map(
      ([questionId, stats]) => ({
        questionId,
        average: stats.responses > 0 ? stats.total / stats.responses : 0,
        responses: stats.responses,
      })
    )

    const latestSessions = (sessions || []).slice(0, 5).map((session) => ({
      id: session.id,
      summary: session.summary,
      sentiment_score: session.sentiment_score,
      created_at: session.created_at,
      session_duration: session.session_duration,
    }))

    const averageSentiment =
      (sessions || []).reduce((acc, session) => acc + (session.sentiment_score || 0), 0) /
      (sessions?.filter((session) => session.sentiment_score !== null && session.sentiment_score !== undefined).length || 1)

    return NextResponse.json({
      project,
      metrics: {
        totalSessions,
        averageDuration,
        averageSentiment: Number.isFinite(averageSentiment) ? averageSentiment : 0,
        ratingDistribution,
        questionAverages,
        latestSessions,
      },
    })
  } catch (error) {
    console.error('Project analytics error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

