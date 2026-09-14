import { useState } from 'react';
import Layout from '../components/Layout';
import { Terminal, Download, ArrowRight, BookOpen, Compass, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'fullstack', label: 'Full Stack Web Developer', icon: '🌐', duration: '12 Weeks' },
  { id: 'python', label: 'Python Backend Engineer', icon: '🐍', duration: '10 Weeks' },
  { id: 'datascience', label: 'Data Scientist & ML Engineer', icon: '📊', duration: '12 Weeks' },
  { id: 'mobile', label: 'Mobile App Developer (Flutter)', icon: '📱', duration: '8 Weeks' },
  { id: 'uiux', label: 'UI/UX Product Designer', icon: '🎨', duration: '8 Weeks' },
  { id: 'cloud', label: 'Cloud & DevOps Engineer', icon: '☁️', duration: '10 Weeks' },
  { id: 'cyber', label: 'Cybersecurity Analyst', icon: '🛡️', duration: '12 Weeks' },
];

const PRESETS: Record<string, any[]> = {
  fullstack: [
    { phase: 'Phase 1: Frontend Basics', weeks: 'Weeks 1-3', color: 'blue', desc: 'Master HTML5, CSS3, Modern JS, and Tailwind CSS.', topics: ['Semantic HTML & Flexbox/Grid', 'DOM Manipulation & ES6+ Javascript', 'Responsive UI Design & Tailwind'], milestone: 'Build a personal portfolio website' },
    { phase: 'Phase 2: React Framework', weeks: 'Weeks 4-6', color: 'purple', desc: 'Build reactive user interfaces using component architectures.', topics: ['React Components, Hooks (useState, useEffect)', 'State Management & Router context', 'API Integrations & Axios'], milestone: 'Build a interactive dashboard webapp' },
    { phase: 'Phase 3: Backend Development', weeks: 'Weeks 7-9', color: 'orange', desc: 'Create robust server logic, APIs, and manage databases.', topics: ['Node.js & Express servers', 'RESTful API Design & Routing', 'PostgreSQL / Supabase databases'], milestone: 'Build a backend task manager API' },
    { phase: 'Phase 4: Full Stack & Deployment', weeks: 'Weeks 10-12', color: 'green', desc: 'Connect backend to frontend, configure auth and deploy.', topics: ['JWT & OAuth Authentication', 'CI/CD Pipelines & GitHub Actions', 'Cloud hosting (Vercel, Render)'], milestone: 'Deploy a full-stack SaaS product' }
  ],
  python: [
    { phase: 'Phase 1: Python Core', weeks: 'Weeks 1-2', color: 'blue', desc: 'Understand basics, syntax, variables, data structures, and functions.', topics: ['Data types, loops, lists, dicts', 'File handling & Modules', 'OOP concepts in Python'], milestone: 'Build a CLI task manager app' },
    { phase: 'Phase 2: Advanced Python', weeks: 'Weeks 3-4', color: 'purple', desc: 'Functional programming, generators, decorators, and APIs.', topics: ['Decorators & Generators', 'Threading & Asynchronous (asyncio)', 'Consuming HTTP APIs'], milestone: 'Build a web scraper and log analyzer' },
    { phase: 'Phase 3: Database & Django', weeks: 'Weeks 5-8', color: 'orange', desc: 'Learn relational databases and web servers using Django.', topics: ['SQL & Database Design', 'Django MVC Architecture & ORM', 'Django REST Framework APIs'], milestone: 'Build an e-commerce backend API' },
    { phase: 'Phase 4: Testing & Deploy', weeks: 'Weeks 9-10', color: 'green', desc: 'Write unit tests, package python code, and deploy server.', topics: ['PyTest & Unit Testing', 'Docker containers', 'Deploying to AWS/Heroku'], milestone: 'Dockerize and deploy Django backend' }
  ]
};

export default function Roadmap() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [roadmap, setRoadmap] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generateRoadmap = async () => {
    if (!selectedGoal) return;
    setLoading(true);
    
    // Simulate AI generation or use preset fallback
    setTimeout(() => {
      const preset = PRESETS[selectedGoal] || PRESETS.fullstack;
      setRoadmap(preset);
      setLoading(false);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 font-poppins print:p-0">
        <div className="text-center mb-10 print:hidden">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <Compass size={14} /> AI Career roadmaps
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Custom Learning Roadmap
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
            Pick your career goal and let our AI generate a personalized, week-by-week learning blueprint.
          </p>
        </div>

        {/* Goal Selector */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl mb-8 print:hidden">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
            Select Your Target Career Goal:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] text-left ${
                  selectedGoal === g.id
                    ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{g.label}</h3>
                  <p className="text-xs text-gray-400">{g.duration}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={generateRoadmap}
            disabled={!selectedGoal || loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Analyzing Skill Gaps & Mapping Modules...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate AI Roadmap
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Roadmap Display */}
        {roadmap && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {GOAL_OPTIONS.find((g) => g.id === selectedGoal)?.label} Roadmap
                </h2>
                <p className="text-sm text-gray-400 mt-1">Structured 12-week timeline roadmap</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all print:hidden"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-10 pl-6 py-2">
              {roadmap.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Icon Node */}
                  <div
                    className={`absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 text-white text-xs font-bold shadow-md bg-${item.color}-500`}
                    style={{
                      background:
                        item.color === 'blue'
                          ? '#2563eb'
                          : item.color === 'purple'
                          ? '#7c3aed'
                          : item.color === 'orange'
                          ? '#f97316'
                          : '#10b981',
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Content Card */}
                  <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-6 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                        {item.phase}
                      </h3>
                      <span className="bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 font-semibold whitespace-nowrap">
                        {item.weeks}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{item.desc}</p>

                    {/* Topics */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Topics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.topics.map((t: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300">
                            <BookOpen size={12} className="text-primary-600" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Milestone */}
                    <div className="border-t border-gray-100 dark:border-slate-800/80 pt-3 flex items-start gap-2 text-xs">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
                      <div>
                        <strong className="text-emerald-600">Milestone Project:</strong>
                        <span className="text-gray-600 dark:text-slate-400 ml-1">{item.milestone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
