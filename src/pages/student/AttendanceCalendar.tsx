import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Calendar, Loader2 } from 'lucide-react';

interface AttendanceEntry {
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT';
  subject: string;
}

export const AttendanceCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchAttendance = async () => {
      setLoading(true);
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance_records')
        .select('attendance_date, status, subject')
        .eq('student_id', currentUser.id)
        .gte('attendance_date', firstDay)
        .lte('attendance_date', lastDay);

      if (!error && data) {
        const map: Record<string, 'PRESENT' | 'ABSENT'> = {};
        data.forEach((rec: AttendanceEntry) => {
          map[rec.attendance_date] = rec.status;
        });
        setAttendanceMap(map);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, [currentUser?.id, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Matrix */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5 text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`blank-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const status = attendanceMap[formattedDate];

            return (
              <div
                key={formattedDate}
                className={`h-9 rounded-xl flex flex-col items-center justify-center relative font-semibold transition ${
                  status === 'PRESENT'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : status === 'ABSENT'
                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                }`}
              >
                <span className="text-[11px]">{dayNum}</span>
                {status && (
                  <span className={`text-[8px] font-bold leading-none ${
                    status === 'PRESENT' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {status === 'PRESENT' ? 'P' : 'A'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Present (P)
        </div>
        <div className="flex items-center gap-1.5 text-rose-700 font-medium">
          <XCircle className="w-3.5 h-3.5" /> Absent (A)
        </div>
      </div>
    </div>
  );
};