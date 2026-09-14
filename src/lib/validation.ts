import { z } from 'zod';

export const contactFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format").optional().or(z.literal('')),
  subject: z.string().max(100, "Subject is too long").optional().or(z.literal('')),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message is too long"),
});

export const internshipApplicationSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format"),
  city: z.string().min(2, "City is required").max(100),
  college: z.string().min(2, "College is required").max(200),
  year_of_study: z.string().min(2, "Year of study is required"),
  branch: z.string().min(2, "Branch is required").max(100),
  motivation: z.string().min(100, "Motivation must be at least 100 characters").max(2000, "Motivation is too long"),
});

export const mouRequestSchema = z.object({
  college_name: z.string().min(2, "College name is required").max(200),
  contact_person: z.string().min(2, "Contact person is required").max(100),
  designation: z.string().min(2, "Designation is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format"),
  city: z.string().min(2, "City is required").max(100),
  student_count: z.string().min(1, "Student count is required").max(50),
  message: z.string().max(1000, "Message is too long").optional().or(z.literal('')),
});
