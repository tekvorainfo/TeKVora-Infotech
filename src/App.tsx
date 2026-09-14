import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from './lib/router';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public pages
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const Internships = lazy(() => import('./pages/Internships'));
const InternshipApply = lazy(() => import('./pages/InternshipApply'));
const Services = lazy(() => import('./pages/Services'));
const Faculty = lazy(() => import('./pages/Faculty'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const MOU = lazy(() => import('./pages/MOU'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const Legal = lazy(() => import('./pages/Legal'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Challenge = lazy(() => import('./pages/Challenge'));
const Showcase = lazy(() => import('./pages/Showcase'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Interview = lazy(() => import('./pages/Interview'));
const Competitions = lazy(() => import('./pages/Competitions'));
const Forum = lazy(() => import('./pages/Forum'));
const Mentors = lazy(() => import('./pages/Mentors'));
const Attendance = lazy(() => import('./pages/Attendance'));
const CodeReview = lazy(() => import('./pages/CodeReview'));
const CodeBattle = lazy(() => import('./pages/CodeBattle'));
const MindMap = lazy(() => import('./pages/MindMap'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
const Alumni = lazy(() => import('./pages/Alumni'));
const Recruiters = lazy(() => import('./pages/Recruiters'));


// Auth pages
const StudentLogin = lazy(() => import('./pages/auth/StudentLogin'));
const StudentRegister = lazy(() => import('./pages/auth/StudentRegister'));
const InternLogin = lazy(() => import('./pages/auth/InternLogin'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));

// Dashboards
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const InternDashboard = lazy(() => import('./pages/dashboard/InternDashboard'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isIntern } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (isAdmin) return <Navigate to="/admin-panel" />;
  if (isIntern) return <Navigate to="/intern/dashboard" />;
  return <>{children}</>;
}

function ProtectedInternRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/intern-login" />;
  if (isAdmin) return <Navigate to="/admin-panel" />;
  return <>{children}</>;
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user || !isAdmin) return <Navigate to="/tekvora-admin-access" />;
  return <>{children}</>;
}

function AppRoutes() {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/internships/:slug/apply" element={<InternshipApply />} />
        <Route path="/services" element={<Services />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mou" element={<MOU />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/portfolio/:student_id" element={<Portfolio />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/code-review" element={<CodeReview />} />
        <Route path="/code-battle" element={<CodeBattle />} />
        <Route path="/mindmap" element={<MindMap />} />
        <Route path="/study-groups" element={<StudyGroups />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/recruiters" element={<Recruiters />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/refund" element={<Legal />} />

        {/* Auth */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/intern-login" element={<InternLogin />} />
        <Route path="/tekvora-admin-access" element={<AdminLogin />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedStudentRoute><StudentDashboard /></ProtectedStudentRoute>} />
        <Route path="/intern/dashboard" element={<ProtectedInternRoute><InternDashboard /></ProtectedInternRoute>} />
        <Route path="/admin-panel" element={<ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

import { I18nProvider } from './contexts/I18nContext';

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
