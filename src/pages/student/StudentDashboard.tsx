import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { PdfReaderModal } from '../../components/reader/PdfReaderModal';
import { AttendanceCalendar } from './AttendanceCalendar';
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
  FileText
} from 'lucide-react';

type ActiveModal = 'profile' | 'attendance' | 'assignment' | 'fees' | 'results' | 'library' | null;

export const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { chapters } = useLibrary();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeReadingChapter, setActiveReadingChapter] = useState<any | null>(null);

  // Read enrolled subjects from live Supabase profile or fallback
  const enrolledSubjects: string[] = 
    (currentUser as any)?.enrolled_subjects?.length > 0
      ? (currentUser as any).enrolled_subjects
      : (currentUser as any)?.enrolledSubjects?.length > 0
      ? (currentUser as any).enrolledSubjects
      : ['Mathematics'];

  const [selectedSubject, setSelectedSubject] = useState<string>(enrolledSubjects[0]);

  const studentName = currentUser?.name || 'Aarav Patel';
  const studentPhone = currentUser?.phone || '9900011101';
  
  // Reconcile live Supabase fee_status ('PAID' / 'UNPAID')
  const liveFeeStatus = (currentUser as any)?.fee_status || (currentUser as any)?.feeStatus || 'UNPAID';
  const isPaid = liveFeeStatus === 'PAID';
  const attendanceRate = (currentUser as any)?.attendance_rate ?? (currentUser as any)?.attendanceRate ?? 100;

  // Filter live chapters by selected subject
  const visibleChapters = chapters.filter((c: any) => c.subject === selectedSubject);
  
  // When fees are cleared, enrolled chapters are unlocked for reading
  const unlockedChaptersCount = isPaid ? visibleChapters.length : visibleChapters.filter((c: any) => c.isUnlocked).length;

  const assignments = [
    { id: 1, title: 'Calculus Problem Set 4', subject: 'Mathematics', dueDate: 'Tomorrow, 5:00 PM', status: 'Pending' },
    { id: 2, title: 'Optics Lab Report', subject: 'Physics', dueDate: '22 Sep 2026', status: 'Submitted' },
    { id: 3, title: 'Organic Reaction Mechanism', subject: 'Chemistry', dueDate: '24 Sep 2026', status: 'Pending' },
  ];

  const testResults = [
    { id: 1, exam: 'Unit Test 2', score: '23/25', grade: 'A+', date: '15 Sep 2026' },
    { id: 2, exam: 'Mid-Term Evaluation', score: '45/50', grade: 'A', date: '08 Sep 2026' },
  ];

  const quickCards = [
    {
      id: 'library',
      title: 'E-Library',
      subtitle: `${unlockedChaptersCount}/${visibleChapters.length} Chapters Available`,
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
      subtitle: 'Scores & Reports',
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
                  {activeModal === 'results' && 'Academic Performance'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. E-LIBRARY (LIVE SUPABASE CHAPTERS) */}
              {activeModal === 'library' && (
                <div className="space-y-4 text-xs">
                  {/* Subject Tabs */}
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

                  {/* Chapters List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {visibleChapters.map((chap: any) => {
                      const chapterNum = chap.chapter_number ?? chap.chapterNumber ?? 1;
                      const pages = chap.total_pages ?? chap.totalPages ?? 14;
                      const canRead = isPaid || chap.isUnlocked;

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
                              Ch {chapterNum}: {chap.title}
                            </span>
                            <span className="block text-[10px] mt-0.5 text-slate-500">
                              {pages} Pages • {canRead ? 'Ready for study' : 'Locked (Payment pending)'}
                            </span>
                          </div>

                          {canRead ? (
                            <button
                              onClick={() => setActiveReadingChapter({
                                ...chap,
                                chapterNumber: chapterNum,
                                totalPages: pages,
                                pdfUrl: chap.pdf_url || chap.pdfUrl,
                              })}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                            >
                              <Eye className="w-3 h-3" /> Read
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 px-2 py-1 bg-slate-200 rounded-md text-[10px] font-semibold shrink-0">
                              <Lock className="w-3 h-3" /> Locked
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {visibleChapters.length === 0 && (
                      <p className="text-center text-slate-400 py-6 text-xs">No chapters published for this stream yet.</p>
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

              {/* 3. ATTENDANCE & DATE-WISE CALENDAR */}
              {activeModal === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Overall Record</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-0.5">{attendanceRate}%</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>

                  {/* Date-wise Present (P) / Absent (A) Calendar */}
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

              {/* 6. RESULTS */}
              {activeModal === 'results' && (
                <div className="space-y-3">
                  {testResults.map((res) => (
                    <div key={res.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{res.exam}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{res.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-600 block">{res.score}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Grade {res.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Real Canvas PDF Reader Modal with Anti-Leak Watermark */}
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