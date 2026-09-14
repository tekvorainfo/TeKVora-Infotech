import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '../lib/router';
import { Menu, X, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

const navLinks = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'courses', label: 'Courses', path: '/courses' },
  { key: 'internships', label: 'Internships', path: '/internships' },
  { key: 'faculty', label: 'Faculty', path: '/faculty' },
  { key: 'verify', label: 'Verify Certificate', path: '/verify' },
  { key: 'mou', label: 'MOU', path: '/mou' },
  { key: 'about', label: 'About', path: '/about' },
  { key: 'contact', label: 'Contact', path: '/contact' },
] as const;

export default function Navbar() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const { user, isAdmin, isIntern, studentProfile, internProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem('tekvora_theme') || 'light');

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTheme(customEvent.detail);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: nextTheme }));
  };


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin-panel';
    if (isIntern) return '/intern/dashboard';
    return '/dashboard';
  };

  const getDisplayName = () => {
    if (isAdmin) return user?.email?.split('@')[0] || 'Admin';
    if (internProfile) return internProfile.full_name;
    if (studentProfile) return studentProfile.full_name;
    return user?.email || '';
  };

  const getUserId = () => {
    if (isAdmin) return 'Admin';
    if (internProfile) return internProfile.intern_id;
    if (studentProfile) return studentProfile.student_id;
    return '';
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 transition-all duration-300 ${scrolled ? 'navbar-scrolled dark:border-slate-805 shadow-sm' : 'border-b border-gray-100 dark:border-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/new_logo.png" alt="TeKVora Infotech" className="h-10 w-auto" />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/20'
                      : 'text-gray-600 dark:text-slate-350 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-slate-900/50 dark:hover:text-white'
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <select
                value={locale}
                onChange={e => setLocale(e.target.value as any)}
                className="bg-white dark:bg-slate-900 text-xs font-semibold text-gray-650 dark:text-slate-300 outline-none cursor-pointer border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5"
              >
                <option value="en" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">EN</option>
                <option value="hi" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">हिंदी</option>
                <option value="mr" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">मराठी</option>
              </select>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200"
                aria-label="Toggle Theme"
                type="button"
              >
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 px-3.5 py-1.5 rounded-lg transition-colors duration-200"
                    title="Go to Dashboard"
                  >
                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-none">{getDisplayName()}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{getUserId()}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200"
                >
                  Student Login
                </Link>
              )}
            </div>

            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Theme"
                type="button"
              >
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
              </button>
              <button
                ref={toggleBtnRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
                type="button"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-[100] lg:hidden"
          style={{ top: '64px' }}
        >
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    location.pathname === link.path
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 flex items-center gap-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {getDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{getDisplayName()}</p>
                        <p className="text-xs text-gray-400">{getUserId()}</p>
                      </div>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Student Login
                  </Link>
                )}

                {/* Mobile preferences block (Feature 34 / PWA preference UI) */}
                <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between px-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preferences</span>
                  <div className="flex items-center gap-3">
                    <select
                      value={locale}
                      onChange={e => setLocale(e.target.value as any)}
                      className="bg-white dark:bg-slate-900 text-xs font-semibold text-gray-650 dark:text-slate-350 outline-none cursor-pointer border border-gray-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5"
                    >
                      <option value="en" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">EN</option>
                      <option value="hi" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">हिंदी</option>
                      <option value="mr" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">मराठी</option>
                    </select>

                    <button
                      onClick={toggleTheme}
                      className="p-2.5 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200 border border-gray-100 dark:border-slate-800"
                      aria-label="Toggle Theme"
                      type="button"
                    >
                      {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-655" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
