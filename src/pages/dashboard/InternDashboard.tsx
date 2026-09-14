import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Briefcase, Award, LogOut, CheckCircle, Clock, AlertTriangle, Eye, User, Key, Calendar, Flame, PlayCircle, PauseCircle, Send, MessageSquare, FileText, ChevronUp, Upload, Link as LinkIcon, Download, Printer, Video, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { InternTask, Certificate, TaskComment, TaskSubmission, InternProfile } from '../../lib/types';
import WhatsAppButton from '../../components/WhatsAppButton';
import { getCertificateHtml, printCertificate, downloadCertificatePDF, downloadCertificatePNG, downloadOfferLetterPDF, downloadLORPDF, printOfferLetter, printLOR } from '../../lib/DocumentGenerator';

type Tab = 'tasks' | 'attendance' | 'certificate' | 'profile' | 'password';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-600',
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
};

interface DailyLog {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'half_day' | 'late';
  notes: string | null;
}

export default function InternDashboard() {
  const { internProfile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InternTask | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submissionForm, setSubmissionForm] = useState({ url: '', notes: '' });
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Certificate Container Size/Scaling
  const [certPreviewWidth, setCertPreviewWidth] = useState(880);
  const certContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCertPreviewWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);
  const certScaleFactor = certPreviewWidth / 880;

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!internProfile) return;
    const [tasksRes, certRes, logsRes, todayRes, classesRes] = await Promise.all([
      supabase.from('intern_tasks').select('*').eq('intern_id', internProfile.id).order('due_date', { ascending: true }),
      supabase.from('certificates').select('*').eq('intern_id', internProfile.id).maybeSingle(),
      supabase.from('intern_daily_logs').select('*').eq('intern_id', internProfile.id).order('date', { ascending: false }).limit(30),
      supabase.from('intern_daily_logs').select('*').eq('intern_id', internProfile.id).eq('date', today).maybeSingle(),
      supabase.from('scheduled_classes').select('*').order('date', { ascending: true }),
    ]);
    setTasks((tasksRes.data || []) as InternTask[]);
    setCertificate(certRes.data as Certificate | null);
    setDailyLogs((logsRes.data || []) as DailyLog[]);
    setTodayLog(todayRes.data as DailyLog | null);
    setScheduledClasses((classesRes.data || []) as any[]);
  }, [internProfile, today]);

  useEffect(() => {
    if (!user || !internProfile) { navigate('/intern-login'); return; }
    loadData();
  }, [user, internProfile, navigate, loadData]);

  const downloadOfferLetter = async (intern: InternProfile & { start_date?: string, end_date?: string }) => {
    await downloadOfferLetterPDF(intern);
  };

  const downloadLOR = async (intern: InternProfile & { start_date?: string, end_date?: string }, _cert: Certificate & { issue_date?: string, program_name?: string, duration?: string }) => {
    await downloadLORPDF(intern, 'Excellent');
  };

  const handleCheckIn = async () => {
    if (!internProfile) return;
    setCheckingIn(true);
    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0];
    const isLate = now.getHours() >= 10;

    const { data, error } = await supabase.from('intern_daily_logs').insert({
      intern_id: internProfile.id,
      date: today,
      check_in: checkInTime,
      status: isLate ? 'late' : 'present',
    }).select().single();

    if (!error && data) {
      setTodayLog(data as DailyLog);
      setDailyLogs(prev => [data as DailyLog, ...prev.slice(0, 29)]);
    }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    if (!todayLog || !internProfile) return;
    setCheckingIn(true);
    const checkOutTime = new Date().toTimeString().split(' ')[0];

    const checkInParts = todayLog.check_in?.split(':').map(Number) || [0, 0];
    const checkOutParts = checkOutTime.split(':').map(Number);
    const checkInMinutes = checkInParts[0] * 60 + checkInParts[1];
    const checkOutMinutes = checkOutParts[0] * 60 + checkOutParts[1];
    const hoursWorked = (checkOutMinutes - checkInMinutes) / 60;

    let status = todayLog.status;
    if (hoursWorked < 4) status = 'half_day';
    else if (todayLog.status === 'late') status = 'late';
    else status = 'present';

    const { data, error } = await supabase.from('intern_daily_logs').update({
      check_out: checkOutTime,
      status,
    }).eq('id', todayLog.id).select().single();

    if (!error && data) {
      setTodayLog(data as DailyLog);
      setDailyLogs(prev => prev.map(l => l.id === data.id ? data as DailyLog : l));
    }
    setCheckingIn(false);
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Calculate streak
  const calculateStreak = useCallback(() => {
    let streak = 0;
    for (const log of dailyLogs) {
      if (log.status === 'present' || log.status === 'late') streak++;
      else break;
    }
    return streak;
  }, [dailyLogs]);

  const streak = calculateStreak();
  const presentDays = dailyLogs.filter(l => l.status === 'present' || l.status === 'late').length;
  const absentDays = dailyLogs.filter(l => l.status === 'absent').length;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
    if (error) setPwMsg({ type: 'error', text: error.message });
    else {
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ current: '', next: '', confirm: '' });
      if (internProfile?.must_change_password) {
        await supabase.from('intern_profiles').update({ must_change_password: false }).eq('id', internProfile.id);
      }
    }
    setPwLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    await supabase.from('intern_tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const openTaskDetail = async (task: InternTask) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    loadTaskDetails(task);
  };

  const loadTaskDetails = async (task: InternTask) => {
    const [commentsRes, submissionsRes] = await Promise.all([
      supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at', { ascending: true }),
      supabase.from('task_submissions').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
    ]);
    setTaskComments((commentsRes.data || []) as TaskComment[]);
    setTaskSubmissions((submissionsRes.data || []) as TaskSubmission[]);
  };

  const submitComment = async () => {
    if (!selectedTask || !newComment.trim() || !internProfile) return;
    const { data } = await supabase.from('task_comments').insert({
      task_id: selectedTask.id,
      author_id: internProfile.user_id,
      author_name: internProfile.full_name,
      author_role: 'intern',
      content: newComment.trim(),
    }).select().single();
    if (data) {
      setTaskComments(prev => [...prev, data as TaskComment]);
      setNewComment('');
    }
  };

  if (!internProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find an active intern profile linked to this account.</p>

        <button onClick={signOut} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><img src="/new_logo.png" alt="TeKVora" className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-4">
            {/* Today Status Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              todayLog?.check_out ? 'bg-gray-100 text-gray-600' :
              todayLog?.check_in ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                todayLog?.check_out ? 'bg-gray-400' :
                todayLog?.check_in ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              {todayLog?.check_out ? 'Day Complete' : todayLog?.check_in ? 'Working' : 'Not Checked In'}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800">{internProfile.full_name}</p>
              <p className="text-xs text-orange-600 font-mono">{internProfile.intern_id}</p>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Password Change Notice */}
        {internProfile.must_change_password && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-800 font-semibold text-sm">Action Required: Change Your Password</p>
              <p className="text-orange-600 text-sm mt-0.5">You're using a temporary password. Please change it immediately.</p>
              <button onClick={() => setTab('password')} className="mt-2 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium">
                Change Password Now
              </button>
            </div>
          </div>
        )}

        {/* Check In/Out Card */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calendar size={28} className="text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="text-xl font-bold">
                  {todayLog?.check_out ? 'Day Completed' :
                   todayLog?.check_in ? `Working since ${todayLog.check_in}` : 'Not checked in yet'}
                </p>
                {todayLog?.check_in && !todayLog?.check_out && (
                  <p className="text-blue-200 text-xs mt-1">Remember to check out when you finish</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                <Flame size={18} className="text-orange-300" />
                <span className="font-bold">{streak} Day Streak</span>
              </div>
              {!todayLog?.check_in ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold transition-all"
                >
                  {checkingIn ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <PlayCircle size={18} />}
                  Check In
                </button>
              ) : !todayLog?.check_out ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkingIn}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold transition-all"
                >
                  {checkingIn ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <PauseCircle size={18} />}
                  Check Out
                </button>
              ) : (
                <div className="bg-white/20 rounded-xl px-5 py-3 backdrop-blur-sm">
                  <CheckCircle size={18} className="inline mr-2" />
                  <span className="font-semibold">Done for today</span>
                </div>
              )}
            </div>
          </div>
          {todayLog?.check_in && (
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-sm">
              <div>
                <p className="text-blue-200 text-xs">Check In</p>
                <p className="font-semibold">{todayLog.check_in}</p>
              </div>
              {todayLog.check_out && (
                <div>
                  <p className="text-blue-200 text-xs">Check Out</p>
                  <p className="font-semibold">{todayLog.check_out}</p>
                </div>
              )}
              <div>
                <p className="text-blue-200 text-xs">Status</p>
                <p className="font-semibold capitalize">{todayLog.status.replace('_', ' ')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm border border-white/30">
              {internProfile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
              <h1 className="text-xl font-bold">{internProfile.full_name}</h1>
              <p className="text-orange-100 text-sm">{internProfile.internship_title || 'Intern'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-mono backdrop-blur-sm">{internProfile.intern_id}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm ${
                  internProfile.status === 'active' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'
                }`}>
                  {internProfile.status === 'active' ? '✓ Active Intern' : internProfile.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              <button
                onClick={() => downloadOfferLetter(internProfile)}
                className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
              >
                <Briefcase size={14} /> Download Offer Letter
              </button>
              {certificate && (
                <button
                  onClick={() => downloadLOR(internProfile, certificate)}
                  className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
                >
                  <Award size={14} /> Download LOR
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-orange-100 text-xs">Task Progress</span>
              <span className="text-white font-semibold text-sm">{completedTasks}/{tasks.length} tasks ({progress}%)</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Briefcase, label: 'Total Tasks', value: tasks.length, color: 'text-primary-600 bg-primary-50' },
            { icon: CheckCircle, label: 'Completed', value: completedTasks, color: 'text-green-600 bg-green-50' },
            { icon: Clock, label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-600 bg-blue-50' },
            { icon: Flame, label: 'Streak', value: `${streak} days`, color: 'text-orange-600 bg-orange-50', isText: true },
            { icon: Award, label: 'Certificate', value: certificate ? 'Issued' : 'Pending', color: 'text-purple-600 bg-purple-50', isText: true },
          ].map((stat, i) => (
            <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={18} />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit flex-wrap">
          {([
            { id: 'tasks', label: 'My Tasks', icon: Briefcase },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'certificate', label: 'Certificate', icon: Award },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Key },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div>
            {/* Scheduled Live Lectures */}
            {scheduledClasses.length > 0 && (
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl p-5 shadow-sm mb-6">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <Radio size={16} className="text-white animate-pulse" /> Live Mentoring & Workshop Sessions
                  </h3>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {scheduledClasses.length} Scheduled
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scheduledClasses.map((cls: any) => {
                    const classDate = cls.date ? new Date(cls.date) : null;
                    return (
                      <div key={cls.id} className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{cls.title}</h4>
                          <p className="text-[11px] text-orange-100 mt-0.5 flex items-center gap-1">
                            <Calendar size={11} /> {classDate ? classDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : cls.date}
                          </p>
                        </div>
                        <a
                          href={cls.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white hover:bg-orange-50 text-orange-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Video size={12} /> Join
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showTaskDetail && selectedTask ? (
              <div className="space-y-4">
                <button onClick={() => setShowTaskDetail(false)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                  <ChevronUp size={14} /> Back to Tasks
                </button>
                <div className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{selectedTask.title}</h3>
                      {selectedTask.description && <p className="text-gray-500 text-sm mt-1">{selectedTask.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        {selectedTask.due_date && <span className="flex items-center gap-1"><Clock size={10} /> Due: {new Date(selectedTask.due_date).toLocaleDateString('en-IN')}</span>}
                        {selectedTask.estimated_hours && <span className="flex items-center gap-1"><Briefcase size={10} /> Est: {selectedTask.estimated_hours}h</span>}
                        <span className={`px-2 py-0.5 rounded-full font-medium ${priorityColors[selectedTask.priority]}`}>{selectedTask.priority}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[selectedTask.status]}`}>{selectedTask.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedTask.status === 'pending' && (
                        <button onClick={() => updateTaskStatus(selectedTask.id, 'in_progress')} className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          <PlayCircle size={12} /> Start
                        </button>
                      )}
                      {selectedTask.status === 'in_progress' && (
                        <button onClick={() => updateTaskStatus(selectedTask.id, 'completed')} className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          <CheckCircle size={12} /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Work */}
                {selectedTask.status !== 'completed' && (
                  <div className="card p-5">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Upload size={14} /> Submit Your Work</h4>
                    <div className="space-y-3">
                      <input value={submissionForm.url} onChange={e => setSubmissionForm(p => ({ ...p, url: e.target.value }))} className="input-field text-sm" placeholder="Project URL / GitHub / Drive link..." />
                      <textarea value={submissionForm.notes} onChange={e => setSubmissionForm(p => ({ ...p, notes: e.target.value }))} className="input-field text-sm resize-none" rows={2} placeholder="Notes about your submission..." />
                      <button
                        onClick={async () => {
                          if (!submissionForm.url && !submissionForm.notes) return;
                          await supabase.from('task_submissions').insert({
                            task_id: selectedTask.id,
                            intern_id: internProfile?.id,
                            submission_url: submissionForm.url || null,
                            submission_notes: submissionForm.notes || null,
                          });
                          setSubmissionForm({ url: '', notes: '' });
                          loadTaskDetails(selectedTask);
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Send size={12} /> Submit
                      </button>
                    </div>
                  </div>
                )}

                {/* Submissions */}
                {taskSubmissions.length > 0 && (
                  <div className="card p-5">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={14} /> Your Submissions</h4>
                    <div className="space-y-2">
                      {taskSubmissions.map(sub => (
                        <div key={sub.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              {sub.submission_url && <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-xs hover:underline flex items-center gap-1"><LinkIcon size={10} /> View Work</a>}
                              {sub.submission_notes && <p className="text-gray-600 text-xs mt-1">{sub.submission_notes}</p>}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              sub.status === 'approved' ? 'bg-green-50 text-green-600' :
                              sub.status === 'rejected' ? 'bg-red-50 text-red-600' :
                              sub.status === 'needs_revision' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                            }`}>{sub.status.replace('_', ' ')}</span>
                          </div>
                          {sub.review_notes && <p className="text-xs text-gray-400 mt-1 border-t border-gray-100 pt-1">Feedback: {sub.review_notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="card p-5">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare size={14} /> Comments</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {taskComments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${c.author_role === 'admin' ? 'bg-primary-100 text-primary-600' : 'bg-orange-100 text-orange-600'}`}>
                          {c.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow">
                          <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                            <p className="text-[10px] font-medium text-gray-700">{c.author_name} <span className="text-gray-400 font-normal">· {c.author_role}</span></p>
                            <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                          </div>
                          <p className="text-[9px] text-gray-300 mt-0.5">{new Date(c.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                    {taskComments.length === 0 && <p className="text-gray-400 text-xs text-center py-4">No comments yet.</p>}
                  </div>
                  <div className="flex gap-2">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment()} className="input-field text-xs flex-grow" placeholder="Add a comment..." />
                    <button onClick={submitComment} disabled={!newComment.trim()} className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {tasks.length === 0 ? (
                  <div className="text-center py-16">
                    <Briefcase size={48} className="text-gray-200 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-500">No Tasks Assigned Yet</h3>
                    <p className="text-gray-400 text-sm mt-1">Tasks will appear here once assigned by your mentor.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => openTaskDetail(task)}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{task.title}</h3>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                                {task.priority} priority
                              </span>
                            </div>
                            {task.description && <p className="text-gray-500 text-sm mb-2 line-clamp-2">{task.description}</p>}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                              {task.due_date && (
                                <p className="flex items-center gap-1">
                                  <Clock size={12} /> Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            {task.status === 'pending' && (
                              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <PlayCircle size={14} /> Start
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button onClick={() => updateTaskStatus(task.id, 'completed')} className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <CheckCircle size={14} /> Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {tab === 'attendance' && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                <p className="text-xs text-gray-500">Present Days</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                <p className="text-xs text-gray-500">Absent Days</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{dailyLogs.length}</p>
                <p className="text-xs text-gray-500">Total Days</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{streak}</p>
                <p className="text-xs text-gray-500">Current Streak</p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Attendance History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Check In</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Check Out</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dailyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No attendance records yet. Check in to start tracking.
                        </td>
                      </tr>
                    ) : (
                      dailyLogs.map(log => {
                        const checkInTime = log.check_in ? new Date(`2000-01-01T${log.check_in}`) : null;
                        const checkOutTime = log.check_out ? new Date(`2000-01-01T${log.check_out}`) : null;
                        const hours = checkInTime && checkOutTime
                          ? ((checkOutTime.getTime() - checkInTime.getTime()) / 3600000).toFixed(1)
                          : '—';

                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">
                              {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-mono">{log.check_in || '—'}</td>
                            <td className="px-4 py-3 text-gray-700 font-mono">{log.check_out || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.status === 'present' ? 'bg-green-100 text-green-700' :
                                log.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                log.status === 'half_day' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {log.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{hours}h</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Tab */}
        {tab === 'certificate' && (
          <div className="space-y-6 max-w-4xl">
            {certificate ? (
              <div className="grid md:grid-cols-3 gap-6 items-start">
                {/* Left: Certificate Preview */}
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3 flex items-center gap-2">
                      <Award className="text-primary-600" size={18} />
                      Certificate Preview
                    </h3>
                    <div 
                      ref={certContainerRef} 
                      className="relative w-full aspect-[880/620] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                    >
                      <iframe
                        title="Certificate Preview"
                        srcDoc={getCertificateHtml(
                          certificate,
                          `${window.location.origin}/verify/${certificate.certificate_id}`,
                          '/logorbg.png',
                          '/signature.png'
                        )}
                        className="absolute top-0 left-0 border-0 origin-top-left"
                        style={{
                          width: '880px',
                          height: '620px',
                          transform: `scale(${certScaleFactor})`,
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Actions and Info */}
                <div className="space-y-4">
                  <div className="card p-5 border-l-4 border-orange-500">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Award size={18} className="text-orange-500" /> Certificate Issued!
                    </h3>
                    <p className="text-gray-400 text-xs mb-4">Your official certificate is ready. Use the actions below to download or print.</p>
                    
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2.5 text-xs mb-5">
                      <p><span className="text-gray-400">Certificate ID:</span> <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{certificate.certificate_id}</span></p>
                      <p><span className="text-gray-400">Program:</span> <span className="font-medium text-gray-800 dark:text-slate-200">{certificate.program_name}</span></p>
                      <p><span className="text-gray-400">Issued:</span> <span className="font-medium text-gray-800 dark:text-slate-200">{new Date(certificate.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => downloadCertificatePDF(certificate)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                      <button
                        onClick={() => downloadCertificatePNG(certificate)}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Download size={14} /> Download PNG
                      </button>
                      <button
                        onClick={() => printCertificate(certificate)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Printer size={14} /> Print Certificate
                      </button>
                      <button 
                        onClick={() => downloadLOR(internProfile, certificate)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Award size={14} /> Download LOR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-lg card p-8 text-center">
                <Award size={48} className="text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-500">Certificate Pending</h3>
                <p className="text-gray-400 text-sm mt-1">Your certificate will be issued by the admin upon completion of all tasks.</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-5">Profile Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Full Name', value: internProfile.full_name },
                  { label: 'Email', value: internProfile.email },
                  { label: 'Intern ID', value: internProfile.intern_id, mono: true },
                  { label: 'Internship', value: internProfile.internship_title || '—' },
                  { label: 'Status', value: internProfile.status },
                  { label: 'Start Date', value: internProfile.start_date ? new Date(internProfile.start_date).toLocaleDateString('en-IN') : '—' },
                  { label: 'End Date', value: internProfile.end_date ? new Date(internProfile.end_date).toLocaleDateString('en-IN') : '—' },
                ].map((f, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-400">{f.label}</span>
                    <span className={`font-medium text-gray-800 ${f.mono ? 'font-mono text-primary-600' : ''}`}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="max-w-md">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-5">Change Password</h3>
              {pwMsg && (
                <div className={`rounded-xl p-3 flex items-center gap-2 mb-4 text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {pwMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {pwMsg.text}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input type="password" required value={passwordForm.next} onChange={e => setPasswordForm(p => ({...p, next: e.target.value}))}
                    className="input-field" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input type="password" required value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({...p, confirm: e.target.value}))}
                    className="input-field" placeholder="Confirm new password" />
                </div>
                <button type="submit" disabled={pwLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                  {pwLoading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : null}
                  Change Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <WhatsAppButton />
    </div>
  );
}
