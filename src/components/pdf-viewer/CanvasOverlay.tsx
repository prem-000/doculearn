'use client';

import { useRef, useEffect, useState, PointerEvent } from 'react';
import { useHotspotStore, Hotspot } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

interface CanvasOverlayProps {
  pageNumber: number;
  width: number;
  height: number;
}

export function CanvasOverlay({ pageNumber, width, height }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mode, hotspots, addHotspot, setActiveHotspot, setChatOpen, docId } = useHotspotStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRadius, setCurrentRadius] = useState(0);

  // Filter hotspots for this page
  const pageHotspots = hotspots.filter(h => h.page === pageNumber);

  // Draw hotspots and preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw existing hotspots
    pageHotspots.forEach(hotspot => {
      const { cx, cy, r } = hotspot.shape;
      const x = cx * width;
      const y = cy * height;
      const radius = r * width;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Soft blue highlight
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw current drawing preview
    if (isDrawing) {
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [width, height, pageHotspots, isDrawing, startPos, currentRadius]);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'read') {
      // Hit detection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const hotspot of pageHotspots) {
        const { cx, cy, r } = hotspot.shape;
        const hx = cx * width;
        const hy = cy * height;
        const hr = r * width;

        const dist = Math.sqrt(Math.pow(x - hx, 2) + Math.pow(y - hy, 2));
        if (dist <= hr) {
          setActiveHotspot(hotspot.id);
          setChatOpen(true);
          return;
        }
      }
      return;
    }

    if (mode === 'mark') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setIsDrawing(true);
      setStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setCurrentRadius(0);
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const radius = Math.sqrt(
      Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
    );
    setCurrentRadius(radius);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;

    if (currentRadius > 5) {
      // Create new hotspot
      const newHotspot: Hotspot = {
        id: uuidv4(),
        pdf_id: docId || '',
        page: pageNumber,
        shape: {
          type: 'circle',
          cx: startPos.x / width,
          cy: startPos.y / height,
          r: currentRadius / width
        },
        createdAt: Date.now()
      };
      addHotspot(newHotspot);
    }

    setIsDrawing(false);
    setCurrentRadius(0);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute top-0 left-0 w-full h-full touch-none ${
        mode === 'mark' ? 'cursor-crosshair' : 'cursor-pointer'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
