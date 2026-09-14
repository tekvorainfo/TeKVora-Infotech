-- Create Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, student_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_applications_select" ON public.job_applications;
CREATE POLICY "job_applications_select" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;
CREATE POLICY "job_applications_insert" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Create Showcase Likes Table
CREATE TABLE IF NOT EXISTS public.showcase_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.showcase_projects(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, student_id)
);

ALTER TABLE public.showcase_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "showcase_likes_select" ON public.showcase_likes;
CREATE POLICY "showcase_likes_select" ON public.showcase_likes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "showcase_likes_insert" ON public.showcase_likes;
CREATE POLICY "showcase_likes_insert" ON public.showcase_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "showcase_likes_delete" ON public.showcase_likes;
CREATE POLICY "showcase_likes_delete" ON public.showcase_likes
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Alter code_reviews to support AI feedback
ALTER TABLE public.code_reviews ADD COLUMN IF NOT EXISTS ai_feedback text;

