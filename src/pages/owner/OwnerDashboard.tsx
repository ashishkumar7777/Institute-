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
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
  Plus,
  Send,
  Building2,
  TrendingUp,
  Home,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  XCircle,
  Check,
  Search,
  Award,
  CalendarCheck2,
  BellRing,
  Receipt
} from 'lucide-react';

type OwnerModal = 'fees' | 'teachers' | 'students' | 'notices' | 'settings' | 'directory' | null;

type ThemeKey = 'purple' | 'blue' | 'emerald' | 'rose';

const THEME_PRESETS: Record<
  ThemeKey,
  {
    label: string;
    gradient: string;
    swatch: string;
    accentText: string;
    badgeBg: string;
  }
> = {
  purple: {
    label: 'Royal Purple',
    gradient: 'from-purple-800 via-indigo-700 to-slate-900',
    swatch: 'bg-purple-700',
    accentText: 'text-purple-600',
    badgeBg: 'bg-purple-500/30 border-purple-400/30',
  },
  blue: {
    label: 'Ocean Blue',
    gradient: 'from-blue-800 via-cyan-700 to-slate-900',
    swatch: 'bg-blue-700',
    accentText: 'text-blue-600',
    badgeBg: 'bg-blue-500/30 border-blue-400/30',
  },
  emerald: {
    label: 'Emerald Green',
    gradient: 'from-emerald-800 via-teal-700 to-slate-900',
    swatch: 'bg-emerald-700',
    accentText: 'text-emerald-600',
    badgeBg: 'bg-emerald-500/30 border-emerald-400/30',
  },
  rose: {
    label: 'Crimson Rose',
    gradient: 'from-rose-800 via-pink-700 to-slate-900',
    swatch: 'bg-rose-700',
    accentText: 'text-rose-600',
    badgeBg: 'bg-rose-500/30 border-rose-400/30',
  },
};

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  institute_id?: string;
  class_name?: string;
  enrolled_subjects?: string[];
  fee_status?: 'PAID' | 'UNPAID';
  monthly_fee?: number;
  fee_cycle_date?: number;
  attendance_rate?: number;
}

interface FeePaymentRecord {
  id: string;
  student_id: string;
  fee_month: string; // 'YYYY-MM'
  amount: number;
  status: 'PAID';
  payment_mode?: string;
  paid_date: string;
}

interface TeacherProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  enrolled_subjects?: string[];
  assigned_classes?: string[];
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
  test_name: string;
  marks_obtained: number;
  total_marks: number;
  grade?: string;
  rank_in_batch?: number;
  test_date: string;
}

const AVAILABLE_STREAMS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const AVAILABLE_CLASSES = ['9th', '10th', '11th', '12th'];

const getMonthKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatMonthLabel = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const OwnerDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { addNotice } = useNotice();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<OwnerModal>(null);

  // Live Supabase student roster & fee ledger state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [feePayments, setFeePayments] = useState<FeePaymentRecord[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSendingNudges, setIsSendingNudges] = useState<boolean>(false);
  const [togglingFeeStudentId, setTogglingFeeStudentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Selected Month for Fee Ledger Modal (defaults to Current Month)
  const currentMonthKey = getMonthKey(new Date());
  const [ledgerDate, setLedgerDate] = useState<Date>(new Date());
  const selectedLedgerMonthKey = getMonthKey(ledgerDate);

  // Student 360 Directory States
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentProfile | null>(null);
  const [studentAttendanceLogs, setStudentAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [studentTestMarks, setStudentTestMarks] = useState<TestMark[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Calendar Navigation State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Student Editing & Deleting State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Faculty State
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(true);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherPhone, setNewTeacherPhone] = useState<string>('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>('Mathematics');
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>(['9th', '10th']);
  const [newTeacherPin, setNewTeacherPin] = useState<string>('123456');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Settings State (Owner Name, Institute Name, Theme Color)
  const [ownerDisplayName, setOwnerDisplayName] = useState<string>(currentUser?.name || "Scholar's Director");
  const [instituteName, setInstituteName] = useState<string>(currentInstitute.name);
  const [themeColor, setThemeColor] = useState<ThemeKey>('purple');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const [noticeTitle, setNoticeTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');
  const [sendNoticeWhatsApp, setSendNoticeWhatsApp] = useState<boolean>(false);

  // Student Admission Form Fields
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('123456');
  const [selectedClass, setSelectedClass] = useState<string>('10th');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [customMonthlyFee, setCustomMonthlyFee] = useState<string>('1500');
  const [admissionFeeStatus, setAdmissionFeeStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');

  const activeTheme = THEME_PRESETS[themeColor] || THEME_PRESETS.purple;

  const loadStudentsAndFees = async () => {
    setIsLoadingStudents(true);
    try {
      const [studentsRes, paymentsRes, instRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('name', { ascending: true }),
        supabase
          .from('fee_payments')
          .select('*')
          .order('fee_month', { ascending: false }),
        supabase
          .from('institutes')
          .select('name, theme_color')
          .eq('id', currentUser?.institute_id || 'inst_apex_01')
          .single()
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents((studentsRes.data as StudentProfile[]) || []);
      if (!paymentsRes.error && paymentsRes.data) {
        setFeePayments(paymentsRes.data as FeePaymentRecord[]);
      }
      if (instRes.data?.name) {
        setInstituteName(instRes.data.name);
      }
      if (instRes.data?.theme_color && THEME_PRESETS[instRes.data.theme_color as ThemeKey]) {
        setThemeColor(instRes.data.theme_color as ThemeKey);
      }
    } catch (err: any) {
      console.error('Failed to load students & fee ledger:', err.message);
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
    if (currentUser?.name) {
      setOwnerDisplayName(currentUser.name);
    }
    loadStudentsAndFees();
    loadTeachers();
  }, [currentUser?.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerDisplayName.trim() || !instituteName.trim()) {
      alert('Please enter both Owner Name and Institute Name.');
      return;
    }

    setIsSavingSettings(true);
    try {
      // 1. Update Owner Name in profiles
      if (currentUser?.id) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ name: ownerDisplayName.trim() })
          .eq('id', currentUser.id);
        if (profileErr) throw profileErr;
      }

      // 2. Update Institute Name & Theme Color in institutes
      const { error: instErr } = await supabase
        .from('institutes')
        .update({
          name: instituteName.trim(),
          theme_color: themeColor,
        })
        .eq('id', currentUser?.institute_id || 'inst_apex_01');

      if (instErr) throw instErr;

      alert('Settings saved successfully!');
      setActiveModal(null);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

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

  const toggleTeacherClassSelection = (cls: string) => {
    setNewTeacherClasses((prev) => {
      if (prev.includes(cls)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cls);
      } else {
        return [...prev, cls];
      }
    });
  };

  // Helper: Check if a student has paid for a specific month ('YYYY-MM')
  const getStudentPaymentForMonth = (studentId: string, monthKey: string): FeePaymentRecord | undefined => {
    return feePayments.find((p) => p.student_id === studentId && p.fee_month === monthKey && p.status === 'PAID');
  };

  // TOP HEADER CALCULATIONS: Strictly Current Month Only!
  const currentMonthPaidStudents = students.filter((s) => Boolean(getStudentPaymentForMonth(s.id, currentMonthKey)));
  const currentMonthUnpaidStudents = students.filter((s) => !getStudentPaymentForMonth(s.id, currentMonthKey));
  const currentMonthCollected = currentMonthPaidStudents.reduce((acc, curr) => {
    const rec = getStudentPaymentForMonth(curr.id, currentMonthKey);
    return acc + (Number(rec?.amount) || Number(curr.monthly_fee) || 1500);
  }, 0);
  const currentMonthOverdue = currentMonthUnpaidStudents.reduce(
    (acc, curr) => acc + (Number(curr.monthly_fee) || 1500),
    0
  );
  const currentMonthExpected = currentMonthCollected + currentMonthOverdue;
  const currentMonthPercentage =
    currentMonthExpected > 0 ? Math.round((currentMonthCollected / currentMonthExpected) * 100) : 0;

  // LEDGER MODAL CALCULATIONS: For Selected Month (selectedLedgerMonthKey)
  const ledgerPaidStudents = students.filter((s) => Boolean(getStudentPaymentForMonth(s.id, selectedLedgerMonthKey)));
  const ledgerUnpaidStudents = students.filter((s) => !getStudentPaymentForMonth(s.id, selectedLedgerMonthKey));
  const ledgerCollected = ledgerPaidStudents.reduce((acc, curr) => {
    const rec = getStudentPaymentForMonth(curr.id, selectedLedgerMonthKey);
    return acc + (Number(rec?.amount) || Number(curr.monthly_fee) || 1500);
  }, 0);
  const ledgerOverdue = ledgerUnpaidStudents.reduce((acc, curr) => acc + (Number(curr.monthly_fee) || 1500), 0);

  // Toggle Paid <-> Unpaid for a Specific Month (with Mistake Revert Confirmation)
  const toggleMonthFeeStatus = async (student: StudentProfile, monthKey: string) => {
    const existingRecord = getStudentPaymentForMonth(student.id, monthKey);
    const monthLabel = formatMonthLabel(monthKey);
    const feeAmount = Number(student.monthly_fee) || 1500;

    if (existingRecord) {
      const confirmed = window.confirm(
        `Revert payment for ${student.name} (${monthLabel})?\n\nThis will mark ${monthLabel} as UNPAID again.`
      );
      if (!confirmed) return;

      setTogglingFeeStudentId(student.id);
      try {
        const { error } = await supabase
          .from('fee_payments')
          .delete()
          .eq('id', existingRecord.id);

        if (error) throw error;

        setFeePayments((prev) => prev.filter((p) => p.id !== existingRecord.id));

        if (monthKey === currentMonthKey) {
          await supabase.from('profiles').update({ fee_status: 'UNPAID' }).eq('id', student.id);
          setStudents((prev) =>
            prev.map((s) => (s.id === student.id ? { ...s, fee_status: 'UNPAID' } : s))
          );
        }
      } catch (err: any) {
        alert('Failed to revert payment: ' + err.message);
      } finally {
        setTogglingFeeStudentId(null);
      }
    } else {
      setTogglingFeeStudentId(student.id);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('fee_payments')
          .upsert(
            {
              student_id: student.id,
              institute_id: currentUser?.institute_id || 'inst_apex_01',
              fee_month: monthKey,
              amount: feeAmount,
              status: 'PAID',
              payment_mode: 'CASH/UPI',
              paid_date: todayStr
            },
            { onConflict: 'student_id,fee_month' }
          )
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setFeePayments((prev) => [
            data as FeePaymentRecord,
            ...prev.filter((p) => !(p.student_id === student.id && p.fee_month === monthKey))
          ]);
        }

        if (monthKey === currentMonthKey) {
          await supabase.from('profiles').update({ fee_status: 'PAID' }).eq('id', student.id);
          setStudents((prev) =>
            prev.map((s) => (s.id === student.id ? { ...s, fee_status: 'PAID' } : s))
          );
        }
      } catch (err: any) {
        alert('Failed to record payment: ' + err.message);
      } finally {
        setTogglingFeeStudentId(null);
      }
    }
  };

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

  const handleManualBroadcastTemplate2 = async () => {
    const targets = ledgerUnpaidStudents.filter((s) => Boolean(s.phone));
    if (targets.length === 0) {
      alert(`All students are marked PAID for ${formatMonthLabel(selectedLedgerMonthKey)}.`);
      return;
    }

    if (!window.confirm(`Trigger Template 2 (Overdue Nudge) to ${targets.length} UNPAID student(s) for ${formatMonthLabel(selectedLedgerMonthKey)}?`)) return;

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

  const handleBroadcastNoticeSubmit = async () => {
    if (!noticeTitle.trim() || !broadcastMessage.trim()) {
      alert('Please enter headline and details.');
      return;
    }

    addNotice(noticeTitle, broadcastMessage, noticePriority);

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
        .from('test_results')
        .select('*')
        .eq('student_id', student.id)
        .order('test_date', { ascending: false });

      if (marksData) {
        setStudentTestMarks(marksData as TestMark[]);
      }
    } catch (err: any) {
      console.error('Error fetching dossier:', err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Teacher Add / Edit / Delete Handlers
  const handleResetTeacherForm = () => {
    setShowAddTeacherModal(false);
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherSubject('Mathematics');
    setNewTeacherClasses(['9th', '10th']);
    setNewTeacherPin('123456');
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherPhone.trim()) {
      alert('Please enter teacher name and mobile number.');
      return;
    }

    const cleanPhone = newTeacherPhone.replace(/\D/g, '').slice(-10);
    setIsSubmittingTeacher(true);

    try {
      if (editingTeacherId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newTeacherName.trim(),
            phone: cleanPhone,
            enrolled_subjects: [newTeacherSubject],
            assigned_classes: newTeacherClasses,
          })
          .eq('id', editingTeacherId);

        if (error) throw error;

        await supabase.rpc('update_student_credentials', {
          p_user_id: editingTeacherId,
          p_new_phone: cleanPhone,
          p_new_pin: newTeacherPin.trim() || null,
        });

        alert('Faculty details & assigned classes updated!');
      } else {
        const { error: rpcError } = await supabase.rpc('onboard_teacher', {
          p_name: newTeacherName.trim(),
          p_phone: cleanPhone,
          p_pin: newTeacherPin.trim() || '123456',
          p_institute_id: currentUser?.institute_id || 'inst_apex_01',
          p_subject: newTeacherSubject,
        });

        if (rpcError) {
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              name: newTeacherName.trim(),
              phone: cleanPhone,
              role: 'teacher',
              institute_id: currentUser?.institute_id || 'inst_apex_01',
              enrolled_subjects: [newTeacherSubject],
              assigned_classes: newTeacherClasses,
            },
          ]);
          if (insertError) throw insertError;
        } else {
          await supabase
            .from('profiles')
            .update({ assigned_classes: newTeacherClasses })
            .eq('phone', cleanPhone);
        }

        alert(`Faculty "${newTeacherName.trim()}" added for ${newTeacherClasses.join(', ')} ${newTeacherSubject}!`);
      }

      await loadTeachers();
      handleResetTeacherForm();
    } catch (err: any) {
      alert('Failed to save teacher: ' + err.message);
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${teacherName}" from faculty?`)) return;
    setDeletingTeacherId(teacherId);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', teacherId);
      if (error) throw error;
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      alert(`Faculty "${teacherName}" removed.`);
    } catch (err: any) {
      alert('Failed to delete faculty: ' + err.message);
    } finally {
      setDeletingTeacherId(null);
    }
  };

  // Student Edit / Delete Handlers
  const handleStartEditStudent = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setNewStudentName(student.name);
    setNewStudentPhone(student.phone);
    setSelectedClass(student.class_name || '10th');
    setCustomMonthlyFee(String(student.monthly_fee || 1500));
    setAdmissionFeeStatus(getStudentPaymentForMonth(student.id, currentMonthKey) ? 'PAID' : 'UNPAID');
    setSelectedSubjects(student.enrolled_subjects?.length ? student.enrolled_subjects : ['Mathematics']);
    setNewStudentPin('');
    setErrorMessage('');
  };

  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentPin('123456');
    setSelectedClass('10th');
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
      setFeePayments((prev) => prev.filter((p) => p.student_id !== studentId));
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
    const cleanPhone = newStudentPhone.replace(/\D/g, '').slice(-10);
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingStudentId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newStudentName.trim(),
            phone: cleanPhone,
            class_name: selectedClass,
            enrolled_subjects: selectedSubjects,
            monthly_fee: assignedFee,
            fee_status: admissionFeeStatus
          })
          .eq('id', editingStudentId);

        if (error) throw error;

        if (admissionFeeStatus === 'PAID') {
          await supabase.from('fee_payments').upsert(
            {
              student_id: editingStudentId,
              institute_id: currentUser?.institute_id || 'inst_apex_01',
              fee_month: currentMonthKey,
              amount: assignedFee,
              status: 'PAID',
              paid_date: new Date().toISOString().split('T')[0]
            },
            { onConflict: 'student_id,fee_month' }
          );
        } else {
          await supabase
            .from('fee_payments')
            .delete()
            .eq('student_id', editingStudentId)
            .eq('fee_month', currentMonthKey);
        }

        await supabase.rpc('update_student_credentials', {
          p_user_id: editingStudentId,
          p_new_phone: cleanPhone,
          p_new_pin: newStudentPin.trim() || null,
        });

        await loadStudentsAndFees();
        handleCancelEditStudent();
        alert('Student details & login credentials updated successfully!');
      } else {
        await supabase.rpc('onboard_student', {
          p_name: newStudentName.trim(),
          p_phone: cleanPhone,
          p_pin: newStudentPin.trim() || '123456',
          p_institute_id: currentUser?.institute_id || 'inst_apex_01',
          p_enrolled_subjects: selectedSubjects,
          p_fee_status: admissionFeeStatus
        });

        const { data: createdProfile } = await supabase
          .from('profiles')
          .update({ monthly_fee: assignedFee, class_name: selectedClass })
          .eq('phone', cleanPhone)
          .select()
          .single();

        if (createdProfile && admissionFeeStatus === 'PAID') {
          await supabase.from('fee_payments').upsert(
            {
              student_id: createdProfile.id,
              institute_id: currentUser?.institute_id || 'inst_apex_01',
              fee_month: currentMonthKey,
              amount: assignedFee,
              status: 'PAID',
              paid_date: new Date().toISOString().split('T')[0]
            },
            { onConflict: 'student_id,fee_month' }
          );
        }

        await loadStudentsAndFees();
        setNewStudentName('');
        setNewStudentPhone('');
        setNewStudentPin('123456');
        setSelectedClass('10th');
        setCustomMonthlyFee('1500');
        setAdmissionFeeStatus('UNPAID');
        setSelectedSubjects(['Mathematics']);
        alert(`Student enrolled successfully in ${selectedClass} Class!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickCards = [
    {
      id: 'fees',
      title: 'Fee Ledger & History',
      subtitle: `₹${(currentMonthCollected / 1000).toFixed(1)}k this month (${currentMonthPercentage}%)`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBg: 'bg-emerald-50/60 border-emerald-100',
      action: () => {
        setLedgerDate(new Date());
        setActiveModal('fees');
      },
    },
    {
      id: 'teachers',
      title: 'Faculty Overview',
      subtitle: `${teachers.length} Active specialists`,
      icon: Users,
      iconBg: 'bg-indigo-100 text-indigo-600',
      cardBg: 'bg-indigo-50/60 border-indigo-100',
      action: () => {
        handleResetTeacherForm();
        setActiveModal('teachers');
      },
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
    {
      id: 'settings',
      title: 'Institute Settings',
      subtitle: 'Name, Owner & Theme',
      icon: Settings,
      iconBg: 'bg-slate-200 text-slate-700',
      cardBg: 'bg-slate-50 border-slate-200',
      action: () => setActiveModal('settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-20 select-none">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Top Header: Dynamic Theme Color & Current Month Collection */}
        <div className={`bg-gradient-to-r ${activeTheme.gradient} px-6 pt-7 pb-10 rounded-b-[2.5rem] shadow-md text-white transition-all duration-300`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-[10px] uppercase tracking-widest ${activeTheme.badgeBg} border px-2 py-0.5 rounded font-bold`}>
                Director Desk
              </span>
              <h1 className="text-2xl font-bold flex items-center gap-1.5 mt-1">
                {ownerDisplayName} <span>🏛️</span>
              </h1>
              <p className="text-xs text-white/80 mt-0.5 font-medium flex items-center gap-1">
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
              <div className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden bg-white/20 flex items-center justify-center font-bold text-white shadow">
                {getInitials(ownerDisplayName)}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3.5 bg-white/10 backdrop-blur rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/80 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {formatMonthLabel(currentMonthKey)} Collection
              </span>
              <span className="font-bold text-white">
                ₹{currentMonthCollected.toLocaleString()} / ₹{currentMonthExpected.toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentMonthPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/80 font-medium">
              <span>{currentMonthPaidStudents.length} Paid</span>
              <span className="text-rose-300 font-bold">
                {currentMonthUnpaidStudents.length} Due (₹{currentMonthOverdue.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        <NoticeBanner />

        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Executive Control</h2>
            <span className={`text-xs font-semibold ${activeTheme.accentText}`}>{instituteName}</span>
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
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-8 py-2.5 flex items-center justify-between fixed bottom-0 max-w-md w-full z-10 shadow-lg">
          <button
            onClick={() => setActiveModal(null)}
            className={`flex flex-col items-center gap-1 ${activeTheme.accentText} font-medium`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => {
              setLedgerDate(new Date());
              setActiveModal('fees');
            }}
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
            onClick={() => setActiveModal('settings')}
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
                  {activeModal === 'fees' && 'Monthly Fee Ledger'}
                  {activeModal === 'teachers' && 'Faculty Roster & Batches'}
                  {activeModal === 'students' && 'Student Admissions'}
                  {activeModal === 'notices' && 'Institute Broadcast'}
                  {activeModal === 'settings' && 'Institute & Theme Settings'}
                  {activeModal === 'directory' && (selectedStudentForDetail ? 'Student 360° Profile' : 'Student Directory & Search')}
                </h3>
                <button
                  onClick={() => {
                    handleCancelEditStudent();
                    handleResetTeacherForm();
                    setSelectedStudentForDetail(null);
                    setActiveModal(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. MONTH-BY-MONTH FEE LEDGER */}
              {activeModal === 'fees' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-3 py-2.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() =>
                        setLedgerDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                      className="p-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-center">
                      <p className="font-bold text-indigo-950 text-xs">
                        {formatMonthLabel(selectedLedgerMonthKey)}
                      </p>
                      <p className="text-[10px] text-indigo-600 font-semibold">
                        {selectedLedgerMonthKey === currentMonthKey ? 'Current Billing Month' : 'Historical Ledger'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setLedgerDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                      className="p-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-emerald-700">
                          Collected: ₹{ledgerCollected.toLocaleString()} ({ledgerPaidStudents.length} Paid)
                        </p>
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          Pending Due: ₹{ledgerOverdue.toLocaleString()} ({ledgerUnpaidStudents.length} Unpaid)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {ledgerPaidStudents.length} / {students.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleManualBroadcastTemplate1}
                        disabled={isSendingNudges || students.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                      >
                        {isSendingNudges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Broadcast T1 (All)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleManualBroadcastTemplate2}
                        disabled={isSendingNudges || ledgerUnpaidStudents.length === 0}
                        className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-2 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                      >
                        {isSendingNudges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3 h-3" />}
                        <span>Nudge Unpaid (T2)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {students.map((s) => {
                      const paymentRec = getStudentPaymentForMonth(s.id, selectedLedgerMonthKey);
                      const isMonthPaid = Boolean(paymentRec);
                      const isToggling = togglingFeeStudentId === s.id;

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-800">{s.name}</p>
                              {s.class_name && (
                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                  {s.class_name}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                                ₹{(paymentRec?.amount || s.monthly_fee || 1500).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {isMonthPaid && paymentRec?.paid_date
                                ? `Paid on ${new Date(paymentRec.paid_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}`
                                : `Phone: ${s.phone}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isMonthPaid && (
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
                              type="button"
                              disabled={isToggling}
                              onClick={() => toggleMonthFeeStatus(s, selectedLedgerMonthKey)}
                              title={isMonthPaid ? 'Tap to revert back to UNPAID' : 'Tap to mark PAID'}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition flex items-center gap-1 ${
                                isMonthPaid
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                                  : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-700'
                              }`}
                            >
                              {isToggling && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                              <span>{isMonthPaid ? 'PAID ✓' : 'UNPAID'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. FACULTY DIRECTORY */}
              {activeModal === 'teachers' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{teachers.length} Faculty Members</p>
                      <p className="text-[10px] text-slate-400">Assign subjects & classes</p>
                    </div>
                    {!showAddTeacherModal && (
                      <button
                        onClick={() => {
                          setEditingTeacherId(null);
                          setNewTeacherName('');
                          setNewTeacherPhone('');
                          setNewTeacherSubject('Mathematics');
                          setNewTeacherClasses(['9th', '10th']);
                          setNewTeacherPin('123456');
                          setShowAddTeacherModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Teacher
                      </button>
                    )}
                  </div>

                  {showAddTeacherModal && (
                    <form onSubmit={handleSaveTeacher} className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-indigo-900 text-xs">
                          {editingTeacherId ? 'Edit Faculty Details' : 'Add New Faculty Specialist'}
                        </p>
                        <button
                          type="button"
                          onClick={handleResetTeacherForm}
                          className="text-[10px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-0.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Teacher Full Name (e.g. Rahul Sir)"
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Mobile Number"
                          value={newTeacherPhone}
                          onChange={(e) => setNewTeacherPhone(e.target.value)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder={editingTeacherId ? 'New PIN (Optional)' : 'Login PIN (6 digits)'}
                          value={newTeacherPin}
                          onChange={(e) => setNewTeacherPin(e.target.value)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500"
                          required={!editingTeacherId}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Assigned Subject</label>
                        <select
                          value={newTeacherSubject}
                          onChange={(e) => setNewTeacherSubject(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          {AVAILABLE_STREAMS.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-700">Assigned Classes / Batches</label>
                          <span className="text-[9px] text-indigo-600 font-semibold">Select 1 or more</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {AVAILABLE_CLASSES.map((cls) => {
                            const isSelected = newTeacherClasses.includes(cls);
                            return (
                              <button
                                type="button"
                                key={cls}
                                onClick={() => toggleTeacherClassSelection(cls)}
                                className={`py-2 rounded-xl font-bold text-[11px] border transition flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                <span>{cls}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTeacher}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingTeacher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>{editingTeacherId ? 'Update Faculty' : 'Save & Create Faculty Login'}</span>
                      </button>
                    </form>
                  )}

                  {isLoadingTeachers ? (
                    <div className="flex justify-center py-6 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {teachers.map((t) => {
                        const classesList = t.assigned_classes?.length ? t.assigned_classes : ['All'];
                        return (
                          <div
                            key={t.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{t.name}</p>
                                <p className="text-[10px] text-indigo-600 font-semibold">
                                  {t.enrolled_subjects?.join(', ') || t.subject || 'Specialist'}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {classesList.map((cls) => (
                                    <span
                                      key={cls}
                                      className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded"
                                    >
                                      {cls === 'All' ? 'All Classes' : `${cls} Class`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] text-slate-400 font-mono mr-1">{t.phone}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeacherId(t.id);
                                  setNewTeacherName(t.name);
                                  setNewTeacherPhone(t.phone);
                                  setNewTeacherSubject(t.enrolled_subjects?.[0] || t.subject || 'Mathematics');
                                  setNewTeacherClasses(t.assigned_classes?.length ? t.assigned_classes : ['9th', '10th', '11th', '12th']);
                                  setNewTeacherPin('');
                                  setShowAddTeacherModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={deletingTeacherId === t.id}
                                onClick={() => handleDeleteTeacher(t.id, t.name)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. STUDENT ADMISSIONS */}
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
                        placeholder={editingStudentId ? 'New PIN (Optional)' : 'Login PIN'}
                        value={newStudentPin}
                        onChange={(e) => setNewStudentPin(e.target.value)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-mono"
                        required={!editingStudentId}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-700 text-[11px]">Student Class / Grade</span>
                        <span className="text-[10px] text-indigo-600 font-medium">Controls E-Library</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {AVAILABLE_CLASSES.map((cls) => (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={`py-2 rounded-xl font-bold text-[11px] border transition ${
                              selectedClass === cls
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

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

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {formatMonthLabel(currentMonthKey)} Fee:
                        </span>
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs">{s.name}</span>
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded">
                                {s.class_name || '10th'}
                              </span>
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
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BROADCAST NOTICES */}
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

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendNoticeWhatsApp}
                      onChange={(e) => setSendNoticeWhatsApp(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">
                      Also send to all students via WhatsApp
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

              {/* 5. INSTITUTE & THEME SETTINGS */}
              {activeModal === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owner / Director Name</label>
                    <input
                      type="text"
                      value={ownerDisplayName}
                      onChange={(e) => setOwnerDisplayName(e.target.value)}
                      placeholder="e.g. Ashish Kumar"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institute Name</label>
                    <input
                      type="text"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      placeholder="e.g. Scholar's Academy"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Dashboard Theme Color</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(THEME_PRESETS) as ThemeKey[]).map((key) => {
                        const item = THEME_PRESETS[key];
                        const isSelected = themeColor === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setThemeColor(key)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-[11px] transition ${
                              isSelected
                                ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full ${item.swatch} inline-block shadow-xs`} />
                              {item.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className={`w-full py-3 bg-gradient-to-r ${activeTheme.gradient} text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99]`}
                  >
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Settings</span>
                  </button>
                </form>
              )}

              {/* 6. STUDENT 360° DIRECTORY (WITH COMPLETE FEE RECEIPT HISTORY) */}
              {activeModal === 'directory' && (
                <div className="space-y-3 text-xs">
                  {!selectedStudentForDetail ? (
                    <>
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
                              {filter === 'ALL' ? 'All Students' : `${filter} (${formatMonthLabel(currentMonthKey).split(' ')[0]})`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 pt-1">
                        {students
                          .filter((s) => {
                            const q = searchQuery.toLowerCase();
                            const matchesSearch = s.name.toLowerCase().includes(q) || s.phone.includes(q);
                            const isPaidNow = Boolean(getStudentPaymentForMonth(s.id, currentMonthKey));
                            const matchesFilter =
                              directoryStatusFilter === 'ALL'
                                ? true
                                : directoryStatusFilter === 'PAID'
                                ? isPaidNow
                                : !isPaidNow;
                            return matchesSearch && matchesFilter;
                          })
                          .map((s) => {
                            const isPaidNow = Boolean(getStudentPaymentForMonth(s.id, currentMonthKey));
                            return (
                              <div
                                key={s.id}
                                onClick={() => handleOpenStudentDetail(s)}
                                className="p-3 bg-slate-50 hover:bg-cyan-50/50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                                      {s.class_name || '10th'}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                        isPaidNow
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-rose-100 text-rose-700'
                                      }`}
                                    >
                                      {isPaidNow ? 'PAID' : 'DUE'}
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
                            );
                          })}
                      </div>
                    </>
                  ) : (
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

                      {(() => {
                        const isPaidCurrentMonth = Boolean(
                          getStudentPaymentForMonth(selectedStudentForDetail.id, currentMonthKey)
                        );
                        const studentLedger = feePayments.filter(
                          (p) => p.student_id === selectedStudentForDetail.id
                        );

                        return (
                          <>
                            <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl text-white shadow-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base">{selectedStudentForDetail.name}</h3>
                                    <span className="text-[10px] font-bold bg-indigo-500/40 border border-indigo-400/40 px-2 py-0.5 rounded">
                                      {selectedStudentForDetail.class_name || '10th'} Class
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-indigo-200 font-mono">{selectedStudentForDetail.phone}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleMonthFeeStatus(selectedStudentForDetail, currentMonthKey)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                                    isPaidCurrentMonth
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30 hover:bg-rose-500/30'
                                  }`}
                                >
                                  {formatMonthLabel(currentMonthKey).split(' ')[0]}: {isPaidCurrentMonth ? 'PAID' : 'DUE'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-[11px]">
                                <div>
                                  <span className="text-white/60 block text-[9px] uppercase tracking-wider">
                                    Monthly Fee
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

                            {/* Month-by-Month Fee Receipt History */}
                            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  <Receipt className="w-4 h-4 text-emerald-600" /> Fee Payment History (Chitta)
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {studentLedger.length} Month(s) Paid
                                </span>
                              </div>

                              {studentLedger.length === 0 ? (
                                <p className="text-[11px] text-slate-400 bg-white p-3 rounded-xl border border-slate-100 text-center">
                                  No fee payments recorded yet.
                                </p>
                              ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {studentLedger.map((rec) => (
                                    <div
                                      key={rec.id}
                                      className="p-2 bg-white rounded-xl border border-emerald-100 flex items-center justify-between text-[11px]"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-800 block">
                                          {formatMonthLabel(rec.fee_month)}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          Paid on {new Date(rec.paid_date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        ₹{Number(rec.amount).toLocaleString()} PAID
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {isLoadingDetails ? (
                        <div className="flex justify-center py-8 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
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
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                                      Attendance Rate
                                    </span>
                                    <span className="text-xl font-black text-slate-900 mt-0.5 block">
                                      {overallRate}%
                                    </span>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {presentCount} Present • {absentCount} Absent
                                    </p>
                                  </div>
                                  <CalendarCheck2 className="w-6 h-6 text-emerald-600" />
                                </div>

                                <div className="p-3 bg-white rounded-2xl border border-slate-200">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="font-bold text-slate-800 text-xs">{monthName}</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 my-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                      <span key={d}>{d}</span>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                                      <div key={`blank-${i}`} className="h-8" />
                                    ))}

                                    {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                                      const dayNum = i + 1;
                                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                      const status = attendanceMap.get(dateStr);

                                      return (
                                        <div
                                          key={dateStr}
                                          className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold ${
                                            status === 'PRESENT'
                                              ? 'bg-emerald-50 border border-emerald-400 text-emerald-800'
                                              : status === 'ABSENT'
                                              ? 'bg-rose-50 border border-rose-300 text-rose-800'
                                              : 'bg-slate-50 border border-slate-100 text-slate-500'
                                          }`}
                                        >
                                          <span>{dayNum}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Test Results */}
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-500" /> Test Scores ({studentTestMarks.length})
                            </span>
                            {studentTestMarks.length === 0 ? (
                              <p className="text-slate-400 text-[11px] text-center py-2">No test scores recorded yet.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {studentTestMarks.map((mark, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                                    <div>
                                      <span className="font-bold text-slate-800 block">{mark.test_name}</span>
                                      <span className="text-[9px] text-indigo-600">{mark.subject}</span>
                                    </div>
                                    <span className="font-bold text-slate-800">
                                      {mark.marks_obtained}/{mark.total_marks}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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

