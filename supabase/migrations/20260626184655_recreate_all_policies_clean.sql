/*
# Recreate ALL RLS policies cleanly using only is_admin()
# No auth.jwt() role checks - everything goes through is_admin() function
*/

-- ============================================
-- 1. STUDENT_PROFILES
-- ============================================
DROP POLICY IF EXISTS "student_profiles_select_admin" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert_own" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_admin" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_delete_admin" ON student_profiles;

CREATE POLICY "student_profiles_select_admin"
ON student_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = id);

CREATE POLICY "student_profiles_insert_own"
ON student_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "student_profiles_update_admin"
ON student_profiles FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = id)
WITH CHECK (is_admin() OR auth.uid() = id);

CREATE POLICY "student_profiles_delete_admin"
ON student_profiles FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 2. COURSE_ENROLLMENTS
-- ============================================
DROP POLICY IF EXISTS "course_enrollments_select_admin" ON course_enrollments;
DROP POLICY IF EXISTS "course_enrollments_insert_own" ON course_enrollments;
DROP POLICY IF EXISTS "course_enrollments_update_admin" ON course_enrollments;
DROP POLICY IF EXISTS "course_enrollments_delete_admin" ON course_enrollments;

CREATE POLICY "course_enrollments_select_admin"
ON course_enrollments FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = student_id);

CREATE POLICY "course_enrollments_insert_own"
ON course_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "course_enrollments_update_admin"
ON course_enrollments FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = student_id)
WITH CHECK (is_admin() OR auth.uid() = student_id);

CREATE POLICY "course_enrollments_delete_admin"
ON course_enrollments FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 3. INTERNSHIP_APPLICATIONS
-- ============================================
DROP POLICY IF EXISTS "internship_applications_select_admin" ON internship_applications;
DROP POLICY IF EXISTS "internship_applications_insert_all" ON internship_applications;
DROP POLICY IF EXISTS "internship_applications_update_admin" ON internship_applications;
DROP POLICY IF EXISTS "internship_applications_delete_admin" ON internship_applications;

CREATE POLICY "internship_applications_select_admin"
ON internship_applications FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "internship_applications_insert_all"
ON internship_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "internship_applications_update_admin"
ON internship_applications FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (true);

CREATE POLICY "internship_applications_delete_admin"
ON internship_applications FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 4. INTERN_PROFILES
-- ============================================
DROP POLICY IF EXISTS "intern_profiles_select_admin" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_insert_admin" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_update_admin" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_delete_admin" ON intern_profiles;

CREATE POLICY "intern_profiles_select_admin"
ON intern_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "intern_profiles_insert_admin"
ON intern_profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "intern_profiles_update_admin"
ON intern_profiles FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);

CREATE POLICY "intern_profiles_delete_admin"
ON intern_profiles FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 5. INTERN_TASKS
-- ============================================
DROP POLICY IF EXISTS "intern_tasks_select_admin" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_insert_admin" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_update_admin" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_delete_admin" ON intern_tasks;

CREATE POLICY "intern_tasks_select_admin"
ON intern_tasks FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "intern_tasks_insert_admin"
ON intern_tasks FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "intern_tasks_update_admin"
ON intern_tasks FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "intern_tasks_delete_admin"
ON intern_tasks FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 6. CERTIFICATES
-- ============================================
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;

CREATE POLICY "certificates_select_all"
ON certificates FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "certificates_insert_admin"
ON certificates FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "certificates_update_admin"
ON certificates FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "certificates_delete_admin"
ON certificates FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 7. MOU_REQUESTS
-- ============================================
DROP POLICY IF EXISTS "mou_requests_select_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_requests_select_admin" ON mou_requests;
DROP POLICY IF EXISTS "mou_requests_insert_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_requests_update_admin" ON mou_requests;
DROP POLICY IF EXISTS "mou_requests_delete_admin" ON mou_requests;

CREATE POLICY "mou_requests_select_all"
ON mou_requests FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "mou_requests_insert_all"
ON mou_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "mou_requests_update_admin"
ON mou_requests FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "mou_requests_delete_admin"
ON mou_requests FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 8. AUDIT_LOGS
-- ============================================
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_update_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_admin" ON audit_logs;

CREATE POLICY "audit_logs_select_admin"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "audit_logs_insert_admin"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "audit_logs_update_admin"
ON audit_logs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "audit_logs_delete_admin"
ON audit_logs FOR DELETE
TO authenticated
USING (is_admin());
