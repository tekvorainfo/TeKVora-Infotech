-- ============================================================================
-- TeKVora Infotech - Complete Consolidated Supabase Backend Schema
-- ============================================================================
-- How to deploy:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the "SQL Editor" section in the left sidebar.
-- 3. Click "New Query" and paste the contents of this file.
-- 4. Click "Run" to initialize all tables, triggers, security policies, and seed data.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Clean Up / Table Drop
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_daily_log_timestamp() CASCADE;

DROP TABLE IF EXISTS public.task_comments CASCADE;
DROP TABLE IF EXISTS public.task_submissions CASCADE;
DROP TABLE IF EXISTS public.email_notifications CASCADE;
DROP TABLE IF EXISTS public.scheduled_classes CASCADE;
DROP TABLE IF EXISTS public.study_group_members CASCADE;
DROP TABLE IF EXISTS public.study_groups CASCADE;
DROP TABLE IF EXISTS public.showcase_likes CASCADE;
DROP TABLE IF EXISTS public.showcase_projects CASCADE;
DROP TABLE IF EXISTS public.mentorship_requests CASCADE;
DROP TABLE IF EXISTS public.mentors CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.forum_replies CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;

DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.mou_partners CASCADE;
DROP TABLE IF EXISTS public.mou_requests CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.intern_daily_logs CASCADE;
DROP TABLE IF EXISTS public.intern_tasks CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.internship_applications CASCADE;
DROP TABLE IF EXISTS public.intern_profiles CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.internships CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- ----------------------------------------------------------------------------
-- 2. Table Creation
-- ----------------------------------------------------------------------------

-- Admin and Mentor Users
CREATE TABLE public.admin_users (
  email text PRIMARY KEY,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'mentor')),
  created_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  duration text,
  skills text[],
  instructor text DEFAULT 'Mr. Vaibhav Tambe',
  type text DEFAULT 'Paid',
  certificate_eligible boolean DEFAULT true,
  thumbnail_url text,
  status text DEFAULT 'active',
  fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Internships table
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  duration text DEFAULT '1 Month',
  mode text DEFAULT 'Remote',
  certificate boolean DEFAULT true,
  skills text[],
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Student Profiles (linked to auth.users)
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  profile_photo_url text,
  is_active boolean DEFAULT true,
  github_username text,
  xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  last_login_date date,
  created_at timestamptz DEFAULT now()
);

-- Intern Profiles
CREATE TABLE public.intern_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  intern_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  internship_id uuid REFERENCES public.internships(id) ON DELETE SET NULL,
  internship_title text,
  status text DEFAULT 'active',
  start_date date,
  end_date date,
  offer_letter_url text,
  must_change_password boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Internship Applications
CREATE TABLE public.internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid REFERENCES public.internships(id) ON DELETE SET NULL,
  internship_title text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  college text NOT NULL,
  year_of_study text NOT NULL,
  branch text NOT NULL,
  city text NOT NULL,
  motivation text NOT NULL,
  resume_url text,
  stage text DEFAULT 'applied',
  interview_date timestamptz,
  interview_mode text,
  interview_link text,
  rejection_reason text,
  stipend text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Course Enrollments
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  course_id text NOT NULL, -- Matched to course list id text
  status text DEFAULT 'pending_payment',
  payment_proof_url text,
  payment_approved boolean DEFAULT false,
  rejection_reason text,
  enrolled_at timestamptz DEFAULT now()
);

-- Intern Tasks
CREATE TABLE public.intern_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid REFERENCES public.intern_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text UNIQUE NOT NULL,
  holder_name text NOT NULL,
  program_name text NOT NULL,
  duration text,
  skills text[],
  issue_date date DEFAULT CURRENT_DATE,
  is_intern boolean DEFAULT false,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  intern_id uuid REFERENCES public.intern_profiles(id) ON DELETE SET NULL,
  is_revoked boolean DEFAULT false,
  revocation_reason text,
  created_at timestamptz DEFAULT now()
);

-- MOU Requests
CREATE TABLE public.mou_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  contact_person text NOT NULL,
  designation text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  student_count text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- MOU Partners (signed colleges)
CREATE TABLE public.mou_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  city text,
  logo_url text,
  signed_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Contact Submissions
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Platform Settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Intern Daily Attendance Logs
CREATE TABLE public.intern_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES public.intern_profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in time,
  check_out time,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('present', 'absent', 'half_day', 'late', 'pending')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(intern_id, date)
);

-- Intern Activity Logs (Progress Tracker)
CREATE TABLE public.intern_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES public.intern_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- e.g., 'task_completed', 'daily_checkin', 'password_changed'
  description text,
  created_at timestamptz DEFAULT now()
);

