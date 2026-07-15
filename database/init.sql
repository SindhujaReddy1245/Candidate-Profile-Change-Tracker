-- Candidate Profile Change Tracker - PostgreSQL schema
-- Run this in pgAdmin, psql, or the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(150),
  role VARCHAR(30) NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  storage_provider VARCHAR(40) NOT NULL DEFAULT 'local',
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, version)
);

CREATE TABLE IF NOT EXISTS changes (
  id BIGSERIAL PRIMARY KEY,
  resume_id BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  classification VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_version ON resumes(candidate_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_changes_resume_id ON changes(resume_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Demo data. Replace the password_hash from your backend-generated hash before production use.
INSERT INTO candidates (id, full_name, email, phone)
VALUES (1, 'Demo Candidate', 'candidate@example.com', '+1 555 0100')
ON CONFLICT (id) DO NOTHING;
