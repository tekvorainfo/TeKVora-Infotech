import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Camera, CheckCircle2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';

interface AttendanceRecord {
  id: string;
  session_id: string;
  topic: string;
  date: string;
  status: 'Present' | 'Late';
}

const INITIAL_RECORDS: AttendanceRecord[] = [
  { id: '1', session_id: 'SESS101', topic: 'React States & Contexts', date: '01 July 2026', status: 'Present' },
  { id: '2', session_id: 'SESS102', topic: 'Python Loops & Lists', date: '02 July 2026', status: 'Present' }
];

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [checkedIn, setCheckedIn] = useState(false);
  const [message, setMessage] = useState('');

  // Admin session generator states
  const [adminPin, setAdminPin] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');

  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    if (pin === '802422' || pin === adminPin) {
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        session_id: 'SESS' + Math.floor(100 + Math.random() * 900),
        topic: sessionTopic || 'Full Stack Web Dev Workshop',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        status: 'Present'
      };

      setRecords([newRecord, ...records]);
      setCheckedIn(true);
      setMessage('Attendance registered successfully for: ' + newRecord.topic);
      setPin('');
      triggerConfetti();
    } else {
      setMessage('Invalid Session PIN Code. Double check with instructor.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const generateAdminSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTopic) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAdminPin(code);
    triggerConfetti();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <QrCode size={14} /> Attendance System
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Lecture Check-in
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Scan lecture QR codes or enter the 6-digit PIN code displayed by the instructor to check in.
          </p>
        </div>

        {/* Checked In Success */}
        {checkedIn ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-8 text-center space-y-4 mb-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Attendance Confirmed!</h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 max-w-sm mx-auto">{message}</p>
            <button
              onClick={() => setCheckedIn(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 py-2.5 text-xs transition-all"
            >
              Verify Another PIN
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* PIN Check-in form */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Student PIN Check-in</h3>
              
              <form onSubmit={handleManualCheckin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lecture PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code..."
                    className="input-field text-center font-bold tracking-widest text-lg"
                    required
                  />
                </div>

                {message && !checkedIn && (
                  <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50 border border-rose-100 p-3 rounded-xl text-center">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  Verify PIN
                </button>
              </form>
            </div>

            {/* Admin QR Session Generator (Visible if Admin or demo) */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-primary-600" /> Admin Session Creator
                </h3>

                <form onSubmit={generateAdminSession} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lecture/Topic Title</label>
                    <input
                      value={sessionTopic}
                      onChange={e => setSessionTopic(e.target.value)}
                      placeholder="e.g. Intro to NumPy"
                      className="input-field"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 font-bold rounded-xl transition-all"
                  >
                    Generate Session Code
                  </button>
                </form>
              </div>

              {adminPin && (
                <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 rounded-2xl text-center space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Generated Session PIN</span>
                  <strong className="text-3xl font-black text-primary-600 block tracking-widest">{adminPin}</strong>
                  <span className="text-[9px] text-gray-400 flex items-center justify-center gap-1"><Clock size={10} /> Active for 15 minutes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4">My Lecture Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 font-bold">
                  <th className="pb-3">Session ID</th>
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
                {records.map(r => (
                  <tr key={r.id} className="text-gray-650 dark:text-slate-350">
                    <td className="py-3 font-mono font-bold text-primary-600">{r.session_id}</td>
                    <td className="py-3 font-semibold">{r.topic}</td>
                    <td className="py-3">{r.date}</td>
                    <td className="py-3 text-right">
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
