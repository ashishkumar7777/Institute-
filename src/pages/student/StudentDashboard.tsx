import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { PdfReaderModal } from '../../components/reader/PdfReaderModal';
import { AttendanceCalendar } from './AttendanceCalendar';
import { supabase } from '../../services/supabase';
import {
  User as UserIcon,
  CalendarCheck,
  BookOpen,
  DollarSign,
  Award,
  ChevronRight,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Home,
  Calendar,
  Clock,
  Lock,
  Eye,
  FileText,
  Loader2
} from 'lucide-react';

type ActiveModal = 'profile' | 'attendance' | 'assignment' | 'fees' | 'results' | 'library' | null;

interface MaterialItem {
  id: string;
  subject: string;
  chapter_title: string;
  page_count: string;
  pdf_url: string;
  is_unlocked?: boolean;
}

interface TestResultItem {
  id: string;
  test_name: string;
  subject: string;
  total_marks: number;
  marks_obtained: number;
  grade: string;
  rank_in_batch?: number;
  test_date: string;
}

const getPerformanceBadge = (obtained: number, total: number) => {
  if (total <= 0) return null;
  const pct = Math.round((obtained / total) * 100);

  if (pct >= 90) {
    return {
      tier: '1st Tier',
      medal: '🥇',
      label: 'Distinction',
      cardBorder: 'border-amber-300 bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-white',
      badgeStyle: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs',
    };
  }

  if (pct >= 80) {
    return {
      tier: '2nd Tier',
      medal: '🥈',
      label: 'Merit',
      cardBorder: 'border-slate-300 bg-gradient-to-r from-slate-100/80 via-slate-50/50 to-white',
      badgeStyle: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-xs',
    };
  }

  if (pct >= 70) {
    return {
      tier: '3rd Tier',
      medal: '🥉',
      label: 'Honors',
      cardBorder: 'border-amber-700/30 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white',
      badgeStyle: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-xs',
    };
  }

  return null;
};

// Computes micro-trend relative to chronologically preceding test in same subject
const computeScoreTrend = (
  currentIndex: number,
  allResults: TestResultItem[]
): { label: string; type: 'up' | 'down' | 'same' | 'first'; diff: number } => {
  const current = allResults[currentIndex];
  if (!current || current.total_marks <= 0) return { label: 'First Test', type: 'first', diff: 0 };

  const currentPct = (current.marks_obtained / current.total_marks) * 100;
  const previous = allResults.slice(currentIndex + 1).find((r) => r.subject === current.subject);

  if (!previous || previous.total_marks <= 0) {
    return { label: 'Baseline', type: 'first', diff: 0 };
  }

  const prevPct = (previous.marks_obtained / previous.total_marks) * 100;
  const diff = Math.round(currentPct - prevPct);

  if (diff > 0) return { label: `+${diff}%`, type: 'up', diff };
  if (diff < 0) return { label: `${diff}%`, type: 'down', diff };
  return { label: '0%', type: 'same', diff: 0 };
};

