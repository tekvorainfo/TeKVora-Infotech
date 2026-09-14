-- Migration: Fix backend security and RLS policy issues
-- Summary of Changes:
-- 1. Reverted is_admin() function to SECURITY DEFINER to avoid permission errors when queried by authenticated users.
-- 2. Fixed search_path on is_admin() to prevent search_path hijacking.
-- 3. Revoked execution privileges on is_admin() from public/anon and granted it only to authenticated users.
-- 4. Synced admin emails with frontend by validating ('admin@tekvora.com', 'vaibhav@tekvora.com') in is_admin().
-- 5. Removed dead 'payment_proofs_select_anon' policy from storage.objects.

-- 1. Fix is_admin() privilege context, email list, search_path, and grants
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN ('admin@tekvora.com', 'vaibhav@tekvora.com')
  );
END;
$$;

-- Revoke default execute on the function from public and anon
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Grant execute on the function to authenticated only
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Drop the dead payment_proofs_select_anon policy from storage.objects
DROP POLICY IF EXISTS "payment_proofs_select_anon" ON storage.objects;
