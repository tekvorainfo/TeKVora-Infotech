import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, ChevronDown, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Explain Python lists',
  'What is REST API?',
  'Help me debug',
  'Career advice',
];

const SYSTEM_PROMPT =
  'You are TeKVora AI Assistant, helping students learn programming. Be concise, friendly, and educational. Format code with backticks.';

// Simple markdown renderer: bold, inline code, code blocks, bullet points
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={i}
          className="bg-gray-900 text-green-300 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap"
        >
          {lang && (
            <span className="text-gray-500 text-[10px] block mb-1">{lang}</span>
          )}
          {codeLines.join('\n')}
        </pre>
      );
      i++;
      continue;
    }

    // Bullet point
    if (line.trim().startsWith('- ') || line.trim().startsWith('\u2022 ')) {
      const bulletText = line.trim().slice(2);
      elements.push(
        <li key={i} className="ml-4 text-sm list-disc leading-relaxed">
          {inlineMarkdown(bulletText)}
        </li>
      );
      i++;
      continue;
    }

    // Regular paragraph
    if (line.trim() !== '') {
      elements.push(
        <p key={i} className="text-sm leading-relaxed mb-1">
          {inlineMarkdown(line)}
        </p>
      );
    } else {
      elements.push(<div key={i} className="h-1" />);
    }
    i++;
  }

  return <div>{elements}</div>;
}

function inlineMarkdown(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm **TeKVora AI** Ask me anything about programming, career advice, or coding concepts. I'm here to help you learn!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

function getLocalAIResponse(text: string): string {
  const lowercase = text.toLowerCase();
  
  if (lowercase.includes('hello') || lowercase.includes('hi') || lowercase.includes('hey')) {
    return `Hello! I am TeKVora AI Assistant. How can I help you today with your programming learning?
    
*(Note: To activate full generative AI power, add \`VITE_GEMINI_API_KEY\` to your \`.env\` file.)*`;
  }
  
  if (lowercase.includes('course') || lowercase.includes('learn') || lowercase.includes('study')) {
    return `TeKVora offers premium software engineering courses:
* **Full Stack Web Development** (React, Node, Django)
* **Python Programming & APIs** (Django, REST, OOP)
* **Data Science & Machine Learning** (Pandas, Numpy, Scikit-learn)
* **Mobile App Development** (Flutter, Dart)

Which one are you interested in?`;
  }
  
  if (lowercase.includes('intern') || lowercase.includes('stipend') || lowercase.includes('duration')) {
    return `Our internship programs offer:
* **Duration:** 3 Months or 6 Months.
* **Format:** Remote / Online with weekly live mentoring sessions.
* **Benefits:** Verified Internship Certificate, Letter of Recommendation (LOR) on merit, and hands-on live project experience.
* **Stipend:** Unpaid/Certificate-Based (unless explicitly sponsored).`;
  }

  if (lowercase.includes('contact') || lowercase.includes('address') || lowercase.includes('office') || lowercase.includes('phone') || lowercase.includes('email')) {
    return `You can reach out to us at:
* **Email:** info@tekvora.in or info@tekvora.com
* **Website:** www.tekvora.in
* **Office Address:** Sambhaji Residency, Phase 3, Gat No. 12, Row House No. 11/18, Behind Devgiri Bank, Paithan Road, Chh. Sambhajinagar, MH`;
  }
  
  if (lowercase.includes('python')) {
    return `Python is a high-level programming language known for its readability.
Example lists:
\`\`\`python
# Creating a list
fruits = ["apple", "banana", "cherry"]
print(fruits[0]) # Output: apple
\`\`\`
Let me know if you want to know more about Python!`;
  }

  if (lowercase.includes('react') || lowercase.includes('javascript') || lowercase.includes('js')) {
    return `JavaScript is the language of the web. React is a component-based frontend library.
Example state hook:
\`\`\`javascript
import { useState } from 'react';
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`
Let me know if you need help with React components!`;
  }

  if (lowercase.includes('rest') || lowercase.includes('api')) {
    return `A REST API (Representational State Transfer) allows systems to communicate over HTTP.
Primary HTTP Methods:
* **GET:** Retrieve resources.
* **POST:** Create new resources.
* **PUT/PATCH:** Update existing resources.
* **DELETE:** Remove resources.`;
  }
  
  if (lowercase.includes('help') || lowercase.includes('debug') || lowercase.includes('error')) {
    return `I can help you debug! Please paste your code snippet and copy the error message you are seeing. Common issues include syntax errors, undefined variables, or network CORS settings.`;
  }

  return `I am currently running in offline local helper mode. For full conversational capability and custom debugging, please configure your **Gemini API Key** in your project's \`.env\` file:
\`\`\`env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`
In the meantime, feel free to ask me about:
* **TeKVora Courses**
* **Internship programs**
* **Office address & contact details**
* **General programming concepts (Python, React, JavaScript, REST APIs)**`;
}

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-') || apiKey === 'undefined') {
      // Offline Local Fallback
      setTimeout(() => {
        const responseText = getLocalAIResponse(text);
        setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
        setLoading(false);
      }, 500);
      return;
    }

    let responseText = '';
    let success = false;

    // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
    for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const history = newMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: history,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData?.error?.message || `API request failed with status ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        responseText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Sorry, I couldn't get a response. Please try again!";
        success = true;
        break; // Break loop if successful
      } catch (e: any) {
        console.warn(`Gemini error using model ${model}:`, e);
        const errMsg = e.message || '';
        
        // Formulate error response in case all models fail
        if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('exceeded') || errMsg.includes('billing')) {
          responseText = `⚠️ **Gemini API Error:** You have exceeded your free tier API quota or plan limits.
          
Google returned the following message:
> *"${errMsg}"*

To solve this, please check your API usage or link a billing account in your **Google AI Studio** console.`;
        } else if (errMsg.includes('API key') || errMsg.includes('key') || errMsg.includes('API_KEY') || errMsg.includes('not valid') || errMsg.includes('invalid') || errMsg.includes('400') || errMsg.includes('403') || errMsg.includes('unauthorized') || errMsg.includes('credentials')) {
          responseText = `⚠️ **Gemini API Error:** Google's servers rejected the API key as invalid.
          
Google returned the following message:
> *"${errMsg}"*

Please verify that the \`VITE_GEMINI_API_KEY\` in your \`.env\` file is correct and active.`;
        } else {
          responseText = `⚠️ **Gemini API Error:** ${errMsg || 'Connection failed'}. Falling back to offline mode.`;
        }
      }
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Ask AI"
        className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
        }}
        aria-label="Open AI Chatbot"
      >
        {open ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <Brain size={22} className="text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-50 transition-all duration-500 ease-out ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ width: 'min(420px, 100vw)' }}
      >
        <div
          className="flex flex-col rounded-t-3xl shadow-2xl border border-white/10 overflow-hidden"
          style={{
            height: 'min(580px, 85vh)',
            background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/10"
            style={{ background: 'rgba(124,58,237,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">TeKVora AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 text-[10px] font-medium">
                    Powered by Gemini
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                  >
                    <Sparkles size={13} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' ? 'text-white rounded-tr-sm' : 'text-gray-100 rounded-tl-sm'
                  }`}
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                        : 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border:
                      msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                >
                  <Sparkles size={13} className="text-white" />
                </div>
                <div
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    borderColor: 'rgba(124,58,237,0.4)',
                    color: '#c4b5fd',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="px-4 py-3 flex-shrink-0 border-t border-white/10"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a programming question..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:scale-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
            <p className="text-center text-gray-600 text-[10px] mt-2">
              AI can make mistakes. Verify important code.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
