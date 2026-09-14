import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate, useLocation } from '../lib/router';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import AIChatbot from './AIChatbot';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

// ── Dashboard paths where the progress bar should be hidden ─────────────────
const DASHBOARD_PATHS = ['/dashboard', '/intern/dashboard', '/admin-panel'];

// ── Keyboard shortcuts definition ───────────────────────────────────────────
const SHORTCUTS = [
  { keys: ['G', 'H'], description: 'Go Home', path: '/' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', path: '/dashboard' },
  { keys: ['G', 'L'], description: 'Go to Leaderboard', path: '/leaderboard' },
  { keys: ['G', 'C'], description: 'Go to Courses', path: '/courses' },
];

export default function Layout({ children, hideFooter }: LayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [showPreloader, setShowPreloader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('tekvora_theme') || 'light'
  );

  // ── Feature 36: Reading Progress ─────────────────────────────────────────
  const [scrollProgress, setScrollProgress] = useState(0);
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isDashboard) return;

    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress((el.scrollTop / total) * 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDashboard, pathname]);

  // ── Feature 37: Confetti ──────────────────────────────────────────────────
  useEffect(() => {
    const handleConfetti = () => {
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'],
        ticks: 250,
        gravity: 0.9,
        scalar: 1.1,
      });
      // Second burst from the left
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
        });
      }, 200);
      // Third burst from the right
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
        });
      }, 400);
    };

    window.addEventListener('tekvora-confetti', handleConfetti);
    return () => window.removeEventListener('tekvora-confetti', handleConfetti);
  }, []);

  // ── Feature 40: Keyboard Shortcut Panel ──────────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const keySequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyboardShortcut = useCallback(
    (e: KeyboardEvent) => {
      // ESC always closes
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setKeySequence([]);
        return;
      }

      // Don't fire shortcuts if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      // '?' opens the panel
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      // '/' focus search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]'
        );
        searchInput?.focus();
        return;
      }

      // Sequence shortcuts: G+H, G+D, G+P, G+L, G+C
      const key = e.key.toUpperCase();
      if (keySequenceTimer.current) clearTimeout(keySequenceTimer.current);

      const newSeq = [...keySequence, key];
      setKeySequence(newSeq);

      if (newSeq.length >= 2) {
        const match = SHORTCUTS.find(
          (s) => s.keys[0] === newSeq[newSeq.length - 2] && s.keys[1] === newSeq[newSeq.length - 1]
        );
        if (match) {
          navigate(match.path);
          setShowShortcuts(false);
          setKeySequence([]);
          return;
        }
      }

      // Reset sequence after 1.5 s of inactivity
      keySequenceTimer.current = setTimeout(() => setKeySequence([]), 1500);
    },
    [keySequence, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tekvora_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTheme(customEvent.detail);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  // ── Preloader ─────────────────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    const hasLoaded = sessionStorage.getItem('tekvora_loaded');
    if (!hasLoaded) {
      setShowPreloader(true);
      const timerFade = setTimeout(() => {
        setFadeOut(true);
        const timerRemove = setTimeout(() => {
          setShowPreloader(false);
          sessionStorage.setItem('tekvora_loaded', 'true');
        }, 500);
        return () => clearTimeout(timerRemove);
      }, 1500);
      return () => clearTimeout(timerFade);
    }
  }, []);

  // ── Cursor Glow Tracker ───────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Click Ripples ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest(
        'button, .btn, a.bg-orange-500, a.bg-white\\/15, .btn-primary, .btn-orange, .btn-outline'
      ) as HTMLElement;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      {/* ── Feature 36: Reading Progress Bar ─────────────────────────────── */}
      {!isDashboard && (
        <div
          className="fixed top-0 left-0 z-[60] h-[3px] transition-all duration-100 pointer-events-none"
          style={{
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 40%, #2563eb 100%)',
            boxShadow: '0 0 8px rgba(124,58,237,0.7)',
          }}
        />
      )}

      {/* Branded Preloader */}
      {showPreloader && (
        <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
          <div className="preloader-logo text-center">
            TeK<span>Vora</span>
          </div>
          <div className="preloader-dots">
            <div className="preloader-dot" />
            <div className="preloader-dot" />
            <div className="preloader-dot" />
          </div>
          <div className="preloader-progress-container">
            <div className="preloader-progress-bar" />
          </div>
        </div>
      )}

      {/* Cursor Glow Blob */}
      <div className="cursor-glow" />

      <Navbar />
      <main className="flex-grow pt-16 relative z-10">{children}</main>
      {!hideFooter && <Footer />}
      <WhatsAppButton />

      {/* ── Feature 9: AI Chatbot ─────────────────────────────────────────── */}
      <AIChatbot />

      {/* ── Feature 40: Keyboard Shortcut Panel ──────────────────────────── */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            style={{
              background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-white/10"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            >
              <div>
                <h2 className="text-white font-bold text-lg">Keyboard Shortcuts</h2>
                <p className="text-purple-300 text-xs mt-0.5">Navigate at lightning speed</p>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Shortcut Rows */}
            <div className="px-6 py-5 space-y-3">
              {SHORTCUTS.map((sc) => (
                <div
                  key={sc.description}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-gray-300 text-sm">{sc.description}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd
                          className="text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20"
                          style={{ background: 'rgba(255,255,255,0.1)', boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
                        >
                          {k}
                        </kbd>
                        {i < sc.keys.length - 1 && (
                          <span className="text-gray-600 text-xs">then</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Extra utility shortcuts */}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-gray-300 text-sm">Focus search</span>
                <kbd
                  className="text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20"
                  style={{ background: 'rgba(255,255,255,0.1)', boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
                >
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-300 text-sm">Close this panel</span>
                <kbd
                  className="text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20"
                  style={{ background: 'rgba(255,255,255,0.1)', boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
                >
                  ESC
                </kbd>
              </div>
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs">
                Press{' '}
                <kbd
                  className="text-gray-400 text-xs font-mono px-1.5 py-0.5 rounded border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  ?
                </kbd>{' '}
                anytime to open this panel
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
