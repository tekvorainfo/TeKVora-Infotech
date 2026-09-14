
-- Courses table
CREATE TABLE courses (
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
  price numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_all" ON courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_insert_admin" ON courses FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "courses_update_admin" ON courses FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "courses_delete_admin" ON courses FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Internships table
CREATE TABLE internships (
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

ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internships_select_all" ON internships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "internships_insert_admin" ON internships FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "internships_update_admin" ON internships FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "internships_delete_admin" ON internships FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Student profiles (linked to auth.users)
CREATE TABLE student_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id text UNIQUE,
  full_name text,
  email text,
  phone text,
  profile_photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_profiles_select_own" ON student_profiles FOR SELECT TO authenticated USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "student_profiles_insert_own" ON student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "student_profiles_update_own" ON student_profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "student_profiles_delete_admin" ON student_profiles FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Intern profiles (admin-created only)
CREATE TABLE intern_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  intern_id text UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  internship_id uuid REFERENCES internships(id),
  internship_title text,
  status text DEFAULT 'active',
  start_date date,
  end_date date,
  offer_letter_url text,
  must_change_password boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intern_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intern_profiles_select" ON intern_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "intern_profiles_insert_admin" ON intern_profiles FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "intern_profiles_update_admin" ON intern_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "intern_profiles_delete_admin" ON intern_profiles FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Internship Applications
CREATE TABLE internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid REFERENCES internships(id),
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

ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select_admin" ON internship_applications FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "applications_insert_all" ON internship_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applications_update_admin" ON internship_applications FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "applications_delete_admin" ON internship_applications FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Course Enrollments
CREATE TABLE course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id),
  course_id uuid REFERENCES courses(id),
  status text DEFAULT 'pending_payment',
  payment_proof_url text,
  payment_approved boolean DEFAULT false,
  rejection_reason text,
  enrolled_at timestamptz DEFAULT now()
);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_select_own" ON course_enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "enrollments_insert_student" ON course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "enrollments_update_admin" ON course_enrollments FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "enrollments_delete_admin" ON course_enrollments FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Intern Tasks
CREATE TABLE intern_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid REFERENCES intern_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intern_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select" ON intern_tasks FOR SELECT TO authenticated USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  EXISTS (SELECT 1 FROM intern_profiles WHERE id = intern_tasks.intern_id AND user_id = auth.uid())
);
CREATE POLICY "tasks_insert_admin" ON intern_tasks FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "tasks_update_admin" ON intern_tasks FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "tasks_delete_admin" ON intern_tasks FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Certificates
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text UNIQUE NOT NULL,
  holder_name text NOT NULL,
  program_name text NOT NULL,
  duration text,
  skills text[],
  issue_date date DEFAULT CURRENT_DATE,
  is_intern boolean DEFAULT false,
  student_id uuid REFERENCES auth.users(id),
  intern_id uuid REFERENCES intern_profiles(id),
  is_revoked boolean DEFAULT false,
  revocation_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates_select_all" ON certificates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "certificates_insert_admin" ON certificates FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "certificates_update_admin" ON certificates FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "certificates_delete_admin" ON certificates FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- MOU Requests
CREATE TABLE mou_requests (
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

ALTER TABLE mou_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mou_select_admin" ON mou_requests FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "mou_insert_all" ON mou_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mou_update_admin" ON mou_requests FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "mou_delete_admin" ON mou_requests FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- MOU Partners (colleges that have signed)
CREATE TABLE mou_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  city text,
  logo_url text,
  signed_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mou_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_select_all" ON mou_partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "partners_insert_admin" ON mou_partners FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "partners_update_admin" ON mou_partners FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "partners_delete_admin" ON mou_partners FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Contact Submissions
CREATE TABLE contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_select_admin" ON contact_submissions FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "contact_insert_all" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_update_admin" ON contact_submissions FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "contact_delete_admin" ON contact_submissions FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Audit Logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "audit_insert_admin" ON audit_logs FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "audit_update_admin" ON audit_logs FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "audit_delete_admin" ON audit_logs FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Platform Settings
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_all" ON platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_insert_admin" ON platform_settings FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "settings_update_admin" ON platform_settings FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "settings_delete_admin" ON platform_settings FOR DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Seed courses
INSERT INTO courses (title, slug, description, duration, skills, type, certificate_eligible, status) VALUES
('Full Stack Web Development', 'full-stack-web-development', 'Master the complete web development stack from frontend to backend. Build real-world projects using modern technologies.', '3 Months', ARRAY['HTML', 'CSS', 'JavaScript', 'Django', 'MySQL'], 'Paid', true, 'active'),
('Python Programming', 'python-programming', 'Learn Python from scratch to advanced level. Cover OOP, APIs, and practical applications.', '6 Weeks', ARRAY['Python', 'OOP', 'APIs', 'Data Structures'], 'Paid', true, 'active'),
('Data Science with Python', 'data-science-with-python', 'Dive into data science using Python. Analyze data, build models, and extract insights.', '2 Months', ARRAY['Pandas', 'NumPy', 'ML Basics', 'Visualization'], 'Paid', true, 'active'),
('Mobile App Development', 'mobile-app-development', 'Build cross-platform mobile applications using Flutter and Dart with Firebase backend.', '2 Months', ARRAY['Flutter', 'Dart', 'Firebase', 'UI Design'], 'Paid', true, 'active'),
('UI/UX Design', 'ui-ux-design', 'Master user interface and experience design. Create stunning prototypes and wireframes.', '6 Weeks', ARRAY['Figma', 'Wireframing', 'Prototyping', 'Design Systems'], 'Paid', true, 'active');

-- Seed internships
INSERT INTO internships (title, slug, description, duration, mode, certificate, skills, status) VALUES
('Web Development Internship', 'web-development-internship', 'Gain hands-on experience building real web applications using modern frameworks and best practices.', '1 Month', 'Remote/Hybrid', true, ARRAY['HTML', 'CSS', 'JavaScript', 'Django'], 'active'),
('Python & Data Science Internship', 'python-data-science-internship', 'Work on real data science projects, analyze datasets and build machine learning models.', '1 Month', 'Remote', true, ARRAY['Python', 'Pandas', 'NumPy', 'ML'], 'active'),
('UI/UX Design Internship', 'ui-ux-design-internship', 'Design user interfaces and experiences for real client projects under expert mentorship.', '1 Month', 'Remote/Hybrid', true, ARRAY['Figma', 'UI Design', 'Prototyping'], 'active');

-- Seed platform settings
INSERT INTO platform_settings (key, value) VALUES
('upi_id', 'tekvora@paytm'),
('bank_name', 'State Bank of India'),
('bank_account', 'PENDING'),
('bank_ifsc', 'PENDING'),
('stats_students', '500+'),
('stats_courses', '5+'),
('stats_internships', '50+'),
('stats_certificates', '200+'),
('stats_mous', '10+');