-- Forum Posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  author_email text,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  tags text[],
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Forum Replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author text NOT NULL,
  author_email text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Job Postings
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text NOT NULL,
  location text,
  type text DEFAULT 'Full-time',
  remote text DEFAULT 'Remote',
  salary text,
  skills text[],
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Job Applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'applied',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, student_id)
);

-- Mentors
CREATE TABLE public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  experience text,
  expertise text[],
  rating numeric DEFAULT 5.0,
  slots_available integer DEFAULT 3,
  bio text,
  avatar_url text,
  linkedin_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Mentorship Requests
CREATE TABLE public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  message text,
  time_slot text DEFAULT 'Flexible (This Week)',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(mentor_id, student_id)
);

-- Showcase Projects
CREATE TABLE public.showcase_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text,
  title text NOT NULL,
  description text,
  tech_stack text[],
  demo_url text,
  github_url text,
  thumbnail_url text,
  likes integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Showcase Likes
CREATE TABLE public.showcase_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.showcase_projects(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, student_id)
);

-- Study Groups
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  topic text NOT NULL,
  description text,
  schedule text,
  notes text DEFAULT '[]',
  max_members integer DEFAULT 10,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meet_link text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Study Group Members
CREATE TABLE public.study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Task Comments
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.intern_tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  author_role text DEFAULT 'intern',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Task Submissions
CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.intern_tasks(id) ON DELETE CASCADE,
  intern_id uuid REFERENCES public.intern_profiles(id) ON DELETE CASCADE,
  submission_url text,
  submission_notes text,
  files text[],
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'needs_revision')),
  reviewed_by uuid,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Scheduled Classes
CREATE TABLE public.scheduled_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  date date NOT NULL,
  start_time time,
  end_time time,
  meet_link text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- Email Notifications
CREATE TABLE public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_type text,
  subject text NOT NULL,
  body text NOT NULL,
  template text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Indexes for Performance Optimization
-- ----------------------------------------------------------------------------
CREATE INDEX idx_intern_profiles_user_id ON public.intern_profiles(user_id);
CREATE INDEX idx_intern_tasks_intern_id ON public.intern_tasks(intern_id);
CREATE INDEX idx_intern_daily_logs_intern_id ON public.intern_daily_logs(intern_id);
CREATE INDEX idx_intern_activity_logs_intern_id ON public.intern_activity_logs(intern_id);
CREATE INDEX idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_intern_id ON public.certificates(intern_id);

CREATE INDEX idx_forum_replies_post_id ON public.forum_replies(post_id);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_student_id ON public.job_applications(student_id);
CREATE INDEX idx_mentorship_requests_mentor_id ON public.mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_student_id ON public.mentorship_requests(student_id);
CREATE INDEX idx_showcase_projects_student_id ON public.showcase_projects(student_id);
CREATE INDEX idx_showcase_likes_project_id ON public.showcase_likes(project_id);
CREATE INDEX idx_study_group_members_group_id ON public.study_group_members(group_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX idx_task_submissions_intern_id ON public.task_submissions(intern_id);

-- ----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------

-- Helper function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE email = user_email AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for mentor or admin checks
CREATE OR REPLACE FUNCTION public.is_staff(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_daily_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Courses policies
CREATE POLICY "courses_select" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_write_admin" ON public.courses FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Internships policies
CREATE POLICY "internships_select" ON public.internships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "internships_write_admin" ON public.internships FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Student profiles policies
CREATE POLICY "student_profiles_select_own" ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "student_profiles_insert_own" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "student_profiles_update_own" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.jwt() ->> 'email'));

