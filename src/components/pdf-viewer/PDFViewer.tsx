'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use the local worker we copied to public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  file: Blob;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    };

    if (file) {
      loadPDF();
    }
  }, [file]);

  useEffect(() => {
    if (!pdf || !containerRef.current) return;

    const renderPages = async () => {
      containerRef.current!.innerHTML = ''; // Clear previous content
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        canvas.className = 'mb-8 shadow-lg mx-auto rounded-md bg-white';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context!,
          viewport: viewport,
        };

        containerRef.current?.appendChild(canvas);
        await page.render(renderContext).promise;
      }
    };

    renderPages();
  }, [pdf]);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col items-center bg-slate-100 dark:bg-slate-900/50 p-4 min-h-full"
    >
      {!pdf && <p className="mt-20 text-muted-foreground animate-pulse">Rendering PDF...</p>}
    </div>
  );
}
