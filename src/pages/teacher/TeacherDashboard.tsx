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
  Lock,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Pencil,
  Trash2,
  XCircle,
  UserCheck,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  fee_status: string;
  attendance_rate: number;
  enrolled_subjects: string[];
}

interface TestResultRow {
  id: string;
  test_name: string;
  subject: string;
  total_marks: number;
  marks_obtained: number;
  grade: string;
  rank_in_batch: number;
  test_date: string;
  student_id: string;
}

type TeacherModal = 'attendance' | 'notes' | 'marks' | 'assignments' | 'fees' | 'syllabus' | 'students' | null;

const formatGoogleDrivePreviewUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url.trim();
};

const computeGrade = (obtained: number, total: number): string => {
  if (total <= 0) return 'F';
  const pct = (obtained / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

export const TeacherDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { chapters } = useLibrary();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<TeacherModal>(null);
  const [assignedStudents, setAssignedStudents] = useState<StudentProfile[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [isSavingAttendance, setIsSavingAttendance] = useState<boolean>(false);

  const teacherName = currentUser?.name || 'Prof. Rajesh Sharma';
  const teacherSubject =
    ((currentUser as any)?.enrolled_subjects && (currentUser as any).enrolled_subjects[0]) ||
    (currentUser as any)?.subject ||
    'Mathematics';

  // Live Supabase uploaded materials state
  const [dbMaterials, setDbMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Notes Edit & Delete state
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);

  // Selected student for detailed calendar inspection
  const [selectedStudentForCalendar, setSelectedStudentForCalendar] = useState<StudentProfile | null>(null);
  const [studentAttendanceHistory, setStudentAttendanceHistory] = useState<Record<string, string>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Selected student for detailed exam history inspection
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentProfile | null>(null);
  const [studentExamHistory, setStudentExamHistory] = useState<TestResultRow[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState<boolean>(false);

  // Student ID -> Micro Trend Cache: { [studentId]: { label: '+8%', type: 'up' } }
  const [studentsTrendMap, setStudentsTrendMap] = useState<Record<string, { label: string; type: 'up' | 'down' | 'same' | 'first' }>>({});

  // Dynamic Exam States
  const [examName, setExamName] = useState<string>('Unit Test 1');
  const [examTotalMarks, setExamTotalMarks] = useState<number>(100);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [marksInputState, setMarksInputState] = useState<Record<string, number>>({});
  const [isPublishingMarks, setIsPublishingMarks] = useState<boolean>(false);

  const fetchLiveMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('syllabus_materials')
        .select('*')
        .eq('subject', teacherSubject)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setDbMaterials(data);
      }
    } catch (err: any) {
      console.error('Error fetching teacher materials:', err.message);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchLiveMaterials();
  }, [teacherSubject]);

  // Combine LibraryContext chapters + live uploaded Supabase PDFs
  const contextChapters = chapters.filter((c: any) => c.subject === teacherSubject);
  const allTeacherChapters = [
    ...contextChapters.map((c: any) => ({
      id: c.id,
      title: c.title,
      chapterNumber: c.chapter_number ?? c.chapterNumber ?? 1,
      totalPages: c.total_pages ?? c.totalPages ?? '14 Pages',
      isUnlocked: c.isUnlocked ?? true,
      pdfUrl: c.pdf_url || c.pdfUrl || '',
      isDbMaterial: false,
    })),
    ...dbMaterials.map((m: any, idx: number) => ({
      id: m.id,
      title: m.chapter_title,
      chapterNumber: contextChapters.length + idx + 1,
      totalPages: m.page_count || 'Study Notes',
      isUnlocked: m.is_unlocked ?? true,
      pdfUrl: m.pdf_url || '',
      isDbMaterial: true,
    })),
  ];

  const unlockedCount = allTeacherChapters.filter((c) => c.isUnlocked).length;

  const handleToggleChapterLock = async (chap: any) => {
    const newStatus = !chap.isUnlocked;

    setDbMaterials((prev) =>
      prev.map((item) =>
        item.id === chap.id ? { ...item, is_unlocked: newStatus } : item
      )
    );

    if (chap.isDbMaterial) {
      setTogglingId(chap.id);
      try {
        const { error } = await supabase
          .from('syllabus_materials')
          .update({ is_unlocked: newStatus })
          .eq('id', chap.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to toggle lock status:', err.message);
        setDbMaterials((prev) =>
          prev.map((item) =>
            item.id === chap.id ? { ...item, is_unlocked: !newStatus } : item
          )
        );
      } finally {
        setTogglingId(null);
      }
    }
  };

  const [chapterTitle, setChapterTitle] = useState('');
  const [rawDriveUrl, setRawDriveUrl] = useState('');
  const [pageCount, setPageCount] = useState('12 Pages');
  const [isPublishingNote, setIsPublishingNote] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [uploadedNotesCount, setUploadedNotesCount] = useState(4);

  // Fetch live students & calculate micro-trends
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;

      const students = ((data as StudentProfile[]) || []).filter((s: any) => {
        if (!s.enrolled_subjects) return true;
        if (Array.isArray(s.enrolled_subjects)) {
          return s.enrolled_subjects.includes(teacherSubject);
        }
        return String(s.enrolled_subjects).includes(teacherSubject);
      });

      setAssignedStudents(students);

      const initialAttendance: Record<string, 'PRESENT' | 'ABSENT'> = {};
      const initialMarks: Record<string, number> = {};
      students.forEach((s) => {
        initialAttendance[s.id] = 'PRESENT';
        initialMarks[s.id] = Math.round(examTotalMarks * 0.75);
      });
      setAttendanceState(initialAttendance);
      setMarksInputState(initialMarks);

      // Fetch all past test results for this subject to compute micro trends
      const { data: testRows } = await supabase
        .from('test_results')
        .select('*')
        .eq('subject', teacherSubject)
        .order('test_date', { ascending: false });

      if (testRows) {
        const trendMap: Record<string, { label: string; type: 'up' | 'down' | 'same' | 'first' }> = {};
        students.forEach((s) => {
          const studentTests = testRows.filter((r) => r.student_id === s.id);
          if (studentTests.length === 0) {
            trendMap[s.id] = { label: 'New', type: 'first' };
          } else if (studentTests.length === 1) {
            trendMap[s.id] = { label: 'Baseline', type: 'first' };
          } else {
            const latestPct = (studentTests[0].marks_obtained / studentTests[0].total_marks) * 100;
            const prevPct = (studentTests[1].marks_obtained / studentTests[1].total_marks) * 100;
            const diff = Math.round(latestPct - prevPct);
            if (diff > 0) trendMap[s.id] = { label: `+${diff}%`, type: 'up' };
            else if (diff < 0) trendMap[s.id] = { label: `${diff}%`, type: 'down' };
            else trendMap[s.id] = { label: '0%', type: 'same' };
          }
        });
        setStudentsTrendMap(trendMap);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [teacherSubject]);

  useEffect(() => {
    if (assignedStudents.length > 0) {
      setMarksInputState((prev) => {
        const next: Record<string, number> = { ...prev };
        assignedStudents.forEach((s) => {
          if (next[s.id] === undefined || next[s.id] > examTotalMarks) {
            next[s.id] = Math.round(examTotalMarks * 0.75);
          }
        });
        return next;
      });
    }
  }, [examTotalMarks, assignedStudents]);

  const handleToggleStudentFee = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';

    setAssignedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, fee_status: nextStatus } : s))
    );

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fee_status: nextStatus })
        .eq('id', studentId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to update fee status:', err.message);
      alert('Error updating fee status: ' + err.message);
      await fetchStudents();
    }
  };

  const loadStudentAttendanceCalendar = async (student: StudentProfile) => {
    setSelectedStudentForCalendar(student);
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('attendance_date, status')
        .eq('student_id', student.id)
        .eq('subject', teacherSubject);

      if (error) throw error;

      const historyMap: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        historyMap[row.attendance_date] = row.status;
      });
      setStudentAttendanceHistory(historyMap);
    } catch (err: any) {
      console.error('Failed to load student attendance:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load individual student's complete test performance report
  const loadStudentPerformanceReport = async (student: StudentProfile) => {
    setSelectedStudentForReport(student);
    setIsLoadingExams(true);
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('student_id', student.id)
        .eq('subject', teacherSubject)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setStudentExamHistory(data || []);
    } catch (err: any) {
      console.error('Failed to load exam history:', err.message);
    } finally {
      setIsLoadingExams(false);
    }
  };

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

  const handlePublishExamMarks = async () => {
    if (assignedStudents.length === 0) {
      alert('No students enrolled to grade.');
      return;
    }
    if (!examName.trim()) {
      alert('Please enter a test/exam title.');
      return;
    }
    if (examTotalMarks <= 0) {
      alert('Maximum marks must be greater than zero.');
      return;
    }

    setIsPublishingMarks(true);

    try {
      const sortedStudents = [...assignedStudents].sort((a, b) => {
        const scoreA = marksInputState[a.id] ?? 0;
        const scoreB = marksInputState[b.id] ?? 0;
        return scoreB - scoreA;
      });

      const payload = sortedStudents.map((student, index) => {
        const obtained = Math.min(examTotalMarks, Math.max(0, Number(marksInputState[student.id]) || 0));
        return {
          test_name: examName.trim(),
          subject: teacherSubject,
          total_marks: examTotalMarks,
          marks_obtained: obtained,
          grade: computeGrade(obtained, examTotalMarks),
          rank_in_batch: index + 1,
          test_date: examDate,
          student_id: student.id,
          teacher_id: currentUser?.id,
        };
      });

      const { error } = await supabase.from('test_results').insert(payload);
      if (error) throw error;

      alert(`Marks for "${examName}" published successfully! Report cards and batch ranks are now live.`);
      setActiveModal(null);
      await fetchStudents();
    } catch (err: any) {
      console.error('Failed to publish marks:', err.message);
      alert('Error publishing marks: ' + err.message);
    } finally {
      setIsPublishingMarks(false);
    }
  };

  const handleStartEditMaterial = (chap: any) => {
    setEditingMaterialId(chap.id);
    setChapterTitle(chap.title);
    setRawDriveUrl(chap.pdfUrl);
    setPageCount(chap.totalPages);
    setActiveModal('notes');
  };

  const handleCancelEditMaterial = () => {
    setEditingMaterialId(null);
    setChapterTitle('');
    setRawDriveUrl('');
    setPageCount('12 Pages');
  };

  const handleDeleteMaterial = async (materialId: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"? Students will immediately lose access.`);
    if (!confirmDelete) return;

    setDeletingMaterialId(materialId);
    try {
      const { error } = await supabase
        .from('syllabus_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setDbMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err: any) {
      console.error('Failed to delete chapter notes:', err.message);
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const handlePublishDrivePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || !rawDriveUrl.trim()) {
      alert('Please enter both the chapter name and Google Drive link.');
      return;
    }

    setIsPublishingNote(true);
    setUploadSuccess(false);

    try {
      const embedUrl = formatGoogleDrivePreviewUrl(rawDriveUrl);

      if (editingMaterialId) {
        const { error } = await supabase
          .from('syllabus_materials')
          .update({
            chapter_title: chapterTitle.trim(),
            page_count: pageCount.trim() || 'Study Notes',
            pdf_url: embedUrl,
          })
          .eq('id', editingMaterialId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('syllabus_materials').insert({
          subject: teacherSubject,
          chapter_title: chapterTitle.trim(),
          page_count: pageCount.trim() || 'Study Notes',
          pdf_url: embedUrl,
          is_unlocked: true,
        });

        if (error) throw error;
        setUploadedNotesCount((prev) => prev + 1);
      }

      await fetchLiveMaterials();

      setUploadSuccess(true);
      setChapterTitle('');
      setRawDriveUrl('');
      setPageCount('12 Pages');
      setEditingMaterialId(null);

      setTimeout(() => {
        setUploadSuccess(false);
        setActiveModal('syllabus');
      }, 1200);
    } catch (err: any) {
      console.error('Save failed:', err.message);
      alert('Failed to save material: ' + err.message);
    } finally {
      setIsPublishingNote(false);
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
      subtitle: `${unlockedCount}/${allTeacherChapters.length} Unlocked`,
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
      id: 'students',
      title: 'Student Profiles',
      subtitle: `${assignedStudents.length} Enrolled • Track Performance`,
      icon: UserCheck,
      iconBg: 'bg-teal-100 text-teal-600',
      cardBg: 'bg-teal-50/60 border-teal-100',
      action: () => {
        setSelectedStudentForCalendar(null);
        setSelectedStudentForReport(null);
        setActiveModal('students');
      },
    },
    {
      id: 'notes',
      title: 'Upload Class Notes',
      subtitle: `${uploadedNotesCount} sheets pushed`,
      icon: Camera,
      iconBg: 'bg-indigo-100 text-indigo-600',
      cardBg: 'bg-indigo-50/60 border-indigo-100',
      action: () => {
        handleCancelEditMaterial();
        setActiveModal('notes');
      },
    },
    {
      id: 'marks',
      title: 'Enter Test Marks',
      subtitle: `${examName} (Out of ${examTotalMarks})`,
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

        {/* Quick Access Grid (6 Cards) */}
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

          {/* Quick Roster */}
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
                {assignedStudents.map((student) => {
                  const trend = studentsTrendMap[student.id];
                  return (
                    <div
                      key={student.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-slate-800">{student.name}</p>
                            {trend && (
                              <span
                                className={`text-[9px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5 ${
                                  trend.type === 'up'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : trend.type === 'down'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {trend.type === 'up' && '▲'}
                                {trend.type === 'down' && '▼'}
                                {trend.type === 'same' && '▬'}
                                {trend.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Attendance: {student.attendance_rate ?? 100}%</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStudentFee(student.id, student.fee_status)}
                        title="Tap to toggle fee status"
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition active:scale-95 ${
                          student.fee_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {student.fee_status}
                      </button>
                    </div>
                  );
                })}
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
                  {activeModal === 'students' && `${teacherSubject} Students Directory`}
                  {activeModal === 'notes' && (editingMaterialId ? `Edit ${teacherSubject} Class Notes` : `Upload ${teacherSubject} Class Notes`)}
                  {activeModal === 'marks' && `Grade & Rank: ${teacherSubject}`}
                  {activeModal === 'fees' && 'Fee Reminder List'}
                </h3>
                <button
                  onClick={() => {
                    handleCancelEditMaterial();
                    setSelectedStudentForCalendar(null);
                    setSelectedStudentForReport(null);
                    setActiveModal(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. SYLLABUS UNLOCKER */}
              {activeModal === 'syllabus' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-blue-900">{teacherSubject} ({allTeacherChapters.length} Chapters)</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">
                        Tap button to lock or unlock chapters for students.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleCancelEditMaterial();
                        setActiveModal('notes');
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow hover:bg-blue-700"
                    >
                      + Add New PDF
                    </button>
                  </div>
                  
                  {isLoadingMaterials ? (
                    <div className="flex justify-center py-6 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {allTeacherChapters.map((chap: any) => (
                        <div
                          key={chap.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition"
                        >
                          <div className="pr-2 flex-1 min-w-0">
                            <span className="font-bold text-slate-800 block truncate">
                              Ch {chap.chapterNumber}: {chap.title}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {chap.totalPages}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={togglingId === chap.id}
                              onClick={() => handleToggleChapterLock(chap)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition active:scale-95 shadow-xs ${
                                chap.isUnlocked
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              }`}
                            >
                              {togglingId === chap.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : chap.isUnlocked ? (
                                <>
                                  <Unlock className="w-3 h-3 text-emerald-600" />
                                  <span>Unlocked</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-rose-600" />
                                  <span>Locked</span>
                                </>
                              )}
                            </button>

                            {chap.isDbMaterial && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditMaterial(chap)}
                                  title="Edit Note Details"
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition active:scale-95"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={deletingMaterialId === chap.id}
                                  onClick={() => handleDeleteMaterial(chap.id, chap.title)}
                                  title="Delete Note"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                                >
                                  {deletingMaterialId === chap.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ATTENDANCE SUBMISSION */}
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

              {/* 3. STUDENT DIRECTORY WITH MICRO-TREND & EXAM PERFORMANCE INSPECTION */}
              {activeModal === 'students' && (
                <div className="space-y-4 text-xs">
                  {/* VIEW A: Individual Student Exam Performance History */}
                  {selectedStudentForReport ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border border-purple-100">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-purple-900 text-sm">{selectedStudentForReport.name}</span>
                            {studentsTrendMap[selectedStudentForReport.id] && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  studentsTrendMap[selectedStudentForReport.id].type === 'up'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : studentsTrendMap[selectedStudentForReport.id].type === 'down'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {studentsTrendMap[selectedStudentForReport.id].label}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-purple-700 mt-0.5">Performance Report • {teacherSubject}</p>
                        </div>
                        <button
                          onClick={() => setSelectedStudentForReport(null)}
                          className="px-2.5 py-1.5 bg-purple-200 hover:bg-purple-300 text-purple-900 font-bold rounded-xl text-[10px] transition"
                        >
                          ← Back to All
                        </button>
                      </div>

                      {isLoadingExams ? (
                        <div className="flex justify-center py-8 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : studentExamHistory.length === 0 ? (
                        <p className="text-center text-slate-400 py-6 text-xs bg-slate-50 rounded-2xl">
                          No test scores recorded yet for {selectedStudentForReport.name}.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {studentExamHistory.map((test) => {
                            const pct = Math.round((test.marks_obtained / test.total_marks) * 100);
                            return (
                              <div
                                key={test.id}
                                className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 text-xs block">{test.test_name}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {new Date(test.test_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2.5 text-right">
                                  <div>
                                    <span className="font-extrabold text-slate-800 text-xs block">
                                      {test.marks_obtained} / {test.total_marks}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 block">
                                      {pct}% • Rank #{test.rank_in_batch}
                                    </span>
                                  </div>

                                  <span
                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                      pct >= 90
                                        ? 'bg-amber-100 text-amber-800'
                                        : pct >= 80
                                        ? 'bg-slate-200 text-slate-800'
                                        : pct >= 70
                                        ? 'bg-amber-50 text-amber-900'
                                        : pct >= 50
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {test.grade}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : selectedStudentForCalendar ? (
                    /* VIEW B: Individual Student Attendance Calendar */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{selectedStudentForCalendar.name}</p>
                          <p className="text-[10px] text-slate-400">Attendance Log • {teacherSubject}</p>
                        </div>
                        <button
                          onClick={() => setSelectedStudentForCalendar(null)}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                        >
                          ← Back to All
                        </button>
                      </div>

                      {isLoadingHistory ? (
                        <div className="flex justify-center py-8 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] mb-2">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1.5 text-center">
                            {Array.from({ length: 30 }).map((_, i) => {
                              const day = i + 1;
                              const dateStr = `2026-10-${day < 10 ? '0' + day : day}`;
                              const status = studentAttendanceHistory[dateStr];

                              return (
                                <div
                                  key={day}
                                  className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition ${
                                    status === 'PRESENT'
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                      : status === 'ABSENT'
                                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-100 text-slate-400'
                                  }`}
                                  title={status ? `${dateStr}: ${status}` : `${dateStr}: No class`}
                                >
                                  <span>{day}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-center gap-4 mt-3 pt-2 border-t border-slate-100 text-[10px]">
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                            </span>
                            <span className="flex items-center gap-1 text-rose-700 font-semibold">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> No Session
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* VIEW C: Full Directory with Trend Pill & Quick Actions */
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-800 text-[11px] flex justify-between items-center">
                        <span>Tap <strong>Report</strong> to view past exams.</span>
                        <span className="font-bold">{assignedStudents.length} Students</span>
                      </div>

                      {assignedStudents.map((s) => {
                        const trend = studentsTrendMap[s.id];
                        return (
                          <div
                            key={s.id}
                            className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between"
                          >
                            <div className="pr-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                                
                                {/* Micro-Trend Indicator ahead of student's name */}
                                {trend && (
                                  <span
                                    title="Score trend compared to previous test"
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                      trend.type === 'up'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : trend.type === 'down'
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {trend.type === 'up' && '▲'}
                                    {trend.type === 'down' && '▼'}
                                    {trend.type === 'same' && '▬'}
                                    {trend.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.phone}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Performance Report Button */}
                              <button
                                type="button"
                                onClick={() => loadStudentPerformanceReport(s)}
                                title="View Previous Test Results & Rankings"
                                className="px-2 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center gap-1 hover:bg-purple-100 transition shadow-2xs"
                              >
                                <Award className="w-3 h-3 text-purple-600" />
                                <span>Report</span>
                              </button>

                              {/* Attendance Calendar Button */}
                              <button
                                type="button"
                                onClick={() => loadStudentAttendanceCalendar(s)}
                                title="View Attendance Calendar"
                                className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 hover:bg-slate-100 shadow-2xs"
                              >
                                <CalendarIcon className="w-3 h-3 text-teal-600" />
                                <span>{s.attendance_rate ?? 100}%</span>
                              </button>

                              {/* Fee Status Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStudentFee(s.id, s.fee_status)}
                                title="Click to toggle fee paid status"
                                className={`px-2 py-1.5 rounded-lg font-bold text-[10px] transition active:scale-95 shadow-2xs ${
                                  s.fee_status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                                    : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                              >
                                {s.fee_status}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 4. NOTES / SYLLABUS PDF UPLOADER */}
              {activeModal === 'notes' && (
                <form onSubmit={handlePublishDrivePdf} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900">
                    <div>
                      <p className="font-bold">
                        {editingMaterialId ? `Edit Notes (${teacherSubject})` : `Target Stream: ${teacherSubject}`}
                      </p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Paste the Google Drive PDF share link. It converts to a secured, non-downloadable reader for students.
                      </p>
                    </div>
                    {editingMaterialId && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCancelEditMaterial();
                          setActiveModal('syllabus');
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chapter Title / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ch 3: Surface Chemistry (Handwritten Notes)"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Google Drive PDF Share Link
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={rawDriveUrl}
                        onChange={(e) => setRawDriveUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Make sure file sharing is set to "Anyone with link: Viewer".
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Document Page Count / Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 14 Pages or Revision Handout"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishingNote}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition"
                  >
                    {isPublishingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving to Supabase...
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {editingMaterialId ? 'Updated Successfully!' : 'Published Successfully!'}
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        {editingMaterialId ? 'Update Notes' : `Publish Notes for ${teacherSubject}`}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 5. DYNAMIC TEST MARKS ENTRY & AUTOMATED BATCH RANKING */}
              {activeModal === 'marks' && (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 text-xs">Test Configuration ({teacherSubject})</span>
                      <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                        Auto-Ranking
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-purple-800 mb-0.5">Test Name / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Periodic Test 1 or Mid-Term Exam"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-purple-800 mb-0.5">Maximum Marks</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={examTotalMarks}
                          onChange={(e) => setExamTotalMarks(Number(e.target.value) || 100)}
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-bold text-slate-800 text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-purple-800 mb-0.5">Test Date</label>
                        <input
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-medium text-slate-700 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center text-slate-400 font-bold px-1 text-[10px] uppercase">
                      <span>Enrolled Student</span>
                      <span>Score / {examTotalMarks} (Grade)</span>
                    </div>

                    {assignedStudents.map((s) => {
                      const currentScore = marksInputState[s.id] ?? 0;
                      const grade = computeGrade(currentScore, examTotalMarks);

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition"
                        >
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.phone}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={examTotalMarks}
                              value={marksInputState[s.id] ?? ''}
                              onChange={(e) =>
                                setMarksInputState({
                                  ...marksInputState,
                                  [s.id]: Number(e.target.value),
                                })
                              }
                              className="w-16 p-1.5 text-center font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                            />
                            <span
                              className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                grade === 'A+' || grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : grade === 'B+' || grade === 'B'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {grade}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={isPublishingMarks || assignedStudents.length === 0}
                    onClick={handlePublishExamMarks}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition text-xs"
                  >
                    {isPublishingMarks ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing & Computing Ranks...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Publish & Broadcast Report Cards</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 6. FEES NUDGE */}
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
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStudentFee(s.id, s.fee_status)}
                            className="bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg text-[10px] shadow-xs"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => alert(`WhatsApp reminder sent for ${s.name}!`)}
                            className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-xs"
                          >
                            Nudge
                          </button>
                        </div>
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