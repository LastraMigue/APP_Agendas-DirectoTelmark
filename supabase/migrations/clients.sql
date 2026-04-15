-- =====================================================
-- MIGRATION 003: Create clients table
-- Stores client/customer information (anonymous)
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_full_name ON clients(full_name);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE clients IS 'Client records for appointment scheduling';
