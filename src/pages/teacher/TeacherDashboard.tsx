import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { supabase } from '../../services/supabase';
import {
  CalendarCheck,
  Camera,
  Award,
  BookOpen,
  AlertCircle,
  ChevronRight,
  LogOut,
  X,
  Users,
  UploadCloud,
  Home,
  FileText,
  Unlock,
  Loader2
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  fee_status: string;
  attendance_rate: number;
  enrolled_subjects: string[];
}

type TeacherModal = 'attendance' | 'notes' | 'marks' | 'assignments' | 'fees' | 'syllabus' | null;

export const TeacherDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { chapters } = useLibrary();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<TeacherModal>(null);
  const [assignedStudents, setAssignedStudents] = useState<StudentProfile[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [isSavingAttendance, setIsSavingAttendance] = useState<boolean>(false);

  // Read teacher name and assigned subject
  const teacherName = currentUser?.name || 'Prof. Rajesh Sharma';
  const teacherSubject =
    ((currentUser as any)?.enrolled_subjects && (currentUser as any).enrolled_subjects[0]) ||
    (currentUser as any)?.subject ||
    'Mathematics';

  // Live chapters for this subject
  const subjectChapters = chapters.filter((c: any) => c.subject === teacherSubject);
  const unlockedCount = subjectChapters.length;

  // Attendance state: { [studentId]: 'PRESENT' | 'ABSENT' }
  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  const [marksState] = useState<Record<string, string>>({
    std_01: '23',
    std_02: '19',
    std_03: '21',
  });

  const [uploadedNotesCount, setUploadedNotesCount] = useState(4);
  const [selectedChapter, setSelectedChapter] = useState('Chapter 1: Relations & Functions');

  // Fetch live students enrolled in this teacher's subject
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;

      // Filter by subject matching either string or array entries
      const students = ((data as StudentProfile[]) || []).filter((s: any) => {
        if (!s.enrolled_subjects) return true;
        if (Array.isArray(s.enrolled_subjects)) {
          return s.enrolled_subjects.includes(teacherSubject);
        }
        return String(s.enrolled_subjects).includes(teacherSubject);
      });

      setAssignedStudents(students);

      // Default all fetched students to PRESENT for today
      const initialAttendance: Record<string, 'PRESENT' | 'ABSENT'> = {};
      students.forEach((s) => {
        initialAttendance[s.id] = 'PRESENT';
      });
      setAttendanceState(initialAttendance);
    } catch (err: any) {
      console.error('Error fetching students:', err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [teacherSubject]);

  const toggleAttendance = (id: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [id]: prev[id] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    assignedStudents.forEach((s) => {
      updated[s.id] = 'PRESENT';
    });
    setAttendanceState(updated);
  };

  // Submit attendance to Supabase
  const handleSaveAttendance = async () => {
    if (assignedStudents.length === 0) return;
    setIsSavingAttendance(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const records = assignedStudents.map((s) => ({
        institute_id: (currentUser as any)?.institute_id || 'inst_apex_01',
        student_id: s.id,
        teacher_id: currentUser?.id,
        subject: teacherSubject,
        attendance_date: today,
        status: attendanceState[s.id] || 'PRESENT',
      }));

      // Upsert records based on the unique constraint (student_id, attendance_date, subject)
      const { error } = await supabase
        .from('attendance_records')
        .upsert(records, { onConflict: 'student_id,attendance_date,subject' });

      if (error) throw error;

      alert("Today's attendance saved successfully! Student percentages updated.");
      setActiveModal(null);
      await fetchStudents();
    } catch (err: any) {
      console.error('Failed to save attendance:', err.message);
      alert('Error saving attendance: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const presentCount = Object.values(attendanceState).filter((v) => v === 'PRESENT').length;
  const unpaidStudents = assignedStudents.filter((s) => s.fee_status === 'UNPAID');

  const cleanFirstName = (name: string) => {
    return name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.)\s+/i, '').split(' ')[0];
  };

  const quickCards = [
    {
      id: 'syllabus',
      title: 'Chapter Unlocker',
      subtitle: `${unlockedCount}/${subjectChapters.length || 2} Unlocked`,
      icon: BookOpen,
      iconBg: 'bg-blue-100 text-blue-600',
      cardBg: 'bg-blue-50/60 border-blue-100',
      action: () => setActiveModal('syllabus'),
    },
    {
      id: 'attendance',
      title: 'Mark Attendance',
      subtitle: `${presentCount}/${assignedStudents.length} Present today`,
      icon: CalendarCheck,
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBg: 'bg-emerald-50/60 border-emerald-100',
      action: () => setActiveModal('attendance'),
    },
    {
      id: 'notes',
      title: 'Upload Class Notes',
      subtitle: `${uploadedNotesCount} sheets pushed today`,
      icon: Camera,
      iconBg: 'bg-indigo-100 text-indigo-600',
      cardBg: 'bg-indigo-50/60 border-indigo-100',
      action: () => setActiveModal('notes'),
    },
    {
      id: 'marks',
      title: 'Enter Test Marks',
      subtitle: 'Unit Test 2 (25 Marks)',
      icon: Award,
      iconBg: 'bg-purple-100 text-purple-600',
      cardBg: 'bg-purple-50/60 border-purple-100',
      action: () => setActiveModal('marks'),
    },
    {
      id: 'fees',
      title: 'Fee Status (Nudge)',
      subtitle: `${unpaidStudents.length} student(s) pending`,
      icon: AlertCircle,
      iconBg: 'bg-rose-100 text-rose-600',
      cardBg: 'bg-rose-50/60 border-rose-100',
      action: () => setActiveModal('fees'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-20 select-none">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-7 pb-10 rounded-b-[2.5rem] shadow-md text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded font-bold">
                Faculty Portal
              </span>
              <h1 className="text-2xl font-bold flex items-center gap-1.5 mt-1">
                {cleanFirstName(teacherName)} Sir <span>👨‍🏫</span>
              </h1>
              <p className="text-xs text-teal-100/90 mt-0.5 font-medium">
                {teacherSubject} Specialist • Apex Academy
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                title="Switch Account"
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/25 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-full border-2 border-white/70 overflow-hidden bg-white/20 flex items-center justify-center font-bold text-white shadow">
                {cleanFirstName(teacherName).charAt(0)}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/15 flex items-center justify-between text-xs">
            <div>
              <p className="text-teal-200 text-[10px] font-bold uppercase">Assigned Subject</p>
              <p className="font-semibold text-white">{teacherSubject} Stream</p>
            </div>
            <div className="text-right">
              <span className="bg-white/20 text-white font-bold text-[11px] px-2 py-1 rounded-lg">
                Active Batch
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Live Institute Broadcast Strip */}
        <NoticeBanner />

        {/* Quick Access Grid */}
        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Classroom Controls</h2>
            <span className="text-xs font-semibold text-emerald-600">
              {isLoadingStudents ? 'Loading...' : `${assignedStudents.length} Students`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {quickCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={card.action}
                  className={`p-3.5 rounded-2xl border ${card.cardBg} cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between h-28 relative`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{card.title}</h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Roster (Live Supabase Students) */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> {teacherSubject} Batch Roster
              </h3>
              <span className="text-[11px] text-slate-400">{assignedStudents.length} Enrolled</span>
            </div>

            {isLoadingStudents ? (
              <div className="flex justify-center py-6 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : assignedStudents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {assignedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400">Attendance: {student.attendance_rate ?? 100}%</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        student.fee_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {student.fee_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-8 py-2.5 flex items-center justify-between fixed bottom-0 max-w-md w-full z-10 shadow-lg">
          <button className="flex flex-col items-center gap-1 text-emerald-600 font-medium">
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => setActiveModal('attendance')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px]">Attendance</span>
          </button>
          <button
            onClick={() => setActiveModal('syllabus')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">Syllabus</span>
          </button>
          <button
            onClick={() => setActiveModal('marks')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Marks</span>
          </button>
        </div>

        {/* Modals */}
        {activeModal && (
          <div className="absolute inset-0 bg-black/50 z-30 flex flex-col justify-end backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-lg text-slate-800 capitalize">
                  {activeModal === 'syllabus' && `${teacherSubject} Chapter Unlocker`}
                  {activeModal === 'attendance' && "Today's Attendance"}
                  {activeModal === 'notes' && 'Daily Whiteboard & Notes'}
                  {activeModal === 'marks' && 'Enter Exam Scores (Unit Test 2)'}
                  {activeModal === 'fees' && 'Fee Reminder List'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. SYLLABUS UNLOCKER */}
              {activeModal === 'syllabus' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="font-bold text-blue-900">{teacherSubject} ({subjectChapters.length} Chapters)</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      Chapter notes available for student access.
                    </p>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {subjectChapters.map((chap: any) => (
                      <div
                        key={chap.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50"
                      >
                        <div className="pr-2">
                          <span className="font-bold text-slate-800">
                            Ch {chap.chapter_number ?? chap.chapterNumber ?? 1}: {chap.title}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {chap.total_pages ?? chap.totalPages ?? 14} Pages
                          </span>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-emerald-100 text-emerald-700">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ATTENDANCE (LIVE LOGGING TO SUPABASE) */}
              {activeModal === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-emerald-800 font-bold">
                        {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <p className="text-emerald-600 mt-0.5">{presentCount} of {assignedStudents.length} present</p>
                    </div>
                    <button
                      onClick={markAllPresent}
                      className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                      All Present
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {assignedStudents.map((s) => {
                      const isPresent = attendanceState[s.id] === 'PRESENT';
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleAttendance(s.id)}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-800">{s.name}</p>
                            <p className="text-[10px] text-slate-400">Current: {s.attendance_rate ?? 100}%</p>
                          </div>
                          <span
                            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs transition ${
                              isPresent ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {isPresent ? 'P' : 'A'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    disabled={isSavingAttendance || assignedStudents.length === 0}
                    onClick={handleSaveAttendance}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save & Submit Attendance
                  </button>
                </div>
              )}

              {/* 3. NOTES */}
              {activeModal === 'notes' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Chapter</label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none"
                    >
                      {subjectChapters.map((c: any) => (
                        <option key={c.id}>
                          Ch {c.chapter_number ?? c.chapterNumber ?? 1}: {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Tap to upload whiteboard snaps</p>
                    <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG supported • Auto-compressed</p>
                  </div>

                  <button
                    onClick={() => {
                      setUploadedNotesCount((prev) => prev + 1);
                      alert('Notes published to student feed!');
                      setActiveModal(null);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                  >
                    Publish to Student Feed
                  </button>
                </div>
              )}

              {/* 4. MARKS */}
              {activeModal === 'marks' && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-semibold mb-1">
                    <span>Student Name</span>
                    <span>Marks / 25</span>
                  </div>
                  {assignedStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <input
                        type="number"
                        defaultValue={marksState[s.id] || '20'}
                        max="25"
                        min="0"
                        className="w-16 p-1.5 text-center font-bold border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      alert('Marks updated and visible to parents!');
                      setActiveModal(null);
                    }}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md mt-2"
                  >
                    Publish Report Cards
                  </button>
                </div>
              )}

              {/* 5. FEES NUDGE */}
              {activeModal === 'fees' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">
                    Students in your batch with pending fee dues:
                  </p>
                  {unpaidStudents.length === 0 ? (
                    <p className="text-emerald-600 font-semibold text-center py-4 bg-emerald-50 rounded-xl">All students have cleared their fees!</p>
                  ) : (
                    unpaidStudents.map((s) => (
                      <div key={s.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-rose-600 font-semibold">Fee Overdue: ₹12,000</p>
                        </div>
                        <button
                          onClick={() => alert(`WhatsApp reminder sent for ${s.name}!`)}
                          className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow"
                        >
                          Send Nudge
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};