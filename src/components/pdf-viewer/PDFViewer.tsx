'use client';

import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFPage } from './PDFPage';
import { useHotspotStore } from '@/lib/store';
import { MousePointer2, PenTool } from 'lucide-react';

// Use the local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  file: Blob;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);
  const { mode, setMode } = useHotspotStore();

  useEffect(() => {
    const loadPDF = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);

      const loadedPages: pdfjsLib.PDFPageProxy[] = [];
      for (let i = 1; i <= loadedPdf.numPages; i++) {
        const page = await loadedPdf.getPage(i);
        loadedPages.push(page);
      }
      setPages(loadedPages);
    };

    if (file) {
      loadPDF();
    }
  }, [file]);

  return (
    <div className="relative flex flex-col items-center bg-slate-100 dark:bg-slate-900/50 p-4 min-h-full pb-24">
      {/* Mode Toggle */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white dark:bg-slate-800 shadow-2xl rounded-full p-1 border border-slate-200 dark:border-slate-700 backdrop-blur-md">
        <button
          onClick={() => setMode('read')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
            mode === 'read' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <MousePointer2 className="w-4 h-4" />
          <span className="text-sm font-medium">Read Mode</span>
        </button>
        <button
          onClick={() => setMode('mark')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
            mode === 'mark' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span className="text-sm font-medium">Mark Mode</span>
        </button>
      </div>

      {!pdf ? (
        <div className="flex flex-col items-center mt-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Analyzing Document...</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-4">
          {pages.map((page, index) => (
            <PDFPage key={index} page={page} pageNumber={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
