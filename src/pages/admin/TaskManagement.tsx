import { useState } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Plus, Trash2, CheckCircle, Clock, AlertTriangle, Send, Mail,
  MessageSquare, Eye, Search,
  Briefcase, User, Calendar, Tag, FileText, X, CheckSquare,
  ArrowLeft, PlayCircle, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InternProfile, InternTask, TaskComment, TaskSubmission } from '../../lib/types';

interface TaskManagementProps {
  interns: InternProfile[];
  tasks: InternTask[];
  onRefresh: () => void;
  userEmail?: string;
}

export default function TaskManagement({ interns, tasks, onRefresh, userEmail }: TaskManagementProps) {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedTask, setSelectedTask] = useState<InternTask | null>(null);
  const [selectedIntern, setSelectedIntern] = useState<InternProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [internFilter, setInternFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'development',
    estimated_hours: '',
    intern_ids: [] as string[],
    send_email: true,
  });

  // Comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Submissions
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);

  // Email
  const [emailForm, setEmailForm] = useState({
    subject: '',
    body: '',
    recipient_type: 'selected' as 'selected' | 'all_active' | 'all_interns',
  });
  const [showEmailPanel, setShowEmailPanel] = useState(false);

  const categories = [
    { id: 'development', label: 'Development', color: 'bg-blue-50 text-blue-600' },
    { id: 'design', label: 'Design / UI', color: 'bg-purple-50 text-purple-600' },
    { id: 'testing', label: 'Testing / QA', color: 'bg-green-50 text-green-600' },
    { id: 'research', label: 'Research', color: 'bg-yellow-50 text-yellow-600' },
    { id: 'documentation', label: 'Documentation', color: 'bg-gray-50 text-gray-600' },
    { id: 'meeting', label: 'Meeting / Sync', color: 'bg-orange-50 text-orange-600' },
    { id: 'general', label: 'General', color: 'bg-slate-50 text-slate-600' },
  ];

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesIntern = internFilter === 'all' || t.intern_id === internFilter;
    return matchesSearch && matchesStatus && matchesIntern;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
  };

  const loadTaskDetails = async (task: InternTask) => {
    setSelectedTask(task);
    setView('detail');
    const [commentsRes, submissionsRes] = await Promise.all([
      supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at', { ascending: true }),
      supabase.from('task_submissions').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
    ]);
    setComments((commentsRes.data || []) as TaskComment[]);
    setSubmissions((submissionsRes.data || []) as TaskSubmission[]);
    const intern = interns.find(i => i.id === task.intern_id);
    setSelectedIntern(intern || null);
  };

  const addTask = async () => {
    if (!taskForm.title || taskForm.intern_ids.length === 0) {
      setMsg('Please fill title and select at least one intern.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setLoading(true);

    const tasksToInsert = taskForm.intern_ids.map(internId => ({
      intern_id: internId,
      title: taskForm.title,
      description: taskForm.description,
      due_date: taskForm.due_date || null,
      priority: taskForm.priority,
      category: taskForm.category,
      estimated_hours: taskForm.estimated_hours ? parseInt(taskForm.estimated_hours) : null,
      assigned_by: userEmail,
      assigned_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('intern_tasks').insert(tasksToInsert).select();

    if (error) {
      setMsg('Error creating tasks: ' + error.message);
    } else {
      // Send email notifications if enabled
      if (taskForm.send_email) {
        for (const internId of taskForm.intern_ids) {
          const intern = interns.find(i => i.id === internId);
          if (intern) {
            await sendTaskEmail(intern, taskForm.title, taskForm.description, taskForm.due_date);
          }
        }
      }
      setMsg(`Task assigned to ${taskForm.intern_ids.length} intern(s) successfully!`);
      setTaskForm({
        title: '', description: '', due_date: '', priority: 'medium',
        category: 'development', estimated_hours: '', intern_ids: [], send_email: true,
      });
      setView('list');
      onRefresh();
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const sendTaskEmail = async (intern: InternProfile, title: string, description: string, dueDate: string) => {
    const dueText = dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'No due date set';
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #1a6bcc, #0a2f61); padding: 30px; text-align: center;">
          <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height: 40px; margin-bottom: 10px;" />
          <h1 style="color: #fff; font-size: 20px; margin: 0;">New Task Assigned</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi <strong>${intern.full_name}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">You have been assigned a new task. Please review the details below and get started.</p>
          <div style="background: #f8fafc; border-left: 4px solid #1a6bcc; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #1a365d; margin: 0 0 10px 0; font-size: 16px;">${title}</h3>
            <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">${description || 'No description provided.'}</p>
            <p style="color: #c9a96e; margin: 15px 0 0 0; font-size: 12px; font-weight: 600;">${dueText}</p>
          </div>
          <a href="https://tekvora.in/intern-login" style="display: inline-block; background: linear-gradient(135deg, #1a6bcc, #0a2f61); color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 10px;">View Task Dashboard</a>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">TeKVora Infotech Pvt. Ltd. | Sambhaji Residency, Paithan Road, Chh. Sambhajinagar, MH</p>
        </div>
      </div>
    `;

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ to: intern.email, subject: `New Task: ${title} - TeKVora Infotech`, html }),
      });
      // Log email
      await supabase.from('email_notifications').insert({
        recipient_email: intern.email,
        recipient_name: intern.full_name,
        recipient_type: 'intern',
        subject: `New Task: ${title}`,
        body: html,
        template: 'task_assigned',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Email send failed:', e);
    }
  };

  const sendBulkEmail = async () => {
    if (!emailForm.subject || !emailForm.body) {
      setMsg('Please fill subject and body.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    let recipients: InternProfile[] = [];
    if (emailForm.recipient_type === 'selected' && selectedIntern) {
      recipients = [selectedIntern];
    } else if (emailForm.recipient_type === 'all_active') {
      recipients = interns.filter(i => i.status === 'active');
    } else {
      recipients = interns;
    }

    setLoading(true);
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #1a6bcc, #0a2f61); padding: 30px; text-align: center;">
          <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height: 40px; margin-bottom: 10px;" />
          <h1 style="color: #fff; font-size: 20px; margin: 0;">TeKVora Infotech</h1>
        </div>
        <div style="padding: 30px;">
          <div style="color: #334155; font-size: 14px; line-height: 1.7;">${emailForm.body.replace(/\n/g, '<br/>')}</div>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            TeKVora Infotech Pvt. Ltd. | ISO 9001:2015 Certified<br/>
            Sambhaji Residency, Phase 3, Gat No. 12, Row House No. 11/18, Behind Devgiri Bank, Paithan Road, Chh. Sambhajinagar, MH
          </p>
        </div>
      </div>
    `;

    for (const intern of recipients) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ to: intern.email, subject: emailForm.subject, html }),
        });
        await supabase.from('email_notifications').insert({
          recipient_email: intern.email,
          recipient_name: intern.full_name,
          recipient_type: 'intern',
          subject: emailForm.subject,
          body: html,
          template: 'bulk_email',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Email failed for', intern.email, err);
      }
    }

    setLoading(false);
    setMsg(`Email sent to ${recipients.length} recipient(s)!`);
    setEmailForm({ subject: '', body: '', recipient_type: 'selected' });
    setShowEmailPanel(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const addComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    const { data } = await supabase.from('task_comments').insert({
      task_id: selectedTask.id,
      author_id: 'admin',
      author_name: 'Admin',
      author_role: 'admin',
      content: newComment.trim(),
    }).select().single();
    if (data) {
      setComments(prev => [...prev, data as TaskComment]);
      setNewComment('');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await supabase.from('intern_tasks').delete().eq('id', taskId);
    onRefresh();
    if (selectedTask?.id === taskId) {
      setView('list');
      setSelectedTask(null);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('intern_tasks').update({ status }).eq('id', taskId);
    onRefresh();
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: status as 'pending' | 'in_progress' | 'completed' } : null);
    }
  };

  const reviewSubmission = async (sub: TaskSubmission, decision: 'approved' | 'rejected' | 'needs_revision') => {
    await supabase.from('task_submissions').update({
      status: decision,
      reviewed_by: userEmail,
      reviewed_at: new Date().toISOString(),
    }).eq('id', sub.id);
    setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: decision, reviewed_by: userEmail, reviewed_at: new Date().toISOString() } : s));
  };

  const toggleInternSelection = (internId: string) => {
    setTaskForm(prev => ({
      ...prev,
      intern_ids: prev.intern_ids.includes(internId)
        ? prev.intern_ids.filter(id => id !== internId)
        : [...prev.intern_ids, internId],
    }));
  };

  const selectAllInterns = () => {
    const activeIds = interns.filter(i => i.status === 'active').map(i => i.id);
    setTaskForm(prev => ({ ...prev, intern_ids: activeIds }));
  };

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-1">Assign New Task</h3>
          <p className="text-gray-400 text-sm mb-6">Create and assign tasks to interns. They will receive an email notification.</p>

          <div className="space-y-5">
            {/* Select Interns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Interns <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={selectAllInterns} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                  Select All Active
                </button>
                <button onClick={() => setTaskForm(prev => ({ ...prev, intern_ids: [] }))} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                  Clear All
                </button>
                <span className="text-xs text-gray-400">{taskForm.intern_ids.length} selected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3">
                {interns.filter(i => i.status === 'active').map(intern => (
                  <label key={intern.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${taskForm.intern_ids.includes(intern.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                    <input
                      type="checkbox"
                      checked={taskForm.intern_ids.includes(intern.id)}
                      onChange={() => toggleInternSelection(intern.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{intern.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{intern.intern_id}</p>
                    </div>
                  </label>
                ))}
                {interns.filter(i => i.status === 'active').length === 0 && (
                  <p className="text-gray-400 text-sm col-span-2 text-center py-4">No active interns found.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Build Login API Endpoint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={taskForm.category}
                  onChange={e => setTaskForm(p => ({ ...p, category: e.target.value }))}
                  className="input-field"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={taskForm.description}
                onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                className="input-field resize-none"
                rows={3}
                placeholder="Detailed task requirements, acceptance criteria, resources..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Est. Hours</label>
                <input
                  type="number"
                  value={taskForm.estimated_hours}
                  onChange={e => setTaskForm(p => ({ ...p, estimated_hours: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 8"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={taskForm.send_email}
                onChange={e => setTaskForm(p => ({ ...p, send_email: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="sendEmail" className="text-sm text-gray-700 flex items-center gap-2">
                <Mail size={14} className="text-primary-600" />
                Send email notification to intern(s)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={addTask}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Send size={15} />}
                Assign Task
              </button>
              <button
                onClick={() => setView('list')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedTask) {
    const category = categories.find(c => c.id === selectedTask.category) || categories[6];
    const isOverdue = selectedTask.due_date && new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'completed';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft size={16} /> Back to Tasks
          </button>
        </div>

        {/* Task Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${category.color}`}>
                  <Tag size={10} className="inline mr-1" />{category.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  selectedTask.priority === 'high' ? 'bg-red-50 text-red-600' :
                  selectedTask.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectedTask.priority} priority
                </span>
                {isOverdue && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                    <AlertTriangle size={10} className="inline mr-1" />Overdue
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
              {selectedTask.description && (
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{selectedTask.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                {selectedTask.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Due: {new Date(selectedTask.due_date).toLocaleDateString('en-IN')}
                  </span>
                )}
                {selectedTask.estimated_hours && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Est: {selectedTask.estimated_hours}h
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User size={12} /> Assigned to: {selectedIntern?.full_name || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={12} /> {selectedIntern?.intern_id || '—'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedTask.status !== 'completed' && (
                <button
                  onClick={() => updateTaskStatus(selectedTask.id, 'completed')}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <CheckCircle size={12} /> Mark Complete
                </button>
              )}
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submissions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={16} /> Submissions ({submissions.length})
              </h3>
              {submissions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map(sub => (
                    <div key={sub.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-grow">
                          <p className="text-sm text-gray-700">{sub.submission_notes || 'Work submitted'}</p>
                          {sub.submission_url && (
                            <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary-600 text-xs hover:underline flex items-center gap-1 mt-1">
                              <Download size={10} /> View Submission
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === 'approved' ? 'bg-green-50 text-green-600' :
                            sub.status === 'rejected' ? 'bg-red-50 text-red-600' :
                            sub.status === 'needs_revision' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>{sub.status.replace('_', ' ')}</span>
                          {sub.status === 'submitted' && (
                            <div className="flex gap-1 mt-1">
                              <button onClick={() => reviewSubmission(sub, 'approved')} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Approve</button>
                              <button onClick={() => reviewSubmission(sub, 'needs_revision')} className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">Revise</button>
                              <button onClick={() => reviewSubmission(sub, 'rejected')} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {sub.review_notes && (
                        <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">Review: {sub.review_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={16} /> Comments ({comments.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {comments.map(c => (
                  <div key={c.id} className={`flex gap-3 ${c.author_role === 'admin' ? 'flex-row' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      c.author_role === 'admin' ? 'bg-primary-100 text-primary-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {c.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow">
                      <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                        <p className="text-xs font-medium text-gray-700">{c.author_name} <span className="text-gray-400 font-normal">· {c.author_role}</span></p>
                        <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-1">{new Date(c.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No comments yet.</p>}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  className="input-field text-sm flex-grow"
                  placeholder="Add a comment..."
                />
                <button onClick={addComment} disabled={!newComment.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Intern Info */}
            {selectedIntern && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Intern Details</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-gray-400">Name</span> <span className="font-medium">{selectedIntern.full_name}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">ID</span> <span className="font-mono text-primary-600">{selectedIntern.intern_id}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">Email</span> <span className="text-gray-600">{selectedIntern.email}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">Role</span> <span>{selectedIntern.internship_title}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedIntern.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedIntern.status}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => { setShowEmailPanel(true); setEmailForm(p => ({ ...p, recipient_type: 'selected' })); }}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <Mail size={12} /> Send Email
                </button>
              </div>
            )}

            {/* Email Panel */}
            {showEmailPanel && (
              <div className="card p-5 border border-primary-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Mail size={14} /> Send Email</h3>
                  <button onClick={() => setShowEmailPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
                <div className="space-y-3">
                  <select
                    value={emailForm.recipient_type}
                    onChange={e => setEmailForm(p => ({ ...p, recipient_type: e.target.value as 'selected' | 'all_active' | 'all_interns' }))}
                    className="input-field text-sm"
                  >
                    <option value="selected">Selected Intern Only</option>
                    <option value="all_active">All Active Interns</option>
                    <option value="all_interns">All Interns</option>
                  </select>
                  <input
                    value={emailForm.subject}
                    onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Email subject"
                  />
                  <textarea
                    value={emailForm.body}
                    onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))}
                    className="input-field text-sm resize-none"
                    rows={4}
                    placeholder="Email body..."
                  />
                  <button
                    onClick={sendBulkEmail}
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Send size={12} />}
                    Send Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: taskStats.total, icon: CheckSquare, color: 'text-primary-600 bg-primary-50' },
          { label: 'Pending', value: taskStats.pending, icon: Clock, color: 'text-gray-600 bg-gray-50' },
          { label: 'In Progress', value: taskStats.in_progress, icon: PlayCircle, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', value: taskStats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Overdue', value: taskStats.overdue, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mb-2`}>
              <s.icon size={16} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> Assign New Task
        </button>
        <div className="flex-grow flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm"
              placeholder="Search tasks..."
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={internFilter} onChange={e => setInternFilter(e.target.value)} className="input-field text-sm w-auto">
            <option value="all">All Interns</option>
            {interns.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
          </select>
        </div>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-xl">
          <CheckCircle size={14} /> {msg}
        </div>
      )}

      {/* Task List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Intern</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const intern = interns.find(i => i.id === task.intern_id);
                const cat = categories.find(c => c.id === task.category) || categories[6];
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                return (
                  <tr key={task.id} className="cursor-pointer hover:bg-gray-50" onClick={() => loadTaskDetails(task)}>
                    <td>
                      <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                      {task.description && <p className="text-gray-400 text-xs truncate max-w-[200px]">{task.description}</p>}
                    </td>
                    <td>
                      <p className="text-sm text-gray-700">{intern?.full_name || '—'}</p>
                      <p className="text-gray-300 text-xs font-mono">{intern?.intern_id}</p>
                    </td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span></td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'
                      }`}>{task.priority}</span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.status === 'completed' ? 'bg-green-50 text-green-600' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}>{task.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : '—'}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => loadTaskDetails(task)} className="text-primary-600 hover:text-primary-700 p-1">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No tasks found.</p>
              <button onClick={() => setView('create')} className="text-primary-600 text-sm font-medium mt-2 hover:underline">
                Assign your first task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
