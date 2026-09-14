import { useState } from 'react';
import Layout from '../components/Layout';
import { Compass, BookOpen, ChevronRight, HelpCircle, ZoomIn, ZoomOut } from 'lucide-react';

interface MindNode {
  id: string;
  label: string;
  desc: string;
  x: number;
  y: number;
  level: 1 | 2 | 3;
}

const TOPICS = [
  { id: 'python', label: 'Python Language' },
  { id: 'react', label: 'React Frontend Framework' }
];

const NODE_MAPS: Record<string, MindNode[]> = {
  python: [
    { id: 'c', label: 'Python Core', desc: 'Core programming primitives, data types, structures.', x: 200, y: 200, level: 1 },
    { id: 'c1', label: 'Data Types', desc: 'Integers, Floats, Strings, Booleans, Complex numbers.', x: 80, y: 120, level: 2 },
    { id: 'c2', label: 'Structures', desc: 'Lists, Tuples, Dictionaries, Sets.', x: 80, y: 280, level: 2 },
    { id: 'c3', label: 'OOP Systems', desc: 'Classes, Objects, Inheritance, Polymorphism.', x: 320, y: 120, level: 2 },
    { id: 'c4', label: 'Concurrency', desc: 'Threading, Multiprocessing, AsyncIO.', x: 320, y: 280, level: 2 },
    { id: 'c1_1', label: 'Decorators', desc: 'Advanced function decorators modifying behavior.', x: 20, y: 80, level: 3 },
    { id: 'c1_2', label: 'Generators', desc: 'Iterators using yield statement.', x: 20, y: 160, level: 3 }
  ],
  react: [
    { id: 'r', label: 'React Engine', desc: 'Declarative component state model.', x: 200, y: 200, level: 1 },
    { id: 'r1', label: 'State & Props', desc: 'Unidirectional data flows and render variables.', x: 80, y: 120, level: 2 },
    { id: 'r2', label: 'Hooks API', desc: 'Functional state helpers (useState, useEffect).', x: 80, y: 280, level: 2 },
    { id: 'r3', label: 'Routing', desc: 'Context path bindings and route rendering.', x: 320, y: 120, level: 2 },
    { id: 'r4', label: 'State Managers', desc: 'Redux Toolkit, Zustand, Context API.', x: 320, y: 280, level: 2 }
  ]
};

export default function MindMap() {
  const [topic, setTopic] = useState<'python' | 'react'>('python');
  const [activeNode, setActiveNode] = useState<MindNode | null>(null);
  const [zoom, setZoom] = useState(1);

  const nodes = NODE_MAPS[topic] || [];
  const rootNode = nodes.find(n => n.level === 1);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <Compass size={14} /> Knowledge Graph
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Concept Mind Map
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Visualize tech concepts and roadmap nodes in a custom interactive svg graph. Click nodes to see details.
          </p>
        </div>

        {/* Dropdown controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Mind Map</label>
            <select
              value={topic}
              onChange={e => {
                setTopic(e.target.value as any);
                setActiveNode(null);
              }}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {TOPICS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
              className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 rounded-xl transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="text-gray-500 dark:text-slate-350" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
              className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 rounded-xl transition-all"
              title="Zoom In"
            >
              <ZoomIn size={16} className="text-gray-500 dark:text-slate-350" />
            </button>
          </div>
        </div>

        {/* Graph Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Graph viewport */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex items-center justify-center relative min-h-[420px]">
            <svg
              viewBox="0 0 400 400"
              className="w-full max-w-[400px] h-[400px] transition-transform duration-300 origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Draw curved lines */}
              {rootNode && nodes.filter(n => n.id !== rootNode.id).map(n => {
                // Determine source coordinates (level 3 connects to level 2 parent, level 2 connects to root)
                let source = rootNode;
                if (n.level === 3) {
                  const parentId = n.id.split('_')[0];
                  source = nodes.find(x => x.id === parentId) || rootNode;
                }

                // Control points for curved Bezier paths
                const midX = (source.x + n.x) / 2;
                return (
                  <path
                    key={n.id}
                    d={`M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${n.y}, ${n.x} ${n.y}`}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                    strokeDasharray={n.level === 3 ? '4,4' : undefined}
                    className="transition-all duration-300 dark:stroke-slate-750"
                  />
                );
              })}

              {/* Draw nodes */}
              {nodes.map(n => {
                const isActive = activeNode?.id === n.id;
                const isRoot = n.level === 1;
                const isLevel2 = n.level === 2;

                return (
                  <g
                    key={n.id}
                    onClick={() => setActiveNode(n)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isRoot ? 24 : isLevel2 ? 18 : 14}
                      fill={isActive ? '#2563eb' : isRoot ? '#7c3aed' : isLevel2 ? '#f97316' : '#10b981'}
                      className="transition-all duration-300 group-hover:scale-110 shadow-sm"
                      style={{
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(37,99,235,0.5))' : undefined
                      }}
                    />
                    <text
                      x={n.x}
                      y={n.y + (isRoot ? 38 : isLevel2 ? 30 : 25)}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-gray-700 dark:fill-slate-300 font-mono select-none"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Details Side card */}
          <div className="lg:col-span-1">
            {activeNode ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <span className="badge-blue flex items-center gap-1.5 w-fit">
                  Level {activeNode.level} Node
                </span>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-snug">{activeNode.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-950/40 p-4 rounded-xl border border-gray-100 dark:border-slate-850 font-mono">
                  {activeNode.desc}
                </p>

                <div className="border-t border-gray-50 dark:border-slate-850 pt-4 flex items-center gap-1.5 text-xs text-primary-600 font-semibold cursor-pointer hover:underline">
                  <BookOpen size={14} /> Open Course Materials <ChevronRight size={12} />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
                <HelpCircle className="mx-auto text-gray-405 mb-2" size={32} />
                <h4 className="font-bold text-gray-950 dark:text-white text-sm">Select Node</h4>
                <p className="text-xs text-gray-400 mt-1">Click any circle in the graph view to inspect descriptive parameters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
