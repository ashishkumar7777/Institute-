import React, { useState } from 'react';
import { useNotice, type Notice } from '../../context/NoticeContext';
import { Megaphone, AlertCircle, ChevronRight, X } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  const { notices } = useNotice();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  if (notices.length === 0) return null;

  const latestNotice = notices[0];

  return (
    <>
      {/* Tap-able Top Broadcast Strip */}
      <div 
        onClick={() => setSelectedNotice(latestNotice)}
        className={`mx-5 -mt-4 mb-3 p-3 rounded-2xl border cursor-pointer transition active:scale-[0.98] shadow-sm flex items-center justify-between ${
          latestNotice.priority === 'urgent'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-900'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            latestNotice.priority === 'urgent' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
          }`}>
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <div className="truncate text-xs">
            <span className="font-bold flex items-center gap-1">
              {latestNotice.title}
              {notices.length > 1 && (
                <span className="text-[9px] bg-slate-200/80 text-slate-700 px-1 rounded-full font-mono">
                  +{notices.length - 1}
                </span>
              )}
            </span>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{latestNotice.message}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </div>

      {/* Notice Board Popup Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">Institute Notice Board</h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
              {notices.map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-blue-600 font-semibold mt-2">Posted by: {n.sender}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};