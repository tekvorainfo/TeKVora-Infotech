import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, MapPin, DollarSign, Clock, Search, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return 'Just now';
  const diffMs = new Date().getTime() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

interface Job {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;
  remote: string;
  salary: string;
  skills: string[];
  created_at: string;
  description: string;
}

// INITIAL_JOBS is now seed data in Supabase

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    loadJobsAndApplications();
  }, [user]);

  const loadJobsAndApplications = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase.from('job_postings').select('*').order('created_at', { ascending: false });
      if (jobsError) throw jobsError;
      if (jobsData) {
        setJobs(jobsData as Job[]);
      }

      if (user) {
        const { data: appsData, error: appsError } = await supabase.from('job_applications').select('job_id').eq('student_id', user.id);
        if (appsError) throw appsError;
        if (appsData) {
          setAppliedIds(appsData.map((a: any) => a.job_id));
        }
      }
    } catch (err) {
      console.error('Error loading jobs/applications:', err);
    }
  };

  const handleApply = async (id: string) => {
    if (!user) return;
    if (appliedIds.includes(id)) return;

    try {
      const { error } = await supabase.from('job_applications').insert({
        job_id: id,
        student_id: user.id
      });

      if (error) throw error;

      setAppliedIds(prev => [...prev, id]);
      triggerConfetti();
    } catch (err) {
      console.error('Error applying for job:', err);
    }
  };

  const filtered = jobs.filter(j => {
    const matchesSearch = j.role.toLowerCase().includes(search.toLowerCase()) || 
                          j.company.toLowerCase().includes(search.toLowerCase()) ||
                          j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'All' || j.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="badge-blue flex items-center gap-1.5 w-fit">
              <Briefcase size={14} /> Career Board
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Placement & Jobs Portals
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
              Direct access to openings, internships, and associate programs with TeKVora hiring partners.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-primary-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search roles, skills..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 w-48 sm:w-60"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="All">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        {/* Listings Stack */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8">
              <AlertCircle className="mx-auto text-gray-400 mb-3" size={36} />
              <h3 className="font-bold text-gray-900 dark:text-white">No openings found</h3>
              <p className="text-xs text-gray-400 mt-1">Try adjusting search term or filtering selectors.</p>
            </div>
          ) : (
            filtered.map(j => {
              const isExpanded = expandedId === j.id;
              const isApplied = appliedIds.includes(j.id);
              return (
                <div
                  key={j.id}
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:border-gray-200 dark:hover:border-slate-750"
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Role / Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{j.role}</h3>
                        <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          {j.type}
                        </span>
                        <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          {j.remote}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">{j.company}</p>

                      {/* Info Row */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={13} /> {j.location}</span>
                        <span className="flex items-center gap-1"><DollarSign size={13} /> {j.salary}</span>
                        <span className="flex items-center gap-1"><Clock size={13} /> {getRelativeTime(j.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 self-start md:self-auto">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : j.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-white font-semibold transition-colors"
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp size={14} /></>
                        ) : (
                          <>View Details <ChevronDown size={14} /></>
                        )}
                      </button>

                      {user ? (
                        <button
                          onClick={() => handleApply(j.id)}
                          disabled={isApplied}
                          className={`font-semibold rounded-xl px-5 py-3 text-xs transition-all flex items-center gap-1 ${
                            isApplied
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50'
                              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/10 hover:scale-[1.02]'
                          }`}
                        >
                          {isApplied ? (
                            <><CheckCircle size={14} /> Applied</>
                          ) : (
                            'Apply Now'
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 px-3 py-2 rounded-xl">
                          Log in to Apply
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded description */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-slate-850 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job Description</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
                          {j.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {j.skills.map(s => (
                            <span key={s} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
