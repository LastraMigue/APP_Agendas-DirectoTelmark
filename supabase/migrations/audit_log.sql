-- =====================================================
-- MIGRATION 006: Create audit log table
-- Tracks all changes made to the database
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Enable RLS (only admins can view, system inserts)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow inserts by service role
CREATE POLICY "Service role can insert audit logs"
    ON audit_log FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE audit_log IS 'Audit trail for all database changes';
