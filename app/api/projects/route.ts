import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isAuthorized(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === adminPassword
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('q')

    let query = supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search && search.trim().length > 0) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase projects fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ projects: data || [] })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      description,
      status = 'draft',
      prototypeUrl,
      introScript,
      walkthroughContext,
      config,
      sections,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert([
        {
          name,
          description,
          status,
          prototype_url: prototypeUrl,
          intro_script: introScript,
          walkthrough_context: walkthroughContext,
          config: config || {},
        },
      ])
      .select('*')
      .single()

    if (insertError || !project) {
      console.error('Supabase project insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create project',
          details: insertError?.message,
        },
        { status: 500 }
      )
    }

    let insertedSections = []
    if (Array.isArray(sections) && sections.length > 0) {
      const sectionsPayload = sections.map((section: any, index: number) => ({
        project_id: project.id,
        title: section.title,
        goal: section.goal,
        prompt: section.prompt,
        success_metrics: section.success_metrics || {},
        order_index: section.order_index ?? index,
      }))

      const { data: sectionData, error: sectionError } = await supabase
        .from('project_sections')
        .insert(sectionsPayload)
        .select('*')
        .order('order_index', { ascending: true })

      if (sectionError) {
        console.error('Supabase project sections insert error:', sectionError)
      } else {
        insertedSections = sectionData || []
      }
    }

    return NextResponse.json({
      project,
      sections: insertedSections,
    })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

