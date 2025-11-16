import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: {
    projectId: string
  }
}

function isAuthorized(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === adminPassword
}

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

    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Project sessions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to load sessions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error('Project sessions route error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


