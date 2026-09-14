/*
# Cleanup Duplicate RLS Policies

Problem: Old policies with `auth.jwt()->>'role' = 'admin'` still exist alongside new `is_admin()` policies.
PostgreSQL evaluates all matching policies with OR, so the old broken policies cause issues.

Solution: Drop ALL old policies and keep only the new `is_admin()` based ones.
*/

-- Drop ALL old policies that use auth.jwt() role check (they have the old naming pattern)
DROP POLICY IF EXISTS "applications_select_admin" ON internship_applications;
DROP POLICY IF EXISTS "applications_insert_all" ON internship_applications;
DROP POLICY IF EXISTS "applications_update_admin" ON internship_applications;
DROP POLICY IF EXISTS "applications_delete_admin" ON internship_applications;

-- Drop old enrollment policies
DROP POLICY IF EXISTS "enrollments_select_own" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_update_admin" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_delete_admin" ON course_enrollments;

-- Drop old student profile policies
DROP POLICY IF EXISTS "profiles_select_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON student_profiles;

-- Drop old intern profile policies
DROP POLICY IF EXISTS "intern_profiles_select_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_insert_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_update_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_delete_admin" ON intern_profiles;

-- Drop old intern task policies
DROP POLICY IF EXISTS "intern_tasks_select_all" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_insert_admin" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_update_admin" ON intern_tasks;
DROP POLICY IF EXISTS "intern_tasks_delete_admin" ON intern_tasks;

-- Drop old certificate policies
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;

-- Drop old MOU policies
DROP POLICY IF EXISTS "mou_select_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_insert_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_update_admin" ON mou_requests;
DROP POLICY IF EXISTS "mou_delete_admin" ON mou_requests;

-- Drop old audit log policies
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_update_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_delete_admin" ON audit_logs;

-- ============================================
-- CREATE CLEAN, WORKING POLICIES
-- ============================================

-- 1. INTERNSHIP_APPLICATIONS
DROP POLICY IF EXISTS "internship_applications_select_admin" ON internship_applications;
CREATE POLICY "internship_applications_select_admin"
ON internship_applications FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "internship_applications_insert_all" ON internship_applications;
CREATE POLICY "internship_applications_insert_all"
ON internship_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

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

-- 2. COURSE_ENROLLMENTS
DROP POLICY IF EXISTS "course_enrollments_select_admin" ON course_enrollments;
CREATE POLICY "course_enrollments_select_admin"
ON course_enrollments FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = student_id);

DROP POLICY IF EXISTS "course_enrollments_insert_own" ON course_enrollments;
CREATE POLICY "course_enrollments_insert_own"
ON course_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

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

-- 3. STUDENT_PROFILES
DROP POLICY IF EXISTS "student_profiles_select_admin" ON student_profiles;
CREATE POLICY "student_profiles_select_admin"
ON student_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "student_profiles_insert_own" ON student_profiles;
CREATE POLICY "student_profiles_insert_own"
ON student_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "student_profiles_update_admin" ON student_profiles;
CREATE POLICY "student_profiles_update_admin"
ON student_profiles FOR UPDATE
TO authenticated
USING (is_admin() OR auth.uid() = id)
WITH CHECK (is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "student_profiles_delete_admin" ON student_profiles;
CREATE POLICY "student_profiles_delete_admin"
ON student_profiles FOR DELETE
TO authenticated
USING (is_admin());

-- 4. INTERN_PROFILES
DROP POLICY IF EXISTS "intern_profiles_select_admin" ON intern_profiles;
CREATE POLICY "intern_profiles_select_admin"
ON intern_profiles FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "intern_profiles_insert_admin" ON intern_profiles;
CREATE POLICY "intern_profiles_insert_admin"
ON intern_profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

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

-- 5. INTERN_TASKS
DROP POLICY IF EXISTS "intern_tasks_select_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_select_admin"
ON intern_tasks FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "intern_tasks_insert_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_insert_admin"
ON intern_tasks FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "intern_tasks_update_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_update_admin"
ON intern_tasks FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "intern_tasks_delete_admin" ON intern_tasks;
CREATE POLICY "intern_tasks_delete_admin"
ON intern_tasks FOR DELETE
TO authenticated
USING (is_admin());

-- 6. CERTIFICATES
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
CREATE POLICY "certificates_select_all"
ON certificates FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "certificates_insert_admin" ON certificates;
CREATE POLICY "certificates_insert_admin"
ON certificates FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "certificates_update_admin" ON certificates;
CREATE POLICY "certificates_update_admin"
ON certificates FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;
CREATE POLICY "certificates_delete_admin"
ON certificates FOR DELETE
TO authenticated
USING (is_admin());

-- 7. MOU_REQUESTS
DROP POLICY IF EXISTS "mou_requests_select_all" ON mou_requests;
CREATE POLICY "mou_requests_select_all"
ON mou_requests FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "mou_requests_insert_all" ON mou_requests;
CREATE POLICY "mou_requests_insert_all"
ON mou_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "mou_requests_update_admin" ON mou_requests;
CREATE POLICY "mou_requests_update_admin"
ON mou_requests FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "mou_requests_delete_admin" ON mou_requests;
CREATE POLICY "mou_requests_delete_admin"
ON mou_requests FOR DELETE
TO authenticated
USING (is_admin());

-- 8. AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_admin" ON audit_logs;
CREATE POLICY "audit_logs_insert_admin"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "audit_logs_update_admin" ON audit_logs;
CREATE POLICY "audit_logs_update_admin"
ON audit_logs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "audit_logs_delete_admin" ON audit_logs;
CREATE POLICY "audit_logs_delete_admin"
ON audit_logs FOR DELETE
TO authenticated
USING (is_admin());