export const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { chapters } = useLibrary();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeReadingChapter, setActiveReadingChapter] = useState<any | null>(null);

  const enrolledSubjects: string[] = 
    (currentUser as any)?.enrolled_subjects?.length > 0
      ? (currentUser as any).enrolled_subjects
      : (currentUser as any)?.enrolledSubjects?.length > 0
      ? (currentUser as any).enrolledSubjects
      : ['Mathematics'];

  const [selectedSubject, setSelectedSubject] = useState<string>(enrolledSubjects[0] || 'Mathematics');
  const [dbMaterials, setDbMaterials] = useState<MaterialItem[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);

  const [liveTestResults, setLiveTestResults] = useState<TestResultItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);

  const studentName = currentUser?.name || 'Aarav Patel';
  const studentPhone = currentUser?.phone || '9900011101';
  
  const liveFeeStatus = (currentUser as any)?.fee_status || (currentUser as any)?.feeStatus || 'UNPAID';
  const isPaid = liveFeeStatus === 'PAID';
  const attendanceRate = (currentUser as any)?.attendance_rate ?? (currentUser as any)?.attendanceRate ?? 100;

  useEffect(() => {
    if (enrolledSubjects.length > 0 && !enrolledSubjects.includes(selectedSubject)) {
      setSelectedSubject(enrolledSubjects[0]);
    }
  }, [enrolledSubjects]);

  useEffect(() => {
    const fetchSubjectMaterials = async () => {
      if (!selectedSubject) return;
      setIsLoadingMaterials(true);

      try {
        const { data, error } = await supabase
          .from('syllabus_materials')
          .select('*')
          .eq('subject', selectedSubject)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Note: syllabus_materials fetch error or table pending:', error.message);
          setDbMaterials([]);
        } else if (data) {
          setDbMaterials(data);
        }
      } catch (err: any) {
        console.error('Error fetching materials:', err.message);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchSubjectMaterials();
  }, [selectedSubject]);

  useEffect(() => {
    const fetchStudentTestResults = async () => {
      if (!currentUser?.id) return;
      setIsLoadingResults(true);

      try {
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('student_id', currentUser.id)
          .order('test_date', { ascending: false });

        if (!error && data) {
          setLiveTestResults(data);
        }
      } catch (err: any) {
        console.error('Error fetching student test results:', err.message);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchStudentTestResults();
  }, [currentUser?.id]);

  const contextChapters = chapters.filter((c: any) => c.subject === selectedSubject);

  const combinedChapters = [
    ...contextChapters.map((c: any) => ({
      id: c.id,
      title: c.title,
      chapterNumber: c.chapter_number ?? c.chapterNumber ?? 1,
      totalPages: c.total_pages ?? c.totalPages ?? '14 Pages',
      pdfUrl: c.pdf_url || c.pdfUrl,
      isUnlocked: c.isUnlocked ?? true,
      subject: c.subject
    })),
    ...dbMaterials.map((m, idx) => ({
      id: m.id,
      title: m.chapter_title,
      chapterNumber: contextChapters.length + idx + 1,
      totalPages: m.page_count || 'Study Notes',
      pdfUrl: m.pdf_url,
      isUnlocked: m.is_unlocked ?? true,
      subject: m.subject
    }))
  ];

  const unlockedByTeacher = combinedChapters.filter((c: any) => c.isUnlocked !== false);
  const unlockedChaptersCount = isPaid ? unlockedByTeacher.length : 0;

  const assignments = [
    { id: 1, title: 'Calculus Problem Set 4', subject: 'Mathematics', dueDate: 'Tomorrow, 5:00 PM', status: 'Pending' },
    { id: 2, title: 'Optics Lab Report', subject: 'Physics', dueDate: '22 Sep 2026', status: 'Submitted' },
    { id: 3, title: 'Organic Reaction Mechanism', subject: 'Chemistry', dueDate: '24 Sep 2026', status: 'Pending' },
  ];

  const quickCards = [
    {
      id: 'library',
      title: 'E-Library',
      subtitle: `${unlockedChaptersCount}/${combinedChapters.length} Chapters Available`,
      icon: BookOpen,
      iconBg: 'bg-blue-100 text-blue-600',
      cardBg: 'bg-blue-50/60 border-blue-100',
      action: () => setActiveModal('library'),
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: `${attendanceRate}% Current Rate`,
      icon: CalendarCheck,
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBg: 'bg-emerald-50/60 border-emerald-100',
      action: () => setActiveModal('attendance'),
    },
    {
      id: 'fees',
      title: 'Fees Details',
      subtitle: isPaid ? 'All Dues Cleared' : 'Payment Overdue',
      icon: DollarSign,
      iconBg: 'bg-teal-100 text-teal-600',
      cardBg: 'bg-teal-50/60 border-teal-100',
      action: () => setActiveModal('fees'),
    },
    {
      id: 'assignment',
      title: 'Assignments',
      subtitle: 'Homework & Tasks',
      icon: FileText,
      iconBg: 'bg-amber-100 text-amber-600',
      cardBg: 'bg-amber-50/60 border-amber-100',
      action: () => setActiveModal('assignment'),
    },
    {
      id: 'results',
      title: 'Test Results',
      subtitle: liveTestResults.length > 0 ? `${liveTestResults.length} Reports Published` : 'Scores & Rankings',
      icon: Award,
      iconBg: 'bg-purple-100 text-purple-600',
      cardBg: 'bg-purple-50/60 border-purple-100',
      action: () => setActiveModal('results'),
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Enrolled Subjects',
      icon: UserIcon,
      iconBg: 'bg-indigo-100 text-indigo-600',
      cardBg: 'bg-indigo-50/60 border-indigo-100',
      action: () => setActiveModal('profile'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-20 select-none">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-6 pt-7 pb-10 rounded-b-[2.5rem] shadow-md text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-200 font-semibold">Student Portal</p>
              <h1 className="text-2xl font-bold flex items-center gap-1.5 mt-0.5">
                Hello, {studentName.split(' ')[0]} <span>👋</span>
              </h1>
              <div className="flex flex-wrap gap-1 mt-1">
                {enrolledSubjects.map((sub) => (
                  <span key={sub} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    {sub}
                  </span>
                ))}
              </div>
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
                {studentName.charAt(0)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/15 text-xs flex justify-between items-center">
            <div>
              <span className="text-blue-200 text-[10px] font-bold uppercase">Enrolled Subject(s)</span>
              <p className="font-semibold text-white">{enrolledSubjects.join(' • ')}</p>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded font-bold ${
              isPaid ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'
            }`}>
              {isPaid ? 'FEES CLEARED' : 'FEE DUE'}
            </span>
          </div>
        </div>

        {/* Real-Time Live Institute Broadcast Strip */}
        <NoticeBanner />

        {/* Quick Access */}
        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Quick Access</h2>
            <span className="text-xs font-semibold text-blue-600">{enrolledSubjects.length} Subject Course</span>
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
                    <h3 className="font-bold text-slate-800 text-sm">{card.title}</h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-6 py-2.5 flex items-center justify-between fixed bottom-0 max-w-md w-full z-10 shadow-lg">
          <button 
            onClick={() => setActiveModal(null)}
            className="flex flex-col items-center gap-1 text-blue-600 font-medium"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => setActiveModal('library')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">Library</span>
          </button>
          <button onClick={() => setActiveModal('attendance')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Schedule</span>
          </button>
          <button onClick={() => setActiveModal('profile')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>

        {/* Modals Container */}
        {activeModal && (
          <div className="absolute inset-0 bg-black/50 z-30 flex flex-col justify-end backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-lg text-slate-800 capitalize">
                  {activeModal === 'library' && 'Syllabus & E-Reader Library'}
                  {activeModal === 'fees' && 'Fees Status & History'}
                  {activeModal === 'profile' && 'Student Profile'}
                  {activeModal === 'attendance' && 'Daily Attendance Calendar'}
                  {activeModal === 'assignment' && 'Assigned Homework'}
                  {activeModal === 'results' && 'Academic Performance & Rankings'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. E-LIBRARY */}
              {activeModal === 'library' && (
                <div className="space-y-4 text-xs">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    {enrolledSubjects.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={`flex-1 py-2 rounded-lg font-bold transition text-center ${
                          selectedSubject === sub
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {isLoadingMaterials ? (
                      <div className="flex justify-center py-8 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : combinedChapters.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 text-xs">
                        No chapters or notes published for {selectedSubject} yet.
                      </p>
                    ) : (
                      combinedChapters.map((chap: any) => {
                        const isTeacherUnlocked = chap.isUnlocked !== false;
                        const canRead = isPaid && isTeacherUnlocked;

                        return (
                          <div
                            key={chap.id}
                            className={`p-3 rounded-xl border flex items-center justify-between transition ${
                              canRead
                                ? 'bg-blue-50/50 border-blue-100 text-slate-800'
                                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-70'
                            }`}
                          >
                            <div className="pr-2">
                              <span className="font-bold text-xs">
                                Ch {chap.chapterNumber}: {chap.title}
                              </span>
                              <span className="block text-[10px] mt-0.5 text-slate-500">
                                {chap.totalPages} •{' '}
                                {!isTeacherUnlocked
                                  ? 'Locked by Teacher'
                                  : !isPaid
                                  ? 'Locked (Payment pending)'
                                  : 'Ready for study'}
                              </span>
                            </div>

                            {canRead ? (
                              <button
                                onClick={() => setActiveReadingChapter({
                                  ...chap,
                                  pdfUrl: chap.pdfUrl,
                                })}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                              >
                                <Eye className="w-3 h-3" /> Read
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400 px-2.5 py-1.5 bg-slate-200 rounded-md text-[10px] font-semibold shrink-0">
                                <Lock className="w-3 h-3" /> Locked
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 2. PROFILE */}
              {activeModal === 'profile' && (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                      {studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{studentName}</p>
                      <p className="text-xs text-slate-500">Phone: {studentPhone}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-700">Enrolled Subjects:</p>
                    <p className="text-blue-600 font-semibold">{enrolledSubjects.join(', ')}</p>
                  </div>
                </div>
              )}

              {/* 3. ATTENDANCE */}
              {activeModal === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Overall Record</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-0.5">{attendanceRate}%</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>

                  <AttendanceCalendar />
                </div>
              )}

              {/* 4. ASSIGNMENT */}
              {activeModal === 'assignment' && (
                <div className="space-y-3">
                  {assignments.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">{item.subject}</span>
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Due: {item.dueDate}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        item.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. FEES */}
              {activeModal === 'fees' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Status</p>
                      <p className={`text-xl font-bold mt-0.5 ${isPaid ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isPaid ? 'PAID (Term 1)' : 'UNPAID (Pending Due)'}
                      </p>
                    </div>
                    {isPaid ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8 text-rose-500" />}
                  </div>
                  {!isPaid && (
                    <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                      Pay ₹12,000 via UPI
                    </button>
                  )}
                </div>
              )}

              {/* 6. RESULTS & PODIUM PERFORMANCE BADGES WITH DYNAMIC SCORES & TREND */}
              {activeModal === 'results' && (
                <div className="space-y-3 text-xs">
                  {isLoadingResults ? (
                    <div className="flex justify-center py-8 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : liveTestResults.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-xs bg-slate-50 rounded-2xl">
                      No test reports published yet.
                    </p>
                  ) : (
                    liveTestResults.map((res, index) => {
                      const badge = getPerformanceBadge(res.marks_obtained, res.total_marks);
                      const percentage = Math.round((res.marks_obtained / res.total_marks) * 100);
                      const trend = computeScoreTrend(index, liveTestResults);

                      return (
                        <div
                          key={res.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            badge
                              ? `${badge.cardBorder} shadow-xs`
                              : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {/* Top row: Test Name, Subject, Trend Pill, and Podium Badge */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs">
                                {res.test_name}
                              </span>
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                                {res.subject}
                              </span>

                              {/* Micro-Trend Indicator */}
                              {trend.type === 'up' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                  ▲ {trend.label}
                                </span>
                              )}
                              {trend.type === 'down' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                                  ▼ {trend.label}
                                </span>
                              )}
                              {trend.type === 'same' && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                  ▬ Stable
                                </span>
                              )}
                              {trend.type === 'first' && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                  ● Baseline
                                </span>
                              )}
                            </div>

                            {/* Podium Badge */}
                            {badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${badge.badgeStyle}`}
                              >
                                <span>{badge.medal}</span>
                                <span>{badge.tier}</span>
                              </span>
                            )}
                          </div>

                          {/* Middle row: Progress Track */}
                          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden my-2">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percentage >= 90
                                  ? 'bg-amber-500'
                                  : percentage >= 80
                                  ? 'bg-slate-500'
                                  : percentage >= 70
                                  ? 'bg-amber-700'
                                  : percentage >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>

                          {/* Bottom row: Date & Batch Rank on left, Exact Number Score on right */}
                          <div className="flex items-end justify-between mt-1 pt-1.5 border-t border-slate-100/80">
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {new Date(res.test_date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {res.rank_in_batch && (
                                <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                                  Batch Rank #{res.rank_in_batch}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-800 block leading-tight">
                                  {res.marks_obtained}
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    /{res.total_marks}
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {percentage}%
                                </span>
                              </div>

                              <span
                                className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                                  percentage >= 90
                                    ? 'bg-amber-100 text-amber-800'
                                    : percentage >= 80
                                    ? 'bg-slate-200 text-slate-800'
                                    : percentage >= 70
                                    ? 'bg-amber-100/70 text-amber-900'
                                    : percentage >= 50
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {res.grade}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Protected PDF Reader Modal */}
        {activeReadingChapter && (
          <PdfReaderModal
            chapter={activeReadingChapter}
            studentName={studentName}
            studentPhone={studentPhone}
            onClose={() => setActiveReadingChapter(null)}
          />
        )}

      </div>
    </div>
  );
};