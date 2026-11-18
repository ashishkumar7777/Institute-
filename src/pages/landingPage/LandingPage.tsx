import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  CalendarCheck2, 
  ArrowRight, 
  Building2, 
  CheckCircle2,
  Lock,
  Smartphone,
  BookOpen,
  Award,
  UserCheck,
  Star
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 select-none flex flex-col justify-between">
      
      {/* Navbar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-800 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight block text-slate-900">Scholar's Academy</span>
              <span className="text-[11px] text-purple-700 font-bold uppercase tracking-wider block -mt-1">Excellence in Education</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 transition flex items-center gap-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" /> Portal Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Institute Focus */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 backdrop-blur text-purple-200">
            <GraduationCap className="w-4 h-4 text-amber-400" /> Admissions Open for 2026-27 Batch
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">Scholar's Academy</span>
          </h1>
          
          <p className="text-sm md:text-base text-purple-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Empowering students with top-tier academic coaching, expert faculty, and structured learning. Stay closely connected with your child's daily progress through our exclusive smart app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Student / Parent / Teacher Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Dedicated Teachers & Faculty Section with Names */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
            World-Class Mentorship
          </span>
          <h2 className="text-3xl font-black text-slate-900">Meet Our Expert Faculty & Subject Specialists</h2>
          <p className="text-xs text-slate-500">
            Our teachers are masters in their respective fields with strong academic backgrounds, dedicated to bringing out the best in every student.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Faculty Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                R
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Mr. Rahul Sharma</h4>
                <p className="text-[11px] text-purple-600 font-semibold">B.Sc. & M.Sc. (Mathematics)</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Expert in advanced algebra, calculus, and board exam preparation with over 8+ years of coaching experience helping students score 95+ marks.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Classes 9th to 12th Mathematics Specialist
            </div>
          </div>

          {/* Faculty Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                A
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Mr. Amit Verma</h4>
                <p className="text-[11px] text-indigo-600 font-semibold">M.Sc. Physics & B.Ed.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specialized in conceptual physics and organic chemistry. Focuses on practical problem-solving and rigorous numerical practice for school and competitive exams.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Physics & Chemistry Lead
            </div>
          </div>

          {/* Faculty Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                P
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dr. Priya Sharma</h4>
                <p className="text-[11px] text-emerald-600 font-semibold">B.Sc. Life Sciences & Ph.D.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated science mentor with deep domain knowledge in biology and general sciences, simplifying complex diagrams and concepts for students.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Biology & Science Expert
            </div>
          </div>

        </div>
      </section>

      {/* Special Feature: Parent & Student App Highlight */}
      <section className="py-12 px-6 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/30 text-purple-200 px-3 py-1 rounded border border-purple-400/30">
              Smart Mobile Companion
            </span>
            <h3 className="text-2xl md:text-3xl font-black">Now Access Everything on Our Dedicated Student & Parent App!</h3>
            <p className="text-xs md:text-sm text-purple-100/80 leading-relaxed">
              We have specially built a mobile app for students and parents. Now parents can easily track daily attendance, view monthly fee receipts (Chitta), check exam test scores, and receive instant WhatsApp alerts directly on their phones.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Daily Attendance Tracking
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Test Scorecards & Grades
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fee Payment History
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center justify-center bg-white/10 p-6 rounded-2xl border border-white/15 backdrop-blur text-center shrink-0 space-y-3">
            <Smartphone className="w-12 h-12 text-amber-300 animate-bounce" />
            <div>
              <p className="font-bold text-sm">Already a Member?</p>
              <p className="text-[11px] text-purple-200">Login with your registered mobile & PIN</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-6 bg-white text-purple-950 rounded-xl font-extrabold text-xs shadow-md hover:bg-purple-50 transition"
            >
              Open App Login
            </button>
          </div>
        </div>
      </section>

      {/* Institute & Teachers Highlights */}
      <section className="py-12 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-700">Why Scholar's Academy?</h2>
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Building Strong Foundations for Future Success</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Expert Faculty Batches</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated subject specialists guiding classes from 9th to 12th standard with result-oriented approaches.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dedicated Teachers</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our experienced educators manage batch assignments, record daily attendance, and publish exam marks directly via teacher portal.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Transparent Attendance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Parents stay fully updated with automated attendance marking and instant updates for student sessions.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Regular Unit Tests</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Frequent examinations with transparent grading and detailed performance scorecards published to the mobile app.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-800 flex items-center justify-center font-bold text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block">Scholar's Academy</span>
              <span className="text-[10px] text-slate-400">Dadri, Uttar Pradesh</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>📞 Helpline Available</span>
            <span>•</span>
            <span>Secure Student & Teacher Portal</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Scholar's Academy. All rights reserved.
        </div>
      </footer>

    </div>
  );
};