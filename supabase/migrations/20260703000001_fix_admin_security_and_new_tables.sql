-- 1. Fix is_admin() privilege context and add allowed admin emails
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- 2. Create Scheduled Classes Table
CREATE TABLE IF NOT EXISTS public.scheduled_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  link text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduled_classes_select" ON public.scheduled_classes;
CREATE POLICY "scheduled_classes_select" ON public.scheduled_classes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "scheduled_classes_all_admin" ON public.scheduled_classes;
CREATE POLICY "scheduled_classes_all_admin" ON public.scheduled_classes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Create Forum Posts & Replies Tables
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  author text NOT NULL,
  upvotes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_posts_select" ON public.forum_posts;
CREATE POLICY "forum_posts_select" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "forum_posts_insert" ON public.forum_posts;
CREATE POLICY "forum_posts_insert" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "forum_posts_update" ON public.forum_posts;
CREATE POLICY "forum_posts_update" ON public.forum_posts
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "forum_replies_select" ON public.forum_replies;
CREATE POLICY "forum_replies_select" ON public.forum_replies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "forum_replies_insert" ON public.forum_replies;
CREATE POLICY "forum_replies_insert" ON public.forum_replies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create Job Postings Table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  remote text NOT NULL,
  salary text NOT NULL,
  skills text[] NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_postings_select" ON public.job_postings;
CREATE POLICY "job_postings_select" ON public.job_postings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_postings_all_admin" ON public.job_postings;
CREATE POLICY "job_postings_all_admin" ON public.job_postings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Create Study Groups & Members Tables
CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  topic text NOT NULL,
  description text NOT NULL,
  schedule text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, student_id)
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_groups_select" ON public.study_groups;
CREATE POLICY "study_groups_select" ON public.study_groups
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "study_groups_insert" ON public.study_groups;
CREATE POLICY "study_groups_insert" ON public.study_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "study_groups_update" ON public.study_groups;
CREATE POLICY "study_groups_update" ON public.study_groups
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "study_group_members_select" ON public.study_group_members;
CREATE POLICY "study_group_members_select" ON public.study_group_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "study_group_members_insert" ON public.study_group_members;
CREATE POLICY "study_group_members_insert" ON public.study_group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "study_group_members_delete" ON public.study_group_members;
CREATE POLICY "study_group_members_delete" ON public.study_group_members
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- 6. Create Showcase Projects Table
CREATE TABLE IF NOT EXISTS public.showcase_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tech_stack text[] NOT NULL,
  github_url text,
  demo_url text,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "showcase_projects_select" ON public.showcase_projects;
CREATE POLICY "showcase_projects_select" ON public.showcase_projects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "showcase_projects_insert" ON public.showcase_projects;
CREATE POLICY "showcase_projects_insert" ON public.showcase_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "showcase_projects_update" ON public.showcase_projects;
CREATE POLICY "showcase_projects_update" ON public.showcase_projects
  FOR UPDATE TO authenticated USING (true);

-- 7. Create Mentors & Requests Tables
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  expertise text[] NOT NULL,
  experience text NOT NULL,
  rating numeric DEFAULT 5.0,
  slots_available int DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  time_slot text NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentors_select" ON public.mentors;
CREATE POLICY "mentors_select" ON public.mentors
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "mentors_all_admin" ON public.mentors;
CREATE POLICY "mentors_all_admin" ON public.mentors
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "mentorship_requests_select" ON public.mentorship_requests;
CREATE POLICY "mentorship_requests_select" ON public.mentorship_requests
  FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "mentorship_requests_insert" ON public.mentorship_requests;
CREATE POLICY "mentorship_requests_insert" ON public.mentorship_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- 8. Create Code Reviews & Comments Tables
CREATE TABLE IF NOT EXISTS public.code_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  title text NOT NULL,
  language text NOT NULL,
  code text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  upvotes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.code_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.code_reviews(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  line_number int,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_review_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "code_reviews_select" ON public.code_reviews;
CREATE POLICY "code_reviews_select" ON public.code_reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "code_reviews_insert" ON public.code_reviews;
CREATE POLICY "code_reviews_insert" ON public.code_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "code_reviews_update" ON public.code_reviews;
CREATE POLICY "code_reviews_update" ON public.code_reviews
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "code_review_comments_select" ON public.code_review_comments;
CREATE POLICY "code_review_comments_select" ON public.code_review_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "code_review_comments_insert" ON public.code_review_comments;
CREATE POLICY "code_review_comments_insert" ON public.code_review_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
