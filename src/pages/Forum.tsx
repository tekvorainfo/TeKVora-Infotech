import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, ThumbsUp, Plus, Search, Tag, X, MessageCircle } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  upvotes: number;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  content: string;
  date: string;
}

const CATEGORIES = ['All Topics', 'Python Help', 'Web Dev', 'Career Prep', 'Project Feedback', 'Off-topic'];

// Removed INITIAL_POSTS since we use Supabase now
// (Removed INITIAL_POSTS items)

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [search, setSearch] = useState('');
  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('tekvora_upvoted_posts') || '[]'));
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);

  // New Post Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Python Help');
  const [newContent, setNewContent] = useState('');

  // New Reply State
  const [newReplyContent, setNewReplyContent] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
      const { data: repliesData, error: repliesError } = await supabase.from('forum_replies').select('*').order('created_at', { ascending: true });
      
      if (postsError) throw postsError;
      if (repliesError) throw repliesError;
      
      if (postsData) {
        const formattedPosts: Post[] = postsData.map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          category: p.category,
          author: p.author,
          date: new Date(p.created_at).toLocaleDateString(),
          upvotes: p.upvotes || 0,
          replies: (repliesData || []).filter((r: any) => r.post_id === p.id).map((r: any) => ({
            id: r.id,
            author: r.author,
            content: r.content,
            date: new Date(r.created_at).toLocaleDateString()
          }))
        }));
        setPosts(formattedPosts);
        
        if (activePost) {
          setActivePost(formattedPosts.find(x => x.id === activePost.id) || null);
        }
      }
    } catch (err) {
      console.error('Error loading forum posts:', err);
    }
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextUpvoted = [...upvotedIds];
    const isUpvoted = nextUpvoted.includes(id);

    const targetPost = posts.find(p => p.id === id);
    if (!targetPost) return;

    const newUpvotes = isUpvoted ? Math.max(0, targetPost.upvotes - 1) : targetPost.upvotes + 1;

    if (isUpvoted) {
      nextUpvoted = nextUpvoted.filter(x => x !== id);
    } else {
      nextUpvoted.push(id);
    }

    setUpvotedIds(nextUpvoted);
    localStorage.setItem('tekvora_upvoted_posts', JSON.stringify(nextUpvoted));

    try {
      const { error } = await supabase.from('forum_posts').update({ upvotes: newUpvotes }).eq('id', id);
      if (error) throw error;
      await loadPosts();
    } catch (err) {
      console.error('Error upvoting post:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    try {
      const { error } = await supabase.from('forum_posts').insert({
        title: newTitle,
        content: newContent,
        category: newCategory,
        author: user?.email?.split('@')[0] || 'User',
        upvotes: 0
      });
      if (error) throw error;

      await loadPosts();

      setNewTitle('');
      setNewContent('');
      setShowAddModal(false);
      triggerConfetti();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !newReplyContent.trim()) return;

    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: activePost.id,
        author: user?.email?.split('@')[0] || 'User',
        content: newReplyContent.trim()
      });
      if (error) throw error;

      await loadPosts();
      setNewReplyContent('');
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const filtered = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All Topics' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="badge-blue flex items-center gap-1.5 w-fit">
              <MessageSquare size={14} /> Peer Community
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              TeKVora Discussion Forum
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
              Ask questions, discuss topics, share solutions, and help fellow students grow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-primary-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search forum..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 w-48 sm:w-60"
              />
            </div>

            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3 flex items-center gap-1.5 transition-all text-sm shadow-md"
              >
                <Plus size={16} /> New Thread
              </button>
            )}
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm px-1 uppercase tracking-wider text-gray-400">Categories</h3>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeCategory === cat
                      ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <Tag size={13} /> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Stack */}
          <div className="lg:col-span-3 space-y-4">
            {filtered.map(p => {
              const isUpvoted = upvotedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePost(p)}
                  className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.005] flex gap-5"
                >
                  {/* Upvote side widget */}
                  <button
                    onClick={(e) => handleUpvote(p.id, e)}
                    className={`flex flex-col items-center justify-center border rounded-xl w-12 h-14 shrink-0 transition-all ${
                      isUpvoted
                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/50'
                        : 'bg-gray-50 border-gray-100 text-gray-400 dark:bg-slate-850 dark:border-slate-800 hover:border-gray-250'
                    }`}
                  >
                    <ThumbsUp size={14} fill={isUpvoted ? 'currentColor' : 'none'} />
                    <span className="text-xs font-bold mt-1">{p.upvotes}</span>
                  </button>

                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded">{p.category}</span>
                      <span>&bull;</span>
                      <span>By <strong>{p.author}</strong></span>
                      <span>&bull;</span>
                      <span>{p.date}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{p.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{p.content}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MessageCircle size={14} /> {p.replies.length} Replies</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thread Details Modal */}
        {activePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl space-y-6">
              <button
                onClick={() => setActivePost(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              {/* Original Post */}
              <div className="space-y-4 border-b border-gray-100 dark:border-slate-850 pb-6">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded">{activePost.category}</span>
                  <span>&bull;</span>
                  <span>By <strong>{activePost.author}</strong></span>
                  <span>&bull;</span>
                  <span>{activePost.date}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{activePost.title}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed font-mono whitespace-pre-line bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  {activePost.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleUpvote(activePost.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      upvotedIds.includes(activePost.id)
                        ? 'bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/50'
                        : 'bg-gray-50 border-gray-100 text-gray-500 dark:bg-slate-850 dark:border-slate-800'
                    }`}
                  >
                    <ThumbsUp size={12} fill={upvotedIds.includes(activePost.id) ? 'currentColor' : 'none'} />
                    <span>{activePost.upvotes} Upvotes</span>
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Replies ({activePost.replies.length})</h3>
                <div className="space-y-3">
                  {activePost.replies.map(r => (
                    <div key={r.id} className="bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span><strong>{r.author}</strong></span>
                        <span>{r.date}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-mono">{r.content}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {user ? (
                  <form onSubmit={handleAddReply} className="pt-2 flex gap-3">
                    <input
                      value={newReplyContent}
                      onChange={e => setNewReplyContent(e.target.value)}
                      placeholder="Add a reply..."
                      className="input-field flex-grow"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-5 py-3 text-xs transition-all flex items-center shrink-0"
                    >
                      Reply
                    </button>
                  </form>
                ) : (
                  <p className="text-center text-xs text-gray-400 py-2">Please login to write replies.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Post Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create New Discussion</h2>
              <p className="text-xs text-gray-400 mb-5">Draft your topic description and tags.</p>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Topic Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    {CATEGORIES.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                    placeholder="Brief headline summarizing the topic..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Content</label>
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    required
                    placeholder="Provide details of your problem or tips..."
                    className="input-field h-36 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Post Discussion
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
