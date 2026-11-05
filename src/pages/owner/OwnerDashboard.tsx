import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotice } from '../../context/NoticeContext';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { supabase } from '../../services/supabase';
import { currentInstitute } from '../../services/mockData';
import {
  DollarSign,
  Users,
  GraduationCap,
  Megaphone,
  Palette,
  ChevronRight,
  LogOut,
  X,
  Plus,
  Send,
  Building2,
  TrendingUp,
  Home,
  Settings,
  Loader2,
  AlertCircle,
  UserPlus,
  Pencil,
  Trash2,
  XCircle,
  Check,
  Search,
  Award,
  CalendarCheck2,
  BellRing
} from 'lucide-react';

type OwnerModal = 'fees' | 'teachers' | 'students' | 'notices' | 'branding' | 'directory' | null;

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  institute_id?: string;
  enrolled_subjects?: string[];
  fee_status?: 'PAID' | 'UNPAID';
  monthly_fee?: number;
  fee_cycle_date?: number;
  attendance_rate?: number;
}

interface TeacherProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  enrolled_subjects?: string[];
  subject?: string;
}

interface AttendanceLog {
  id: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT';
  subject?: string;
}

interface TestMark {
  id: string;
  subject: string;
  test_title: string;
  marks_obtained: number;
  max_marks: number;
  created_at: string;
}

const AVAILABLE_STREAMS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];

