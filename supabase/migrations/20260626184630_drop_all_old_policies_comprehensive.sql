/*
# Drop ALL old policies that use auth.jwt() role check
# Keep only the new is_admin() based policies
*/

-- INTERNSHIP_APPLICATIONS: drop old ones, keep new
DROP POLICY IF EXISTS "applications_select_admin" ON internship_applications;
DROP POLICY IF EXISTS "applications_insert_all" ON internship_applications;
DROP POLICY IF EXISTS "applications_update_admin" ON internship_applications;
DROP POLICY IF EXISTS "applications_delete_admin" ON internship_applications;

-- COURSE_ENROLLMENTS: drop old ones
DROP POLICY IF EXISTS "enrollments_select_own" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_update_admin" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_delete_admin" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_student" ON course_enrollments;

-- STUDENT_PROFILES: drop old ones
DROP POLICY IF EXISTS "profiles_select_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON student_profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON student_profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON student_profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_select_own" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_own" ON student_profiles;

-- INTERN_PROFILES: drop old ones
DROP POLICY IF EXISTS "intern_profiles_select" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_select_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_insert_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_update_own" ON intern_profiles;
DROP POLICY IF EXISTS "intern_profiles_delete_admin" ON intern_profiles;

-- INTERN_TASKS: drop old ones
DROP POLICY IF EXISTS "tasks_select" ON intern_tasks;
DROP POLICY IF EXISTS "tasks_select_admin" ON intern_tasks;
DROP POLICY IF EXISTS "tasks_insert_admin" ON intern_tasks;
DROP POLICY IF EXISTS "tasks_update_admin" ON intern_tasks;
DROP POLICY IF EXISTS "tasks_delete_admin" ON intern_tasks;

-- CERTIFICATES: drop old ones
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON certificates;
DROP POLICY IF EXISTS "certificates_delete_admin" ON certificates;

-- MOU_REQUESTS: drop old ones
DROP POLICY IF EXISTS "mou_select_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_select_admin" ON mou_requests;
DROP POLICY IF EXISTS "mou_insert_all" ON mou_requests;
DROP POLICY IF EXISTS "mou_update_admin" ON mou_requests;
DROP POLICY IF EXISTS "mou_delete_admin" ON mou_requests;

-- AUDIT_LOGS: drop old ones
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_update_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_delete_admin" ON audit_logs;
