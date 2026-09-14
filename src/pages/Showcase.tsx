import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Github, ExternalLink, Heart, Plus, Search, Code2, X } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  github: string;
  demo?: string;
  student_name: string;
  likes: number;
}

// INITIAL_PROJECTS is now seeded in Supabase

export default function Showcase() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');
  const [github, setGithub] = useState('');
  const [demo, setDemo] = useState('');

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase.from('showcase_projects').select('*').order('created_at', { ascending: false });
      if (projectsError) throw projectsError;
      if (projectsData) {
        setProjects(projectsData.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          tech: p.tech_stack || [],
          github: p.github_url || '',
          demo: p.demo_url || '',
          student_name: p.student_name || 'Anonymous',
          likes: p.likes || 0
        })));
      }

      if (user) {
        const { data: likesData, error: likesError } = await supabase.from('showcase_likes').select('project_id').eq('student_id', user.id);
        if (likesError) throw likesError;
        if (likesData) {
          setLiked(likesData.map((l: any) => l.project_id));
        }
      }
    } catch (err) {
      console.error('Error loading projects/likes:', err);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    const isLiked = liked.includes(id);

    const project = projects.find(p => p.id === id);
    if (!project) return;

    try {
      if (isLiked) {
        const { error: deleteError } = await supabase.from('showcase_likes').delete().eq('project_id', id).eq('student_id', user.id);
        if (deleteError) throw deleteError;
        const newLikes = Math.max(0, project.likes - 1);
        const { error: updateError } = await supabase.from('showcase_projects').update({ likes: newLikes }).eq('id', id);
        if (updateError) throw updateError;
        setLiked(prev => prev.filter(x => x !== id));
      } else {
        const { error: insertError } = await supabase.from('showcase_likes').insert({ project_id: id, student_id: user.id });
        if (insertError) throw insertError;
        const newLikes = project.likes + 1;
        const { error: updateError } = await supabase.from('showcase_projects').update({ likes: newLikes }).eq('id', id);
        if (updateError) throw updateError;
        setLiked(prev => [...prev, id]);
        triggerConfetti();
      }
      await loadProjects();
    } catch (err) {
      console.error('Error handling showcase project like:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !github || !user) return;

    try {
      const { error } = await supabase.from('showcase_projects').insert({
        student_id: user.id,
        student_name: user.email?.split('@')[0] || 'Student',
        title,
        description: desc,
        tech_stack: tech.split(',').map(t => t.trim()).filter(Boolean),
        github_url: github,
        demo_url: demo || null,
        likes: 0
      });

      if (error) throw error;

      setTitle('');
      setDesc('');
      setTech('');
      setGithub('');
      setDemo('');
      setShowModal(false);
      await loadProjects();
      triggerConfetti();
    } catch (err) {
      console.error('Error creating showcase project:', err);
    }
  };

  const filtered = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tech.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 font-poppins">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="badge-blue flex items-center gap-1.5 w-fit">
              <Code2 size={14} /> Student Gallery
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Project Showcase
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
              Explore outstanding web applications, scripts, and algorithms built by TeKVora students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-primary-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by skill or title..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 w-48 sm:w-64"
              />
            </div>

            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3 flex items-center gap-1.5 transition-all text-sm shadow-md shadow-primary-500/10"
              >
                <Plus size={16} /> Submit Project
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="card p-6 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-snug group-hover:text-primary-600 transition-colors">
                    {p.title}
                  </h3>
                  <button
                    onClick={() => handleLike(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      liked.includes(p.id)
                        ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/50'
                        : 'bg-gray-50 border-gray-100 text-gray-500 dark:bg-slate-850 dark:border-slate-800 hover:border-gray-200'
                    }`}
                  >
                    <Heart size={12} fill={liked.includes(p.id) ? 'currentColor' : 'none'} />
                    {p.likes}
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4">
                  {p.description}
                </p>
                {/* Tech tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {p.tech.map(t => (
                    <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-gray-100 dark:border-slate-850 pt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  By <strong className="text-gray-700 dark:text-slate-300">{p.student_name}</strong>
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Github size={14} /> GitHub
                  </a>
                  {p.demo && (
                    <a
                      href={p.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors font-semibold"
                    >
                      <ExternalLink size={14} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Submit Your Project</h2>
              <p className="text-xs text-gray-400 mb-5">Share your creation with the TeKVora community.</p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Chatbot Interface"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    required
                    placeholder="Summarize features and outcomes..."
                    className="input-field h-20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tech Stack (comma separated)</label>
                  <input
                    value={tech}
                    onChange={e => setTech(e.target.value)}
                    placeholder="e.g. React, Node, Tailwind"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">GitHub URL</label>
                    <input
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      required
                      placeholder="https://github.com/..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Demo URL (optional)</label>
                    <input
                      value={demo}
                      onChange={e => setDemo(e.target.value)}
                      placeholder="https://demo.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Publish to Showcase
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
