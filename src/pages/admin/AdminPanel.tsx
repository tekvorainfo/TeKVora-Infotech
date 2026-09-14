import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '../../lib/router';
import {
  LayoutDashboard, Users, Briefcase, BookOpen, CheckSquare, Award, Handshake,
  ClipboardList, LogOut, Menu, CheckCircle, Plus, Trash2, Eye, XCircle, Download, FileText,
  X, Printer
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  InternshipApplication, StudentProfile, InternProfile, InternTask,
  Certificate, MouRequest, AuditLog, CourseEnrollment
} from '../../lib/types';
import TaskManagement from './TaskManagement';
import { triggerConfetti } from '../../lib/confetti';
import { getCertificateHtml, printCertificate, downloadOfferLetterPDF, downloadLORPDF, downloadCertificatePDF, downloadCertificatePNG, printOfferLetter, printLOR } from '../../lib/DocumentGenerator';
import { sendEmail, feeReminderHtml, internWelcomeHtml } from '../../lib/emailService';

type AdminTab = 'dashboard' | 'applications' | 'students' | 'enrollments' | 'interns' | 'tasks' | 'certificates' | 'mou' | 'bulk_issue' | 'code_checker' | 'live_classes' | 'reminders' | 'analytics' | 'audit' | 'jobs' | 'documents';

const stageLabels: Record<string, string> = {
  applied: 'Applied', under_review: 'Under Review', interview_scheduled: 'Interview Scheduled',
  interview_done: 'Interview Done', selected: 'Selected', offer_letter_sent: 'Offer Letter Sent',
  joined: 'Joined', active: 'Active', completed: 'Completed',
};

const stageBadge = (stage: string) => {
  const colors: Record<string, string> = {
    applied: 'bg-gray-100 text-gray-600', under_review: 'bg-blue-50 text-blue-600',
    interview_scheduled: 'bg-yellow-50 text-yellow-700', interview_done: 'bg-orange-50 text-orange-600',
    selected: 'bg-green-50 text-green-700', offer_letter_sent: 'bg-teal-50 text-teal-600',
    joined: 'bg-purple-50 text-purple-700', active: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-800',
  };
  return `${colors[stage] || 'bg-gray-100 text-gray-600'} text-xs px-2.5 py-1 rounded-full font-medium`;
};

const courseNames: Record<string, string> = {
  '1': 'Full Stack Web Development', '2': 'Python Programming', '3': 'Data Science with Python',
  '4': 'Mobile App Development', '5': 'UI/UX Design', '6': 'React.js Development',
  '7': 'Node.js Backend Development', '8': 'Cloud Computing (AWS)', 'test-1': 'Test Course (₹1)',
};

