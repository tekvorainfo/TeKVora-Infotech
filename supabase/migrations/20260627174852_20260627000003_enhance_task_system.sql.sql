/*
# Enhance Task Management System for IT Company Workflow

1. New Tables:
   - `task_assignments` — track which admin assigned which task to which intern
   - `task_comments` — intern/admin can comment on tasks for collaboration
   - `task_submissions` — interns can submit their work with links/files
   - `email_notifications` — log of all emails sent from admin panel

2. Enhanced `intern_tasks` table:
   - Add `assigned_by` column (admin email)
   - Add `assigned_at` timestamp
   - Add `category` column for task categorization
   - Add `estimated_hours` for time tracking

3. Security:
   - RLS policies for all new tables
   - Admin-only write access
   - Intern can read their own data
*/

-- ============================================
-- Enhance intern_tasks table
-- ============================================
ALTER TABLE intern_tasks 
ADD COLUMN IF NOT EXISTS assigned_by text,
ADD COLUMN IF NOT EXISTS assigned_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS estimated_hours integer;

-- ============================================
-- Task Comments table
-- ============================================
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES intern_tasks(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_role text NOT NULL DEFAULT 'intern',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments_select_own" ON task_comments;
CREATE POLICY "task_comments_select_own" ON task_comments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM intern_tasks WHERE id = task_comments.task_id AND (
      is_admin() OR EXISTS (SELECT 1 FROM intern_profiles WHERE id = intern_tasks.intern_id AND user_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "task_comments_insert" ON task_comments;
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM intern_tasks WHERE id = task_comments.task_id AND (
      is_admin() OR EXISTS (SELECT 1 FROM intern_profiles WHERE id = intern_tasks.intern_id AND user_id = auth.uid())
    ))
  );

-- ============================================
-- Task Submissions table
-- ============================================
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES intern_tasks(id) ON DELETE CASCADE,
  intern_id uuid REFERENCES intern_profiles(id) ON DELETE CASCADE,
  submission_url text,
  submission_notes text,
  files text[],
  status text DEFAULT 'submitted',
  reviewed_by text,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_submissions_select_own" ON task_submissions;
CREATE POLICY "task_submissions_select_own" ON task_submissions FOR SELECT
  TO authenticated USING (
    is_admin() OR EXISTS (SELECT 1 FROM intern_profiles WHERE id = task_submissions.intern_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "task_submissions_insert_own" ON task_submissions;
CREATE POLICY "task_submissions_insert_own" ON task_submissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM intern_profiles WHERE id = task_submissions.intern_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "task_submissions_update_admin" ON task_submissions;
CREATE POLICY "task_submissions_update_admin" ON task_submissions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- Email Notifications Log table
-- ============================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_type text DEFAULT 'intern',
  subject text NOT NULL,
  body text NOT NULL,
  template text DEFAULT 'generic',
  status text DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_notifications_select_admin" ON email_notifications;
CREATE POLICY "email_notifications_select_admin" ON email_notifications FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "email_notifications_insert_admin" ON email_notifications;
CREATE POLICY "email_notifications_insert_admin" ON email_notifications FOR INSERT
  TO authenticated WITH CHECK (is_admin());
