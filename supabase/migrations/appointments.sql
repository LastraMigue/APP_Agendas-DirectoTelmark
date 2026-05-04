-- =====================================================
-- MIGRATION 004: Create appointments table
-- Core table for scheduling and managing appointments
-- =====================================================

-- Create enum type for appointment status
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'scheduled',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum type for appointment priority
DO $$ BEGIN
    CREATE TYPE appointment_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    status appointment_status DEFAULT 'scheduled',
    priority appointment_priority DEFAULT 'normal',
    location TEXT,
    meeting_link TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_minutes_before INTEGER DEFAULT 30,
    cancelled_reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_end_time ON appointments(end_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);
CREATE INDEX idx_appointments_agent_date ON appointments(agent_id, start_time);

-- Composite index for calendar queries
CREATE INDEX idx_appointments_calendar ON appointments(agent_id, start_time, end_time) 
    WHERE status NOT IN ('cancelled', 'completed');

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE appointments IS 'Appointment records linking agents with clients';
COMMENT ON COLUMN appointments.status IS 'Current status: scheduled, confirmed, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN appointments.priority IS 'Priority level: low, normal, high, urgent';
