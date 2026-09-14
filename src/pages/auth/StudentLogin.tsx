import { useState } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-48 h-48 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-orange-500/20 rounded-full"></div>
        </div>
        <div className="relative z-10 text-center">
          <img src="/new_logo.png" alt="TeKVora" className="h-16 w-auto mx-auto mb-8 rounded-xl" />
          <h2 className="text-3xl font-bold text-white mb-3">Student Portal</h2>
          <p className="text-blue-200 text-lg max-w-sm">Access your courses, track progress, and download certificates.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {['My Courses', 'My Certificates', 'Course Enrollment', 'Progress Tracking'].map((f) => (
              <div key={f} className="glass-card p-3 text-white text-sm font-medium">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/new_logo.png" alt="TeKVora" className="h-12 w-auto mx-auto mb-3" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-1">Sign in to your student account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-11" placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">Register here</Link>
            </p>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="text-xs">or</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
            <p className="text-gray-500 text-sm">
              Are you an intern?{' '}
              <Link to="/intern-login" className="text-orange-600 font-semibold hover:underline">Intern Login →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
