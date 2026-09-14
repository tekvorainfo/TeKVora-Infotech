import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function DailyCheckIn({ internId }: { internId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'checked_in'>('idle');
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    setStatus('loading');
    setError('');
    
    try {
      const { error: dbError } = await supabase
        .from('intern_daily_logs')
        .insert({
          intern_id: internId,
          date: new Date().toISOString().split('T')[0],
          check_in: new Date().toTimeString().split(' ')[0],
          status: 'present'
        });

      if (dbError) {
        if (dbError.code === '23505') {
          // Unique constraint violation - already checked in today
          setError('You have already checked in today.');
        } else {
          setError(dbError.message);
        }
        setStatus('idle');
      } else {
        setStatus('checked_in');
        
        // Also log the activity
        await supabase.from('intern_activity_logs').insert({
          intern_id: internId,
          activity_type: 'daily_checkin',
          description: 'Intern checked in for the day.'
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily Attendance</h2>
          <p className="text-gray-500 text-sm">Mark your presence for today.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-mono">
          <Clock size={18} />
          {time.toLocaleTimeString()}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {status === 'checked_in' ? (
        <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle size={48} className="text-green-500 mb-3" />
          <h3 className="text-lg font-semibold text-green-800">Checked In Successfully</h3>
          <p className="text-green-600 text-sm">Have a great day at work!</p>
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={status === 'loading'}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <CheckCircle size={20} />
              Mark Attendance (Check In)
            </>
          )}
        </button>
      )}
    </div>
  );
}
