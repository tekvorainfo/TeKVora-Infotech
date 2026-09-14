/*
# Fix Remaining Security Audit Issues

1. Update contact_submissions policies to use is_admin() instead of old JWT role check
2. Update mou_requests SELECT policy to use is_admin() instead of true
3. Fix is_admin() to SECURITY INVOKER (safer — no privilege escalation)
4. Verify anon cannot execute is_admin()
*/

-- Fix contact_submissions policies to use is_admin()
DROP POLICY IF EXISTS "contact_select_admin" ON contact_submissions;
CREATE POLICY "contact_select_admin" ON contact_submissions FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "contact_update_admin" ON contact_submissions;
CREATE POLICY "contact_update_admin" ON contact_submissions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "contact_delete_admin" ON contact_submissions;
CREATE POLICY "contact_delete_admin" ON contact_submissions FOR DELETE
  TO authenticated USING (is_admin());

-- Fix mou_requests SELECT policy
DROP POLICY IF EXISTS "mou_requests_select_all" ON mou_requests;
CREATE POLICY "mou_requests_select_admin" ON mou_requests FOR SELECT
  TO authenticated USING (is_admin());

-- Fix is_admin() to SECURITY INVOKER (safer)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@tekvora.com'
  );
END;
$$;

-- Only authenticated users can execute is_admin
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
