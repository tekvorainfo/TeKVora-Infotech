-- Migration: Add gamification and GitHub fields to student_profiles table
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_username text;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS last_login_date date;
