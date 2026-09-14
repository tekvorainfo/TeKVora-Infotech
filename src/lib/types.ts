export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: string;
  skills: string[];
  instructor: string;
  type: string;
  certificate_eligible: boolean;
  thumbnail_url?: string;
  status: string;
  created_at: string;
}

export interface Internship {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: string;
  mode: string;
  certificate: boolean;
  skills: string[];
  status: string;
  created_at: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  internship_title: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  year_of_study: string;
  branch: string;
  city: string;
  motivation: string;
  resume_url?: string;
  stage: ApplicationStage;
  interview_date?: string;
  interview_mode?: string;
  interview_link?: string;
  rejection_reason?: string;
  stipend?: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStage =
  | 'applied'
  | 'under_review'
  | 'interview_scheduled'
  | 'interview_done'
  | 'selected'
  | 'offer_letter_sent'
  | 'joined'
  | 'active'
  | 'completed';

export interface StudentProfile {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  is_active: boolean;
  github_username?: string;
  xp?: number;
  streak?: number;
  last_login_date?: string;
  created_at: string;
}

export interface InternProfile {
  id: string;
  user_id: string;
  intern_id: string;
  full_name: string;
  email: string;
  phone?: string;
  internship_id?: string;
  internship_title?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  offer_letter_url?: string;
  must_change_password: boolean;
  created_at: string;
}

export interface InternTask {
  id: string;
  intern_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_by?: string;
  assigned_at?: string;
  category?: string;
  estimated_hours?: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  intern_id: string;
  submission_url?: string;
  submission_notes?: string;
  files?: string[];
  status: 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  recipient_type: string;
  subject: string;
  body: string;
  template: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  holder_name: string;
  program_name: string;
  duration?: string;
  skills: string[];
  issue_date: string;
  is_intern: boolean;
  student_id?: string;
  intern_id?: string;
  is_revoked: boolean;
  revocation_reason?: string;
  created_at: string;
}

export interface MouRequest {
  id: string;
  college_name: string;
  contact_person: string;
  designation: string;
  email: string;
  phone: string;
  city: string;
  student_count?: string;
  message?: string;
  status: 'new' | 'in_discussion' | 'mou_signed' | 'rejected';
  created_at: string;
}

export interface MouPartner {
  id: string;
  college_name: string;
  city?: string;
  logo_url?: string;
  signed_date?: string;
  is_active: boolean;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  payment_proof_url?: string;
  payment_approved: boolean;
  rejection_reason?: string;
  enrolled_at: string;
  courses?: Course;
  student_profiles?: {
    full_name: string;
    email: string;
  };
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}