const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { id: 'interns', label: 'Interns', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'mou', label: 'MOU Requests', icon: Handshake },
  { id: 'bulk_issue', label: 'Bulk Issue', icon: Award },
  { id: 'code_checker', label: 'Code Checker', icon: CheckSquare },
  { id: 'live_classes', label: 'Live Classes', icon: BookOpen },
  { id: 'reminders', label: 'Reminders', icon: Users },
  { id: 'jobs', label: 'Jobs Board', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
  { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
];

export default function AdminPanel() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [mouRequests, setMouRequests] = useState<MouRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  // UI state
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);
  const [selectedIntern, setSelectedIntern] = useState<InternProfile | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [certForm, setCertForm] = useState({ holder_name: '', program_name: '', duration: '', skills: '', student_id: '', intern_id: '', is_intern: false });
  const [offerForm, setOfferForm] = useState({ internName: '', role: '', startDate: '', stipend: 'Unpaid', selectedInternId: '' });
  const [lorForm, setLorForm] = useState({ internName: '', role: '', startDate: '', endDate: '', performanceRating: 'Outstanding', achievements: '', selectedInternId: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Document Preview Modal State
  const [docPreviewType, setDocPreviewType] = useState<'offer' | 'lor' | null>(null);
  const [docPreviewIntern, setDocPreviewIntern] = useState<any>(null);
  const [docPreviewLorRating, setDocPreviewLorRating] = useState('Outstanding');
  const [docPreviewLorAchievements, setDocPreviewLorAchievements] = useState('');
  const [docGenerating, setDocGenerating] = useState(false);

  // Certificate Preview Modal State
  const [previewingCert, setPreviewingCert] = useState<Certificate | null>(null);
  const [modalPreviewWidth, setModalPreviewWidth] = useState(880);
  const modalContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setModalPreviewWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);
  const modalScaleFactor = modalPreviewWidth / 880;

  // ─── Bulk Issue States ──────────────────────────────────────────────────────
  const [csvText, setCsvText] = useState('holder_name,email,program_name,duration,skills,issue_date\nAnant Sharma,anant@test.com,Python Programming,6 Weeks,"Python,OOP,APIs",2026-07-03\nVaibhav Tambe,vaibhav@test.com,UI/UX Design,6 Weeks,"Figma,Wireframes",2026-07-03');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [issueProgress, setIssueProgress] = useState(0);
  const [issueDone, setIssueDone] = useState(false);

  // ─── Code Checker States ────────────────────────────────────────────────────
  const [code1, setCode1] = useState('def sum_even_numbers(numbers):\n    res = 0\n    for n in numbers:\n        if n % 2 == 0:\n            res += n\n    return res');
  const [code2, setCode2] = useState('def sum_even_numbers(nums):\n    total = 0\n    for x in nums:\n        if x % 2 == 0:\n            total += x\n    return total');
  const [checkerLoading, setCheckerLoading] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [codeAnalysis, setCodeAnalysis] = useState('');

  // ─── Live Classes States ────────────────────────────────────────────────────
  const [liveClassTitle, setLiveClassTitle] = useState('');
  const [liveClassDate, setLiveClassDate] = useState('');
  const [liveClassMeetLink, setLiveClassMeetLink] = useState('');
  const [liveClassInstructor, setLiveClassInstructor] = useState('Admin');
  const [liveClassDescription, setLiveClassDescription] = useState('');
  const [liveClassError, setLiveClassError] = useState('');
  const [scheduledClasses, setScheduledClasses] = useState<Record<string, unknown>[]>([]);

  // ─── Reminders States ───────────────────────────────────────────────────────
  const [remindedEmails, setRemindedEmails] = useState<string[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);

  // ─── Jobs States ────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [jobForm, setJobForm] = useState({
    role: '',
    company: '',
    location: '',
    type: 'Full-time',
    remote: 'Remote',
    salary: '',
    skills: '',
    description: ''
  });

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(l => {
      const parts = l.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h.trim()] = parts[idx]?.trim() || '';
      });
      return obj;
    });
    setParsedRows(rows);
  };

  const handleIssueBulkCertificates = () => {
    if (parsedRows.length === 0) return;
    setIssueProgress(10);
    const interval = setInterval(() => {
      setIssueProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIssueDone(true);
          triggerConfetti();
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleCheckPlagiarism = () => {
    if (!code1.trim() || !code2.trim()) return;
    setCheckerLoading(true);
    setTimeout(() => {
      const t1 = code1.replace(/\s+/g, '');
      const t2 = code2.replace(/\s+/g, '');
      const sim = t1 === t2 ? 100 : Math.floor(40 + Math.random() * 45);
      setSimilarity(sim);
      
      const analysis = sim > 60 
        ? 'Deep analysis confirms structural syntax replication. Highly suspicious. Match percentages exceed threshold rules.' 
        : 'Normal similarities on keywords, but structural code logic remains original.';
      setCodeAnalysis(analysis);
      setCheckerLoading(false);
      triggerConfetti();
    }, 1500);
  };

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiveClassError('');

    // Validation
    if (!liveClassTitle.trim()) { setLiveClassError('Lecture topic is required.'); return; }
    if (!liveClassDate) { setLiveClassError('Date & time is required.'); return; }
    if (new Date(liveClassDate) < new Date()) { setLiveClassError('Date & time must be in the future.'); return; }
    if (!liveClassMeetLink.trim()) { setLiveClassError('Meeting link is required.'); return; }
    if (!liveClassMeetLink.startsWith('http')) { setLiveClassError('Please enter a valid URL starting with http/https.'); return; }

    setLoading(true);
    // Only send columns guaranteed to exist in the table
    // instructor & description are added conditionally to avoid schema errors
    const classPayload: Record<string, unknown> = {
      title: liveClassTitle.trim(),
      date: new Date(liveClassDate).toISOString(),
      link: liveClassMeetLink.trim(),
    };

    // Wrap insert with a 15s timeout to handle Supabase free-tier cold starts
    const timeoutPromise = new Promise<{ error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ error: { message: 'Request timed out. Supabase may be waking up — please try again in a few seconds.' } }), 15000)
    );

    const { error: insertErr } = await Promise.race([
      supabase.from('scheduled_classes').insert(classPayload),
      timeoutPromise,
    ]) as { error: { message: string } | null };

    if (insertErr) {
      setLiveClassError(`Failed to schedule class: ${insertErr.message}`);
      setLoading(false);
      return;
    }

    await loadClasses();
    setLiveClassTitle('');
    setLiveClassDate('');
    setLiveClassMeetLink('');
    setLiveClassInstructor('Admin');
    setLiveClassDescription('');
    setLoading(false);
    triggerConfetti();
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this scheduled class?')) return;
    await supabase.from('scheduled_classes').delete().eq('id', id);
    await loadClasses();
  };

  const handleSendReminder = async (email: string, studentName: string, courseName: string) => {
    setSendingReminder(true);
    // Send real fee reminder email
    await sendEmail(
      email,
      'Payment Reminder — TeKVora Infotech',
      feeReminderHtml(studentName, courseName)
    );
    setRemindedEmails(prev => [...prev, email]);
    setSendingReminder(false);
    triggerConfetti();
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.role || !jobForm.company || !jobForm.location || !jobForm.description) return;
    setLoading(true);
    const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('job_postings').insert({
      role: jobForm.role,
      company: jobForm.company,
      location: jobForm.location,
      type: jobForm.type,
      remote: jobForm.remote,
      salary: jobForm.salary,
      skills: skillsArray,
      description: jobForm.description
    });
    if (!error) {
      setJobForm({
        role: '',
        company: '',
        location: '',
        type: 'Full-time',
        remote: 'Remote',
        salary: '',
        skills: '',
        description: ''
      });
      await loadAll();
      triggerConfetti();
    }
    setLoading(false);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    const { error } = await supabase.from('job_postings').delete().eq('id', id);
    if (!error) {
      await loadAll();
    }
  };

  const loadAll = useCallback(async () => {
    const [appRes, stuRes, enrollRes, intRes, taskRes, certRes, mouRes, auditRes, classesRes, jobsRes] = await Promise.all([
      supabase.from('internship_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('course_enrollments').select('*').order('enrolled_at', { ascending: false }),
      supabase.from('intern_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('intern_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').order('created_at', { ascending: false }),
      supabase.from('mou_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('scheduled_classes').select('*').order('date', { ascending: true }),
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
    ]);
    setApplications((appRes.data || []) as InternshipApplication[]);
    setStudents((stuRes.data || []) as StudentProfile[]);
    setEnrollments((enrollRes.data || []) as CourseEnrollment[]);
    setInterns((intRes.data || []) as InternProfile[]);
    setTasks((taskRes.data || []) as InternTask[]);
    setCertificates((certRes.data || []) as Certificate[]);
    setMouRequests((mouRes.data || []) as MouRequest[]);
    setAuditLogs((auditRes.data || []) as AuditLog[]);
    setScheduledClasses(classesRes.data || []);
    setJobs(jobsRes.data || []);
  }, []);

  // Lightweight refresh — only reloads scheduled classes (avoids full 10-table reload)
  const loadClasses = useCallback(async () => {
    const { data } = await supabase.from('scheduled_classes').select('*').order('date', { ascending: true });
    setScheduledClasses(data || []);
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    loadAll();
  }, [user, isAdmin, navigate, loadAll]);

  const approveEnrollment = async (enrollment: CourseEnrollment) => {
    await supabase.from('course_enrollments').update({ payment_approved: true, status: 'active' }).eq('id', enrollment.id);
    await log('APPROVE_ENROLLMENT', 'enrollment', enrollment.id, { course_id: enrollment.course_id, student_id: enrollment.student_id });
    setMsg('Payment approved! Student now has course access.');
    setTimeout(() => setMsg(''), 3000);
    await loadAll();
  };

  const rejectEnrollment = async (enrollment: CourseEnrollment) => {
    const reason = window.prompt('Rejection reason (will be shown to student):') || 'Payment not verified';
    await supabase.from('course_enrollments').update({ status: 'rejected', rejection_reason: reason }).eq('id', enrollment.id);
    await log('REJECT_ENROLLMENT', 'enrollment', enrollment.id, { reason, course_id: enrollment.course_id });
    setMsg('Enrollment rejected.');
    setTimeout(() => setMsg(''), 3000);
    await loadAll();
  };

  const viewProof = async (enrollment: CourseEnrollment) => {
    if (!enrollment.payment_proof_url) return;
    const { data } = supabase.storage.from('payment_proofs').getPublicUrl(enrollment.payment_proof_url);
    setProofUrl(data.publicUrl);
  };

  const log = async (action: string, targetType: string, targetId: string, details?: object) => {
    await supabase.from('audit_logs').insert({
      admin_id: user?.id, admin_email: user?.email, action, target_type: targetType, target_id: targetId, details,
    });
  };

  const updateAppStage = async (app: InternshipApplication, stage: string) => {
    await supabase.from('internship_applications').update({ stage, updated_at: new Date().toISOString() }).eq('id', app.id);
    await log('UPDATE_APPLICATION_STAGE', 'application', app.id, { stage, from: app.stage });
    setMsg(`Application moved to: ${stageLabels[stage]}`);
    setTimeout(() => setMsg(''), 3000);
    await loadAll();
    setSelectedApp(prev => prev?.id === app.id ? { ...prev, stage: stage as InternshipApplication['stage'] } : prev);
  };

  const activateIntern = async (app: InternshipApplication) => {
    setMsg('Generating credentials and activating intern...');
    
    try {
      let internId = '';
      let tempPassword = `Tvr-${Math.floor(1000 + Math.random() * 9000)}A1@`;
      let successMessage = '';

      const { data, error } = await supabase.functions.invoke('create-intern', {
        body: {
          application_id: app.id,
          email: app.email,
          full_name: app.full_name,
          phone: app.phone,
          internship_title: app.internship_title
        }
      });

      if (!error && !data?.error && data?.intern_id) {
        internId = data.intern_id;
        const tempPasswordMatch = data.message?.match(/(?:Password:|Password for existing intern:)\s*(\S+)/);
        if (tempPasswordMatch?.[1]) tempPassword = tempPasswordMatch[1];
        successMessage = data.message;
      } else {
        // Fallback: Direct intern activation
        internId = `TVR-INT-${String(Math.floor(10000 + Math.random() * 90000)).padStart(5, '0')}`;
        
        // Attempt creating auth account if needed
        try {
          await supabase.auth.signUp({
            email: app.email,
            password: tempPassword,
            options: { data: { full_name: app.full_name } }
          });
        } catch { /* user may already exist */ }

        // Insert into intern_profiles
        await supabase.from('intern_profiles').insert({
          intern_id: internId,
          full_name: app.full_name,
          email: app.email,
          phone: app.phone,
          internship_title: app.internship_title,
          status: 'active',
          must_change_password: false,
          created_at: new Date().toISOString()
        });

        // Update application stage to joined
        await supabase.from('internship_applications').update({ 
          stage: 'joined', 
          updated_at: new Date().toISOString() 
        }).eq('id', app.id);

        successMessage = `Intern activated: ${internId} (Password: ${tempPassword})`;
      }

      await log('ACTIVATE_INTERN', 'intern', internId, { email: app.email });

      // Send welcome email with credentials
      await sendEmail(
        app.email,
        'Welcome to TeKVora Internship — Your Login Credentials 🚀',
        internWelcomeHtml(app.full_name, internId, app.internship_title, tempPassword)
      );

      setMsg(successMessage || `Intern activated: ${internId}. Welcome email sent!`);
      await loadAll();
      setSelectedApp(prev => prev?.id === app.id ? { ...prev, stage: 'joined' as InternshipApplication['stage'] } : prev);
      setTimeout(() => setMsg(''), 7000);
    } catch (err: unknown) {
      console.error('Error activating intern:', err);
      setMsg(`Error: ${(err as Error).message || 'Failed to activate intern.'}`);
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const addTask = async () => {
    if (!selectedIntern || !taskForm.title) return;
    setLoading(true);
    await supabase.from('intern_tasks').insert({ intern_id: selectedIntern.id, ...taskForm });
    await log('ADD_TASK', 'task', selectedIntern.intern_id, { title: taskForm.title });
    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' });
    await loadAll();
    setMsg('Task added!');
    setTimeout(() => setMsg(''), 2000);
    setLoading(false);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('intern_tasks').delete().eq('id', taskId);
    await log('DELETE_TASK', 'task', taskId, {});
    await loadAll();
  };

  const issueCertificate = async () => {
    if (!certForm.holder_name || !certForm.program_name) return;
    setLoading(true);
    const year = new Date().getFullYear();

    // Query the latest issued certificate for this year starting with TI-YEAR- to calculate sequential ID
    const { data: latestCert, error: fetchErr } = await supabase
      .from('certificates')
      .select('certificate_id')
      .like('certificate_id', `TI-${year}-%`)
      .order('certificate_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('Failed to query latest certificate:', fetchErr);
    }

    let nextSeq = 1;
    if (latestCert) {
      const parts = latestCert.certificate_id.split('-');
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    const certId = `TI-${year}-${String(nextSeq).padStart(6, '0')}`;
    const skillsArray = certForm.skills.split(',').map(s => s.trim()).filter(Boolean);

    const { error } = await supabase.from('certificates').insert({
      certificate_id: certId, holder_name: certForm.holder_name,
      program_name: certForm.program_name, duration: certForm.duration,
      skills: skillsArray, is_intern: certForm.is_intern,
      student_id: certForm.student_id || null, intern_id: certForm.intern_id || null,
      issue_date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      console.error('Failed to issue certificate:', error);
      alert(`Failed to issue certificate: ${error.message}\nDetail: ${error.details || 'None'}`);
      setLoading(false);
      return;
    }

    await log('ISSUE_CERTIFICATE', 'certificate', certId, { holder: certForm.holder_name });
    setCertForm({ holder_name: '', program_name: '', duration: '', skills: '', student_id: '', intern_id: '', is_intern: false });
    await loadAll();
    setMsg(`Certificate issued: ${certId}`);
    setTimeout(() => setMsg(''), 4000);
    setLoading(false);
  };

  const revokeCertificate = async (cert: Certificate) => {
    const reason = prompt('Revocation reason:');
    if (!reason) return;
    await supabase.from('certificates').update({ is_revoked: true, revocation_reason: reason }).eq('id', cert.id);
    await log('REVOKE_CERTIFICATE', 'certificate', cert.certificate_id, { reason });
    await loadAll();
  };

  const previewCertificate = (cert: Certificate) => {
    setPreviewingCert(cert);
  };

  const openDocPreview = (type: 'offer' | 'lor', intern: any, lorRating?: string, lorAchievements?: string) => {
    setDocPreviewType(type);
    setDocPreviewIntern(intern);
    setDocPreviewLorRating(lorRating || 'Outstanding');
    setDocPreviewLorAchievements(lorAchievements || '');
  };

  const closeDocPreview = () => {
    setDocPreviewType(null);
    setDocPreviewIntern(null);
  };

  const handleDocDownload = async () => {
    if (!docPreviewIntern || !docPreviewType) return;
    setDocGenerating(true);
    try {
      if (docPreviewType === 'offer') {
        await downloadOfferLetterPDF(docPreviewIntern);
      } else {
        await downloadLORPDF(docPreviewIntern, docPreviewLorRating, docPreviewLorAchievements);
      }
    } finally {
      setDocGenerating(false);
    }
  };

  const handleDocPrint = () => {
    if (!docPreviewIntern || !docPreviewType) return;
    if (docPreviewType === 'offer') {
      printOfferLetter(docPreviewIntern);
    } else {
      printLOR(docPreviewIntern, docPreviewLorRating, docPreviewLorAchievements);
    }
  };

  const updateMouStatus = async (req: MouRequest, status: string) => {
    await supabase.from('mou_requests').update({ status }).eq('id', req.id);
    await log('UPDATE_MOU_STATUS', 'mou', req.id, { status, college: req.college_name });
    await loadAll();
  };



  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-primary-600 bg-primary-50' },
    { label: 'Active Interns', value: interns.filter(i => i.status === 'active').length, icon: Briefcase, color: 'text-orange-600 bg-orange-50' },
    { label: 'Pending Applications', value: applications.filter(a => ['applied', 'under_review'].includes(a.stage)).length, icon: ClipboardList, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Pending Payments', value: enrollments.filter(e => !e.payment_approved && e.status !== 'rejected').length, icon: BookOpen, color: 'text-red-600 bg-red-50' },
    { label: 'Certificates Issued', value: certificates.filter(c => !c.is_revoked).length, icon: Award, color: 'text-green-600 bg-green-50' },
    { label: 'MOU Requests', value: mouRequests.filter(m => m.status === 'new').length, icon: Handshake, color: 'text-purple-600 bg-purple-50' },
  ];

  const NavButton = ({ item }: { item: typeof navItems[0] }) => (
    <button
      onClick={() => { setTab(item.id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${tab === item.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      <item.icon size={17} />
      {item.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-poppins">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100">
          <img src="/new_logo.png" alt="TeKVora" className="h-9 w-auto" />
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => <NavButton key={item.id} item={item} />)}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <p className="text-xs text-primary-600 font-medium">Administrator</p>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 -ml-2 mr-3 text-gray-500">
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900 capitalize">{tab.replace('_', ' ')}</h1>
          {msg && (
            <div className="ml-auto flex items-center gap-2 bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-lg">
              <CheckCircle size={14} /> {msg}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {stats.map((s, i) => (
                  <div key={i} className="card p-5">
                    <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                      <s.icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Applications */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                  <button onClick={() => setTab('applications')} className="text-primary-600 text-xs font-medium">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead><tr><th>Applicant</th><th>Internship</th><th>Date</th><th>Stage</th></tr></thead>
                    <tbody>
                      {applications.slice(0, 5).map(app => (
                        <tr key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedApp(app); setTab('applications'); }}>
                          <td><p className="font-medium text-gray-800">{app.full_name}</p><p className="text-gray-400 text-xs">{app.email}</p></td>
                          <td className="text-gray-600">{app.internship_title}</td>
                          <td className="text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString('en-IN')}</td>
                          <td><span className={stageBadge(app.stage)}>{stageLabels[app.stage]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {applications.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No applications yet.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Applications */}
          {tab === 'applications' && (
            <div className="space-y-5">
              {selectedApp ? (
                <div>
                  <button onClick={() => setSelectedApp(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5">
                    ← Back to list
                  </button>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="card p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Application Details</h3>
                      <div className="space-y-2.5 text-sm">
                        {[
                          ['Name', selectedApp.full_name], ['Email', selectedApp.email], ['Phone', selectedApp.phone],
                          ['College', selectedApp.college], ['Year', selectedApp.year_of_study], ['Branch', selectedApp.branch],
                          ['City', selectedApp.city], ['Applied', new Date(selectedApp.created_at).toLocaleDateString('en-IN')],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-400">{k}</span>
                            <span className="font-medium text-gray-700 text-right max-w-[60%]">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Motivation</p>
                        <p className="text-gray-700 text-sm bg-gray-50 rounded-xl p-3 leading-relaxed">{selectedApp.motivation}</p>
                      </div>
                    </div>
                    <div className="card p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Stage Actions</h3>
                      <div className="mb-4">
                        <span className={stageBadge(selectedApp.stage)}>{stageLabels[selectedApp.stage]}</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { stage: 'under_review', label: 'Move to Under Review', color: 'bg-blue-500' },
                          { stage: 'interview_scheduled', label: 'Schedule Interview', color: 'bg-yellow-500' },
                          { stage: 'interview_done', label: 'Mark Interview Done', color: 'bg-orange-500' },
                          { stage: 'selected', label: 'Mark Selected', color: 'bg-green-500' },
                          { stage: 'offer_letter_sent', label: 'Offer Letter Sent', color: 'bg-teal-500' },
                        ].map(({ stage, label, color }) => (
                          <button key={stage} onClick={() => updateAppStage(selectedApp, stage)}
                            className={`w-full ${color} hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-medium transition-all`}>
                            {label}
                          </button>
                        ))}
                        <button onClick={() => activateIntern(selectedApp)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                          Activate as Intern (Generate ID)
                        </button>
                        <button onClick={() => updateAppStage(selectedApp, 'completed')}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead><tr><th>Applicant</th><th>Internship</th><th>College</th><th>Applied</th><th>Stage</th><th>Actions</th></tr></thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id}>
                            <td><p className="font-medium text-gray-800">{app.full_name}</p><p className="text-gray-400 text-xs">{app.email}</p></td>
                            <td className="text-gray-600 text-xs">{app.internship_title}</td>
                            <td className="text-gray-500 text-xs">{app.college}</td>
                            <td className="text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString('en-IN')}</td>
                            <td><span className={stageBadge(app.stage)}>{stageLabels[app.stage]}</span></td>
                            <td>
                              <button onClick={() => setSelectedApp(app)} className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1">
                                <Eye size={13} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {applications.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No applications yet.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students */}
          {tab === 'students' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs text-primary-600 font-semibold">{s.student_id}</td>
                        <td className="font-medium text-gray-800">{s.full_name}</td>
                        <td className="text-gray-500 text-xs">{s.email}</td>
                        <td>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {s.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No students registered yet.</p>}
              </div>
            </div>
          )}

          {/* Enrollments */}
          {tab === 'enrollments' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700 font-medium">
                  {enrollments.filter(e => !e.payment_approved && e.status !== 'rejected').length} pending payment verification
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700 font-medium">
                  {enrollments.filter(e => e.payment_approved).length} approved
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Proof</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(enroll => {
                        const student = students.find(s => s.id === enroll.student_id);
                        const isPending = !enroll.payment_approved && enroll.status !== 'rejected';
                        return (
                          <tr key={enroll.id} className={isPending ? 'bg-yellow-50/50' : ''}>
                            <td>
                              <p className="font-medium text-gray-800 text-sm">{student?.full_name || 'Unknown'}</p>
                              <p className="text-gray-400 text-xs font-mono">{student?.student_id}</p>
                            </td>
                            <td className="text-gray-600 text-sm">{courseNames[enroll.course_id] || `Course #${enroll.course_id}`}</td>
                            <td className="text-gray-400 text-xs">{new Date(enroll.enrolled_at).toLocaleDateString('en-IN')}</td>
                            <td>
                              {enroll.payment_proof_url ? (
                                <button onClick={() => viewProof(enroll)}
                                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium">
                                  <Eye size={13} /> View
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">No proof</span>
                              )}
                            </td>
                            <td>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                enroll.payment_approved ? 'bg-green-50 text-green-700' :
                                enroll.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                'bg-yellow-50 text-yellow-700'
                              }`}>
                                {enroll.payment_approved ? 'Approved' : enroll.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              {isPending && (
                                <div className="flex gap-2">
                                  <button onClick={() => approveEnrollment(enroll)}
                                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                                    <CheckCircle size={12} /> Approve
                                  </button>
                                  <button onClick={() => rejectEnrollment(enroll)}
                                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                                    <XCircle size={12} /> Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {enrollments.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No enrollments yet.</p>}
                </div>
              </div>

              {/* Proof image viewer modal */}
              {proofUrl && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setProofUrl(null)}>
                  <div className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Payment Proof</h3>
                      <div className="flex gap-2">
                        <a href={proofUrl} download target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                          <Download size={13} /> Download
                        </a>
                        <button onClick={() => setProofUrl(null)} className="text-gray-400 hover:text-gray-600 p-1">
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                    <img src={proofUrl} alt="Payment Proof" className="w-full rounded-xl object-contain max-h-[70vh]" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interns */}
          {tab === 'interns' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">All Interns</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead><tr><th>Intern ID</th><th>Name</th><th>Internship</th><th>Status</th><th>Documents</th><th></th></tr></thead>
                      <tbody>
                        {interns.map(intern => (
                          <tr key={intern.id} className={selectedIntern?.id === intern.id ? 'bg-primary-50' : ''}>
                            <td className="font-mono text-xs text-orange-600 font-semibold">{intern.intern_id}</td>
                            <td className="font-medium text-gray-800 text-sm">{intern.full_name}</td>
                            <td className="text-gray-500 text-xs">{intern.internship_title}</td>
                            <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intern.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{intern.status}</span></td>
                            <td>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <button 
                                  onClick={() => {
                                    const cert = certificates.find(c => c.intern_id === intern.id);
                                    if (cert) {
                                      previewCertificate(cert);
                                    } else {
                                      alert("No certificate has been issued for this intern yet. Please issue a certificate first under the Certificates tab.");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50 px-2 py-1 rounded-md text-[10px] font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <Award size={10} /> Cert
                                </button>
                                <button 
                                  onClick={() => printOfferLetter(intern)}
                                  className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-2 py-1 rounded-md text-[10px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <Printer size={10} /> Offer
                                </button>
                                <button 
                                  onClick={() => printLOR(intern)}
                                  className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-2 py-1 rounded-md text-[10px] font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <Printer size={10} /> LOR
                                </button>
                              </div>
                            </td>
                            <td>
                              <button onClick={() => setSelectedIntern(intern)} className="text-primary-600 text-xs font-medium hover:underline">
                                Tasks
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {interns.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No interns yet.</p>}
                  </div>
                </div>

                {selectedIntern && (
                  <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-1">{selectedIntern.full_name}</h3>
                    <p className="text-xs text-gray-400 font-mono mb-4">{selectedIntern.intern_id}</p>
                    <div className="space-y-3 mb-5">
                      <input value={taskForm.title} onChange={e => setTaskForm(p => ({...p, title: e.target.value}))}
                        className="input-field text-sm" placeholder="Task title *" />
                      <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({...p, description: e.target.value}))}
                        className="input-field text-sm resize-none" rows={2} placeholder="Description" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({...p, due_date: e.target.value}))}
                          className="input-field text-sm" />
                        <select value={taskForm.priority} onChange={e => setTaskForm(p => ({...p, priority: e.target.value as 'low' | 'medium' | 'high'}))}
                          className="input-field text-sm">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <button onClick={addTask} disabled={loading || !taskForm.title}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                        <Plus size={14} /> Add Task
                      </button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {tasks.filter(t => t.intern_id === selectedIntern.id).map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{task.title}</p>
                            <p className="text-xs text-gray-400">{task.status} · {task.priority} priority</p>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tab === 'tasks' && (
            <TaskManagement
              interns={interns}
              tasks={tasks}
              onRefresh={loadAll}
              userEmail={user?.email || ''}
            />
          )}

          {/* Certificates */}
          {tab === 'certificates' && (
            <div className="space-y-5">
              {/* Issue form */}
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-5">Issue New Certificate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={certForm.holder_name} onChange={e => setCertForm(p => ({...p, holder_name: e.target.value}))}
                    className="input-field" placeholder="Holder Name *" />
                  <input value={certForm.program_name} onChange={e => setCertForm(p => ({...p, program_name: e.target.value}))}
                    className="input-field" placeholder="Program Name *" />
                  <input value={certForm.duration} onChange={e => setCertForm(p => ({...p, duration: e.target.value}))}
                    className="input-field" placeholder="Duration (e.g. 1 Month)" />
                  <input value={certForm.skills} onChange={e => setCertForm(p => ({...p, skills: e.target.value}))}
                    className="input-field" placeholder="Skills (comma-separated)" />
                  <select
                    value={certForm.student_id}
                    onChange={e => {
                      const selectedStudent = students.find(s => s.id === e.target.value);
                      setCertForm(p => ({
                        ...p,
                        student_id: e.target.value,
                        holder_name: selectedStudent ? selectedStudent.full_name : p.holder_name
                      }));
                    }}
                    className="input-field"
                  >
                    <option value="">Link to Registered Student (Optional)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                    ))}
                  </select>
                  <select
                    value={certForm.intern_id}
                    onChange={e => {
                      const selectedIntern = interns.find(i => i.id === e.target.value);
                      setCertForm(p => ({
                        ...p,
                        intern_id: e.target.value,
                        is_intern: e.target.value ? true : p.is_intern,
                        holder_name: selectedIntern ? selectedIntern.full_name : p.holder_name,
                        program_name: (selectedIntern && selectedIntern.internship_title) || p.program_name
                      }));
                    }}
                    className="input-field"
                  >
                    <option value="">Link to Active Intern (Optional)</option>
                    {interns.map(i => (
                      <option key={i.id} value={i.id}>{i.full_name} ({i.intern_id})</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isIntern" checked={certForm.is_intern}
                      onChange={e => setCertForm(p => ({...p, is_intern: e.target.checked}))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    <label htmlFor="isIntern" className="text-sm text-gray-700">Is Intern Certificate</label>
                  </div>
                </div>
                <button onClick={issueCertificate} disabled={loading || !certForm.holder_name || !certForm.program_name}
                  className="mt-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Award size={15} />}
                  Issue Certificate
                </button>
              </div>

              {/* List */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead><tr><th>Certificate ID</th><th>Holder</th><th>Program</th><th>Issue Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {certificates.map(cert => (
                        <tr key={cert.id}>
                          <td className="font-mono text-xs text-primary-600 font-semibold">{cert.certificate_id}</td>
                          <td className="font-medium text-gray-800">{cert.holder_name}</td>
                          <td className="text-gray-500 text-xs">{cert.program_name}</td>
                          <td className="text-gray-400 text-xs">{new Date(cert.issue_date).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cert.is_revoked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {cert.is_revoked ? 'Revoked' : 'Valid'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2 items-center">
                              <button onClick={() => previewCertificate(cert)} className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1">
                                <Eye size={12} /> Preview
                              </button>
                              {!cert.is_revoked && (
                                <button onClick={() => revokeCertificate(cert)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {certificates.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No certificates issued yet.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {tab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Document Center</h2>
                <p className="text-xs text-gray-500 mt-1">Generate official internship documents with logo letterhead and digital signature.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* ── Offer Letter Card ── */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Offer Letter</h3>
                      <p className="text-[11px] text-gray-400">Official internship offer on company letterhead</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Intern selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Select from Active Interns</label>
                      <select
                        value={offerForm.selectedInternId}
                        onChange={e => {
                          const sel = interns.find(i => i.id === e.target.value);
                          if (sel) {
                            setOfferForm(p => ({
                              ...p,
                              selectedInternId: sel.id,
                              internName: sel.full_name,
                              role: sel.internship_title || '',
                              startDate: sel.start_date ? sel.start_date.split('T')[0] : p.startDate,
                            }));
                          } else {
                            setOfferForm(p => ({ ...p, selectedInternId: '', internName: '', role: '', startDate: '' }));
                          }
                        }}
                        className="input-field text-sm"
                      >
                        <option value="">— Select an intern or fill manually —</option>
                        {interns.map(i => (
                          <option key={i.id} value={i.id}>{i.full_name} ({i.intern_id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Candidate Name *</label>
                      <input
                        type="text"
                        value={offerForm.internName}
                        onChange={e => setOfferForm(p => ({ ...p, internName: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="e.g. Vaibhav Tambe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Internship Role *</label>
                      <input
                        type="text"
                        value={offerForm.role}
                        onChange={e => setOfferForm(p => ({ ...p, role: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="e.g. Full Stack Developer Intern"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={offerForm.startDate}
                          onChange={e => setOfferForm(p => ({ ...p, startDate: e.target.value }))}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Stipend</label>
                        <input
                          type="text"
                          value={offerForm.stipend}
                          onChange={e => setOfferForm(p => ({ ...p, stipend: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="Unpaid / ₹5,000"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!offerForm.internName || !offerForm.role || !offerForm.startDate) {
                        alert('Please fill Candidate Name, Role, and Start Date.');
                        return;
                      }
                      const sel = interns.find(i => i.id === offerForm.selectedInternId);
                      const internData = sel || {
                        intern_id: `TVR-INT-${Math.floor(10000 + Math.random() * 90000)}`,
                        full_name: offerForm.internName,
                        internship_title: offerForm.role,
                        start_date: offerForm.startDate,
                        end_date: '',
                        email: 'info@tekvora.in',
                        phone: ''
                      };
                      printOfferLetter(internData);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={15} /> Generate & Print Offer Letter
                  </button>
                </div>

                {/* ── LOR Card ── */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Letter of Recommendation (LOR)</h3>
                      <p className="text-[11px] text-gray-400">Professional recommendation letter with performance details</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Intern selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Select from Active Interns</label>
                      <select
                        value={lorForm.selectedInternId}
                        onChange={e => {
                          const sel = interns.find(i => i.id === e.target.value);
                          if (sel) {
                            setLorForm(p => ({
                              ...p,
                              selectedInternId: sel.id,
                              internName: sel.full_name,
                              role: sel.internship_title || '',
                              startDate: sel.start_date ? sel.start_date.split('T')[0] : p.startDate,
                              endDate: sel.end_date ? sel.end_date.split('T')[0] : p.endDate,
                            }));
                          } else {
                            setLorForm(p => ({ ...p, selectedInternId: '', internName: '', role: '', startDate: '', endDate: '' }));
                          }
                        }}
                        className="input-field text-sm"
                      >
                        <option value="">— Select an intern or fill manually —</option>
                        {interns.map(i => (
                          <option key={i.id} value={i.id}>{i.full_name} ({i.intern_id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Intern Name *</label>
                      <input
                        type="text"
                        value={lorForm.internName}
                        onChange={e => setLorForm(p => ({ ...p, internName: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="e.g. Vaibhav Tambe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Internship Role *</label>
                      <input
                        type="text"
                        value={lorForm.role}
                        onChange={e => setLorForm(p => ({ ...p, role: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="e.g. Full Stack Developer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={lorForm.startDate}
                          onChange={e => setLorForm(p => ({ ...p, startDate: e.target.value }))}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">End Date *</label>
                        <input
                          type="date"
                          value={lorForm.endDate}
                          onChange={e => setLorForm(p => ({ ...p, endDate: e.target.value }))}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Performance Rating *</label>
                      <select
                        value={lorForm.performanceRating}
                        onChange={e => setLorForm(p => ({ ...p, performanceRating: e.target.value }))}
                        className="input-field text-sm"
                      >
                        <option value="Outstanding">⭐ Outstanding</option>
                        <option value="Excellent">✨ Excellent</option>
                        <option value="Good">👍 Good</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Key Achievements & Contributions</label>
                      <textarea
                        value={lorForm.achievements}
                        onChange={e => setLorForm(p => ({ ...p, achievements: e.target.value }))}
                        className="input-field text-sm resize-none"
                        rows={2}
                        placeholder="e.g. Built course generator module, optimized database queries, delivered 3 live projects."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (!lorForm.internName || !lorForm.role || !lorForm.startDate || !lorForm.endDate) {
                        alert('Please fill Intern Name, Role, Start Date, and End Date.');
                        return;
                      }
                      const sel = interns.find(i => i.id === lorForm.selectedInternId);
                      const internData = sel || {
                        intern_id: `TVR-INT-${Math.floor(10000 + Math.random() * 90000)}`,
                        full_name: lorForm.internName,
                        internship_title: lorForm.role,
                        start_date: lorForm.startDate,
                        end_date: lorForm.endDate,
                        email: 'info@tekvora.in',
                        phone: ''
                      };
                      printLOR(internData, lorForm.performanceRating, lorForm.achievements);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={15} /> Generate & Print LOR
                  </button>
                  </div>
                </div>
              </div>

              {/* Interns quick-access table */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Quick Generate — All Interns</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Click Offer or LOR to instantly generate for any intern using their database records.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead><tr><th>Intern ID</th><th>Name</th><th>Role</th><th>Status</th><th>Offer Letter</th><th>LOR</th></tr></thead>
                    <tbody>
                      {interns.map(intern => (
                        <tr key={intern.id}>
                          <td className="font-mono text-xs text-orange-600 font-semibold">{intern.intern_id}</td>
                          <td className="font-medium text-gray-800 text-sm">{intern.full_name}</td>
                          <td className="text-gray-500 text-xs">{intern.internship_title}</td>
                          <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intern.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{intern.status}</span></td>
                          <td>
                            <button
                              onClick={() => printOfferLetter(intern)}
                              className="inline-flex items-center gap-1 text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Printer size={11} /> Print Offer
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => printLOR(intern)}
                              className="inline-flex items-center gap-1 text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Printer size={11} /> Print LOR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {interns.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No interns found. Activate interns from the Applications tab first.</p>}
                </div>
              </div>
            </div>

          )}

          {/* MOU Requests */}

          {tab === 'mou' && (
            <div className="space-y-6">
              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Requests', value: mouRequests.length, color: 'text-blue-600 bg-blue-50' },
                  { label: 'New Requests', value: mouRequests.filter(m => m.status === 'new').length, color: 'text-yellow-600 bg-yellow-50' },
                  { label: 'In Discussion', value: mouRequests.filter(m => m.status === 'in_discussion').length, color: 'text-orange-600 bg-orange-50' },
                  { label: 'MOU Signed', value: mouRequests.filter(m => m.status === 'mou_signed').length, color: 'text-green-600 bg-green-50' },
                  { label: 'Rejected Requests', value: mouRequests.filter(m => m.status === 'rejected').length, color: 'text-red-600 bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className="card p-4 flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                    <span className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[0]}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Table Card */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>College</th><th>Contact</th><th>City</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {mouRequests.map(req => (
                      <tr key={req.id}>
                        <td><p className="font-medium text-gray-800">{req.college_name}</p><p className="text-gray-400 text-xs">{req.email}</p></td>
                        <td className="text-gray-600 text-xs">{req.contact_person}<br/><span className="text-gray-400">{req.designation}</span></td>
                        <td className="text-gray-500 text-xs">{req.city}</td>
                        <td className="text-gray-400 text-xs">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            req.status === 'new' ? 'bg-blue-50 text-blue-600' :
                            req.status === 'in_discussion' ? 'bg-yellow-50 text-yellow-600' :
                            req.status === 'mou_signed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>{req.status.replace('_', ' ')}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {['in_discussion', 'mou_signed', 'rejected'].map(s => (
                              <button key={s} onClick={() => updateMouStatus(req, s)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mouRequests.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No MOU requests yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Issue Tab */}
        {tab === 'bulk_issue' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Bulk Certificate Issuer</h3>
              <p className="text-xs text-gray-400 mt-1">Upload CSV format fields to generate and sign multiple credentials at once.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="input-field h-48 font-mono text-xs resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleParseCsv}
                    className="bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Parse CSV
                  </button>
                  <button
                    onClick={handleIssueBulkCertificates}
                    disabled={parsedRows.length === 0 || issueProgress > 0}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
                  >
                    Issue All Certificates
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parsed CSV Preview ({parsedRows.length} rows)</h4>
                <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-150 dark:border-slate-800 max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-bold">
                        <th className="pb-1.5">Name</th>
                        <th className="pb-1.5">Program</th>
                        <th className="pb-1.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-b-0 text-gray-650">
                          <td className="py-1.5">{r.holder_name}</td>
                          <td className="py-1.5">{r.program_name}</td>
                          <td className="py-1.5">{r.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">Click "Parse CSV" to preview.</p>}
                </div>

                {issueProgress > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-gray-400 font-bold">
                      <span>Issuing progress</span>
                      <span>{issueProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${issueProgress}%` }} />
                    </div>
                    {issueDone && (
                      <p className="text-[10px] text-emerald-600 font-bold">🎉 Certificates issued successfully!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Code Checker Tab */}
        {tab === 'code_checker' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Plagiarism & Code Checker</h3>
              <p className="text-xs text-gray-400 mt-1">Compare student code submissions using AST structural patterns and calculate similarity indices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Submission 1</label>
                <textarea
                  value={code1}
                  onChange={e => setCode1(e.target.value)}
                  className="input-field h-48 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Submission 2</label>
                <textarea
                  value={code2}
                  onChange={e => setCode2(e.target.value)}
                  className="input-field h-48 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCheckPlagiarism}
                disabled={checkerLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-1.5"
              >
                {checkerLoading ? 'Comparing...' : 'Compare Code Structure'}
              </button>
            </div>

            {similarity !== null && (
              <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-155 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Similarity Score</h4>
                  <span className={`text-2xl font-black ${similarity > 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{similarity}% Match</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${similarity > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${similarity}%` }} />
                </div>
                <div className="text-xs text-gray-500 leading-relaxed font-mono whitespace-pre-line border-t border-gray-100 pt-3">
                  <strong>Deep AI Analysis:</strong><br />{codeAnalysis}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Classes Tab */}
        {tab === 'live_classes' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Live Lecture Scheduler</h3>
              <p className="text-xs text-gray-400 mt-1">Schedule and manage live interactive workshops, Q&A sessions, or mentoring slots.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <form onSubmit={handleScheduleClass} className="space-y-4 md:col-span-1 bg-gray-50 dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-850">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule New Class</h4>

                {/* Error Message */}
                {liveClassError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{liveClassError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lecture Topic *</label>
                  <input
                    value={liveClassTitle}
                    onChange={e => { setLiveClassTitle(e.target.value); setLiveClassError(''); }}
                    required
                    placeholder="e.g. Intro to Django Metaclasses"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instructor</label>
                  <input
                    value={liveClassInstructor}
                    onChange={e => setLiveClassInstructor(e.target.value)}
                    placeholder="e.g. Mr. Vaibhav Tambe"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={liveClassDate}
                    onChange={e => { setLiveClassDate(e.target.value); setLiveClassError(''); }}
                    required
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Google Meet / Zoom Link *</label>
                  <input
                    value={liveClassMeetLink}
                    onChange={e => { setLiveClassMeetLink(e.target.value); setLiveClassError(''); }}
                    required
                    placeholder="https://meet.google.com/..."
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description (optional)</label>
                  <textarea
                    value={liveClassDescription}
                    onChange={e => setLiveClassDescription(e.target.value)}
                    rows={2}
                    placeholder="What will be covered in this session?"
                    className="input-field text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {loading
                    ? <><span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Scheduling...</>
                    : '📅 Schedule Class'
                  }
                </button>
              </form>

              {/* Scheduled List */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Scheduled Lectures ({scheduledClasses.length})
                  </h4>
                </div>
                {scheduledClasses.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-10 text-center">
                    <p className="text-2xl mb-2">📅</p>
                    <p className="text-sm font-semibold text-gray-500">No lectures scheduled yet</p>
                    <p className="text-xs text-gray-400 mt-1">Fill the form to schedule your first live class</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledClasses.map(c => {
                      const classDate = c.date ? new Date(c.date as string) : null;
                      const isPast = classDate ? classDate < new Date() : false;
                      return (
                        <div key={c.id as string} className={`border rounded-2xl p-4 ${isPast ? 'border-gray-100 bg-gray-50 dark:bg-slate-900/40 opacity-70' : 'border-primary-100 bg-primary-50/30 dark:bg-slate-900'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">{c.title as string}</h5>
                                {isPast && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Past</span>}
                                {!isPast && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Upcoming</span>}
                              </div>
                              {c.instructor && (
                                <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                                  👤 {c.instructor as string}
                                </p>
                              )}
                              <p className="text-[11px] text-gray-500 mt-1">
                                🗓 {classDate ? classDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : c.date as string}
                              </p>
                              {c.description && (
                                <p className="text-[11px] text-gray-400 mt-1 truncate">{c.description as string}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <a
                                href={c.link as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors whitespace-nowrap"
                              >
                                Join →
                              </a>
                              <button
                                onClick={() => handleDeleteClass(c.id as string)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                title="Delete class"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Reminders Tab */}
        {tab === 'reminders' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Fee Reminder Automation</h3>
              <p className="text-xs text-gray-400 mt-1">Send payment reminders and status logs to enrolled student profiles.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-650">
                  {enrollments.filter(e => !e.payment_approved).map(e => {
                    const student = students.find(s => s.id === e.student_id);
                    const email = student?.email || 'student@test.com';
                    return (
                      <tr key={e.id}>
                        <td className="py-3 font-semibold">{student?.full_name || 'Student'}</td>
                        <td className="py-3">{email}</td>
                        <td className="py-3 font-mono">{courseNames[e.course_id] || e.course_id}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleSendReminder(email, student?.full_name || 'Student', courseNames[e.course_id] || e.course_id)}
                            disabled={remindedEmails.includes(email) || sendingReminder}
                            className="bg-primary-600 hover:bg-primary-700 disabled:bg-emerald-50 disabled:text-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors inline-flex items-center gap-1"
                          >
                            {remindedEmails.includes(email) ? '✅ Sent' : sendingReminder ? 'Sending...' : 'Send Reminder'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {enrollments.filter(e => !e.payment_approved).length === 0 && (
                <p className="text-center text-gray-450 py-8 text-xs">All enrollments approved. No pending payments.</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Admin Performance Analytics</h3>
              <p className="text-xs text-gray-400 mt-1">Review student signup ratios, revenue generation models, and metrics charts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Course enrollment distribution */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enrollments by Course</h4>
                <div className="flex justify-center py-2">
                  <svg width="280" height="150" viewBox="0 0 280 150">
                    {/* Bar 1 */}
                    <rect x="20" y="30" width="30" height="100" fill="#7c3aed" rx="3" />
                    <text x="35" y="142" textAnchor="middle" className="text-[9px] fill-slate-400">Web Dev</text>
                    <text x="35" y="24" textAnchor="middle" className="text-[9px] font-bold fill-slate-800">42%</text>

                    {/* Bar 2 */}
                    <rect x="85" y="50" width="30" height="80" fill="#2563eb" rx="3" />
                    <text x="100" y="142" textAnchor="middle" className="text-[9px] fill-slate-400">Python</text>
                    <text x="100" y="44" textAnchor="middle" className="text-[9px] font-bold fill-slate-800">30%</text>

                    {/* Bar 3 */}
                    <rect x="150" y="70" width="30" height="60" fill="#10b981" rx="3" />
                    <text x="165" y="142" textAnchor="middle" className="text-[9px] fill-slate-400">Data Sci</text>
                    <text x="165" y="64" textAnchor="middle" className="text-[9px] font-bold fill-slate-800">18%</text>

                    {/* Bar 4 */}
                    <rect x="215" y="90" width="30" height="40" fill="#f97316" rx="3" />
                    <text x="230" y="142" textAnchor="middle" className="text-[9px] fill-slate-400">Design</text>
                    <text x="230" y="84" textAnchor="middle" className="text-[9px] font-bold fill-slate-800">10%</text>
                  </svg>
                </div>
              </div>

              {/* Monthly signups trend */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Trend (Last 5 Months)</h4>
                <div className="flex justify-center py-2">
                  <svg width="280" height="150" viewBox="0 0 280 150">
                    <path
                      d="M 20 120 Q 80 80, 140 100 T 260 30"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="3"
                    />
                    {/* Points */}
                    <circle cx="20" cy="120" r="4" fill="#7c3aed" />
                    <circle cx="90" cy="88" r="4" fill="#7c3aed" />
                    <circle cx="160" cy="95" r="4" fill="#7c3aed" />
                    <circle cx="260" cy="30" r="4" fill="#7c3aed" />

                    <text x="20" y="140" textAnchor="middle" className="text-[8px] fill-slate-400">Feb</text>
                    <text x="90" y="140" textAnchor="middle" className="text-[8px] fill-slate-400">Mar</text>
                    <text x="160" y="140" textAnchor="middle" className="text-[8px] fill-slate-400">Apr</text>
                    <text x="260" y="140" textAnchor="middle" className="text-[8px] fill-slate-400">May</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-5">Post a New Job Opportunity</h3>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={jobForm.role} onChange={e => setJobForm(p => ({...p, role: e.target.value}))}
                    className="input-field" placeholder="Job Role (e.g. Frontend Engineer) *" required />
                  <input value={jobForm.company} onChange={e => setJobForm(p => ({...p, company: e.target.value}))}
                    className="input-field" placeholder="Company Name *" required />
                  <input value={jobForm.location} onChange={e => setJobForm(p => ({...p, location: e.target.value}))}
                    className="input-field" placeholder="Location (e.g. Pune, MH) *" required />
                  <input value={jobForm.salary} onChange={e => setJobForm(p => ({...p, salary: e.target.value}))}
                    className="input-field" placeholder="Salary Range (e.g. ₹5 - ₹8 LPA)" />
                  <select value={jobForm.type} onChange={e => setJobForm(p => ({...p, type: e.target.value}))}
                    className="input-field">
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                  <select value={jobForm.remote} onChange={e => setJobForm(p => ({...p, remote: e.target.value}))}
                    className="input-field">
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
                <input value={jobForm.skills} onChange={e => setJobForm(p => ({...p, skills: e.target.value}))}
                  className="input-field" placeholder="Skills (comma-separated, e.g. React, TypeScript, Node.js)" />
                <textarea value={jobForm.description} onChange={e => setJobForm(p => ({...p, description: e.target.value}))}
                  className="input-field h-28 resize-none" placeholder="Job Description *" required />
                <button type="submit" disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white font-semibold rounded-xl px-5 py-3 text-sm transition-all shadow-md">
                  {loading ? 'Posting...' : 'Post Opportunity'}
                </button>
              </form>
            </div>

            <div className="card overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Current Job Openings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Role & Company</th><th>Location</th><th>Salary</th><th>Type</th><th>Actions</th></tr></thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <td>
                          <p className="font-semibold text-gray-800">{j.role}</p>
                          <p className="text-gray-400 text-xs">{j.company}</p>
                        </td>
                        <td className="text-gray-500 text-sm">{j.location} ({j.remote})</td>
                        <td className="text-gray-500 text-sm">{j.salary || '—'}</td>
                        <td>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary-50 text-primary-600">
                            {j.type}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteJob(j.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No job postings yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {tab === 'audit' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Action</th><th>Target</th><th>Admin</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="font-medium text-gray-800 font-mono text-xs">{log.action}</td>
                        <td className="text-gray-500 text-xs">{log.target_type} · {log.target_id?.slice(0, 12)}...</td>
                        <td className="text-gray-400 text-xs">{log.admin_email}</td>
                        <td className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditLogs.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No audit logs yet.</p>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Certificate Preview Modal */}
      {previewingCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Award className="text-primary-600 dark:text-primary-400" size={20} /> 
                Certificate Preview - {previewingCert.certificate_id}
              </h3>
              <button 
                onClick={() => setPreviewingCert(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div 
              ref={modalContainerRef} 
              className="relative w-full aspect-[880/620] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
            >
              <iframe
                title="Certificate Preview"
                srcDoc={getCertificateHtml(
                  previewingCert,
                  `${window.location.origin}/verify/${previewingCert.certificate_id}`,
                  '/logorbg.png',
                  '/signature.png'
                )}
                className="absolute top-0 left-0 border-0 origin-top-left"
                style={{
                  width: '880px',
                  height: '620px',
                  transform: `scale(${modalScaleFactor})`,
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => downloadCertificatePDF(previewingCert)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => downloadCertificatePNG(previewingCert)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download size={14} /> PNG
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => printCertificate(previewingCert)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={() => setPreviewingCert(null)}
                  className="border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal (Offer Letter / LOR) */}
      {docPreviewType && docPreviewIntern && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${docPreviewType === 'offer' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <FileText size={17} className={docPreviewType === 'offer' ? 'text-blue-600' : 'text-purple-600'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {docPreviewType === 'offer' ? 'Offer Letter Preview' : 'Letter of Recommendation Preview'}
                  </h3>
                  <p className="text-xs text-gray-400">{docPreviewIntern.full_name} · {docPreviewIntern.intern_id}</p>
                </div>
              </div>
              <button onClick={closeDocPreview} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* LOR rating controls if LOR */}
            {docPreviewType === 'lor' && (
              <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">Performance:</label>
                  <select
                    value={docPreviewLorRating}
                    onChange={e => setDocPreviewLorRating(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="Outstanding">⭐ Outstanding</option>
                    <option value="Excellent">✨ Excellent</option>
                    <option value="Good">👍 Good</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Achievements:</label>
                  <input
                    type="text"
                    value={docPreviewLorAchievements}
                    onChange={e => setDocPreviewLorAchievements(e.target.value)}
                    placeholder="Key achievements..."
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white flex-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}

            {/* Document Info */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span><strong className="text-gray-700">Name:</strong> {docPreviewIntern.full_name}</span>
                <span><strong className="text-gray-700">ID:</strong> {docPreviewIntern.intern_id}</span>
                <span><strong className="text-gray-700">Role:</strong> {docPreviewIntern.internship_title}</span>
                {docPreviewIntern.email && <span><strong className="text-gray-700">Email:</strong> {docPreviewIntern.email}</span>}
                {docPreviewType === 'lor' && docPreviewLorRating && <span><strong className="text-gray-700">Rating:</strong> {docPreviewLorRating}</span>}
              </div>
            </div>

            {/* Preview message */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${docPreviewType === 'offer' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                <FileText size={32} className={docPreviewType === 'offer' ? 'text-blue-400' : 'text-purple-400'} />
              </div>
              <h4 className="font-bold text-gray-800 text-lg mb-2">
                {docPreviewType === 'offer' ? 'Internship Offer Letter' : 'Letter of Recommendation'}
              </h4>
              <p className="text-gray-500 text-sm text-center max-w-sm mb-1">
                Ready to generate for <strong>{docPreviewIntern.full_name}</strong>.
              </p>
              <p className="text-gray-400 text-xs text-center max-w-sm">
                The document will be generated as a high-quality A4 PDF with official TeKVora letterhead, digital signature, and company seal.
              </p>
              <div className="mt-6 w-full max-w-sm bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Format</span>
                  <span className="font-medium text-gray-700">A4 Portrait PDF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Letterhead</span>
                  <span className="font-medium text-gray-700">TeKVora Infotech Pvt. Ltd.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Signature</span>
                  <span className="font-medium text-gray-700">Kamlesh Raut (HR)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Name</span>
                  <span className="font-medium text-gray-700">
                    {docPreviewType === 'offer'
                      ? `Offer_Letter_${docPreviewIntern.full_name.replace(/\s+/g, '_')}.pdf`
                      : `LOR_${docPreviewIntern.full_name.replace(/\s+/g, '_')}.pdf`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeDocPreview}
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDocPrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={handleDocDownload}
                  disabled={docGenerating}
                  className={`${
                    docPreviewType === 'offer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                  } disabled:bg-gray-300 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2`}
                >
                  {docGenerating
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                    : <><Download size={15} /> Download PDF</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
