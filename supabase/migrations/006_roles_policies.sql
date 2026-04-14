-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'agent');

-- Add role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'agent';

-- Create policies for roles
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Supervisors can view agents" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );
