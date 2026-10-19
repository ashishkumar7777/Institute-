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
  Check
} from 'lucide-react';

type OwnerModal = 'fees' | 'teachers' | 'students' | 'notices' | 'branding' | null;

interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  institute_id?: string;
  enrolled_subjects?: string[];
  fee_status?: 'PAID' | 'UNPAID';
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
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Student Editing & Deleting State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Live Supabase teachers state
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(true);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherPhone, setNewTeacherPhone] = useState<string>('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>('Physics');
  const [newTeacherPin, setNewTeacherPin] = useState<string>('123456');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);

  // Teacher Editing & Deleting State
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  const [instituteName, setInstituteName] = useState(currentInstitute.name);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');

  // Student Admission Form Fields (Multiple Stream Selection)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('123456');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);

  // Load students from Supabase profiles
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

  // Load teachers from Supabase profiles
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

  // Multi-subject toggle helper
  const toggleSubjectSelection = (subj: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subj)) {
        if (prev.length === 1) return prev; // Keep at least one subject selected
        return prev.filter((s) => s !== subj);
      } else {
        return [...prev, subj];
      }
    });
  };

  // Financial calculations
  const feePerStudent = 12000;
  const paidStudentsCount = students.filter((s) => s.fee_status === 'PAID').length;
  const unpaidStudentsCount = students.filter((s) => s.fee_status === 'UNPAID').length;
  const totalCollected = paidStudentsCount * feePerStudent;
  const totalExpected = (students.length || 1) * feePerStudent;
  const collectionPercentage = students.length > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Toggle fee status
  const toggleFeeStatus = async (studentId: string, currentStatus?: 'PAID' | 'UNPAID') => {
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, fee_status: nextStatus } : s))
    );

    const { error } = await supabase
      .from('profiles')
      .update({ fee_status: nextStatus })
      .eq('id', studentId);

    if (error) {
      console.error('Fee update failed:', error.message);
      loadStudents();
    }
  };

  // Student Edit / Cancel Handlers
  const handleStartEditStudent = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setNewStudentName(student.name);
    setNewStudentPhone(student.phone);
    const existingStreams = Array.isArray(student.enrolled_subjects) && student.enrolled_subjects.length > 0
      ? student.enrolled_subjects
      : ['Mathematics'];
    setSelectedSubjects(existingStreams);
    setNewStudentPin('123456');
    setErrorMessage('');
  };

  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentPin('123456');
    setSelectedSubjects(['Mathematics']);
    setErrorMessage('');
  };

  // Delete student completely
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to completely remove "${studentName}"?`);
    if (!confirmDelete) return;

    setDeletingStudentId(studentId);
    setErrorMessage('');

    try {
      const { error } = await supabase.rpc('delete_student_account', {
        target_student_id: studentId,
      });

      if (error) throw error;

      setStudents((prev) => prev.filter((s) => s.id !== studentId));

      if (editingStudentId === studentId) {
        handleCancelEditStudent();
      }
      alert(`Student "${studentName}" deleted. Mobile number can now be registered again.`);
    } catch (err: any) {
      console.error('Delete failed:', err.message);
      alert('Failed to delete student: ' + err.message);
    } finally {
      setDeletingStudentId(null);
    }
  };

  // Save or Update Student with Multi-Stream Support
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentPhone.trim()) {
      setErrorMessage('Please fill in Name and Phone Number.');
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMessage('Please select at least one stream/subject.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingStudentId) {
        const { error } = await supabase.rpc('update_student_account', {
          target_student_id: editingStudentId,
          new_name: newStudentName.trim(),
          new_phone: newStudentPhone.trim(),
          new_subjects: selectedSubjects,
          new_pin: newStudentPin.trim() || '123456',
        });

        if (error) throw error;

        await loadStudents();
        handleCancelEditStudent();
        alert('Student details, streams, and login PIN updated successfully!');
      } else {
        const instituteId = currentUser?.institute_id || 'inst_apex_01';

        const { error } = await supabase.rpc('onboard_student', {
          p_name: newStudentName.trim(),
          p_phone: newStudentPhone.trim(),
          p_pin: newStudentPin.trim() || '123456',
          p_institute_id: instituteId,
          p_enrolled_subjects: selectedSubjects,
          p_fee_status: 'PAID'
        });

        if (error) throw error;

        await loadStudents();
        setNewStudentName('');
        setNewStudentPhone('');
        setNewStudentPin('123456');
        setSelectedSubjects(['Mathematics']);
        alert(`Student enrolled successfully with subjects: ${selectedSubjects.join(', ')}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher Edit / Cancel Handlers
  const handleStartEditTeacher = (teacher: TeacherProfile) => {
    setEditingTeacherId(teacher.id);
    setNewTeacherName(teacher.name);
    setNewTeacherPhone(teacher.phone);
    const subj = Array.isArray(teacher.enrolled_subjects) && teacher.enrolled_subjects.length > 0
      ? teacher.enrolled_subjects[0]
      : teacher.subject || 'Physics';
    setNewTeacherSubject(subj);
    setNewTeacherPin('123456');
    setShowAddTeacherModal(true);
  };

  const handleCancelEditTeacher = () => {
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherPin('123456');
    setNewTeacherSubject('Physics');
    setShowAddTeacherModal(false);
  };

  // Delete Teacher
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove faculty member "${teacherName}"?`);
    if (!confirmDelete) return;

    setDeletingTeacherId(teacherId);
    try {
      const { error } = await supabase.rpc('delete_teacher_account', {
        target_teacher_id: teacherId,
      });

      if (error) throw error;

      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      alert(`Teacher "${teacherName}" removed. Phone number can now be reused.`);
    } catch (err: any) {
      console.error('Failed to delete teacher:', err.message);
      alert('Error deleting teacher: ' + err.message);
    } finally {
      setDeletingTeacherId(null);
    }
  };

  // Save or Update Teacher
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherPhone.trim()) {
      alert('Please fill in Name and Phone.');
      return;
    }

    setIsSubmittingTeacher(true);
    try {
      if (editingTeacherId) {
        const { error } = await supabase.rpc('update_teacher_account', {
          target_teacher_id: editingTeacherId,
          new_name: newTeacherName.trim(),
          new_phone: newTeacherPhone.trim(),
          new_subject: newTeacherSubject.trim(),
          new_pin: newTeacherPin.trim() || '123456',
        });

        if (error) throw error;

        alert(`Faculty profile for "${newTeacherName}" updated successfully!`);
        handleCancelEditTeacher();
        await loadTeachers();
      } else {
        const { error } = await supabase.rpc('onboard_new_teacher', {
          p_name: newTeacherName.trim(),
          p_phone: newTeacherPhone.trim(),
          p_pin: newTeacherPin.trim() || '123456',
          p_subject: newTeacherSubject.trim(),
        });

        if (error) throw error;

        alert(`Teacher ${newTeacherName} onboarded successfully! Login PIN: ${newTeacherPin}`);
        handleCancelEditTeacher();
        await loadTeachers();
      }
    } catch (err: any) {
      console.error('Failed to save teacher:', err.message);
      alert('Error saving faculty member: ' + err.message);
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

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

          {/* Revenue Snapshot */}
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
              <span>{paidStudentsCount} Paid</span>
              <span className="text-rose-300 font-bold">{unpaidStudentsCount} Overdue (₹{(unpaidStudentsCount * feePerStudent).toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Real-time Notice Banner */}
        <NoticeBanner />

        {/* Quick Tools */}
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

          {/* Infrastructure Status */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-purple-900">Subscription & Storage</p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Cloudflare R2: 1.1 GB / 10 GB (₹0 Free Tier)
              </p>
              <p className="text-[10px] text-purple-500 mt-1">
                Multi-Tenant PostgreSQL • RLS Enabled
              </p>
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
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
                  {activeModal === 'fees' && 'Student Fee Reconciliation'}
                  {activeModal === 'teachers' && 'Faculty Roster & Batches'}
                  {activeModal === 'students' && 'Student Admissions'}
                  {activeModal === 'notices' && 'Institute Broadcast'}
                  {activeModal === 'branding' && 'Custom White-Label Setup'}
                </h3>
                <button
                  onClick={() => {
                    handleCancelEditStudent();
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
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-slate-700">{unpaidStudentsCount} Overdue Payments</p>
                      <p className="text-[10px] text-slate-400">Tap status badge to toggle live status</p>
                    </div>
                    <button
                      onClick={() => alert(`WhatsApp payment links broadcasted to ${unpaidStudentsCount} parents!`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Nudge All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400">Phone: {s.phone}</p>
                        </div>
                        <button
                          onClick={() => toggleFeeStatus(s.id, s.fee_status)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                            s.fee_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                              : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          {s.fee_status || 'PAID'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. LIVE FACULTY DIRECTORY (WITH EDIT & DELETE) */}
              {activeModal === 'teachers' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{teachers.length} Faculty Members</p>
                      <p className="text-[10px] text-slate-400">Live PostgreSQL directory</p>
                    </div>
                    <button
                      onClick={() => {
                        handleCancelEditTeacher();
                        setShowAddTeacherModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Teacher
                    </button>
                  </div>

                  {isLoadingTeachers ? (
                    <div className="flex justify-center py-6 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : teachers.length === 0 ? (
                    <p className="text-center text-slate-400 py-6">No faculty found. Click &quot;Add Teacher&quot; above.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {teachers.map((t) => {
                        const subjectDisplay =
                          Array.isArray(t.enrolled_subjects) && t.enrolled_subjects.length > 0
                            ? t.enrolled_subjects.join(', ')
                            : t.subject || 'Specialist';

                        return (
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
                                <p className="text-[10px] text-indigo-600 font-medium">{subjectDisplay} Faculty</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right mr-1">
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
                                  Active
                                </span>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{t.phone}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStartEditTeacher(t)}
                                title="Edit Teacher"
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition active:scale-95"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                disabled={deletingTeacherId === t.id}
                                onClick={() => handleDeleteTeacher(t.id, t.name)}
                                title="Delete Teacher"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                              >
                                {deletingTeacherId === t.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. LIVE STUDENT ADMISSIONS (WITH MULTI-STREAM SELECTION) */}
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

                  {/* Student List */}
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
                            <span className="font-bold text-slate-800 block text-xs">{s.name}</span>
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

              {/* 4. BROADCAST NOTICES */}
              {activeModal === 'notices' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Headline</label>
                    <input
                      type="text"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="e.g. Test Series Postponed"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Details</label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type message for all students and faculty..."
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

                  <button
                    onClick={() => {
                      if (!noticeTitle.trim() || !broadcastMessage.trim()) {
                        alert('Please enter both title and message.');
                        return;
                      }
                      addNotice(noticeTitle, broadcastMessage, noticePriority);
                      alert('Notice broadcasted to all students and teachers in real time!');
                      setNoticeTitle('');
                      setBroadcastMessage('');
                      setActiveModal(null);
                    }}
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
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Theme Color</label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-300 cursor-pointer" />
                      <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-slate-300 cursor-pointer" />
                      <div className="w-8 h-8 rounded-full bg-purple-700 border-2 border-purple-400 cursor-pointer" />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 space-y-1">
                    <p>Multi-Tenant Schema: <strong>Isolated RLS</strong></p>
                    <p>Zero Egress Storage: <strong>Cloudflare R2 Ready</strong></p>
                  </div>
                  <button
                    onClick={() => {
                      alert('Branding updated across client applications!');
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Sub-Modal: Add or Edit Teacher Form */}
        {showAddTeacherModal && (
          <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    {editingTeacherId ? 'Edit Faculty Details' : 'Onboard New Faculty'}
                  </h4>
                </div>
                <button
                  onClick={handleCancelEditTeacher}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Teacher Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. H.C. Verma"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Mobile Number (Login ID)</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9871780002"
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 font-medium font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Teaching Subject</label>
                  <select
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 font-medium bg-white"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Access PIN / Password</label>
                  <input
                    type="text"
                    value={newTeacherPin}
                    onChange={(e) => setNewTeacherPin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 font-medium font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTeacher}
                  className={`w-full py-3 mt-2 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 transition ${
                    editingTeacherId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmittingTeacher ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingTeacherId ? (
                    'Update Faculty Account'
                  ) : (
                    'Confirm & Create Faculty Account'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};