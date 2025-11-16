import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface Project {
  id?: string
  name: string
  description?: string
  status?: 'draft' | 'live' | 'offline' | 'template'
  prototype_url?: string
  intro_script?: string
  walkthrough_context?: string
  config?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ProjectSection {
  id?: string
  project_id: string
  title: string
  goal?: string
  prompt?: string
  success_metrics?: Record<string, any>
  order_index?: number
  created_at?: string
}

export interface TestSession {
  id?: string
  project_id?: string | null
  test_url: string
  user_events: any[]
  conversation_history: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  survey_answers: Record<string, number>
  summary?: string
  sentiment_score?: number
  created_at?: string
  session_duration?: number
}

export interface ProjectSession {
  id?: string
  project_id: string
  session_id: string
  notes?: string
  sentiment_score?: number
  created_at?: string
}

