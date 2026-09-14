import { useState } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function StudentRegister() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const generateStudentId = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `TVR-STU-${num}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const studentId = generateStudentId();
      await supabase.from('student_profiles').insert({
        id: data.user.id,
        student_id: studentId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        is_active: true,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500">Welcome to TeKVora Infotech. Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <img src="/new_logo.png" alt="TeKVora" className="h-16 w-auto mx-auto mb-8 rounded-xl" />
          <h2 className="text-3xl font-bold text-white mb-3">Join TeKVora</h2>
          <p className="text-blue-200 text-lg max-w-sm">Start your journey to a successful tech career today.</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/new_logo.png" alt="TeKVora" className="h-12 w-auto mx-auto mb-3" />
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-1">Get your student ID (TVR-STU-XXXXX)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))}
                className="input-field" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                className="input-field" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                className="input-field" placeholder="+91 XXXXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                  className="input-field pr-11" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
              <input type="password" required value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))}
                className="input-field" placeholder="Repeat password" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
