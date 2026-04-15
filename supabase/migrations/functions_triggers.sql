-- =====================================================
-- MIGRATION 007: Create functions and triggers
-- Auto-update timestamps and helper functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- Function to check agent availability
-- =====================================================
CREATE OR REPLACE FUNCTION check_agent_availability(
    p_agent_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicting_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflicting_count
    FROM appointments
    WHERE agent_id = p_agent_id
      AND status NOT IN ('cancelled')
      AND id != COALESCE(p_exclude_appointment_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (
          (start_time <= p_start_time AND end_time > p_start_time)
          OR (start_time < p_end_time AND end_time >= p_end_time)
          OR (start_time >= p_start_time AND end_time <= p_end_time)
      );
    
    RETURN conflicting_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_agent_availability IS 
'Checks if an agent is available during the specified time slot';


-- =====================================================
-- Function to get agent working hours for a specific day
-- =====================================================
CREATE OR REPLACE FUNCTION get_agent_working_hours(
    p_agent_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_working_hours JSONB;
    v_day_name TEXT;
BEGIN
    v_day_name := LOWER(TO_CHAR(p_date, 'Day'));
    
    SELECT working_hours -> v_day_name INTO v_working_hours
    FROM agents
    WHERE id = p_agent_id;
    
    RETURN v_working_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Function to create notification for appointment
-- =====================================================
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_client_phone TEXT;
    v_client_email TEXT;
    v_agent_name TEXT;
    v_client_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'scheduled' THEN
        -- Get client info
        SELECT phone, COALESCE(email, '') INTO v_client_phone, v_client_email
        FROM clients WHERE id = NEW.client_id;
        
        -- Get agent info
        SELECT full_name INTO v_agent_name
        FROM agents WHERE id = NEW.agent_id;
        
        -- Get client name
        SELECT full_name INTO v_client_name
        FROM clients WHERE id = NEW.client_id;
        
        -- Create in-app notification
        INSERT INTO notifications (
            appointment_id,
            agent_id,
            client_id,
            type,
            recipient,
            recipient_name,
            subject,
            message,
            scheduled_for,
            status
        ) VALUES (
            NEW.id,
            NEW.agent_id,
            NEW.client_id,
            'in_app',
            v_client_email,
            v_client_name,
            'Nueva cita programada',
            'Se ha programado una nueva cita para el ' || 
            TO_CHAR(NEW.start_time, 'DD/MM/YYYY HH24:MI') ||
            ' con ' || v_agent_name,
            NEW.start_time - (NEW.reminder_minutes_before || ' minutes')::INTERVAL,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_appointment_notification
    AFTER INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION create_appointment_notification();


-- =====================================================
-- Function to update reminder_sent status
-- =====================================================
CREATE OR REPLACE FUNCTION mark_reminder_sent()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.reminder_sent = false AND NEW.reminder_sent = true THEN
        UPDATE notifications
        SET status = 'sent', sent_at = NOW()
        WHERE appointment_id = NEW.id 
          AND type = 'in_app'
          AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_reminder_sent
    AFTER UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION mark_reminder_sent();


-- =====================================================
-- Function to cancel related notifications on appointment cancellation
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE notifications
        SET status = 'failed',
            error_message = 'Appointment cancelled'
        WHERE appointment_id = NEW.id
          AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cancel_appointment_notifications
    AFTER UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION cancel_appointment_notifications();


-- =====================================================
-- Function to get appointments summary for dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_agent_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_appointments BIGINT,
    scheduled_count BIGINT,
    completed_count BIGINT,
    cancelled_count BIGINT,
    no_show_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE a.status = 'scheduled')::BIGINT,
        COUNT(*) FILTER (WHERE a.status = 'completed')::BIGINT,
        COUNT(*) FILTER (WHERE a.status = 'cancelled')::BIGINT,
        COUNT(*) FILTER (WHERE a.status = 'no_show')::BIGINT
    FROM appointments a
    WHERE 
        (p_agent_id IS NULL OR a.agent_id = p_agent_id)
        AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
