import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Users, Star, Calendar, MessageSquare, Plus, CheckCircle, X } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  skills: string[];
  rating: number;
  reviews: number;
  avatar: string;
  slots: number;
}

// MENTORS is now stored/seeded in Supabase

export default function Mentors() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  
  // Form states
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  useState(() => {
    loadMentorsAndRequests();
  });

  const loadMentorsAndRequests = async () => {
    try {
      const { data: mentorsData, error: mentorsError } = await supabase.from('mentors').select('*').order('name', { ascending: true });
      if (mentorsError) throw mentorsError;
      if (mentorsData) {
        setMentors(mentorsData.map((m: any) => {
          const [role, company] = (m.experience || '').split(' | ');
          const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
          return {
            id: m.id,
            name: m.name,
            role: role || 'Instructor',
            company: company || 'TeKVora Infotech',
            skills: m.expertise || [],
            rating: Number(m.rating) || 5.0,
            reviews: Math.floor((Number(m.rating) || 5.0) * 6),
            avatar: initials,
            slots: m.slots_available || 3
          };
        }));
      }

      if (user) {
        const { data: requestsData, error: requestsError } = await supabase.from('mentorship_requests').select('mentor_id').eq('student_id', user.id);
        if (requestsError) throw requestsError;
        if (requestsData) {
          setRequestedIds(requestsData.map((r: any) => r.mentor_id));
        }
      }
    } catch (err) {
      console.error('Error loading mentors/requests:', err);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !user) return;

    try {
      const { error } = await supabase.from('mentorship_requests').insert({
        mentor_id: selectedMentor.id,
        student_id: user.id,
        topic,
        message,
        time_slot: 'Flexible (This Week)',
        status: 'pending'
      });

      if (error) throw error;

      setRequestedIds(prev => [...prev, selectedMentor.id]);
      setTopic('');
      setMessage('');
      setSelectedMentor(null);
      triggerConfetti();
    } catch (err) {
      console.error('Error requesting mentorship:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <Users size={14} /> Expert Mentors
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Mentor Matching
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Book 1:1 sessions with industry experts, senior developers, and instructors to unblock your coding paths.
          </p>
        </div>

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map(m => {
            const hasRequested = requestedIds.includes(m.id);
            return (
              <div key={m.id} className="card p-6 flex flex-col justify-between group">
                <div className="space-y-4">
                  {/* Top info */}
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
                      {m.avatar}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">{m.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{m.role} &bull; <strong className="text-gray-600 dark:text-slate-300 font-semibold">{m.company}</strong></p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-500 font-bold">
                        <Star size={12} fill="currentColor" /> {m.rating.toFixed(1)} <span className="text-gray-400 font-medium">({m.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {m.skills.map(s => (
                      <span key={s} className="bg-slate-150 dark:bg-slate-800 text-slate-655 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="border-t border-gray-100 dark:border-slate-850 pt-4 mt-6 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar size={13} /> {m.slots} slots left this week
                  </span>

                  {user ? (
                    <button
                      onClick={() => setSelectedMentor(m)}
                      disabled={hasRequested}
                      className={`font-bold px-4 py-2.5 rounded-xl text-xs transition-all ${
                        hasRequested
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50'
                          : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:scale-[1.02]'
                      }`}
                    >
                      {hasRequested ? 'Requested' : 'Book Session'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 px-3 py-1.5 rounded-xl">
                      Log in to Book
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Booking Form Modal */}
        {selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
              <button
                onClick={() => setSelectedMentor(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Book a 1:1 with {selectedMentor.name}</h2>
              <p className="text-xs text-gray-400 mb-5">Draft your meeting agenda and select topic parameters.</p>

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Topic Agenda</label>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    required
                    placeholder="e.g. Code Review on API or Career Guidance"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message to Mentor</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    placeholder="Briefly describe what you would like to discuss..."
                    className="input-field h-28 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Send Booking Request
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
