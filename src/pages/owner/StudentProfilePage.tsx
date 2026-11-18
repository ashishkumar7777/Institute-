import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  ArrowLeft, 
  Phone, 
  CalendarCheck2, 
  Award, 
  Receipt, 
  Loader2, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  class_name?: string;
  monthly_fee?: number;
  enrolled_subjects?: string[];
}

interface FeePaymentRecord {
  id: string;
  fee_month: string;
  amount: number;
  status: string;
  paid_date: string;
}

interface AttendanceLog {
  id: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT';
}

interface TestMark {
  id: string;
  subject: string;
  test_name: string;
  marks_obtained: number;
  total_marks: number;
  grade?: string;
  test_date: string;
}

const formatMonthLabel = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

export const StudentProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [feeLedger, setFeeLedger] = useState<FeePaymentRecord[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [testMarks, setTestMarks] = useState<TestMark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calendar navigation state for attendance grid
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const fetchStudentCompleteDossier = async () => {
      if (!studentId) return;
      setIsLoading(true);

      try {
        const [profileRes, feeRes, attendanceRes, marksRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', studentId).single(),
          supabase.from('fee_payments').select('*').eq('student_id', studentId).order('fee_month', { ascending: false }),
          supabase.from('attendance_records').select('*').eq('student_id', studentId).order('attendance_date', { ascending: false }),
          supabase.from('test_results').select('*').eq('student_id', studentId).order('test_date', { ascending: false }),
        ]);

        if (profileRes.data) setStudent(profileRes.data);
        if (feeRes.data) setFeeLedger(feeRes.data);
        if (attendanceRes.data) setAttendanceLogs(attendanceRes.data);
        if (marksRes.data) setTestMarks(marksRes.data);
      } catch (err: any) {
        console.error('Error loading student profile dossier:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentCompleteDossier();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-600 font-bold mb-3">Student profile not found.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPaidCurrentMonth = feeLedger.some((p) => p.fee_month === currentMonthKey && p.status === 'PAID');
  const totalPresent = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const attendanceRate = attendanceLogs.length > 0 ? Math.round((totalPresent / attendanceLogs.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center pb-12 select-none">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-slate-900 px-5 pt-6 pb-8 text-white">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-purple-200 hover:text-white mb-4 font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <span className="text-[10px] bg-white/20 border border-white/30 px-2 py-0.5 rounded font-bold">
                  {student.class_name || '10th'} Class
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5" /> {student.phone}
              </p>
            </div>
            
            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isPaidCurrentMonth ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
            }`}>
              {isPaidCurrentMonth ? 'NOVEMBER PAID' : 'NOVEMBER DUE'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15 text-xs">
            <div>
              <span className="text-purple-200 text-[10px] uppercase font-semibold block">Monthly Tuition Fee</span>
              <span className="font-extrabold text-white text-sm">₹{(student.monthly_fee || 1500).toLocaleString()}/mo</span>
            </div>
            <div>
              <span className="text-purple-200 text-[10px] uppercase font-semibold block">Streams / Subjects</span>
              <span className="font-semibold text-white truncate block">{student.enrolled_subjects?.join(', ') || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          
          {/* 1. Fee Chitta / History */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Fee Payment Ledger (Chitta)
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {feeLedger.length} Paid Record(s)
              </span>
            </div>

            {feeLedger.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100 text-center">
                No fee payment receipts recorded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {feeLedger.map((rec) => (
                  <div key={rec.id} className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{formatMonthLabel(rec.fee_month)}</span>
                      <span className="text-[10px] text-slate-400">Paid on {new Date(rec.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] border border-emerald-200">
                      ₹{Number(rec.amount).toLocaleString()} PAID
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Attendance Summary & Calendar Grid */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CalendarCheck2 className="w-4 h-4 text-indigo-600" /> Attendance Record
              </h3>
              <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                {attendanceRate}% Overall
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sessions Logged</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{attendanceLogs.length}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Present Days</span>
                <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">{totalPresent}</span>
              </div>
            </div>

            {/* Attendance Calendar Grid */}
            {(() => {
              const currentYear = calendarDate.getFullYear();
              const currentMonth = calendarDate.getMonth();
              const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
              const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

              const attendanceMap = new Map<string, 'PRESENT' | 'ABSENT'>();
              attendanceLogs.forEach((log) => {
                if (log.attendance_date) {
                  attendanceMap.set(log.attendance_date, log.status);
                }
              });

              return (
                <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-bold text-slate-800 text-xs">{monthName}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`blank-${i}`} className="h-7" />
                    ))}

                    {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const status = attendanceMap.get(dateStr);

                      return (
                        <div
                          key={dateStr}
                          className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold ${
                            status === 'PRESENT'
                              ? 'bg-emerald-100 border border-emerald-400 text-emerald-800 font-bold'
                              : status === 'ABSENT'
                              ? 'bg-rose-100 border border-rose-300 text-rose-800 font-bold'
                              : 'bg-slate-50 border border-slate-100 text-slate-400'
                          }`}
                        >
                          <span>{dayNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 3. Test Scores & Ranks */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> Academic Test Results
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                {testMarks.length} Exam(s)
              </span>
            </div>

            {testMarks.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100 text-center">
                No exam scorecards published yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {testMarks.map((mark) => {
                  const pct = Math.round((mark.marks_obtained / mark.total_marks) * 100);
                  return (
                    <div key={mark.id} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{mark.test_name}</span>
                        <span className="text-[10px] text-purple-700 font-semibold">
                          {mark.subject} • {new Date(mark.test_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-800 text-xs block">{mark.marks_obtained}/{mark.total_marks} ({pct}%)</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.2 rounded inline-block mt-0.5">Grade: {mark.grade || 'A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};