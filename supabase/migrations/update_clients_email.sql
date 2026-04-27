-- =====================================================
-- MIGRATION: Update clients table for OTP auth
-- Ensures email is unique and required
-- =====================================================

ALTER TABLE clients 
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT clients_email_unique UNIQUE (email);
