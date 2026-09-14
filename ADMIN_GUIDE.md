# TeKVora Infotech - Admin Guide

## Admin Login Credentials

**Admin URLs:**
- Student Portal: `/login`
- Intern Portal: `/intern-login`
- Admin Panel: `/tekvora-admin-access`

**Default Admin Credentials:**
- Email: `admin@tekvora.com` or `vaibhav@tekvora.com`
- Password: Set via Supabase Auth

**To create admin account:**
1. Go to Supabase Dashboard → Authentication → Users
2. Create user with email `admin@tekvora.com`
3. Set a secure password

---

## Platform Overview

### Student Portal
- Students self-register at `/register`
- They get auto-generated Student ID: `TVR-STU-XXXXX`
- When enrolling in courses:
  - See UPI QR code for payment (`tekvora@paytm`)
  - Upload payment proof (screenshot)
  - Admin verifies payment and approves enrollment

### Intern Portal
- Interns CANNOT self-register - admin creates accounts
- After admin activation, intern gets:
  - Email with login credentials
  - Intern ID: `TVR-INT-XXXXX`
  - Access to dashboard with tasks, daily attendance

### Admin Panel Features

#### Dashboard
- View stats: applications, students, interns, certificates

#### Applications (9-Stage Pipeline)
1. **Applied** - Initial application received
2. **Under Review** - Admin reviewing application
3. **Interview Scheduled** - Set up interview
4. **Interview Done** - Interview completed
5. **Selected** - Candidate selected
6. **Offer Letter Sent** - Admin sent offer letter
7. **Joined** - Candidate accepted and joined
8. **Active** - Currently working as intern
9. **Completed** - Internship finished

#### Student Management
- View all registered students
- Approve/reject course enrollments
- View payment proofs
- Generate certificates (Format: `TVR-YYYY-XXXXXX`)

#### Intern Management
- Create new intern accounts
- Assign internship program
- Upload offer letter (PDF)
- Set must_change_password flag
- Track daily attendance
- View completed tasks

#### Task Allocation
- Create tasks for specific interns
- Set priority (low/medium/high)
- Set due dates
- Interns can update task status

#### Certificate Management
- Generate certificates:
  - Certificate ID: `TVR-YYYY-XXXXXX` (auto-generated)
  - Program name
  - Holder name
  - Issue date
  - Skills covered
- Revoke certificates if needed

#### MOU Partnerships
- Track college partnerships
- Add new MOU requests
- Update partnership status

#### Audit Logs
- Track all admin actions
- View timestamps and details

---

## Payment Process

### Course Enrollment Flow
1. Student clicks "Enroll Now" in dashboard
2. Modal shows:
   - Course details and fee
   - Discount percentage
   - **UPI QR Code** for `tekvora@paytm`
   - File upload for payment proof
3. Student pays via UPI/Bank transfer
4. Student uploads screenshot
5. Admin reviews in Student Management
6. Admin approves/rejects

### UPI Details
- UPI ID: `tekvora@paytm`
- Account Name: TeKVora Infotech
- QR Code auto-generated via API

---

## Daily Attendance Tracking (Interns)

### How It Works
1. Intern logs in daily
2. Clicks "Check In" button (records time)
3. System marks status:
   - Before 10 AM → Present
   - After 10 AM → Late
4. When done, clicks "Check Out"
5. System calculates hours worked
6. If < 4 hours → Half Day

### Admin Can View
- Daily attendance table
- Check-in/out times
- Hours worked per day
- Streak count
- Present/Absent statistics

---

## Certificate Generation

### Certificate ID Format
`TVR-YYYY-XXXXXX`
- TVR = TeKVora Prefix
- YYYY = Current year (e.g., 2026)
- XXXXXX = Random alphanumeric

### Verification URL
`/verify?id=TVR-2026-A3F9K2`

---

## Faculty Section

The faculty page (`/faculty`) now includes:
- **Founder**: Mr. Vaibhav Tambe (with photo)
- **Expert Trainers**:
  - Ms. Priya Sharma - UI/UX Specialist
  - Mr. Rahul Patil - Python & Data Science
  - Ms. Sneha Kulkarni - Mobile Development
  - Mr. Amit Deshmukh - Cloud & DevOps

---

## Courses & Internships

### 8 Courses Available
1. Full Stack Web Development (3 Months)
2. Python Programming (6 Weeks)
3. Data Science with Python (2 Months)
4. Mobile App Development (2 Months)
5. UI/UX Design (6 Weeks)
6. React.js Development (2 Months)
7. Node.js Backend Development (6 Weeks)
8. Cloud Computing - AWS (1 Month)

### 8 Internships Available
1. Web Development Internship
2. Python & Data Science Internship
3. UI/UX Design Internship
4. React.js Development Internship
5. Mobile App Development Internship
6. Cloud & DevOps Internship
7. Node.js Backend Internship
8. Digital Marketing Internship

---

## Database Tables

Core tables managed via Supabase:
- `student_profiles` - Student data
- `intern_profiles` - Intern data
- `course_enrollments` - Course enrollment + payment
- `internship_applications` - 9-stage pipeline
- `intern_tasks` - Task allocation
- `intern_daily_logs` - Daily attendance
- `certificates` - Issued certificates
- `mou_requests` - MOU partnerships
- `audit_logs` - Admin action history

---

## Contact & Support

- WhatsApp: +91 9022302322
- Email: info@tekvora.com
- Founder: vaibhav@tekvora.com
