-- =====================================================
-- MIGRATION 002: Create agents table
-- Stores agent/employee information
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialty TEXT,
    color TEXT DEFAULT '#3B82F6',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    working_hours JSONB DEFAULT '{
        "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
        "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
        "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
        "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
        "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
        "saturday": {"enabled": false, "start": "09:00", "end": "14:00"},
        "sunday": {"enabled": false, "start": "09:00", "end": "14:00"}
    }'::JSONB,
    appointment_duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE agents IS 'Agent/employee records who handle appointments';
COMMENT ON COLUMN agents.color IS 'Calendar display color in hex format';
COMMENT ON COLUMN agents.working_hours IS 'Weekly working schedule in JSON format';
