import { useState } from 'react';
import { useParams, Link } from '../lib/router';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { internshipApplicationSchema } from '../lib/validation';
import { sendEmail, internshipApplicationHtml } from '../lib/emailService';
import { z } from 'zod';

const internshipTitles: Record<string, string> = {
  'web-development-internship': 'Web Development Internship',
  'python-data-science-internship': 'Python & Data Science Internship',
  'ui-ux-design-internship': 'UI/UX Design Internship',
};

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year', 'Post Graduate'];

export default function InternshipApply() {
  const { slug } = useParams<{ slug: string }>();
  const internshipTitle = internshipTitles[slug || ''] || 'Internship';

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', college: '',
    year_of_study: '', branch: '', city: '', motivation: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload your resume.');
      return;
    }
    if (form.motivation.length < 100) {
      setError('Please write at least 100 characters in the motivation field.');
      return;
    }
    setLoading(true);
    setError('');

    let resume_url: string | undefined;
    if (resumeFile) {
      const fileName = `${Date.now()}_${resumeFile.name.replace(/\s+/g, '_')}`;
      const { data, error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile, { upsert: true });
      if (uploadErr) {
        console.error('Resume upload error:', uploadErr);
        setError(`Failed to upload resume: ${uploadErr.message}. Please try a smaller PDF (under 5MB).`);
        setLoading(false);
        return;
      }
      resume_url = data?.path || fileName;
    }

    try {
      const validatedData = internshipApplicationSchema.parse(form);
      const { error: insertErr } = await supabase.from('internship_applications').insert({
        ...validatedData,
        internship_title: internshipTitle,
        resume_url,
        stage: 'applied',
      });

      if (insertErr) {
        console.error('Insert error:', insertErr);
        setError(`Failed to submit application: ${insertErr.message}`);
      } else {
        // Send confirmation email to applicant (fire-and-forget)
        sendEmail(
          validatedData.email,
          `Application Received: ${internshipTitle} — TeKVora Infotech`,
          internshipApplicationHtml(validatedData.full_name, internshipTitle, validatedData.email)
        );
        setSuccess(true);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
            <p className="text-gray-500 mb-2">
              Thank you <strong>{form.full_name}</strong>! Your application for <strong>{internshipTitle}</strong> has been received.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              We'll review your application and get back to you within 3 working days via email at <strong>{form.email}</strong>.
            </p>
            <Link to="/internships" className="btn-primary">
              Back to Internships
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link to="/internships" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Back to Internships
          </Link>

          <div className="card p-8">
            <div className="mb-8">
              <span className="badge-orange mb-3 inline-block">Application Form</span>
              <h1 className="text-2xl font-bold text-gray-900">{internshipTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">No login required. Fill the form and we'll contact you.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input name="full_name" required value={form.full_name} onChange={handleChange}
                    className="input-field" placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange}
                    className="input-field" placeholder="your@email.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input name="phone" required value={form.phone} onChange={handleChange}
                    className="input-field" placeholder="+91 XXXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input name="city" required value={form.city} onChange={handleChange}
                    className="input-field" placeholder="Your city" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">College / University *</label>
                <input name="college" required value={form.college} onChange={handleChange}
                  className="input-field" placeholder="Enter your college/university name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year of Study *</label>
                  <select name="year_of_study" required value={form.year_of_study} onChange={handleChange} className="input-field">
                    <option value="">Select year</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch / Stream *</label>
                  <input name="branch" required value={form.branch} onChange={handleChange}
                    className="input-field" placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Why do you want this internship? * <span className="text-gray-400 font-normal">(min 100 characters)</span>
                </label>
                <textarea
                  name="motivation" required value={form.motivation} onChange={handleChange}
                  rows={4} className="input-field resize-none"
                  placeholder="Tell us about your motivation, goals, and what you hope to learn..."
                />
                <p className="text-xs text-gray-400 mt-1">{form.motivation.length} / 100 minimum characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resume (PDF, max 5MB) *</label>
                <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{resumeFile ? resumeFile.name : 'Click to upload your resume'}</p>
                    <p className="text-xs text-gray-400">PDF only, max 5MB</p>
                  </div>
                  <input
                    type="file" accept=".pdf" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        setError('File size must be under 5MB.');
                      } else {
                        setResumeFile(file || null);
                        setError('');
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> Submitting...</> : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
