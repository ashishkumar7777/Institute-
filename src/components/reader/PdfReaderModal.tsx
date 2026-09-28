import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ShieldAlert } from 'lucide-react';
import { type Chapter } from '../../services/mockData';

// Safe worker loading compatible with iOS Safari & Android WebViews
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfReaderModalProps {
  chapter: Chapter;
  studentName: string;
  studentPhone: string;
  onClose: () => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  chapter,
  studentName,
  studentPhone,
  onClose,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 420) : 360
  );

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(Math.min(window.innerWidth - 32, 420));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoadError(false);
  };

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages || 1, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.0, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(0.7, s - 0.15));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none touch-manipulation"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shrink-0 pt-safe">
        <div className="flex-1 pr-3 truncate">
          <p className="text-[10px] text-blue-400 font-bold uppercase">{chapter.subject}</p>
          <h3 className="text-sm font-bold truncate">
            Ch {chapter.chapterNumber}: {chapter.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 active:bg-slate-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 w-8 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 active:bg-slate-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 ml-2 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 active:bg-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 flex flex-col items-center p-3 relative">
        {/* Anti-Piracy Watermark */}
        <div className="fixed inset-0 pointer-events-none flex flex-col justify-around items-center opacity-[0.08] z-20 overflow-hidden">
          <p className="text-2xl font-black text-white transform -rotate-25 tracking-widest uppercase">
            {studentName} • {studentPhone}
          </p>
          <p className="text-2xl font-black text-white transform -rotate-25 tracking-widest uppercase">
            {studentName} • {studentPhone}
          </p>
        </div>

        {loadError ? (
          <div className="text-center text-slate-400 my-auto p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">Document failed to load</p>
            <p className="text-xs text-slate-500 mt-1">Check network connection.</p>
          </div>
        ) : (
          <div className="shadow-2xl rounded-xl overflow-hidden bg-white max-w-full">
            <Document
              file={chapter.pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => {
                console.error("PDF load error:", err);
                setLoadError(true);
              }}
              loading={
                <div className="p-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading chapter pages...
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>

      {/* Bottom Paging Controller */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-white shrink-0 pb-safe">
        <button
          onClick={prevPage}
          disabled={pageNumber <= 1}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 active:bg-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <span className="text-xs text-slate-400 font-medium">
          Page <strong className="text-white font-mono">{pageNumber}</strong> of{' '}
          <strong className="text-slate-200 font-mono">{numPages || '...'}</strong>
        </span>

        <button
          onClick={nextPage}
          disabled={numPages === null || pageNumber >= numPages}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 active:bg-slate-700"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};  