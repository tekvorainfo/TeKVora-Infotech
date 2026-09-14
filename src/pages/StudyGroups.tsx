import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, MessageCircle, Calendar, ShieldAlert, X } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';
import { supabase } from '../lib/supabase';

interface Group {
  id: string;
  name: string;
  topic: string;
  members: number;
  schedule: string;
  description: string;
  notes: GroupNote[];
}

interface GroupNote {
  id: string;
  author: string;
  content: string;
  date: string;
}

// INITIAL_GROUPS is now stored in Supabase

export default function StudyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newTopic, setNewTopic] = useState('Python');
  const [newSchedule, setNewSchedule] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Note text state
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    loadGroupsAndMembers();
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
      const { data: membersData, error: membersError } = await supabase.from('study_group_members').select('*');

      if (groupsError) throw groupsError;
      if (membersError) throw membersError;

      if (groupsData) {
        const formatted: Group[] = groupsData.map((g: any) => {
          let parsedNotes: GroupNote[] = [];
          try {
            parsedNotes = g.notes ? JSON.parse(g.notes) : [];
          } catch (e) {
            parsedNotes = [];
          }

          const groupMembersCount = (membersData || []).filter((m: any) => m.group_id === g.id).length;

          return {
            id: g.id,
            name: g.name,
            topic: g.topic,
            members: groupMembersCount,
            schedule: g.schedule,
            description: g.description,
            notes: parsedNotes
          };
        });

        setGroups(formatted);
        if (activeGroup) {
          setActiveGroup(formatted.find(x => x.id === activeGroup.id) || null);
        }
      }
    } catch (err) {
      console.error('Error loading study groups:', err);
    }
  };

  const loadGroupsAndMembers = async () => {
    try {
      await loadGroups();
      if (user) {
        const { data, error } = await supabase.from('study_group_members').select('group_id').eq('student_id', user.id);
        if (error) throw error;
        if (data) {
          setJoinedIds(data.map((m: any) => m.group_id));
        }
      }
    } catch (err) {
      console.error('Error loading study group memberships:', err);
    }
  };

  const handleJoin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (joinedIds.includes(id)) return;

    try {
      const { error } = await supabase.from('study_group_members').insert({
        group_id: id,
        student_id: user.id
      });

      if (error) throw error;

      setJoinedIds(prev => [...prev, id]);
      await loadGroups();
      triggerConfetti();
    } catch (err) {
      console.error('Error joining study group:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSchedule) return;

    try {
      const { data, error } = await supabase.from('study_groups').insert({
        name: newName,
        topic: newTopic,
        schedule: newSchedule,
        description: newDesc,
        notes: '[]'
      }).select().single();

      if (error) throw error;

      if (data) {
        // Auto-join the creator
        const { error: joinError } = await supabase.from('study_group_members').insert({
          group_id: data.id,
          student_id: user?.id
        });
        if (joinError) throw joinError;

        setNewName('');
        setNewSchedule('');
        setNewDesc('');
        setShowAddModal(false);
        await loadGroupsAndMembers();
        triggerConfetti();
      }
    } catch (err) {
      console.error('Error creating study group:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !noteContent.trim() || !user) return;

    const newNote: GroupNote = {
      id: Date.now().toString(),
      author: user.email?.split('@')[0] || 'User',
      content: noteContent.trim(),
      date: new Date().toLocaleDateString()
    };

    const updatedNotes = [newNote, ...activeGroup.notes];

    const { error } = await supabase
      .from('study_groups')
      .update({ notes: JSON.stringify(updatedNotes) })
      .eq('id', activeGroup.id);

    if (!error) {
      await loadGroups();
      setNoteContent('');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="badge-blue flex items-center gap-1.5 w-fit">
              <Users size={14} /> Peer Study circles
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Virtual Study Groups
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
              Collaborate, share study materials, notes, and attend recurring sync calls with classmates.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3 flex items-center gap-1.5 transition-all text-sm shadow-md"
            >
              <Plus size={16} /> Create Group
            </button>
          )}
        </div>

        {/* Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups stack */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm uppercase tracking-wider text-gray-400 mb-2">Available Circles</h3>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400">No active study groups yet.</p>
            ) : (
              groups.map(g => {
                const isJoined = joinedIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGroup(g)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      activeGroup?.id === g.id
                        ? 'bg-primary-50/50 border-primary-350 dark:bg-primary-950/20 dark:border-primary-900/50'
                        : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 hover:border-gray-250'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded uppercase">{g.topic}</span>
                      {isJoined && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Joined</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-3">{g.name}</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1.5"><Calendar size={12} /> {g.schedule}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Group Details/Shared Board */}
          <div className="lg:col-span-2">
            {activeGroup ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-850 pb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{activeGroup.name}</h2>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"><Calendar size={13} /> {activeGroup.schedule}</p>
                  </div>

                  {!joinedIds.includes(activeGroup.id) && user && (
                    <button
                      onClick={(e) => handleJoin(activeGroup.id, e)}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs transition-all shadow-sm"
                    >
                      Join Circle
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-950/50 p-4 rounded-xl border border-gray-100 dark:border-slate-850">
                  {activeGroup.description}
                </p>

                {/* Board Notes section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                    <MessageCircle size={16} className="text-primary-600" /> Shared Board Announcements
                  </h3>

                  {joinedIds.includes(activeGroup.id) ? (
                    <div className="space-y-4">
                      {/* Add note Form */}
                      {user && (
                        <form onSubmit={handleAddNote} className="flex gap-3 pt-2">
                          <input
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            placeholder="Share notes, resources, or reminders..."
                            className="input-field flex-grow"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-5 py-3 text-xs transition-colors shrink-0"
                          >
                            Share
                          </button>
                        </form>
                      )}

                      {/* Notes list */}
                      <div className="space-y-3">
                        {activeGroup.notes.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                            Board is empty. Be the first to share notes!
                          </p>
                        ) : (
                          activeGroup.notes.map(n => (
                            <div key={n.id} className="bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-gray-400">
                                <span><strong>{n.author}</strong></span>
                                <span>{n.date}</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-mono">{n.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-gray-50 dark:bg-slate-950/40">
                      <ShieldAlert className="mx-auto text-amber-500" size={32} />
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">Join Circle to Access Board</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">This board has shared schedules, zoom links, and notes accessible only to circle members.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <Users className="mx-auto text-gray-400 mb-3" size={36} />
                <h3 className="font-bold text-gray-900 dark:text-white">No active study circle selected</h3>
                <p className="text-xs text-gray-400 mt-1">Select a group from the list to join calls or check shared developer resources.</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Group Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create Study Group</h2>
              <p className="text-xs text-gray-400 mb-5">Start a peer collaboration circle.</p>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Group Name</label>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      placeholder="e.g. Django Backenders"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Topic</label>
                    <select
                      value={newTopic}
                      onChange={e => setNewTopic(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Python">Python</option>
                      <option value="Web Dev">Web Dev</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Cloud">Cloud</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Schedule Detail</label>
                  <input
                    value={newSchedule}
                    onChange={e => setNewSchedule(e.target.value)}
                    required
                    placeholder="e.g. Every Saturday at 3 PM"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    required
                    placeholder="Specify target goals, topics, or materials you plan to cover..."
                    className="input-field h-24 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Create & Join Group
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
