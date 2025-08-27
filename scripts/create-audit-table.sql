-- Create audit_logs table for storing important application events
-- Run this script against your Neon database to set up audit logging

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id INTEGER,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs (level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs (source);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Create GIN index for JSONB details field for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin ON audit_logs USING GIN (details);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_level_timestamp ON audit_logs (level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_source_timestamp ON audit_logs (source, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores important application events for auditing and debugging';
COMMENT ON COLUMN audit_logs.level IS 'Log level: INFO, WARNING, ERROR, CRITICAL';
COMMENT ON COLUMN audit_logs.source IS 'Source component: Audit, Performance, etc.';
COMMENT ON COLUMN audit_logs.details IS 'JSON payload with additional context';
COMMENT ON COLUMN audit_logs.user_id IS 'Optional user ID if the event is user-related';
COMMENT ON COLUMN audit_logs.request_id IS 'Optional request correlation ID';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, DELETE ON audit_logs TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO your_app_user;