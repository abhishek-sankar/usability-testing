-- Create test_sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_url TEXT NOT NULL,
  user_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  survey_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER, -- Duration in seconds
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON test_sessions(created_at DESC);

-- Create index on test_url for filtering
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_url ON test_sessions(test_url);

-- Enable Row Level Security (RLS)
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (we'll handle auth at application level)
-- For production, you may want to restrict this based on your auth setup
CREATE POLICY "Allow all operations for authenticated users" ON test_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

