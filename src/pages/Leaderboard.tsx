import { useState, useEffect } from 'react';
import { Award, Flame, Github, Trophy, ArrowLeft, Star, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { Link } from '../lib/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface StudentLeaderboardProfile {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  github_username: string | null;
  xp: number;
  streak: number;
  last_login_date: string | null;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<StudentLeaderboardProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .order('xp', { ascending: false })
          .limit(10);

        if (error) throw error;
        setLeaders(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  // Compute achievements badges
  const getBadges = (profile: StudentLeaderboardProfile) => {
    const badgesList = [];
    if (profile.streak >= 7) {
      badgesList.push({ icon: '🔥', label: 'Streak Champ', color: 'border-orange-500 bg-orange-950/20 text-orange-400' });
    }
    if (profile.xp >= 200) {
      badgesList.push({ icon: '⚡', label: 'XP Collector', color: 'border-yellow-500 bg-yellow-950/20 text-yellow-400' });
    }
    if (profile.xp >= 500) {
      badgesList.push({ icon: '🤖', label: 'Python Master', color: 'border-blue-500 bg-blue-950/20 text-blue-400' });
    }
    if (profile.github_username && profile.github_username.trim() !== '') {
      badgesList.push({ icon: '🐙', label: 'Git Architect', color: 'border-violet-500 bg-violet-950/20 text-violet-400' });
    }
    return badgesList;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return <Trophy className="text-amber-400 animate-bounce" size={26} />;
    if (rank === 1) return <Trophy className="text-slate-300" size={24} />;
    if (rank === 2) return <Trophy className="text-amber-700" size={22} />;
    return <span className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">#{rank + 1}</span>;
  };

  return (
    <Layout>
      {/* Banner Header */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 relative overflow-hidden transition-colors">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-500/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-xs font-semibold uppercase tracking-wider mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2.5">
            <Trophy className="text-amber-400 animate-pulse" size={32} />
            Global Hall of Fame
          </h1>
          <p className="text-blue-100 text-sm mt-2 max-w-lg mx-auto">
            Compete, code, and complete modules to climb the rankings. Track your streaks and earn custom achievement badges!
          </p>
        </div>
      </section>

      {/* Leaderboard Table Content */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950 min-h-[70vh] transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 transition-colors">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                <p className="text-sm font-semibold">Loading student records...</p>
              </div>
            ) : leaders.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Trophy className="mx-auto mb-4 opacity-30" size={48} />
                <p className="font-semibold">No students have earned XP yet.</p>
                <p className="text-xs mt-1">Sign up and complete courses to lock in the first spot!</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Ranking headers */}
                <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-5 md:col-span-6">Student</div>
                  <div className="col-span-3 md:col-span-2 text-center">Badges</div>
                  <div className="col-span-2 text-right">Score</div>
                </div>

                {/* List items */}
                <div className="space-y-3.5">
                  {leaders.map((leader, index) => {
                    const badges = getBadges(leader);
                    return (
                      <div
                        key={leader.id}
                        className={`grid grid-cols-12 items-center px-4 py-4 rounded-2xl border transition-all duration-300 ${
                          index === 0
                            ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 shadow-amber-500/5'
                            : index === 1
                            ? 'bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/30'
                            : index === 2
                            ? 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30'
                            : 'bg-slate-50/50 dark:bg-slate-850/50 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-2 flex items-center justify-center">
                          {getRankBadge(index)}
                        </div>

                        {/* Student Details */}
                        <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                            index === 0 ? 'bg-amber-500 shadow-md shadow-amber-500/20' : 'bg-primary-600'
                          }`}>
                            {leader.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <Link
                              to={`/portfolio/${leader.id}`}
                              className="text-sm font-bold text-slate-850 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
                            >
                              {leader.full_name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">
                              {leader.student_id}
                            </span>
                          </div>
                        </div>

                        {/* Badges Container */}
                        <div className="col-span-3 md:col-span-2 flex items-center justify-center gap-1.5 flex-wrap">
                          {leader.streak > 0 && (
                            <span className="flex items-center gap-0.5 bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                              <Flame size={10} fill="currentColor" /> {leader.streak}
                            </span>
                          )}
                          {badges.map((badge, idx) => (
                            <span
                              key={idx}
                              title={badge.label}
                              className={`text-xs border px-1.5 py-0.5 rounded-md cursor-help ${badge.color}`}
                            >
                              {badge.icon}
                            </span>
                          ))}
                        </div>

                        {/* XP Value */}
                        <div className="col-span-2 text-right">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                            {leader.xp}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                            XP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>
      </section>

      {/* Info card footer */}
      <section className="py-12 bg-slate-950 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Sparkles className="text-orange-400 mx-auto mb-4 animate-pulse" size={24} />
          <h3 className="text-lg font-bold text-white mb-2">Claim your spot!</h3>
          <p className="text-sm text-slate-400">
            Click on any student's name on the leaderboard to view their public resume portfolio, verified certificates, and GitHub repositories.
          </p>
        </div>
      </section>
    </Layout>
  );
}
