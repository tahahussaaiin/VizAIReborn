-- VizAI Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects tracking with comprehensive metadata
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  row_count int NOT NULL,
  column_count int NOT NULL,
  generation_progress int DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100),
  phase text DEFAULT 'idle' CHECK (phase IN ('idle','analyzing','selecting','generating','exporting','failed')),
  selected_metaphor jsonb,
  suggested_metaphors jsonb,
  visualization_code jsonb,
  token_usage jsonb DEFAULT '{"total_input":0,"total_output":0,"cost_usd":0}',
  status text DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','error')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI conversation context for resumability
CREATE TABLE IF NOT EXISTS ai_generation_context (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE PRIMARY KEY,
  conversation_history jsonb DEFAULT '[]',
  compact_summary text,
  current_step text,
  step_results jsonb DEFAULT '{}', -- Stores analysis results, metaphors, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job queue for rate limiting and reliability
CREATE TABLE IF NOT EXISTS job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  function_name text NOT NULL CHECK (function_name IN ('analyze-csv','generate-visualization')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','failed','completed')),
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Rate limiting enforcement
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requests_this_minute int DEFAULT 0,
  daily_cost_usd decimal(10,4) DEFAULT 0,
  daily_reset_at timestamptz DEFAULT (current_date + interval '1 day'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Telemetry and performance metrics
CREATE TABLE IF NOT EXISTS telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  events jsonb DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  summary jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(daily_reset_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_queue_project_status ON job_queue(project_id, status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- AI context policies
CREATE POLICY "Users can access own AI context" ON ai_generation_context
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Job queue policies
CREATE POLICY "Users can view own jobs" ON job_queue
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create own jobs" ON job_queue
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Rate limits policies
CREATE POLICY "Users can view own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON rate_limits
  FOR ALL USING (true); -- Will be restricted by service role key

-- Telemetry policies
CREATE POLICY "Users can view own telemetry" ON telemetry
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generation_context_updated_at BEFORE UPDATE ON ai_generation_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();