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

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found', details: error?.message },
        { status: 404 }
      )
    }

    const { data: sections } = await supabase
      .from('project_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    return NextResponse.json({
      project,
      sections: sections || [],
    })
  } catch (error) {
    console.error('Project GET error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json()
    const {
      name,
      description,
      status,
      prototypeUrl,
      introScript,
      walkthroughContext,
      config,
      sections,
    } = body

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...(name && { name }),
        description,
        status,
        prototype_url: prototypeUrl,
        intro_script: introScript,
        walkthrough_context: walkthroughContext,
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select('*')
      .single()

    if (error || !project) {
      return NextResponse.json(
        {
          error: 'Failed to update project',
          details: error?.message,
        },
        { status: 500 }
      )
    }

    let updatedSections = []
    if (Array.isArray(sections)) {
      await supabase.from('project_sections').delete().eq('project_id', projectId)

      if (sections.length > 0) {
        const payload = sections.map((section: any, index: number) => ({
          project_id: projectId,
          title: section.title,
          goal: section.goal,
          prompt: section.prompt,
          success_metrics: section.success_metrics || {},
          order_index: section.order_index ?? index,
        }))

        const { data: sectionData, error: sectionError } = await supabase
          .from('project_sections')
          .insert(payload)
          .select('*')
          .order('order_index', { ascending: true })

        if (sectionError) {
          console.error('Project sections update error:', sectionError)
        } else {
          updatedSections = sectionData || []
        }
      }
    } else {
      const { data: existingSections } = await supabase
        .from('project_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      updatedSections = existingSections || []
    }

    return NextResponse.json({
      project,
      sections: updatedSections,
    })
  } catch (error) {
    console.error('Project PUT error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete project', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

