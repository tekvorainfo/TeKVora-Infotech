/*
# Cleanup remaining old policies on student_profiles
*/

-- Drop old policies that still use auth.jwt() role check
DROP POLICY IF EXISTS "student_profiles_select_own" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_own" ON student_profiles;

-- Also drop old enrollment insert policy
DROP POLICY IF EXISTS "enrollments_insert_student" ON course_enrollments;
