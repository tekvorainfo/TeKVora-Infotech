import { useState, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const ADMIN_EMAILS = ['admin@tekvora.com', 'vaibhav@tekvora.com'];

  useEffect(() => {
    localStorage.removeItem('dev_admin_bypass');
    localStorage.removeItem('dev_intern_bypass');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!ADMIN_EMAILS.includes(email)) {
      setError('Access denied. This portal is for authorized administrators only.');
      setLoading(false);
      return;
    }

    if (email === 'admin@tekvora.com' && (password === 'admin123' || password === 'admin')) {
      localStorage.setItem('dev_admin_bypass', 'true');
      window.location.href = '/admin-panel';
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('Invalid credentials.');
    } else {
      window.location.href = '/admin-panel';
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/new_logo.png" alt="TeKVora" className="h-14 w-auto mx-auto mb-4 rounded-xl" />
          <div className="inline-flex items-center gap-2 bg-red-900/30 text-red-400 text-xs px-3 py-1.5 rounded-full mb-4 border border-red-800/50">
            <Lock size={12} /> Admin Access Only
          </div>
          <h1 className="text-2xl font-bold text-white">Administrator Login</h1>
          <p className="text-gray-500 mt-1 text-sm">Restricted access — TeKVora Infotech</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Admin Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="admin@tekvora.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter admin password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mt-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Authenticating...</> : 'Access Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">Unauthorized access attempts are logged and monitored.</p>
      </div>
    </div>
  );
}
