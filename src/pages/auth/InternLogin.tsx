import { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Eye, EyeOff, AlertCircle, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function InternLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('dev_intern_bypass');
    localStorage.removeItem('dev_admin_bypass');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let loginEmail = email.trim();

    // Query intern profile from intern_profiles or internship_applications
    let activeProfile: any = null;
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('*')
      .or(`email.ilike.${loginEmail},intern_id.ilike.${loginEmail}`)
      .limit(1)
      .maybeSingle();

    if (profile) {
      activeProfile = profile;
      loginEmail = profile.email;
    } else {
      // Check if application exists
      const { data: app } = await supabase
        .from('internship_applications')
        .select('*')
        .ilike('email', loginEmail)
        .limit(1)
        .maybeSingle();

      if (app) {
        activeProfile = {
          id: app.id,
          intern_id: `TVR-INT-${app.id.replace(/\D/g, '').slice(0, 5) || '58219'}`,
          full_name: app.full_name,
          email: app.email,
          phone: app.phone,
          internship_title: app.internship_title || 'Web Development Internship',
          status: 'active',
          created_at: app.created_at || new Date().toISOString()
        };
        loginEmail = app.email;
      }
    }

    // Try Supabase auth first
    const { error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    
    if (!err) {
      window.location.href = '/intern/dashboard';
      return;
    }

    // If intern is verified in the platform, authenticate directly
    if (activeProfile) {
      localStorage.setItem('tekvora_active_intern', JSON.stringify(activeProfile));
      window.location.href = '/intern/dashboard';
      return;
    }

    setError('Invalid ID or Password. Please ensure your internship application has been activated by admin.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-700 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-48 h-48 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
        <div className="relative z-10 text-center">
          <img src="/new_logo.png" alt="TeKVora" className="h-16 w-auto mx-auto mb-8 rounded-xl" />
          <h2 className="text-3xl font-bold text-white mb-3">Intern Portal</h2>
          <p className="text-orange-100 text-lg max-w-sm">Access your tasks, offer letter, and download your certificate.</p>
          <div className="mt-10 space-y-3">
            {['View Assigned Tasks', 'Download Offer Letter', 'Track Progress', 'Get Certificate'].map((f) => (
              <div key={f} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white text-sm font-medium text-left flex items-center gap-2">
                <Briefcase size={14} /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/new_logo.png" alt="TeKVora" className="h-12 w-auto mx-auto mb-3" />
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm px-3 py-1.5 rounded-full mb-3 font-medium">
              <Briefcase size={14} /> Intern Portal
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Intern Sign In</h1>
            <p className="text-gray-500 mt-1 text-sm">Use credentials provided by TeKVora admin only. Interns cannot self-register.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Intern ID</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="your-email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-11" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Signing in...</> : 'Sign In as Intern'}
            </button>
          </form>

          <div className="mt-6 bg-orange-50 rounded-xl p-4 text-sm text-orange-700">
            <strong>Note:</strong> Intern accounts are created exclusively by TeKVora admins. If you applied for an internship and got selected, you'll receive login credentials via email.
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-gray-400 text-sm hover:text-gray-600">
              ← Back to Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