export const OwnerDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { addNotice } = useNotice();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<OwnerModal>(null);

  // Live Supabase student roster state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSendingNudges, setIsSendingNudges] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Student 360 Directory States
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentProfile | null>(null);
  const [studentAttendanceLogs, setStudentAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [studentTestMarks, setStudentTestMarks] = useState<TestMark[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Calendar Navigation State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 10, 1));

  // Student Editing & Deleting State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Faculty State
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(true);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherPhone, setNewTeacherPhone] = useState<string>('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>('Physics');
  const [newTeacherPin, setNewTeacherPin] = useState<string>('123456');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  const [instituteName, setInstituteName] = useState(currentInstitute.name);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');
  const [sendNoticeWhatsApp, setSendNoticeWhatsApp] = useState<boolean>(false);

  // Student Admission Form Fields
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('123456');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [customMonthlyFee, setCustomMonthlyFee] = useState<string>('1500');
  const [admissionFeeStatus, setAdmissionFeeStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents((data as StudentProfile[]) || []);
    } catch (err: any) {
      console.error('Failed to load students:', err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeachers((data as TeacherProfile[]) || []);
    } catch (err: any) {
      console.error('Failed to load teachers:', err.message);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadTeachers();
  }, []);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const toggleSubjectSelection = (subj: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subj)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== subj);
      } else {
        return [...prev, subj];
      }
    });
  };

  // Dynamic Financial Calculations
  const paidStudents = students.filter((s) => s.fee_status === 'PAID');
  const unpaidStudents = students.filter((s) => s.fee_status === 'UNPAID');
  const totalCollected = paidStudents.reduce((acc, curr) => acc + (Number(curr.monthly_fee) || 1500), 0);
  const totalOverdue = unpaidStudents.reduce((acc, curr) => acc + (Number(curr.monthly_fee) || 1500), 0);
  const totalExpected = totalCollected + totalOverdue;
  const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Toggle Single Student Fee Status
  const toggleFeeStatus = async (studentId: string, currentStatus?: 'PAID' | 'UNPAID') => {
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, fee_status: nextStatus } : s))
    );

    if (selectedStudentForDetail?.id === studentId) {
      setSelectedStudentForDetail((prev) => (prev ? { ...prev, fee_status: nextStatus } : null));
    }

    const { error } = await supabase
      .from('profiles')
      .update({ fee_status: nextStatus })
      .eq('id', studentId);

    if (error) {
      console.error('Fee update failed:', error.message);
      loadStudents();
    }
  };

  // MANUAL TRIGGER 1: Send Template 1 (monthly_fee_alert: 41737) to ALL students
  const handleManualBroadcastTemplate1 = async () => {
    const targets = students.filter((s) => Boolean(s.phone));
    if (targets.length === 0) {
      alert('No students found with valid mobile numbers.');
      return;
    }

    if (!window.confirm(`Trigger Template 1 (Monthly Alert) to ALL ${targets.length} students on WhatsApp?`)) return;

    setIsSendingNudges(true);
    let sentCount = 0;
    for (const student of targets) {
      try {
        const feeAmount = student.monthly_fee || 1500;
        const subject = student.enrolled_subjects?.[0] || 'Mathematics';

        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'MONTHLY_BROADCAST',
            phone: student.phone,
            studentName: student.name,
            subject: subject,
            amount: feeAmount,
            dueDate: '5th of this month'
          }
        });
        if (!error && (data?.return === true || data?.status_code === 200)) sentCount++;
      } catch (err) {}
    }

    setIsSendingNudges(false);
    alert(`Template 1 Dispatch Report:\n• Successful: ${sentCount}/${targets.length}`);
  };

  // MANUAL TRIGGER 2: Send Template 2 (fee_overdue_nudge: 41738) to ALL UNPAID students
  const handleManualBroadcastTemplate2 = async () => {
    const targets = unpaidStudents.filter((s) => Boolean(s.phone));
    if (targets.length === 0) {
      alert('All students are marked PAID. No pending dues to nudge.');
      return;
    }

    if (!window.confirm(`Trigger Template 2 (Overdue Nudge) to ${targets.length} UNPAID student(s)?`)) return;

    setIsSendingNudges(true);
    let sentCount = 0;
    for (const student of targets) {
      try {
        const feeAmount = student.monthly_fee || 1500;
        const subject = student.enrolled_subjects?.[0] || 'Mathematics';

        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'OVERDUE_NUDGE',
            phone: student.phone,
            studentName: student.name,
            subject: subject,
            amount: feeAmount
          }
        });
        if (!error && (data?.return === true || data?.status_code === 200)) sentCount++;
      } catch (err) {}
    }

    setIsSendingNudges(false);
    alert(`Template 2 Overdue Report:\n• Sent: ${sentCount}/${targets.length}`);
  };

  // MANUAL TRIGGER 3: Send Template 2 to an INDIVIDUAL student
  const handleSingleStudentNudge = async (student: StudentProfile) => {
    if (!student.phone) {
      alert('This student does not have a registered mobile number.');
      return;
    }

    if (!window.confirm(`Send Template 2 WhatsApp alert directly to ${student.name}?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          type: 'OVERDUE_NUDGE',
          phone: student.phone,
          studentName: student.name,
          subject: student.enrolled_subjects?.[0] || 'Mathematics',
          amount: student.monthly_fee || 1500
        }
      });

      if (!error && (data?.return === true || data?.status_code === 200)) {
        alert(`WhatsApp overdue nudge delivered to ${student.name}!`);
      } else {
        alert('Failed to deliver message. Check Fast2SMS logs.');
      }
    } catch (err: any) {
      alert('Error sending nudge: ' + err.message);
    }
  };

  // Notice Broadcast Handler (with Template 41741 WhatsApp option)
  const handleBroadcastNoticeSubmit = async () => {
    if (!noticeTitle.trim() || !broadcastMessage.trim()) {
      alert('Please enter headline and details.');
      return;
    }

    // 1. App banner broadcast
    addNotice(noticeTitle, broadcastMessage, noticePriority);

    // 2. WhatsApp broadcast via Template 41741
    if (sendNoticeWhatsApp) {
      const targets = students.filter((s) => Boolean(s.phone));
      let count = 0;
      for (const s of targets) {
        try {
          await supabase.functions.invoke('send-whatsapp', {
            body: {
              type: 'ANNOUNCEMENT',
              phone: s.phone,
              studentName: s.name,
              subject: noticeTitle.trim(),
              message: broadcastMessage.trim()
            }
          });
          count++;
        } catch (e) {}
      }
      alert(`Notice published on app banner & WhatsApp sent to ${count} students!`);
    } else {
      alert('Notice published to all client app banners!');
    }

    setNoticeTitle('');
    setBroadcastMessage('');
    setSendNoticeWhatsApp(false);
    setActiveModal(null);
  };

  // Open 360 Student Dossier
  const handleOpenStudentDetail = async (student: StudentProfile) => {
    setSelectedStudentForDetail(student);
    setIsLoadingDetails(true);
    setStudentAttendanceLogs([]);
    setStudentTestMarks([]);

    try {
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', student.id)
        .order('attendance_date', { ascending: false });

      if (attendanceData) {
        setStudentAttendanceLogs(attendanceData as AttendanceLog[]);
      }

      const { data: marksData } = await supabase
        .from('student_marks')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (marksData) {
        setStudentTestMarks(marksData as TestMark[]);
      }
    } catch (err: any) {
      console.error('Error fetching dossier:', err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Student Edit / Delete Handlers
  const handleStartEditStudent = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setNewStudentName(student.name);
    setNewStudentPhone(student.phone);
    setCustomMonthlyFee(String(student.monthly_fee || 1500));
    setAdmissionFeeStatus(student.fee_status || 'UNPAID');
    setSelectedSubjects(student.enrolled_subjects?.length ? student.enrolled_subjects : ['Mathematics']);
    setNewStudentPin('123456');
    setErrorMessage('');
  };

  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentPin('123456');
    setCustomMonthlyFee('1500');
    setAdmissionFeeStatus('UNPAID');
    setSelectedSubjects(['Mathematics']);
    setErrorMessage('');
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to completely remove "${studentName}"?`)) return;
    setDeletingStudentId(studentId);

    try {
      const { error } = await supabase.rpc('delete_student_account', { target_student_id: studentId });
      if (error) {
        await supabase.from('profiles').delete().eq('id', studentId);
      }
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (editingStudentId === studentId) handleCancelEditStudent();
      if (selectedStudentForDetail?.id === studentId) setSelectedStudentForDetail(null);
      alert(`Student "${studentName}" deleted successfully.`);
    } catch (err: any) {
      alert('Failed to delete student: ' + err.message);
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentPhone.trim()) {
      setErrorMessage('Please fill in Name and Phone Number.');
      return;
    }

    const assignedFee = Number(customMonthlyFee) || 1500;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingStudentId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newStudentName.trim(),
            phone: newStudentPhone.replace(/\D/g, '').slice(-10),
            enrolled_subjects: selectedSubjects,
            monthly_fee: assignedFee,
            fee_status: admissionFeeStatus
          })
          .eq('id', editingStudentId);

        if (error) throw error;
        await loadStudents();
        handleCancelEditStudent();
        alert('Student details updated successfully!');
      } else {
        const cleanPhone = newStudentPhone.replace(/\D/g, '').slice(-10);
        const { error: insertError } = await supabase.from('profiles').insert([
          {
            name: newStudentName.trim(),
            phone: cleanPhone,
            role: 'student',
            institute_id: currentUser?.institute_id || 'inst_apex_01',
            enrolled_subjects: selectedSubjects,
            monthly_fee: assignedFee,
            fee_status: admissionFeeStatus,
            fee_cycle_date: 5
          }
        ]);

        if (insertError) {
          await supabase.rpc('onboard_student', {
            p_name: newStudentName.trim(),
            p_phone: cleanPhone,
            p_pin: newStudentPin.trim() || '123456',
            p_institute_id: currentUser?.institute_id || 'inst_apex_01',
            p_enrolled_subjects: selectedSubjects,
            p_fee_status: admissionFeeStatus
          });

          await supabase.from('profiles').update({ monthly_fee: assignedFee }).eq('phone', cleanPhone);
        }

        await loadStudents();
        setNewStudentName('');
        setNewStudentPhone('');
        setNewStudentPin('123456');
        setCustomMonthlyFee('1500');
        setAdmissionFeeStatus('UNPAID');
        setSelectedSubjects(['Mathematics']);
        alert(`Student enrolled successfully!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Cards Array
  const quickCards = [
    {
      id: 'fees',
      title: 'Fee Collection',
      subtitle: `₹${(totalCollected / 1000).toFixed(0)}k collected (${collectionPercentage}%)`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBg: 'bg-emerald-50/60 border-emerald-100',
      action: () => setActiveModal('fees'),
    },
    {
      id: 'teachers',
      title: 'Faculty Overview',
      subtitle: `${teachers.length} Active specialists`,
      icon: Users,
      iconBg: 'bg-indigo-100 text-indigo-600',
      cardBg: 'bg-indigo-50/60 border-indigo-100',
      action: () => setActiveModal('teachers'),
    },
    {
      id: 'students',
      title: 'Student Roster',
      subtitle: `${students.length} Enrolled students`,
      icon: GraduationCap,
      iconBg: 'bg-blue-100 text-blue-600',
      cardBg: 'bg-blue-50/60 border-blue-100',
      action: () => setActiveModal('students'),
    },
    {
      id: 'notices',
      title: 'Broadcast Notice',
      subtitle: 'Push alert to all portals',
      icon: Megaphone,
      iconBg: 'bg-amber-100 text-amber-600',
      cardBg: 'bg-amber-50/60 border-amber-100',
      action: () => setActiveModal('notices'),
    },
    {
      id: 'branding',
      title: 'White-Label Setup',
      subtitle: 'Theme, Logo & AMC',
      icon: Palette,
      iconBg: 'bg-purple-100 text-purple-600',
      cardBg: 'bg-purple-50/60 border-purple-100',
      action: () => setActiveModal('branding'),
    },
    {
      id: 'directory',
      title: 'Student 360° Profile',
      subtitle: 'Search, Ledger & Tests',
      icon: Search,
      iconBg: 'bg-cyan-100 text-cyan-600',
      cardBg: 'bg-cyan-50/60 border-cyan-100',
      action: () => {
        setSelectedStudentForDetail(null);
        setSearchQuery('');
        setDirectoryStatusFilter('ALL');
        setActiveModal('directory');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-20 select-none">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-slate-900 px-6 pt-7 pb-10 rounded-b-[2.5rem] shadow-md text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest bg-purple-500/30 border border-purple-400/30 px-2 py-0.5 rounded font-bold">
                Director Desk
              </span>
              <h1 className="text-2xl font-bold flex items-center gap-1.5 mt-1">
                {currentUser?.name || 'Dr. Suresh Verma'} <span>🏛️</span>
              </h1>
              <p className="text-xs text-purple-200/90 mt-0.5 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {instituteName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                title="Sign Out"
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/25 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-full border-2 border-purple-300 overflow-hidden bg-white/20 flex items-center justify-center font-bold text-white shadow">
                SV
              </div>
            </div>
          </div>

          {/* Dynamic Revenue Snapshot */}
          <div className="mt-3 p-3.5 bg-white/10 backdrop-blur rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-purple-200 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Term 1 Revenue
              </span>
              <span className="font-bold text-white">
                ₹{totalCollected.toLocaleString()} / ₹{totalExpected.toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${collectionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-purple-200 font-medium">
              <span>{paidStudents.length} Paid</span>
              <span className="text-rose-300 font-bold">
                {unpaidStudents.length} Overdue (₹{totalOverdue.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Notice Banner */}
        <NoticeBanner />

        {/* Quick Tools 2x3 Grid */}
        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Executive Control</h2>
            <span className="text-xs font-semibold text-purple-600">Apex System</span>
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

          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-purple-900">Subscription & Storage</p>
              <p className="text-[11px] text-purple-700 mt-0.5">Cloudflare R2: 1.1 GB / 10 GB (₹0 Free Tier)</p>
              <p className="text-[10px] text-purple-500 mt-1">Multi-Tenant PostgreSQL • RLS Enabled</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-8 py-2.5 flex items-center justify-between fixed bottom-0 max-w-md w-full z-10 shadow-lg">
          <button className="flex flex-col items-center gap-1 text-purple-600 font-medium">
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => setActiveModal('fees')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px]">Ledger</span>
          </button>
          <button
            onClick={() => setActiveModal('teachers')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Faculty</span>
          </button>
          <button
            onClick={() => setActiveModal('branding')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>

        {/* Modals Container */}
        {activeModal && (
          <div className="absolute inset-0 bg-black/50 z-30 flex flex-col justify-end backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 pb-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
                  {activeModal === 'fees' && 'Student Fee Reconciliation'}
                  {activeModal === 'teachers' && 'Faculty Roster & Batches'}
                  {activeModal === 'students' && 'Student Admissions'}
                  {activeModal === 'notices' && 'Institute Broadcast'}
                  {activeModal === 'branding' && 'Custom White-Label Setup'}
                  {activeModal === 'directory' && (selectedStudentForDetail ? 'Student 360° Profile' : 'Student Directory & Search')}
                </h3>
                <button
                  onClick={() => {
                    handleCancelEditStudent();
                    setSelectedStudentForDetail(null);
                    setActiveModal(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. FEE RECONCILIATION */}
              {activeModal === 'fees' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{unpaidStudents.length} Overdue Students</p>
                        <p className="text-[10px] text-slate-400">Total Pending: ₹{totalOverdue.toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {paidStudents.length} / {students.length} Paid
                      </span>
                    </div>

                    {/* Both Manual Trigger Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleManualBroadcastTemplate1}
                        disabled={isSendingNudges || students.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                      >
                        {isSendingNudges ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Broadcast T1 (All)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleManualBroadcastTemplate2}
                        disabled={isSendingNudges || unpaidStudents.length === 0}
                        className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-2 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                      >
                        {isSendingNudges ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BellRing className="w-3 h-3" />
                        )}
                        <span>Nudge Unpaid (T2)</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Ledger List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800">{s.name}</p>
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                              ₹{(s.monthly_fee || 1500).toLocaleString()}/mo
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">Phone: {s.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {s.fee_status === 'UNPAID' && (
                            <button
                              type="button"
                              onClick={() => handleSingleStudentNudge(s)}
                              title="Nudge via WhatsApp"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition active:scale-95"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleFeeStatus(s.id, s.fee_status)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              s.fee_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                                : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            {s.fee_status || 'UNPAID'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. FACULTY DIRECTORY */}
              {activeModal === 'teachers' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{teachers.length} Faculty Members</p>
                      <p className="text-[10px] text-slate-400">Live PostgreSQL directory</p>
                    </div>
                    <button
                      onClick={() => setShowAddTeacherModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Teacher
                    </button>
                  </div>

                  {isLoadingTeachers ? (
                    <div className="flex justify-center py-6 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {teachers.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{t.name}</p>
                              <p className="text-[10px] text-indigo-600 font-medium">
                                {t.enrolled_subjects?.join(', ') || t.subject || 'Specialist'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-mono">{t.phone}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeacherId(t.id);
                                setNewTeacherName(t.name);
                                setNewTeacherPhone(t.phone);
                                setShowAddTeacherModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(t.id, t.name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. STUDENT ADMISSIONS (PRESETS & ENROLLED ROSTER PRESERVED) */}
              {activeModal === 'students' && (
                <div className="space-y-4 text-xs">
                  <form onSubmit={handleSaveStudent} className="p-3.5 bg-slate-50 rounded-2xl space-y-3 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800 text-sm">
                        {editingStudentId ? 'Edit Student Details' : 'Admit New Student'}
                      </p>
                      {editingStudentId && (
                        <button
                          type="button"
                          onClick={handleCancelEditStudent}
                          className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Student Full Name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-medium"
                      required
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Mobile Number"
                        value={newStudentPhone}
                        onChange={(e) => setNewStudentPhone(e.target.value)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-mono"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Login PIN"
                        value={newStudentPin}
                        onChange={(e) => setNewStudentPin(e.target.value)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-mono"
                        required
                      />
                    </div>

                    {/* Multi-Stream Selection Buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-700 text-[11px]">Enrolled Streams / Subjects</span>
                        <span className="text-[10px] text-blue-600 font-medium">Select multiple</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {AVAILABLE_STREAMS.map((subj) => {
                          const isSelected = selectedSubjects.includes(subj);
                          return (
                            <button
                              type="button"
                              key={subj}
                              onClick={() => toggleSubjectSelection(subj)}
                              className={`py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-between border transition ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <span>{subj}</span>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                  isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* MANUAL CUSTOM FEE TEXT INPUT WITH QUICK PRESETS */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Monthly Tuition Fee (Custom)</label>
                        <span className="text-[10px] text-slate-400">Enter custom amount</span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={customMonthlyFee}
                          onChange={(e) => setCustomMonthlyFee(e.target.value)}
                          placeholder="e.g. 1500 or 2500"
                          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                          required
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">Presets:</span>
                        {['1200', '1500', '2500', '3500'].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setCustomMonthlyFee(preset)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              customMonthlyFee === preset
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            ₹{preset}
                          </button>
                        ))}
                      </div>

                      {/* Initial Fee Status Selector */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600">Initial Status:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAdmissionFeeStatus('PAID')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition ${
                              admissionFeeStatus === 'PAID'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            PAID
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdmissionFeeStatus('UNPAID')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition ${
                              admissionFeeStatus === 'UNPAID'
                                ? 'bg-rose-50 border-rose-500 text-rose-700'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            UNPAID
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition disabled:opacity-50 ${
                        editingStudentId
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : editingStudentId ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Update Student Details</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Admit to Institute</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Student List with Controls */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-700">Enrolled Students ({students.length})</p>
                      {isLoadingStudents && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {students.map((s) => (
                        <div
                          key={s.id}
                          className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-[11px] border border-slate-100 hover:border-slate-200 transition"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-xs">{s.name}</span>
                              <span className="text-[9px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
                                ₹{(s.monthly_fee || 1500).toLocaleString()}/mo
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Array.isArray(s.enrolled_subjects) && s.enrolled_subjects.length > 0 ? (
                                s.enrolled_subjects.map((sub) => (
                                  <span key={sub} className="bg-blue-100/70 text-blue-700 text-[9px] px-1.5 py-0.2 rounded font-medium">
                                    {sub}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px]">General</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono text-[10px] mr-1">{s.phone}</span>

                            <button
                              type="button"
                              onClick={() => handleStartEditStudent(s)}
                              title="Edit Student"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition active:scale-95"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={deletingStudentId === s.id}
                              onClick={() => handleDeleteStudent(s.id, s.name)}
                              title="Delete Student Completely"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                            >
                              {deletingStudentId === s.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}

                      {students.length === 0 && !isLoadingStudents && (
                        <p className="text-center text-slate-400 py-3 text-[11px]">No students admitted yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BROADCAST NOTICES (WITH WHATSAPP 41741 DISPATCH) */}
              {activeModal === 'notices' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Headline / Topic</label>
                    <input
                      type="text"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="e.g. Diwali Holiday Notice"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Details</label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Classes suspended from 10th to 15th Nov..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNoticePriority('normal')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-[11px] ${
                        noticePriority === 'normal' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-slate-500'
                      }`}
                    >
                      Standard Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticePriority('urgent')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-[11px] ${
                        noticePriority === 'urgent' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white text-slate-500'
                      }`}
                    >
                      Urgent Alert ⚠️
                    </button>
                  </div>

                  {/* WhatsApp Checkbox Option */}
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendNoticeWhatsApp}
                      onChange={(e) => setSendNoticeWhatsApp(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">
                      Also send to all students via WhatsApp (Template 41741)
                    </span>
                  </label>

                  <button
                    onClick={handleBroadcastNoticeSubmit}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Broadcast Immediately
                  </button>
                </div>
              )}

              {/* 5. WHITE-LABEL SETUP */}
              {activeModal === 'branding' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institute Branding Name</label>
                    <input
                      type="text"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 space-y-1">
                    <p>Multi-Tenant Schema: <strong>Isolated RLS</strong></p>
                    <p>Zero Egress Storage: <strong>Cloudflare R2 Ready</strong></p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {/* 6. STUDENT 360° DIRECTORY (RESTORED FILTER TABS & METRIC CARDS) */}
              {activeModal === 'directory' && (
                <div className="space-y-3 text-xs">
                  {!selectedStudentForDetail ? (
                    <>
                      {/* Search Bar & Filter Tabs */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by student name or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-1.5">
                          {(['ALL', 'PAID', 'UNPAID'] as const).map((filter) => (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setDirectoryStatusFilter(filter)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${
                                directoryStatusFilter === filter
                                  ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              {filter === 'ALL' ? 'All Students' : filter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtered Student List */}
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 pt-1">
                        {students
                          .filter((s) => {
                            const q = searchQuery.toLowerCase();
                            const matchesSearch = s.name.toLowerCase().includes(q) || s.phone.includes(q);
                            const matchesFilter =
                              directoryStatusFilter === 'ALL' ? true : s.fee_status === directoryStatusFilter;
                            return matchesSearch && matchesFilter;
                          })
                          .map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleOpenStudentDetail(s)}
                              className="p-3 bg-slate-50 hover:bg-cyan-50/50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      s.fee_status === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {s.fee_status || 'UNPAID'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {s.phone} • {s.enrolled_subjects?.join(', ') || 'General'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700">
                                  ₹{(s.monthly_fee || 1500).toLocaleString()}/mo
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </div>
                            </div>
                          ))}

                        {students.filter((s) => {
                          const q = searchQuery.toLowerCase();
                          return (
                            (s.name.toLowerCase().includes(q) || s.phone.includes(q)) &&
                            (directoryStatusFilter === 'ALL' || s.fee_status === directoryStatusFilter)
                          );
                        }).length === 0 && (
                          <p className="text-center text-slate-400 py-6 text-[11px]">No matching students found.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    /* 360° STUDENT DETAIL VIEW */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDetail(null)}
                          className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                        >
                          ← Back to Directory
                        </button>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          ID: {selectedStudentForDetail.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* Header Bio Card */}
                      <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl text-white shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base">{selectedStudentForDetail.name}</h3>
                            <p className="text-[11px] text-indigo-200 font-mono">{selectedStudentForDetail.phone}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              toggleFeeStatus(selectedStudentForDetail.id, selectedStudentForDetail.fee_status)
                            }
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                              selectedStudentForDetail.fee_status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-400/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {selectedStudentForDetail.fee_status || 'UNPAID'} (Tap to toggle)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-[11px]">
                          <div>
                            <span className="text-white/60 block text-[9px] uppercase tracking-wider">
                              Custom Monthly Fee
                            </span>
                            <span className="font-bold text-white text-xs">
                              ₹{(selectedStudentForDetail.monthly_fee || 1500).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60 block text-[9px] uppercase tracking-wider">
                              Enrolled Streams
                            </span>
                            <span className="font-medium text-white truncate block">
                              {selectedStudentForDetail.enrolled_subjects?.join(', ') || 'All Streams'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isLoadingDetails ? (
                        <div className="flex justify-center py-8 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
                          
                          {/* 1. DAILY ATTENDANCE CALENDAR (EXACT STUDENT PORTAL STYLE) */}
                          {(() => {
                            const currentYear = calendarDate.getFullYear();
                            const currentMonth = calendarDate.getMonth();
                            const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

                            const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                            const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

                            const attendanceMap = new Map<string, 'PRESENT' | 'ABSENT'>();
                            studentAttendanceLogs.forEach((log) => {
                              if (log.attendance_date) {
                                attendanceMap.set(log.attendance_date, log.status);
                              }
                            });

                            const totalLogs = studentAttendanceLogs.length;
                            const presentCount = studentAttendanceLogs.filter((l) => l.status === 'PRESENT').length;
                            const absentCount = studentAttendanceLogs.filter((l) => l.status === 'ABSENT').length;
                            const overallRate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 0;

                            return (
                              <div className="space-y-3">
                                {/* Overall Record Scorecard */}
                                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                      Overall Record
                                    </span>
                                    <span className="text-2xl font-black text-emerald-950 mt-0.5 block">
                                      {overallRate}%
                                    </span>
                                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                      {presentCount} Present • {absentCount} Absent ({totalLogs} Total sessions)
                                    </p>
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
                                    <Check className="w-6 h-6 stroke-[2.5]" />
                                  </div>
                                </div>

                                {/* Calendar Card */}
                                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                                      <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                                      <span>{monthName}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Week Days Header */}
                                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 my-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                      <span key={d}>{d}</span>
                                    ))}
                                  </div>

                                  {/* Day Tiles Matrix */}
                                  <div className="grid grid-cols-7 gap-1.5">
                                    {/* Offset blanks */}
                                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                                      <div key={`blank-${i}`} className="h-9" />
                                    ))}

                                    {/* Days in Month */}
                                    {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                                      const dayNum = i + 1;
                                      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                                      const formattedDay = String(dayNum).padStart(2, '0');
                                      const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

                                      const status = attendanceMap.get(dateStr);

                                      return (
                                        <div
                                          key={dateStr}
                                          className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition ${
                                            status === 'PRESENT'
                                              ? 'bg-emerald-50 border border-emerald-400 text-emerald-800'
                                              : status === 'ABSENT'
                                              ? 'bg-rose-50 border border-rose-300 text-rose-800'
                                              : 'bg-slate-50/70 border border-slate-100 text-slate-600'
                                          }`}
                                        >
                                          <span className="text-[11px] leading-none">{dayNum}</span>
                                          {status && (
                                            <span
                                              className={`text-[8px] font-bold mt-0.5 leading-none ${
                                                status === 'PRESENT' ? 'text-emerald-600' : 'text-rose-600'
                                              }`}
                                            >
                                              {status === 'PRESENT' ? 'P' : 'A'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Status Indicator Legend */}
                                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-[10px] font-medium text-slate-500">
                                    <span className="flex items-center gap-1 text-emerald-700">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present (P)
                                    </span>
                                    <span className="flex items-center gap-1 text-rose-700">
                                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent (A)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2. ENHANCED ACADEMIC PERFORMANCE & MARKS */}
                          {(() => {
                            const totalTests = studentTestMarks.length;
                            const totalMarksObtained = studentTestMarks.reduce((acc, curr) => acc + Number(curr.marks_obtained), 0);
                            const totalMaxMarks = studentTestMarks.reduce((acc, curr) => acc + Number(curr.max_marks || 100), 0);
                            const overallAvg = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
                            const bestScore = totalTests > 0 
                              ? Math.max(...studentTestMarks.map((m) => Math.round((m.marks_obtained / (m.max_marks || 100)) * 100))) 
                              : 0;

                            return (
                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                      <Award className="w-4 h-4 text-amber-500" /> Academic Assessments & Tests
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Performance tracking</p>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      overallAvg >= 75
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : overallAvg >= 50
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {overallAvg}% Avg
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-xs">
                                    <span className="text-[8px] text-slate-400 uppercase font-semibold block">Tests Given</span>
                                    <span className="text-sm font-bold text-slate-800">{totalTests}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-xs">
                                    <span className="text-[8px] text-slate-400 uppercase font-semibold block">Overall Avg</span>
                                    <span className="text-sm font-bold text-indigo-600">{overallAvg}%</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-xs">
                                    <span className="text-[8px] text-slate-400 uppercase font-semibold block">Best Score</span>
                                    <span className="text-sm font-bold text-emerald-600">{bestScore}%</span>
                                  </div>
                                </div>

                                {totalTests === 0 ? (
                                  <div className="p-4 bg-white rounded-xl border border-slate-100 text-center space-y-1">
                                    <p className="text-slate-400 text-[11px] font-medium">No test scores recorded yet.</p>
                                    <p className="text-slate-300 text-[9px]">Add test marks to generate automated performance reports.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {studentTestMarks.map((mark, idx) => {
                                      const scorePct = Math.round((mark.marks_obtained / (mark.max_marks || 100)) * 100);
                                      return (
                                        <div
                                          key={idx}
                                          className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-1.5 shadow-xs"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <span className="font-bold text-slate-800 text-[11px] block">
                                                {mark.test_title || 'Weekly Chapter Test'}
                                              </span>
                                              <span className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                                {mark.subject}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <span className="font-bold text-xs text-slate-800">
                                                {mark.marks_obtained} <span className="text-[10px] text-slate-400">/ {mark.max_marks || 100}</span>
                                              </span>
                                              <span className={`block text-[9px] font-bold ${
                                                scorePct >= 75 ? 'text-emerald-600' : scorePct >= 50 ? 'text-amber-600' : 'text-rose-600'
                                              }`}>
                                                {scorePct}% Score
                                              </span>
                                            </div>
                                          </div>

                                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                scorePct >= 75
                                                  ? 'bg-emerald-500'
                                                  : scorePct >= 50
                                                  ? 'bg-amber-500'
                                                  : 'bg-rose-500'
                                              }`}
                                              style={{ width: `${scorePct}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        </div>
                      )}
                    </div>
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