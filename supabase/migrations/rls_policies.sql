-- =====================================================
-- MIGRATION 008: Create RLS Policies
-- Row Level Security policies for all tables
-- =====================================================

-- =====================================================
-- Profiles RLS Policies
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- View all profiles (for admins and supervisors)
CREATE POLICY "profiles_select_all"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'supervisor')
        )
        OR auth.uid() = id
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_admin_all"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );


-- =====================================================
-- Agents RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "agents_select_all" ON agents;
DROP POLICY IF EXISTS "agents_insert_admin" ON agents;
DROP POLICY IF EXISTS "agents_update_admin" ON agents;
DROP POLICY IF EXISTS "agents_delete_admin" ON agents;

-- Everyone can view agents (for scheduling)
CREATE POLICY "agents_select_all"
    ON agents FOR SELECT
    USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Only admins can insert agents
CREATE POLICY "agents_insert_admin"
    ON agents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update agents
CREATE POLICY "agents_update_admin"
    ON agents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete agents
CREATE POLICY "agents_delete_admin"
    ON agents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- =====================================================
-- Clients RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "clients_select_all" ON clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_update_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON clients;

-- Authenticated users can view clients
CREATE POLICY "clients_select_all"
    ON clients FOR SELECT
    USING (auth.role() = 'authenticated');

-- Authenticated users can insert clients
CREATE POLICY "clients_insert_authenticated"
    ON clients FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update clients
CREATE POLICY "clients_update_authenticated"
    ON clients FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Only admins can delete clients
CREATE POLICY "clients_delete_admin"
    ON clients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- =====================================================
-- Appointments RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "appointments_select_own_agent" ON appointments;
DROP POLICY IF EXISTS "appointments_select_admin" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_authenticated" ON appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON appointments;
DROP POLICY IF EXISTS "appointments_update_admin" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON appointments;

-- Agents can view their own appointments
CREATE POLICY "appointments_select_own_agent"
    ON appointments FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- Authenticated users can insert appointments
CREATE POLICY "appointments_insert_authenticated"
    ON appointments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Agents can update their own appointments
CREATE POLICY "appointments_update_own"
    ON appointments FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- Admins can update any appointment
CREATE POLICY "appointments_update_admin"
    ON appointments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete appointments
CREATE POLICY "appointments_delete_admin"
    ON appointments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- =====================================================
-- Notifications RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_select_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- Service role can insert notifications
CREATE POLICY "notifications_insert_service"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() IN ('service_role', 'authenticated'));

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- =====================================================
-- Audit Log RLS Policies
-- =====================================================

-- Only admins can view audit log
CREATE POLICY "audit_log_select_admin"
    ON audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );
