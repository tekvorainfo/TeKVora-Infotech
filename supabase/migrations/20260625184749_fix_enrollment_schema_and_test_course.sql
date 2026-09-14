
-- Fix: Drop UUID FK constraint on course_enrollments.course_id, change to text
-- Root cause: frontend was inserting string IDs ('1', '2') not UUIDs, causing silent failures
ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;
ALTER TABLE course_enrollments ALTER COLUMN course_id TYPE text USING course_id::text;

-- Update course prices (price column already exists)
UPDATE courses SET price = 15000 WHERE slug = 'full-stack-web-development';
UPDATE courses SET price = 8000  WHERE slug = 'python-programming';
UPDATE courses SET price = 12000 WHERE slug = 'data-science-with-python';
UPDATE courses SET price = 12000 WHERE slug = 'mobile-app-development';
UPDATE courses SET price = 6000  WHERE slug = 'ui-ux-design';

-- Add ₹1 test course for payment verification
INSERT INTO courses (title, slug, description, duration, skills, price, type, certificate_eligible, status)
VALUES (
  'Full Stack Web Dev — ₹1 TEST',
  'test-payment-1rupee',
  'Test course for payment gateway verification. Price is ₹1.',
  '1 Week',
  ARRAY['HTML', 'CSS', 'JavaScript'],
  1,
  'Paid',
  false,
  'active'
) ON CONFLICT (slug) DO UPDATE SET price = 1;

-- Add payment_note column to course_enrollments for admin notes
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS admin_note text;

-- Add index for faster enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
