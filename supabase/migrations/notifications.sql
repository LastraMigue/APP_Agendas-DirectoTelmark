-- =====================================================
-- MIGRATION 005: Create notifications table
-- Stores notifications and reminders for appointments
-- =====================================================

-- Create enum types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'email',
        'sms',
        'whatsapp',
        'in_app'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM (
        'pending',
        'sent',
        'failed',
        'read'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type notification_type DEFAULT 'in_app',
    recipient TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status notification_status DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) 
    WHERE status = 'pending';
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE notifications IS 'Notification and reminder records for appointments';
COMMENT ON COLUMN notifications.type IS 'Channel: email, sms, whatsapp, in_app';
