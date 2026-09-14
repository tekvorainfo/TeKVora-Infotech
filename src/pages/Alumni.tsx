import { useState } from 'react';
import Layout from '../components/Layout';
import { Award, Search, MapPin, Building, Calendar, ArrowUpRight, GraduationCap } from 'lucide-react';

interface Alumnus {
  id: string;
  name: string;
  role: string;
  company: string;
  year: string;
  city: string;
  story: string;
  salaryRange?: string;
  skills: string[];
}

const ALUMNI_LIST: Alumnus[] = [
  { id: '1', name: 'Vaibhav Tambe', role: 'Full Stack Engineer', company: 'InnovaTech Labs', year: '2024', city: 'Pune, MH', story: 'TeKVora structural workshops and mentor codes helped me transition from a college coder to a full-stack engineer.', skills: ['Python', 'Django', 'React', 'Supabase'] },
  { id: '2', name: 'Anant Sharma', role: 'Backend Developer', company: 'Cognizant', year: '2025', city: 'Bangalore, KA', story: 'The Daily Coding challenges kept my problem solving sharp. Direct referral placement mapped my career path.', skills: ['Node.js', 'Express', 'SQL', 'Docker'] },
  { id: '3', name: 'Sneha Patel', role: 'Data Analyst', company: 'TCS Innovation', year: '2024', city: 'Mumbai, MH', story: 'Mapping visual roadmaps let me focus on NumPy, Pandas, and statistics module parameters effectively.', skills: ['Python', 'SQL', 'PowerBI', 'Pandas'] }
];

export default function Alumni() {
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('All');

  const filtered = ALUMNI_LIST.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.skills.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
                          a.role.toLowerCase().includes(search.toLowerCase());
    const matchesCompany = filterCompany === 'All' || a.company === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const companies = ['All', ...Array.from(new Set(ALUMNI_LIST.map(a => a.company)))];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <GraduationCap size={14} /> Success Stories
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Alumni Gallery & Placement Network
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Meet our alumni working at top tech companies. Read their career transition stories and connect.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Placed', value: '450+ Students' },
            { label: 'Avg Salary Package', value: '₹5.5 LPA' },
            { label: 'Hiring Partners', value: '45+ Companies' },
            { label: 'Highest Package', value: '₹14.0 LPA' }
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{s.label}</span>
              <strong className="text-xl font-extrabold text-primary-600 mt-1 block">{s.value}</strong>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-8 justify-between">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 flex-grow max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, skill, or role..."
              className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-slate-350 placeholder-gray-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company</label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(a => (
            <div key={a.id} className="card p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Class of {a.year}
                  </span>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    <ArrowUpRight size={16} />
                  </a>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug group-hover:text-primary-600 transition-colors">
                    {a.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Building size={12} /> {a.role} at <strong className="text-gray-700 dark:text-slate-350">{a.company}</strong>
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <MapPin size={12} /> {a.city}
                  </p>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-950/30 p-4 rounded-xl border border-gray-100 dark:border-slate-850 italic">
                  "{a.story}"
                </p>
              </div>

              {/* Skills tags */}
              <div className="border-t border-gray-100 dark:border-slate-850 pt-4 mt-5 flex flex-wrap gap-1">
                {a.skills.map(s => (
                  <span key={s} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