-- Intern profiles policies
CREATE POLICY "intern_profiles_select" ON public.intern_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "intern_profiles_write_admin" ON public.intern_profiles FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Internship applications policies
CREATE POLICY "applications_select_admin" ON public.internship_applications FOR SELECT TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "applications_insert_public" ON public.internship_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applications_write_admin" ON public.internship_applications FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Course enrollments policies
CREATE POLICY "enrollments_select_own" ON public.course_enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "enrollments_insert_own" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "enrollments_write_admin" ON public.course_enrollments FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Tasks policies
CREATE POLICY "tasks_select" ON public.intern_tasks FOR SELECT TO authenticated USING (
  public.is_admin(auth.jwt() ->> 'email') OR 
  EXISTS (SELECT 1 FROM public.intern_profiles WHERE id = intern_tasks.intern_id AND user_id = auth.uid())
);
CREATE POLICY "tasks_write_admin" ON public.intern_tasks FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Certificates policies
CREATE POLICY "certificates_select_all" ON public.certificates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "certificates_write_admin" ON public.certificates FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- MOU Requests policies
CREATE POLICY "mou_select_admin" ON public.mou_requests FOR SELECT TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "mou_insert_public" ON public.mou_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mou_write_admin" ON public.mou_requests FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Partners policies
CREATE POLICY "partners_select" ON public.mou_partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "partners_write_admin" ON public.mou_partners FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Contact submissions policies
CREATE POLICY "contact_select_admin" ON public.contact_submissions FOR SELECT TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "contact_insert_public" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Daily Attendance logs policies
CREATE POLICY "select_own_logs" ON public.intern_daily_logs FOR SELECT TO authenticated USING (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid()) OR
  public.is_admin(auth.jwt() ->> 'email')
);
CREATE POLICY "insert_own_logs" ON public.intern_daily_logs FOR INSERT TO authenticated WITH CHECK (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "update_own_logs" ON public.intern_daily_logs FOR UPDATE TO authenticated USING (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admin_all_logs" ON public.intern_daily_logs FOR ALL TO authenticated USING (
  public.is_admin(auth.jwt() ->> 'email')
);

-- Platform settings policies
CREATE POLICY "settings_select" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_write_admin" ON public.platform_settings FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Audit logs policies
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Forum posts policies
CREATE POLICY "forum_posts_select" ON public.forum_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "forum_posts_insert" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "forum_posts_update" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = author_email OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "forum_posts_delete" ON public.forum_posts FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = author_email OR public.is_admin(auth.jwt() ->> 'email'));

-- Forum replies policies
CREATE POLICY "forum_replies_select" ON public.forum_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "forum_replies_insert" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "forum_replies_update" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = author_email OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "forum_replies_delete" ON public.forum_replies FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = author_email OR public.is_admin(auth.jwt() ->> 'email'));

-- Job postings policies
CREATE POLICY "job_postings_select" ON public.job_postings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "job_postings_all_admin" ON public.job_postings FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Job applications policies
CREATE POLICY "job_applications_select" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "job_applications_insert" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "job_applications_all_admin" ON public.job_applications FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Mentors policies
CREATE POLICY "mentors_select" ON public.mentors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mentors_all_admin" ON public.mentors FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Mentorship requests policies
CREATE POLICY "mentorship_requests_select" ON public.mentorship_requests FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "mentorship_requests_insert" ON public.mentorship_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "mentorship_requests_all_admin" ON public.mentorship_requests FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Showcase projects policies
CREATE POLICY "showcase_projects_select" ON public.showcase_projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "showcase_projects_insert" ON public.showcase_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "showcase_projects_update" ON public.showcase_projects FOR UPDATE TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "showcase_projects_delete" ON public.showcase_projects FOR DELETE TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.jwt() ->> 'email'));

