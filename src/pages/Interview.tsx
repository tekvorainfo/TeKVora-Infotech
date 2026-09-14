import { useState } from 'react';
import Layout from '../components/Layout';
import { Terminal, Users, Sparkles, RefreshCw, Send, ArrowRight, Play, Award } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';

const QUESTIONS: Record<string, string[]> = {
  python: [
    'Explain the difference between deep copy and shallow copy in Python.',
    'What are Python decorators and when would you use them?',
    'Explain how Python manages memory via garbage collection and reference counting.',
    'How do list comprehensions differ from generator expressions in terms of syntax and memory?',
    'What is the purpose of the global interpreter lock (GIL) in CPython?'
  ],
  webdev: [
    'Explain the event loop in JavaScript and how it handles asynchronous calls.',
    'What are the key benefits and trade-offs of Client-side Rendering (CSR) vs Server-side Rendering (SSR)?',
    'How does CSS nesting work in modern browsers, and how does it compare to preprocessors like SASS?',
    'What are React Server Components and how do they differ from standard client components?',
    'Explain cross-site scripting (XSS) and how developers prevent it.'
  ]
};

export default function Interview() {
  const [topic, setTopic] = useState<'python' | 'webdev' | ''>('');
  const [stage, setStage] = useState<'setup' | 'interview' | 'report'>('setup');
  
  // Interview active states
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const startInterview = () => {
    if (!topic) return;
    setQuestionIdx(0);
    setAnswers([]);
    setScores([]);
    setFeedbacks([]);
    setCurrentAnswer('');
    setStage('interview');
  };

function getLocalInterviewFeedback(question: string, answer: string): { score: number; feedback: string } {
  const lowercaseAnswer = answer.toLowerCase();
  
  if (question.includes('deep copy') || question.includes('shallow copy')) {
    if (lowercaseAnswer.includes('import copy') && lowercaseAnswer.includes('copy.deepcopy')) {
      return { score: 9, feedback: 'Excellent explanation. Correctly identified copy.deepcopy() for recursively copying nested objects.' };
    }
    if (lowercaseAnswer.includes('reference') || lowercaseAnswer.includes('nested')) {
      return { score: 8, feedback: 'Good explanation of how shallow copy shares nested references while deep copy duplicates them.' };
    }
    return { score: 6, feedback: 'Basic explanation. You should mention that shallow copy only copies the outer container while keeping references to nested elements.' };
  }

  if (question.includes('garbage collection') || question.includes('reference counting')) {
    if (lowercaseAnswer.includes('circular') || lowercaseAnswer.includes('cycles') || lowercaseAnswer.includes('generational')) {
      return { score: 9, feedback: 'Superb! Great mention of reference counting cycles and Python\'s generational garbage collector.' };
    }
    if (lowercaseAnswer.includes('count')) {
      return { score: 7, feedback: 'Good mention of reference counting. Explain how Python handles circular references to score higher.' };
    }
    return { score: 5, feedback: 'Explain how Python decrements reference counts to zero and cleans up objects to improve this answer.' };
  }

  if (question.includes('event loop') || question.includes('asynchronous')) {
    if (lowercaseAnswer.includes('call stack') && (lowercaseAnswer.includes('callback queue') || lowercaseAnswer.includes('task queue') || lowercaseAnswer.includes('microtask'))) {
      return { score: 9, feedback: 'Excellent explanation of the call stack, event loop, and callback/microtask queue coordination.' };
    }
    if (lowercaseAnswer.includes('stack') || lowercaseAnswer.includes('queue') || lowercaseAnswer.includes('single threaded')) {
      return { score: 7, feedback: 'Good. Be sure to describe how the event loop polls the queue when the call stack becomes empty.' };
    }
    return { score: 5, feedback: 'Explain the single-threaded nature of JS and how asynchronous web APIs offload work to improve.' };
  }

  if (question.includes('cross-site scripting') || question.includes('xss')) {
    if (lowercaseAnswer.includes('sanitize') || lowercaseAnswer.includes('escape') || lowercaseAnswer.includes('csp') || lowercaseAnswer.includes('content security policy')) {
      return { score: 9, feedback: 'Excellent security advice! Mentioning sanitization, HTML escaping, and CSP headers is fully correct.' };
    }
    if (lowercaseAnswer.includes('script') || lowercaseAnswer.includes('input')) {
      return { score: 7, feedback: 'Solid definition. Explain concrete mitigation strategies like escaping or CSP to score higher.' };
    }
    return { score: 6, feedback: 'Define the vulnerability clearly: malicious scripts injected into trusted websites, and how to block them.' };
  }

  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount > 40) {
    return { score: 8, feedback: 'Detailed and comprehensive explanation covering primary technical aspects.' };
  } else if (wordCount > 15) {
    return { score: 7, feedback: 'Good concise explanation, but could be elaborated with code examples or architectural context.' };
  }
  return { score: 5, feedback: 'Explanation is too brief. Try to detail the underlying runtime mechanics and security/performance tradeoffs.' };
}

  const handleNext = async () => {
    if (!currentAnswer.trim()) return;
    setLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    let score = 7;
    let feedback = '';

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-') || apiKey === 'undefined') {
      const localResult = getLocalInterviewFeedback(currentQuestion, currentAnswer);
      score = localResult.score;
      feedback = localResult.feedback;
    } else {
      try {
        const prompt = `Review the following programming interview question and the student's answer. Give a score from 1 to 10, and a concise 1-2 sentence feedback. Return your response strictly in the JSON format: {"score": 8, "feedback": "Explanation is correct but you should mention memory overhead."}. Ensure you return valid JSON, and nothing else.
Question: ${currentQuestion}
Answer: ${currentAnswer}`;

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
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (typeof parsed.score === 'number' && parsed.feedback) {
          score = parsed.score;
          feedback = parsed.feedback;
        } else {
          throw new Error('Invalid JSON format from Gemini response');
        }
      } catch (e) {
        console.warn('Gemini eval fallback to local evaluator: ', e);
        const localResult = getLocalInterviewFeedback(currentQuestion, currentAnswer);
        score = localResult.score;
        feedback = localResult.feedback;
      }
    }

    setScores(s => [...s, score]);
    setFeedbacks(f => [...f, feedback]);
    setAnswers(a => [...a, currentAnswer]);
    setCurrentAnswer('');

    const nextIdx = questionIdx + 1;
    const questionsList = QUESTIONS[topic] || [];
    
    if (nextIdx >= questionsList.length) {
      setStage('report');
      triggerConfetti();
    } else {
      setQuestionIdx(nextIdx);
    }
    setLoading(false);
  };

  const questionsList = topic ? QUESTIONS[topic] : [];
  const currentQuestion = questionsList[questionIdx];

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : '0.0';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 font-poppins">
        {/* Setup Stage */}
        {stage === 'setup' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/20 rounded-2xl flex items-center justify-center text-primary-600 mx-auto text-2xl">
              🤖
            </div>
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">AI Interview Simulator</h1>
              <p className="text-sm text-gray-400 mt-2">
                Simulate a real-time technical screen. Answer 5 AI questions and get structured score reports.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Select Focus Topic</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTopic('python')}
                  className={`py-3.5 rounded-2xl border-2 text-sm font-bold transition-all ${
                    topic === 'python'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600'
                      : 'border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300'
                  }`}
                >
                  🐍 Python Core
                </button>
                <button
                  onClick={() => setTopic('webdev')}
                  className={`py-3.5 rounded-2xl border-2 text-sm font-bold transition-all ${
                    topic === 'webdev'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600'
                      : 'border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300'
                  }`}
                >
                  🌐 Web Frontend
                </button>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={!topic}
              className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10 flex items-center gap-2 mx-auto"
            >
              <Play size={14} fill="white" /> Start Screening
            </button>
          </div>
        )}

        {/* Active Interview Stage */}
        {stage === 'interview' && (
          <div className="space-y-6">
            {/* Question Screen */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-600" />
              <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                <span className="font-bold uppercase tracking-wider text-primary-600">Interviewer AI</span>
                <span>Question {questionIdx + 1} of {questionsList.length}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion}
              </h2>
            </div>

            {/* Answer Box */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Your Technical Answer</label>
              <textarea
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                placeholder="Type your explanation here. Detail your points fully..."
                className="input-field h-40 resize-none outline-none font-mono text-sm leading-6"
                disabled={loading}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() || loading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-1.5 text-sm shadow-md"
                >
                  {loading ? (
                    <><RefreshCw className="animate-spin" size={14} /> Evaluating...</>
                  ) : (
                    <>Submit & Continue <Send size={12} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Performance Report Stage */}
        {stage === 'report' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
            <div className="text-center space-y-3">
              <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
                <Award size={14} /> Evaluation complete
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Performance Scorecard</h2>
              <div className="flex justify-center items-baseline gap-1 mt-4">
                <span className="text-5xl font-black text-primary-600">{avgScore}</span>
                <span className="text-gray-400 text-sm">/ 10.0</span>
              </div>
              <p className="text-xs text-gray-400">Average evaluation mark</p>
            </div>

            {/* Questions breakdown */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Detailed Breakdown</h3>
              <div className="space-y-4">
                {questionsList.map((q, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-850 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-gray-800 dark:text-slate-200 text-sm leading-snug">
                        {idx + 1}. {q}
                      </h4>
                      <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-extrabold px-3 py-1 rounded-full border border-primary-100 dark:border-primary-900/50">
                        {scores[idx] || 0} / 10
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Your Answer</p>
                      <p className="text-gray-600 dark:text-slate-300 text-xs mt-1 font-mono leading- relaxed">
                        {answers[idx]}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-xs flex items-start gap-2">
                      <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-gray-500 dark:text-slate-400">{feedbacks[idx]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restart */}
            <div className="flex justify-center border-t border-gray-100 dark:border-slate-800 pt-6">
              <button
                onClick={() => setStage('setup')}
                className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl text-sm transition-all"
              >
                Start New Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
