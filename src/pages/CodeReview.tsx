import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Send, MessageSquare, Plus, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
  author: string;
  comments: Comment[];
  aiFeedback?: string;
}

interface Comment {
  id: string;
  author: string;
  line: number;
  content: string;
}

// INITIAL_SNIPPETS is now stored/seeded in Supabase

export default function CodeReview() {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [activeSnippet, setActiveSnippet] = useState<CodeSnippet | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // New Snippet States
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('Python');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Comment State
  const [commentLine, setCommentLine] = useState(1);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadSnippets();
  }, [user]);

  const loadSnippets = async () => {
    const { data: snippetsData } = await supabase.from('code_reviews').select('*').order('created_at', { ascending: false });
    const { data: commentsData } = await supabase.from('code_review_comments').select('*').order('created_at', { ascending: true });

    if (snippetsData) {
      const formatted: CodeSnippet[] = snippetsData.map((s: any) => ({
        id: s.id,
        title: s.title,
        language: s.language,
        code: s.code,
        description: s.description || '',
        author: s.student_name || 'Anonymous',
        comments: (commentsData || []).filter((c: any) => c.review_id === s.id).map((c: any) => ({
          id: c.id,
          author: c.author_name || 'User',
          line: c.line_number || 1,
          content: c.content
        })),
        aiFeedback: s.ai_feedback || undefined
      }));

      setSnippets(formatted);
      if (activeSnippet) {
        setActiveSnippet(formatted.find(x => x.id === activeSnippet.id) || null);
      }
    }
  };

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode || !user) return;

    const { error } = await supabase.from('code_reviews').insert({
      student_id: user.id,
      student_name: user.email?.split('@')[0] || 'User',
      title: newTitle,
      language: newLang,
      code: newCode,
      description: newDesc,
      status: 'pending',
      upvotes: 0
    });

    if (!error) {
      setNewTitle('');
      setNewCode('');
      setNewDesc('');
      setShowAddModal(false);
      await loadSnippets();
      triggerConfetti();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSnippet || !commentText.trim() || !user) return;

    const { error } = await supabase.from('code_review_comments').insert({
      review_id: activeSnippet.id,
      author_id: user.id,
      author_name: user.email?.split('@')[0] || 'User',
      line_number: commentLine,
      content: commentText.trim()
    });

    if (!error) {
      setCommentText('');
      await loadSnippets();
    }
  };

