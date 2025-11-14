import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface TestSession {
  id?: string
  test_url: string
  user_events: any[]
  conversation_history: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  survey_answers: Record<string, number>
  summary?: string
  created_at?: string
  session_duration?: number
}

