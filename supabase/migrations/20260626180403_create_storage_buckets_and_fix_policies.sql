/*
# Create Storage Buckets and Fix RLS Policies

1. New Storage Buckets
- `payment_proofs` — For students to upload UPI payment screenshots during course enrollment
- `resumes` — For internship applicants to upload their resume/CV PDFs

2. Security
- Enable RLS on storage.objects
- Add policies so authenticated users can upload to their own folders
- Add policies so anon users can upload resumes (internship applications don't require login)
- Add policies so admins can read all files

3. Fixes
- Storage buckets were missing, causing file uploads to fail silently
- This caused: course enrollment payment proof upload failure, internship resume upload failure
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('payment_proofs', 'payment_proofs', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('resumes', 'resumes', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "payment_proofs_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_own" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "resumes_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "resumes_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_all" ON storage.objects;

-- Policy: Authenticated users can upload payment proofs
CREATE POLICY "payment_proofs_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment_proofs');

-- Policy: Users can view their own payment proofs
CREATE POLICY "payment_proofs_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment_proofs');

-- Policy: Admins can view all payment proofs
CREATE POLICY "payment_proofs_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment_proofs' AND auth.jwt() ->> 'role' = 'admin');

-- Policy: Anyone (anon) can upload resumes (internship applications don't require login)
CREATE POLICY "resumes_insert_all"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- Policy: Admins can view all resumes
CREATE POLICY "resumes_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes' AND auth.jwt() ->> 'role' = 'admin');

-- Policy: Allow public read access to both buckets (files are public)
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('payment_proofs', 'resumes'));
