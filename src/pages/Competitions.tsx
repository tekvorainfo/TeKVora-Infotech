import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Calendar, Users, Award, Clock, ArrowRight } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';

interface Competition {
  id: string;
  title: string;
  theme: string;
  start_date: string;
  end_date: string;
  prize: string;
  registrations: number;
}

const PAST_WINNERS = [
  { rank: 1, name: 'Vaibhav Tambe', prize: 'Gold Trophy + ₹5000 Cash', icon: '🥇' },
  { rank: 2, name: 'Anant Sharma', prize: 'Silver Medal + Premium Course', icon: '🥈' },
  { rank: 3, name: 'Sneha Patil', prize: 'Bronze Medal + Swag Kit', icon: '🥉' }
];

export default function Competitions() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([
    {
      id: 'c1',
      title: 'Python Algorithmic Sprint',
      theme: 'Data Structures, Optimization & Dynamic Programming',
      start_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
      prize: '₹10,000 Cash Prize & Premium Internship Referrals',
      registrations: 42
    }
  ]);
  const [registeredIds, setRegisteredIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('tekvora_registered_competitions') || '[]'));

  const handleRegister = (id: string) => {
    if (!user) return;
    if (registeredIds.includes(id)) return;

    const nextReg = [...registeredIds, id];
    setRegisteredIds(nextReg);
    localStorage.setItem('tekvora_registered_competitions', JSON.stringify(nextReg));

    setCompetitions(comps => comps.map(c => {
      if (c.id === id) {
        return { ...c, registrations: c.registrations + 1 };
      }
      return c;
    }));

    triggerConfetti();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <Trophy size={14} className="text-amber-500" /> Seasonal Coding Hackathons
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            TeKVora Competitions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Put your skills to the test, compete with other peers, build robust solutions, and win exciting prizes!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Competitions List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Active & Upcoming</h3>
            {competitions.map(c => {
              const isRegistered = registeredIds.includes(c.id);
              const startDate = new Date(c.start_date);
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-primary-600/5 rounded-full translate-x-1/3 -translate-y-1/3" />
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{c.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{c.theme}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-y border-gray-50 dark:border-slate-850 py-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-gray-400 font-medium block">Prizes</span>
                      <strong className="text-amber-500 dark:text-amber-400 font-bold block">{c.prize}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 font-medium block">Date & Time</span>
                      <span className="text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Calendar size={13} /> {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {startDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 font-medium block">Registered</span>
                      <span className="text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Users size={13} /> {c.registrations} Students
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} className="animate-pulse" /> Countdown Started
                    </span>

                    {user ? (
                      <button
                        onClick={() => handleRegister(c.id)}
                        disabled={isRegistered}
                        className={`font-bold px-6 py-3 rounded-xl text-xs transition-all ${
                          isRegistered
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50'
                            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/10'
                        }`}
                      >
                        {isRegistered ? 'Registered' : 'Register Now'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 px-3 py-2 rounded-xl">
                        Log in to Register
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hall of Fame (Past winners) */}
          <div className="space-y-6">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Hall of Fame</h3>
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Competition Winners</p>
              
              <div className="space-y-3">
                {PAST_WINNERS.map(w => (
                  <div key={w.rank} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl">
                    <span className="text-3xl leading-none">{w.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-950 dark:text-white text-sm">{w.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{w.prize}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
