/*
# Fix Admin RLS Policies and Mobile Navbar

1. Problem: Admin RLS policies check `auth.jwt()->>'role' = 'admin'` but the admin user doesn't have this role set.
2. Problem: Mobile navbar hamburger menu not working.

## Changes:
- Update admin user metadata to include role='admin'
- Create a helper function `is_admin()` that checks if the current user is the admin by email
- Update ALL table RLS policies to use the new `is_admin()` function instead of JWT role check
*/

-- Update admin user metadata to include role
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'admin@tekvora.com';

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@tekvora.com'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- ============================================
-- FIX ALL TABLE POLICIES
-- ============================================

-- 1. STUDENT_PROFILES - Allow admin to read all
DROP POLICY IF EXISTS "student_profiles_select_admin" ON student_profiles;
CREATE POLICY "student_profiles_select_admin"
ON student_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "student_profiles_update_admin" ON student_profiles;
CREATE POLICY "student_profiles_update_admin"
ON student_profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS "student_profiles_delete_admin" ON student_profiles;
CREATE POLICY "student_profiles_delete_admin"
ON student_profiles FOR DELETE
TO authenticated
USING (is_admin());

-- 2. COURSE_ENROLLMENTS - Allow admin full access
DROP POLICY IF EXISTS "course_enrollments_select_admin" ON course_enrollments;
CREATE POLICY "course_enrollments_select_admin"
ON course_enrollments FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = student_id);

DROP POLICY IF EXISTS "course_enrollments_update_admin" ON course_enrollments;
CREATE POLICY "course_enrollments_update_admin"
ON course_enrollments FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = student_id)
WITH CHECK (is_admin() OR auth.uid() = student_id);

DROP POLICY IF EXISTS "course_enrollments_delete_admin" ON course_enrollments;
CREATE POLICY "course_enrollments_delete_admin"
ON course_enrollments FOR DELETE
TO authenticated
USING (is_admin());

-- 3. INTERNSHIP_APPLICATIONS - Allow admin full access
DROP POLICY IF EXISTS "internship_applications_select_admin" ON internship_applications;
CREATE POLICY "internship_applications_select_admin"
ON internship_applications FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "internship_applications_update_admin" ON internship_applications;
CREATE POLICY "internship_applications_update_admin"
ON internship_applications FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS "internship_applications_delete_admin" ON internship_applications;
CREATE POLICY "internship_applications_delete_admin"
ON internship_applications FOR DELETE
TO authenticated
USING (is_admin());

-- 4. INTERN_PROFILES - Allow admin full access
DROP POLICY IF EXISTS "intern_profiles_select_admin" ON intern_profiles;
CREATE POLICY "intern_profiles_select_admin"
ON intern_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "intern_profiles_update_admin" ON intern_profiles;
CREATE POLICY "intern_profiles_update_admin"
ON intern_profiles FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "intern_profiles_delete_admin" ON intern_profiles;
CREATE POLICY "intern_profiles_delete_admin"
ON intern_profiles FOR DELETE
TO authenticated
USING (is_admin());

-- 5. INTERN_TASKS - Allow admin full access
DROP POLICY IF EXISTS "intern_tasks_select_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_select_admin"
ON intern_tasks FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "intern_tasks_update_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_update_admin"
ON intern_tasks FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS "intern_tasks_delete_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_delete_admin"
ON intern_tasks FOR DELETE
TO authenticated
USING (is_admin());

-- 6. CERTIFICATES - Allow admin full access
DROP POLICY IF EXISTS "certificates_update_admin" ON certificates;
CREATE POLICY "certificates_update_admin"
ON certificates FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;
CREATE POLICY "certificates_delete_admin"
ON certificates FOR DELETE
TO authenticated
USING (is_admin());

-- 7. MOU_REQUESTS - Allow admin full access
DROP POLICY IF EXISTS "mou_requests_select_admin" ON mou_requests;
CREATE POLICY "mou_requests_select_admin"
ON mou_requests FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "mou_requests_update_admin" ON mou_requests;
CREATE POLICY "mou_requests_update_admin"
ON mou_requests FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS "mou_requests_delete_admin" ON mou_requests;
CREATE POLICY "mou_requests_delete_admin"
ON mou_requests FOR DELETE
TO authenticated
USING (is_admin());

-- 8. AUDIT_LOGS - Allow admin full access
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
CREATE POLICY "audit_select_admin"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "audit_insert_admin" ON audit_logs;
CREATE POLICY "audit_insert_admin"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "audit_update_admin" ON audit_logs;
CREATE POLICY "audit_update_admin"
ON audit_logs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "audit_delete_admin" ON audit_logs;
CREATE POLICY "audit_delete_admin"
ON audit_logs FOR DELETE
TO authenticated
USING (is_admin());
