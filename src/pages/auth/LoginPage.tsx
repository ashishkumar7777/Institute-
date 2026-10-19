import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { currentInstitute } from '../../services/mockData';
import { Phone, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithPhoneAndPin } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('9900000001');
  const [pin, setPin] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) {
      setErrorMsg('Please enter both Mobile Number and PIN');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await loginWithPhoneAndPin(phone, pin);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold">{currentInstitute.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Student & Faculty Mobile Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Secret PIN / Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN or Password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying with Database...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 mb-2">Development Direct Switch:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="flex-1 py-1.5 bg-purple-950/60 border border-purple-800/40 rounded-lg text-[10px] text-purple-300 font-bold"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="flex-1 py-1.5 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-[10px] text-emerald-300 font-bold"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => navigate('/student')}
              className="flex-1 py-1.5 bg-blue-950/60 border border-blue-800/40 rounded-lg text-[10px] text-blue-300 font-bold"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};