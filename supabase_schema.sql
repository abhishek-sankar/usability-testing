-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  prototype_url TEXT,
  intro_script TEXT,
  walkthrough_context TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Project sections table
CREATE TABLE IF NOT EXISTS project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT,
  prompt TEXT,
  success_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_order ON project_sections(project_id, order_index);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_url TEXT NOT NULL,
  user_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  survey_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE test_sessions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE test_sessions
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC;

CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON test_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_url ON test_sessions(test_url);
CREATE INDEX IF NOT EXISTS idx_test_sessions_project_id ON test_sessions(project_id);

-- Project sessions table (lookup between projects and sessions)
CREATE TABLE IF NOT EXISTS project_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  notes TEXT,
  sentiment_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);

-- Row Level Security configuration
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on project_sections" ON project_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on test_sessions" ON test_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on project_sessions" ON project_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

