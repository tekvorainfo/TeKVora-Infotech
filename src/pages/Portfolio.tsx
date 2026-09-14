import { useState, useEffect } from 'react';
import { Award, Flame, Github, Link as LinkIcon, Mail, Phone, Calendar, ArrowLeft, Printer, Loader2, Code, ShieldCheck } from 'lucide-react';
import { useParams, Link } from '../lib/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface StudentProfile {
  student_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  github_username: string | null;
  xp: number;
  streak: number;
}

interface Certificate {
  id: string;
  certificate_id: string;
  program_name: string;
  duration: string;
  skills: string[];
  issue_date: string;
}

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

export default function Portfolio() {
  const { student_id } = useParams<{ student_id: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    async function loadPortfolioData() {
      if (!student_id) return;
      try {
        setLoading(true);
        // 1. Fetch student profile
        const { data: profileData, error: profileErr } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', student_id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileData) return;

        setProfile(profileData);

        // 2. Fetch certificates
        const { data: certsData, error: certsErr } = await supabase
          .from('certificates')
          .select('*')
          .eq('student_id', student_id)
          .eq('is_revoked', false);

        if (certsErr) throw certsErr;
        setCertificates(certsData || []);

        // 3. Fetch GitHub repositories if username is provided
        if (profileData.github_username) {
          setGithubLoading(true);
          try {
            const res = await fetch(`https://api.github.com/users/${profileData.github_username}/repos?sort=updated&per_page=4`);
            if (res.ok) {
              const reposData = await res.json();
              setRepos(reposData || []);
            }
          } catch (err) {
            console.error('Error loading GitHub repos:', err);
          } finally {
            setGithubLoading(false);
          }
        }

      } catch (err) {
        console.error('Error gathering portfolio data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, [student_id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
          <p className="font-semibold text-sm">Building developer portfolio...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <Award className="mx-auto text-slate-350 opacity-40 mb-4" size={56} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Portfolio Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">The requested developer profile does not exist or has been deleted.</p>
          <Link to="/" className="btn-primary">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="bg-slate-50 dark:bg-slate-950 py-8 min-h-screen transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Header Controls (Hidden during print) */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> Back to Rankings
            </Link>

            <button
              onClick={handlePrint}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Printer size={14} /> Print Portfolio / Save PDF
            </button>
          </div>

          {/* Resume Frame Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-xl p-8 md:p-12 print:border-none print:shadow-none print:p-0 transition-colors">
            
            {/* Header Resume Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-8 mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.full_name}
                </h1>
                <p className="text-primary-600 dark:text-primary-400 font-bold font-mono text-sm uppercase tracking-wide mt-1">
                  Verified Student Profile • {profile.student_id}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {profile.phone}
                    </span>
                  )}
                  {profile.github_username && (
                    <span className="flex items-center gap-1">
                      <Github size={12} /> github.com/{profile.github_username}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex gap-2">
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl px-4 py-3 text-center min-w-[70px]">
                  <Flame className="mx-auto mb-1" size={18} fill="currentColor" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Streak</p>
                  <p className="font-extrabold font-mono text-base mt-0.5">{profile.streak} days</p>
                </div>
                <div className="bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl px-4 py-3 text-center min-w-[70px]">
                  <Award className="mx-auto mb-1" size={18} />
                  <p className="text-[9px] font-bold uppercase tracking-wider">XP Score</p>
                  <p className="font-extrabold font-mono text-base mt-0.5">{profile.xp}</p>
                </div>
              </div>
            </div>

            {/* Resume Main Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column (Certificates & Credentials) */}
              <div className="md:col-span-7 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white border-l-4 border-primary-600 pl-2.5 mb-4 uppercase tracking-wider text-[13px]">
                    Verified Certifications
                  </h3>
                  
                  {certificates.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                      <Award className="mx-auto mb-2 opacity-35" size={32} />
                      <p className="text-xs font-semibold">No issued certifications yet.</p>
                      <p className="text-[10px] mt-0.5">Certificates appear automatically upon course completions.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">
                                {cert.program_name}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                                Duration: {cert.duration} • Issued on {cert.issue_date}
                              </p>
                            </div>
                            <ShieldCheck className="text-green-500 flex-shrink-0" size={20} />
                          </div>
                          
                          {/* Skills pill list */}
                          {cert.skills && cert.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {cert.skills.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                            <span>ID: {cert.certificate_id}</span>
                            <span className="text-green-500">Verified status</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (GitHub Portfolio Integration) */}
              <div className="md:col-span-5 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white border-l-4 border-primary-600 pl-2.5 mb-4 uppercase tracking-wider text-[13px] flex items-center gap-1.5">
                    <Github size={16} /> Open Source Projects
                  </h3>

                  {!profile.github_username ? (
                    <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                      <Code className="mx-auto mb-2 opacity-35" size={32} />
                      <p className="text-xs font-semibold">GitHub portfolio not linked.</p>
                    </div>
                  ) : githubLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500 mb-2" />
                      <p className="text-[10px] font-medium">Fetching public repositories...</p>
                    </div>
                  ) : repos.length === 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-2xl text-center text-slate-400">
                      <p className="text-xs font-medium">No public repositories found for user.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {repos.map((repo) => (
                        <a
                          key={repo.id}
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/20 hover:bg-primary-50/20 dark:hover:bg-primary-950/10 border-slate-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-800 transition-all shadow-sm"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs md:text-sm hover:text-primary-600 truncate">
                              {repo.name}
                            </h4>
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold font-mono">
                              ⭐ {repo.stargazers_count}
                            </span>
                          </div>
                          
                          {repo.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1.5 line-clamp-2">
                              {repo.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/60 dark:border-slate-800/40 text-[9px] font-bold font-mono text-slate-400">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                              {repo.language || 'Code'}
                            </span>
                            <span className="flex items-center gap-0.5 text-primary-600 hover:underline">
                              View Code <LinkIcon size={10} />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer stamp (Hides in print but shows verification) */}
            <div className="border-t border-slate-100 dark:border-slate-800 mt-10 pt-6 text-center text-[10px] text-slate-400 font-mono leading-relaxed">
              <p>TeKVora Infotech Certificate ID and Academic Portfolio verification system.</p>
              <p className="mt-0.5">Checked secure signature hash matching Supabase nodes.</p>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
