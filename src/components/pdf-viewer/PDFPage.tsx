'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CanvasOverlay } from './CanvasOverlay';
import 'pdfjs-dist/web/pdf_viewer.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotspotStore } from '@/lib/store';

interface PDFPageProps {
  page: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  scale?: number;
}

export function PDFPage({ page, pageNumber, scale = 1.5 }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRendered, setIsRendered] = useState(false);
  
  // Selection state
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

  // 1. Render Canvas
  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
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
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'RenderingCancelledException') {
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

  // 2. Render Text Layer
  useEffect(() => {
    if (!isRendered || !page) return;
    
    let isActive = true;
    const textLayerDiv = textLayerRef.current;
    if (!textLayerDiv) return;

    const renderText = async () => {
      try {
        const textContent = await page.getTextContent();
        if (!isActive) return;

        const viewport = page.getViewport({ scale });
        textLayerDiv.innerHTML = '';
        
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport
        });
        await textLayer.render();
      } catch (e) {
        console.error('Error rendering text layer', e);
      }
    };

    renderText();

    return () => {
      isActive = false;
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
      }
    };
  }, [isRendered, page, scale]);

  // 3. Handle Selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && textLayerRef.current?.contains(selection.anchorNode)) {
        const text = selection.toString().trim();
        if (!text) {
          setSelectionRect(null);
          setSelectedText('');
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (textLayerRef.current) {
          const pageRect = textLayerRef.current.getBoundingClientRect();
          setSelectionRect(new DOMRect(
            rect.left - pageRect.left, 
            rect.top - pageRect.top, 
            rect.width, 
            rect.height
          ));
        }
        setSelectedText(text);
      } else {
        setSelectionRect(null);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const { addHotspot, setActiveHotspot, setChatOpen, docId, hotspots, mode } = useHotspotStore();

  const handleContextAction = (action: string) => {
    if (!docId || !selectionRect) return;

    const rect = textLayerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Normalize coordinates (0 to 1) based on the page width/height
    const cx = (selectionRect.left + selectionRect.width / 2) / dimensions.width;
    const cy = (selectionRect.top + selectionRect.height / 2) / dimensions.height;
    const r = 0.03; // Fixed small radius for text anchors

    import('uuid').then(({ v4: uuidv4 }) => {
      const newHotspotId = uuidv4();
      
      let promptText = "Explain this marked section";
      if (action === 'Simplify') promptText = "Simplify this marked section so a beginner can understand it.";
      if (action === 'MCQ') promptText = "Generate a multiple-choice question based on this marked section to test my knowledge.";
      if (action === 'Summary') promptText = "Provide a concise summary of this marked section.";
      
      addHotspot({
        id: newHotspotId,
        pdf_id: docId,
        page: pageNumber,
        shape: { type: 'circle', cx, cy, r },
        text: selectedText,
        question: promptText,
        createdAt: Date.now()
      });

      setActiveHotspot(newHotspotId);
      setChatOpen(true);
      window.getSelection()?.removeAllRanges();
    });
  };

  return (
    <div 
      className="relative mb-8 shadow-xl mx-auto rounded-lg overflow-hidden bg-white"
      style={{ width: dimensions.width || 'auto', height: dimensions.height || 'auto' }}
    >
      {/* 1. Base Canvas */}
      <canvas ref={canvasRef} className="block" />
      
      {/* 2. Text Layer for native browser selection */}
      <div 
        ref={textLayerRef}
        className="absolute inset-0 z-10 textLayer"
        style={{ "--scale-factor": scale } as React.CSSProperties}
        onClick={(e) => {
          if (!docId) return;
          const rect = textLayerRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const cx = (e.clientX - rect.left) / dimensions.width;
          const cy = (e.clientY - rect.top) / dimensions.height;
          
          const pageHotspots = hotspots.filter(h => h.page === pageNumber);
          for (const hotspot of pageHotspots) {
            const hx = hotspot.shape.cx;
            const hy = hotspot.shape.cy;
            const hr = hotspot.shape.r;
            
            // Adjust radius slightly for easier tapping on small screens
            const dist = Math.sqrt(Math.pow(cx - hx, 2) + Math.pow(cy - hy, 2));
            if (dist <= hr + 0.02) {
              setActiveHotspot(hotspot.id);
              setChatOpen(true);
              return;
            }
          }
        }}
        onDoubleClick={(e) => {
          if (!docId) return;
          const rect = textLayerRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const cx = (e.clientX - rect.left) / dimensions.width;
          const cy = (e.clientY - rect.top) / dimensions.height;
          const r = 0.03;

          import('uuid').then(({ v4: uuidv4 }) => {
            const newId = uuidv4();
            addHotspot({
              id: newId,
              pdf_id: docId,
              page: pageNumber,
              shape: { type: 'circle', cx, cy, r },
              text: '',
              question: 'New Document Query',
              createdAt: Date.now()
            });
            setActiveHotspot(newId);
            setChatOpen(true);
            window.getSelection()?.removeAllRanges();
          });
        }}
      />

      {/* 3. Canvas Overlay for Drawing and visual rendering of anchors */}
      {isRendered && (
        <div className={`absolute inset-0 z-20 ${mode === 'mark' ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <CanvasOverlay 
            pageNumber={pageNumber} 
            width={dimensions.width} 
            height={dimensions.height} 
          />
        </div>
      )}

      {/* 4. Context Actions Menu */}
      <AnimatePresence>
        {selectionRect && selectedText && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-50 bg-[#18181b] border border-[#27272a] text-white p-1.5 rounded-xl shadow-2xl flex items-center gap-1"
            style={{
              top: Math.max(10, selectionRect.top - 55),
              left: Math.max(10, Math.min(dimensions.width - 300, selectionRect.left + (selectionRect.width / 2) - 150)),
            }}
          >
            {['Explain', 'Simplify', 'MCQ', 'Summary'].map(action => (
              <button 
                key={action}
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextAction(action);
                }}
                className="px-3 py-1.5 text-xs font-semibold hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                {action}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
