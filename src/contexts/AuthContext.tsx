import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { StudentProfile, InternProfile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  studentProfile: StudentProfile | null;
  internProfile: InternProfile | null;
  isAdmin: boolean;
  isIntern: boolean;
  isStudent: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  studentProfile: null,
  internProfile: null,
  isAdmin: false,
  isIntern: false,
  isStudent: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [internProfile, setInternProfile] = useState<InternProfile | null>(null);
  const [isAdminState, setIsAdminState] = useState(false);
  const [loading, setLoading] = useState(true);

  const [devBypass, setDevBypass] = useState(() => typeof window !== 'undefined' && localStorage.getItem('dev_admin_bypass') === 'true');
  const [devInternBypass, setDevInternBypass] = useState(() => typeof window !== 'undefined' && localStorage.getItem('dev_intern_bypass') === 'true');
  const [activeInternJson, setActiveInternJson] = useState<InternProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('tekvora_active_intern');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const effectiveUser = devBypass 
    ? { id: 'dev-admin', email: 'admin@tekvora.com' } as User 
    : devInternBypass 
      ? { id: 'dev-intern', email: 'intern@tekvora.com' } as User 
      : activeInternJson
        ? { id: activeInternJson.id || activeInternJson.user_id || 'active-intern-id', email: activeInternJson.email } as User
        : user;

  const effectiveInternProfile = devInternBypass
    ? {
        id: 'dev-intern-id',
        user_id: 'dev-intern',
        intern_id: 'TVR-INT-99999',
        full_name: 'Test Intern',
        email: 'intern@tekvora.com',
        phone: '1234567890',
        internship_title: 'Web Development Internship',
        status: 'active',
        must_change_password: false,
        created_at: new Date().toISOString()
      } as InternProfile
    : activeInternJson
      ? activeInternJson
      : internProfile;

  const isAdmin = isAdminState || devBypass;
  const isIntern = !!effectiveInternProfile && !isAdmin;
  const isStudent = !!studentProfile && !isAdmin && !isIntern;

  const loadProfile = async (userId: string, email: string) => {
    if (devBypass || devInternBypass) {
      if (devBypass) setIsAdminState(true);
      setLoading(false);
      return;
    }

    try {
      // Check if user is in admin_users table
      const { data: adminData, error: adminError } = await supabase.from('admin_users').select('email').eq('email', email).maybeSingle();
      if (adminError) throw adminError;
      
      const isUserAdmin = !!adminData;
      setIsAdminState(isUserAdmin);

      if (isUserAdmin) {
        setStudentProfile(null);
        setInternProfile(null);
        setLoading(false);
        return;
      }

      const [studentRes, internRes] = await Promise.all([
        supabase.from('student_profiles').select('*').or(`id.eq.${userId},email.eq.${email}`).limit(1).maybeSingle(),
        supabase.from('intern_profiles').select('*').or(`user_id.eq.${userId},email.eq.${email}`).limit(1).maybeSingle(),
      ]);

      const studentData = studentRes.data as StudentProfile | null;
      const internData = internRes.data as InternProfile | null;

      if (!studentData && !internData && email) {
        const fallbackStudent: StudentProfile = {
          id: userId,
          student_id: `TVR-STU-${Math.floor(10000 + Math.random() * 90000)}`,
          full_name: email.split('@')[0],
          email,
          phone: '',
          is_active: true,
          created_at: new Date().toISOString()
        };
        setStudentProfile(fallbackStudent);
        setInternProfile(null);
      } else {
        setStudentProfile(studentData);
        setInternProfile(internData);
      }
    } catch (err) {
      console.error('Error loading user profile from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id, user.email || '');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user || devBypass || devInternBypass) {
        const id = session?.user?.id || (devBypass ? 'dev-admin' : 'dev-intern');
        const email = session?.user?.email || (devBypass ? 'admin@tekvora.com' : 'intern@tekvora.com');
        // Set Admin State based on email list
        const ADMIN_EMAILS = ['admin@tekvora.com', 'vaibhav@tekvora.com'];
        if (ADMIN_EMAILS.includes(email)) {
          setIsAdminState(true);
          setLoading(false);
        } else {
          loadProfile(id, email);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '');
      } else {
        setStudentProfile(null);
        setInternProfile(null);
        setIsAdminState(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('dev_admin_bypass');
    localStorage.removeItem('dev_intern_bypass');
    localStorage.removeItem('tekvora_active_intern');
    setDevBypass(false);
    setDevInternBypass(false);
    setActiveInternJson(null);
    setUser(null);
    setSession(null);
    setStudentProfile(null);
    setInternProfile(null);
    setIsAdminState(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user: effectiveUser, session, studentProfile, internProfile: effectiveInternProfile,
      isAdmin, isIntern, isStudent, loading, signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
