-- =====================================================
-- MIGRATION: Fix client login RLS issue
-- Create security definer function to check client email existence
-- bypassing RLS for unauthenticated login/registration checks
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_client_email_exists(search_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM clients WHERE email = search_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_client_email_exists(TEXT) TO anon, authenticated;
