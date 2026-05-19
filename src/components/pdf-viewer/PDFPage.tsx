'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CanvasOverlay } from './CanvasOverlay';

interface PDFPageProps {
  page: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  scale?: number;
}

export function PDFPage({ page, pageNumber, scale = 1.5 }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let renderTask: any = null;
    let isActive = true;

    const renderPage = async () => {
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      setDimensions({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      try {
        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (isActive) {
          setIsRendered(true);
        }
      } catch (error: any) {
        if (error?.name === 'RenderingCancelledException') {
          // Expected when component unmounts or re-renders
        } else {
          console.error('Error rendering page:', error);
        }
      }
    };

    renderPage();

    return () => {
      isActive = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [page, scale]);

  return (
    <div 
      className="relative mb-8 shadow-xl mx-auto rounded-lg overflow-hidden bg-white"
      style={{ width: dimensions.width || 'auto', height: dimensions.height || 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />
      {isRendered && (
        <CanvasOverlay 
          pageNumber={pageNumber} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
    </div>
  );
}