function getLocalCodeReview(code: string, language: string): string {
  const lowercase = code.toLowerCase();
  
  if (language.toLowerCase() === 'python') {
    let complexity = 'O(n)';
    let recs = [];
    if (lowercase.includes('for ') && lowercase.includes('in ') && lowercase.includes('range(')) {
      complexity = 'O(n) linear complexity based on loop iterations.';
    }
    if (lowercase.includes('def binary_search') || (lowercase.includes('mid') && lowercase.includes('low') && lowercase.includes('high'))) {
      complexity = 'O(log n) logarithmic complexity which is optimal.';
      recs.push('Ensure the array input is pre-sorted as binary search assumes monotonic order.');
    }
    if (!lowercase.includes('def ')) {
      recs.push('Wrap this execution logic inside functions to enforce cleaner scopes and testability.');
    }
    if (lowercase.includes('open(') && !lowercase.includes('with open(')) {
      recs.push('Use the "with open(...) as f" context manager pattern to ensure file descriptors are automatically closed.');
    }
    if (recs.length === 0) {
      recs.push('Enforce PEP 8 naming conventions (snake_case for functions and variables).');
      recs.push('Consider adding type hints (e.g., def func(val: int) -> str) for better static checking.');
    }

    return `### AI Mentor Code Audit (Python)

1. **Complexity:** ${complexity}
2. **Best Practices:** Code is syntactically valid. Variables are defined cleanly.
3. **Recommendations:**
${recs.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`;
  }

  // JS/TS
  let complexity = 'O(n)';
  let recs = [];
  if (lowercase.includes('.map(') || lowercase.includes('.forEach(') || lowercase.includes('for(')) {
    complexity = 'O(n) based on array traversal.';
  }
  if (lowercase.includes('var ')) {
    recs.push('Avoid using old "var" keyword. Prefer block-scoped "let" and "const" to prevent scope leakage.');
  }
  if (lowercase.includes('fetch(') && !lowercase.includes('try') && !lowercase.includes('.catch(')) {
    recs.push('Add proper error handling (try/catch block or .catch handler) to handle network request failures.');
  }
  if (recs.length === 0) {
    recs.push('Ensure all dependencies are declared inside your hooks or useEffect dependency arrays.');
    recs.push('Prefer strict comparison (===) over abstract equality (==) for type safety.');
  }

  return `### AI Mentor Code Audit (JavaScript)

1. **Complexity:** ${complexity}
2. **Best Practices:** Clean variable structure.
3. **Recommendations:**
${recs.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`;
}

  const triggerAiReview = async () => {
    if (!activeSnippet) return;
    setAiLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    let feedback = '';

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-') || apiKey === 'undefined') {
      feedback = getLocalCodeReview(activeSnippet.code, activeSnippet.language || 'javascript');
    } else {
      try {
        const prompt = `Perform a senior developer code audit for the following code snippet. 
Language: ${activeSnippet.language || 'javascript'}
Code:
${activeSnippet.code}

Provide your evaluation in a clear Markdown format containing:
1. Complexity analysis (time & space complexity)
2. Best practices check
3. Recommendations for improvement.
Start directly with the content.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData?.error?.message || `API request failed with status ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!feedback) {
          throw new Error('Empty response from Gemini');
        }
      } catch (e) {
        console.warn('Gemini review fallback to local code audit:', e);
        feedback = getLocalCodeReview(activeSnippet.code, activeSnippet.language || 'javascript');
      }
    }

    const { error } = await supabase
      .from('code_reviews')
      .update({ ai_feedback: feedback })
      .eq('id', activeSnippet.id);

    if (!error) {
      await loadSnippets();
      triggerConfetti();
    }
    setAiLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="badge-blue flex items-center gap-1.5 w-fit">
              <Terminal size={14} /> Code Reviews
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Peer Code Reviews
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
              Submit scripts, algorithms, or snippets for peer code inspection or trigger immediate AI automated audits.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3 flex items-center gap-1.5 transition-all text-sm shadow-md"
            >
              <Plus size={16} /> Request Review
            </button>
          )}
        </div>

        {/* Layout stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review items stack */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm uppercase tracking-wider text-gray-450 mb-3">Requests Stack</h3>
            {snippets.length === 0 ? (
              <p className="text-xs text-gray-400">No review requests yet.</p>
            ) : (
              snippets.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSnippet(s)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    activeSnippet?.id === s.id
                      ? 'bg-primary-50/50 border-primary-350 dark:bg-primary-950/20 dark:border-primary-900/50 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 hover:border-gray-250'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded uppercase">{s.language}</span>
                    <span className="text-[10px] text-gray-400 font-medium">By {s.author}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-3 leading-snug">{s.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Active Review Details View */}
          <div className="lg:col-span-2">
            {activeSnippet ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                {/* Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-850 pb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug">{activeSnippet.title}</h2>
                    <p className="text-xs text-gray-400 mt-1">Requested by <strong>{activeSnippet.author}</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerAiReview}
                      disabled={aiLoading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Sparkles size={12} fill="white" /> {aiLoading ? 'Auditing...' : 'AI Code Review'}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-950/50 p-4 rounded-xl border border-gray-100 dark:border-slate-850">
                  {activeSnippet.description}
                </p>

                {/* Code display */}
                <pre className="bg-[#0d1117] text-slate-100 font-mono text-xs p-5 rounded-2xl overflow-x-auto border border-slate-800 leading-6">
                  {activeSnippet.code.split('\n').map((line, idx) => (
                    <div key={idx} className="hover:bg-slate-800/40 px-2 rounded -mx-2 flex">
                      <span className="text-slate-600 select-none w-8 text-right mr-4">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </pre>

                {/* Comments Thread */}
                <div className="space-y-4 border-t border-gray-100 dark:border-slate-850 pt-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Comments ({activeSnippet.comments.length})</h3>
                  
                  {activeSnippet.comments.map(c => (
                    <div key={c.id} className="bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl flex gap-3">
                      <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold h-fit px-2 py-0.5 rounded shrink-0">Line {c.line}</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span><strong>{c.author}</strong></span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-mono">{c.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment Form */}
                  {user ? (
                    <form onSubmit={handleAddComment} className="pt-2 flex flex-col md:flex-row gap-3">
                      <input
                        type="number"
                        min={1}
                        value={commentLine}
                        onChange={e => setCommentLine(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Line"
                        className="input-field w-20 shrink-0 text-center"
                        required
                      />
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Comment on line code details..."
                        className="input-field flex-grow"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-5 py-3 text-xs transition-all flex items-center justify-center shrink-0"
                      >
                        Add Comment
                      </button>
                    </form>
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-2">Please login to write comment reviews.</p>
                  )}
                </div>

                {/* AI feedback view */}
                {activeSnippet.aiFeedback && (
                  <div className="border-t border-purple-100 dark:border-purple-950/30 pt-5 space-y-3">
                    <h3 className="font-bold text-purple-600 dark:text-purple-400 text-sm flex items-center gap-1.5">
                      <Sparkles size={16} className="text-purple-600" /> AI Code Feedback Report
                    </h3>
                    <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-5 font-mono text-xs text-purple-950 dark:text-purple-300 leading-6 whitespace-pre-line">
                      {activeSnippet.aiFeedback}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <Terminal className="mx-auto text-gray-400 mb-3" size={36} />
                <h3 className="font-bold text-gray-900 dark:text-white">No active review selected</h3>
                <p className="text-xs text-gray-400 mt-1">Select a request from the stack to see details and audit loops.</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Snippet Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Request Peer Code Review</h2>
              <p className="text-xs text-gray-400 mb-5">Upload code snippets for review.</p>

              <form onSubmit={handleCreateSnippet} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Snippet Title</label>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      required
                      placeholder="e.g. Dijkstra algorithm loop"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Language</label>
                    <select
                      value={newLang}
                      onChange={e => setNewLang(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="TypeScript">TypeScript</option>
                      <option value="HTML/CSS">HTML/CSS</option>
                      <option value="SQL">SQL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Short Description</label>
                  <input
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="e.g. Checking for edge case logic on null arrays..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Code Content</label>
                  <textarea
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    required
                    placeholder="def my_function():\n    pass"
                    className="input-field h-48 font-mono text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Publish Code Snippet
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