-- Showcase likes policies
CREATE POLICY "showcase_likes_select" ON public.showcase_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "showcase_likes_insert" ON public.showcase_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "showcase_likes_delete" ON public.showcase_likes FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Study groups policies
CREATE POLICY "study_groups_select" ON public.study_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "study_groups_insert" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "study_groups_all_admin" ON public.study_groups FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Study group members policies
CREATE POLICY "study_group_members_select" ON public.study_group_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "study_group_members_insert" ON public.study_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "study_group_members_delete" ON public.study_group_members FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Task comments policies
CREATE POLICY "task_comments_select" ON public.task_comments FOR SELECT TO authenticated USING (
  public.is_admin(auth.jwt() ->> 'email') OR 
  EXISTS (
    SELECT 1 FROM public.intern_tasks 
    JOIN public.intern_profiles ON intern_profiles.id = intern_tasks.intern_id
    WHERE intern_tasks.id = task_comments.task_id AND intern_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "task_comments_insert" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Task submissions policies
CREATE POLICY "task_submissions_select" ON public.task_submissions FOR SELECT TO authenticated USING (
  public.is_admin(auth.jwt() ->> 'email') OR 
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "task_submissions_insert" ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "task_submissions_update" ON public.task_submissions FOR UPDATE TO authenticated USING (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid()) OR
  public.is_admin(auth.jwt() ->> 'email')
);

-- Scheduled classes policies
CREATE POLICY "scheduled_classes_select" ON public.scheduled_classes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scheduled_classes_all_admin" ON public.scheduled_classes FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Email notifications policies
CREATE POLICY "email_notifications_admin" ON public.email_notifications FOR ALL TO authenticated USING (public.is_admin(auth.jwt() ->> 'email'));

-- Intern Activity Logs policies
CREATE POLICY "intern_activity_logs_select" ON public.intern_activity_logs FOR SELECT TO authenticated USING (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid()) OR
  public.is_admin(auth.jwt() ->> 'email')
);
CREATE POLICY "intern_activity_logs_insert" ON public.intern_activity_logs FOR INSERT TO authenticated WITH CHECK (
  intern_id IN (SELECT id FROM public.intern_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "intern_activity_logs_admin" ON public.intern_activity_logs FOR ALL TO authenticated USING (
  public.is_admin(auth.jwt() ->> 'email')
);

-- Public read policy for student_profiles (Leaderboard & Portfolio)
CREATE POLICY "student_profiles_public_read" ON public.student_profiles FOR SELECT TO anon USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 4. Storage Buckets Configuration
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('payment_proofs', 'payment_proofs', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('resumes', 'resumes', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "payment_proofs_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_own" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "resumes_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "resumes_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;

CREATE POLICY "payment_proofs_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment_proofs');
CREATE POLICY "payment_proofs_select_own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment_proofs');
CREATE POLICY "payment_proofs_select_admin" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment_proofs' AND public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "resumes_insert_all" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "resumes_select_admin" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id IN ('payment_proofs', 'resumes'));

-- ----------------------------------------------------------------------------
-- 5. Automations (Triggers & Functions)
-- ----------------------------------------------------------------------------

-- Trigger function to automatically create student_profiles row on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_student_id text;
BEGIN
  -- Generate unique student ID format TVR-STU-XXXXX
  new_student_id := 'TVR-STU-' || floor(random() * (99999 - 10000 + 1) + 10000)::text;
  
  INSERT INTO public.student_profiles (id, student_id, full_name, email, phone, is_active, xp, streak)
  VALUES (
    new.id,
    new_student_id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    new.raw_user_meta_data->>'phone',
    true,
    0,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating attendance timestamps
CREATE OR REPLACE FUNCTION public.update_daily_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_log_update_timestamp
  BEFORE UPDATE ON public.intern_daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_daily_log_timestamp();

-- ----------------------------------------------------------------------------
-- 6. Initial Seed Data
-- ----------------------------------------------------------------------------
INSERT INTO public.admin_users (email, role) VALUES 
('admin@tekvora.com', 'admin'),
('vaibhav@tekvora.com', 'admin');

INSERT INTO public.courses (title, slug, description, duration, skills, type, fee, discount) VALUES
('Full Stack Web Development', 'full-stack-web-development', 'Master the complete web development stack from frontend to backend. Build real-world projects using modern technologies.', '3 Months', ARRAY['HTML', 'CSS', 'JavaScript', 'Django', 'MySQL'], 'Paid', 15000, 20),
('Python Programming', 'python-programming', 'Learn Python from scratch to advanced level. Cover OOP, APIs, and practical applications.', '6 Weeks', ARRAY['Python', 'OOP', 'APIs', 'Data Structures'], 'Paid', 5000, 10),
('Data Science with Python', 'data-science-with-python', 'Dive into data science using Python. Analyze data, build models, and extract insights.', '2 Months', ARRAY['Pandas', 'NumPy', 'ML Basics', 'Visualization'], 'Paid', 8000, 15),
('Mobile App Development', 'mobile-app-development', 'Build cross-platform mobile applications using Flutter and Dart with Firebase backend.', '2 Months', ARRAY['Flutter', 'Dart', 'Firebase', 'UI Design'], 'Paid', 10000, 20),
('UI/UX Design', 'ui-ux-design', 'Master user interface and experience design. Create stunning prototypes and wireframes.', '6 Weeks', ARRAY['Figma', 'Wireframing', 'Prototyping', 'Design Systems'], 'Paid', 6000, 10);

INSERT INTO public.internships (title, slug, description, duration, mode, certificate, skills) VALUES
('Web Development Internship', 'web-development-internship', 'Gain hands-on experience building real web applications using modern frameworks and best practices.', '1 Month', 'Remote/Hybrid', true, ARRAY['HTML', 'CSS', 'JavaScript', 'Django']),
('Python & Data Science Internship', 'python-data-science-internship', 'Work on real data science projects, analyze datasets and build machine learning models.', '1 Month', 'Remote', true, ARRAY['Python', 'Pandas', 'NumPy', 'ML']),
('UI/UX Design Internship', 'ui-ux-design-internship', 'Design user interfaces and experiences for real client projects under expert mentorship.', '1 Month', 'Remote/Hybrid', true, ARRAY['Figma', 'UI Design', 'Prototyping']);

INSERT INTO public.platform_settings (key, value) VALUES
('upi_id', 'tekvora@paytm'),
('bank_name', 'State Bank of India'),
('bank_account', 'PENDING'),
('bank_ifsc', 'PENDING'),
('stats_students', '500+'),
('stats_courses', '5+'),
('stats_internships', '50+'),
('stats_certificates', '200+'),
('stats_mous', '10+');
