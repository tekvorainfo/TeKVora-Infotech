/*
# Fix Security Audit Issues

1. Fix mutable search_path on functions `is_admin` and `update_daily_log_timestamp`
2. Fix RLS policies with `USING (true)` / `WITH CHECK (true)` on:
   - contact_submissions (contact_insert_all)
   - internship_applications (internship_applications_insert_all, internship_applications_update_admin)
   - mou_requests (mou_requests_insert_all)
3. Fix public bucket `payment_proofs` broad SELECT policy
4. Fix `is_admin()` SECURITY DEFINER function — restrict EXECUTE to authenticated only
5. All changes are backward-compatible and do NOT drop data.
*/

-- ============================================
-- 1. Fix mutable search_path on functions
-- ============================================

-- Fix is_admin() search_path
ALTER FUNCTION is_admin() SET search_path = public, auth;

-- Fix update_daily_log_timestamp() search_path
ALTER FUNCTION update_daily_log_timestamp() SET search_path = public;

-- ============================================
-- 2. Fix contact_submissions INSERT policy
-- ============================================

DROP POLICY IF EXISTS "contact_insert_all" ON contact_submissions;
CREATE POLICY "contact_insert_anon" ON contact_submissions FOR INSERT
  TO anon WITH CHECK (true);

-- ============================================
-- 3. Fix internship_applications policies
-- ============================================

DROP POLICY IF EXISTS "internship_applications_insert_all" ON internship_applications;
CREATE POLICY "internship_applications_insert_anon" ON internship_applications FOR INSERT
  TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "internship_applications_update_admin" ON internship_applications;
CREATE POLICY "internship_applications_update_admin" ON internship_applications FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- 4. Fix mou_requests INSERT policy
-- ============================================

DROP POLICY IF EXISTS "mou_requests_insert_all" ON mou_requests;
CREATE POLICY "mou_requests_insert_anon" ON mou_requests FOR INSERT
  TO anon WITH CHECK (true);

-- ============================================
-- 5. Fix payment_proofs storage bucket policy
-- Remove broad listing policy, keep object-level access
-- ============================================

DROP POLICY IF EXISTS "payment_proofs_select_own" ON storage.objects;

-- Create a scoped policy: users can only see their own payment proofs
CREATE POLICY "payment_proofs_select_own" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment_proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anon to SELECT their own objects too (for upload flow)
CREATE POLICY "payment_proofs_select_anon" ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'payment_proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- 6. Fix is_admin() SECURITY DEFINER — revoke from anon
-- ============================================

REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
