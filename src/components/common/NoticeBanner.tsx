import React, { useState } from 'react';
import { useNotice } from '../../context/NoticeContext';
import { Megaphone, AlertTriangle, ChevronRight, X } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  const { latestNotice, notices } = useNotice();
  const [isOpen, setIsOpen] = useState(false);

  if (!latestNotice) return null;

  const isUrgent = latestNotice.priority === 'urgent';

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`mx-5 -mt-5 mb-1 p-3 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
          isUrgent
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
            }`}
          >
            {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs truncate">{latestNotice.title}</span>
              {notices.length > 1 && (
                <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full font-semibold">
                  +{notices.length - 1}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 truncate">{latestNotice.message}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 opacity-40 ml-2" />
      </div>

      {/* Notice List Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl max-w-md w-full p-5 max-h-[75vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-600" /> Institute Announcements
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pt-3 pr-1">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs ${
                    n.priority === 'urgent'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{n.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        n.priority === 'urgent'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1.5">
                    <span>{n.sender}</span>
                    <span>{n.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};