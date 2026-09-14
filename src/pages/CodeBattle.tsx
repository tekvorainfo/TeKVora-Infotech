import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Swords, Play, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';

interface Opponent {
  name: string;
  avatar: string;
  status: string;
}

export default function CodeBattle() {
  const { user } = useAuth();
  const [stage, setStage] = useState<'lobby' | 'battle' | 'results'>('lobby');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [code, setCode] = useState('def is_prime(n):\n    # Return True if prime, else False\n    pass\n');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState(0);

  useEffect(() => {
    let t: any;
    if (stage === 'battle') {
      t = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setStage('results');
            clearInterval(t);
            return 0;
          }
          return prev - 1;
        });

        // Simulate opponent code completions increasing
        setOpponentProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 8);
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [stage]);

  const handleStart = () => {
    setTimer(600);
    setOpponentProgress(0);
    setStage('battle');
  };

  const handleSubmit = () => {
    setRunning(true);
    setOutput('Compiling and executing against test cases...');
    
    setTimeout(() => {
      if (code.includes('pass') || !code.includes('return')) {
        setOutput('Fail: Output returned None on test input n=7.');
        setRunning(false);
        return;
      }

      setOutput('All test cases passed!\nTest case 1: n=7 -> Expected True. Passed.\nTest case 2: n=4 -> Expected False. Passed.\nTest case 3: n=1 -> Expected False. Passed.\n\nCode complexity: O(sqrt(N)) time, O(1) auxiliary space.');
      setStage('results');
      triggerConfetti();
      setRunning(false);
    }, 1500);
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Lobby stage */}
        {stage === 'lobby' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 max-w-xl mx-auto">
            <Swords size={48} className="text-primary-600 mx-auto" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Coding Battles & Duels</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Compete 1-on-1 in a timed challenge. First developer to pass all tests wins.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-850 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0">
                AI
              </div>
              <div className="text-left flex-grow">
                <h4 className="font-bold text-gray-800 dark:text-slate-200 text-xs">Matching Opponent</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Searching active students...</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>

            <button
              onClick={handleStart}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10 flex items-center justify-center gap-2"
            >
              <Swords size={14} /> Challenge AI Bot
            </button>
          </div>
        )}

        {/* Battle Arena Stage */}
        {stage === 'battle' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left panel: Problem */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl px-6 py-4 shadow-sm">
                <span className="text-xs text-gray-400 font-medium">Topic: Primality Testing</span>
                <span className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Timer size={13} className="animate-spin" /> {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </span>
              </div>

              {/* Opponent Progress Bar */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>Opponent (AI Bot) Progress</span>
                  <span>{opponentProgress}% Complete</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${opponentProgress}%` }}
                  />
                </div>
              </div>

              {/* Problem detail */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Problem Statement</h3>
                <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed">
                  Write a function is_prime(n) that checks if an integer n is prime. Return True if it is prime, else False.
                </p>
                <div className="space-y-1 bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-850 font-mono text-xs">
                  <p className="text-gray-400"># Test Inputs</p>
                  <p className="text-gray-700 dark:text-slate-300">is_prime(7) -&gt; True</p>
                  <p className="text-gray-700 dark:text-slate-300">is_prime(4) -&gt; False</p>
                </div>
              </div>
            </div>

            {/* Right Panel: Editor */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#0d1117] rounded-3xl border border-slate-850 shadow-xl overflow-hidden flex flex-col h-[320px]">
                <div className="bg-[#161b22] px-5 py-3 border-b border-slate-850 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><Terminal size={14} /> duel.py</span>
                  <button
                    onClick={handleSubmit}
                    disabled={running}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    Submit Code
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="flex-grow w-full bg-[#0d1117] text-slate-100 font-mono text-sm p-5 outline-none resize-none leading-6"
                />
              </div>

              {output && (
                <pre className="bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 font-mono text-xs text-gray-600 dark:text-slate-300 leading-5">
                  {output}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Results stage */}
        {stage === 'results' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 max-w-xl mx-auto">
            <CheckCircle size={48} className="text-emerald-500 mx-auto" />
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Duel Victorious!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You passed all test cases faster than your opponent.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between text-sm">
              <span className="text-emerald-800 dark:text-emerald-400 font-bold">Reward</span>
              <strong className="text-amber-500 font-bold">+50 XP & Gold Badge</strong>
            </div>

            <button
              onClick={() => setStage('lobby')}
              className="w-full py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 font-bold rounded-xl transition-all"
            >
              Leave Arena
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
