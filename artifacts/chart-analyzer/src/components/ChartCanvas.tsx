import React, { useRef, useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { renderAnnotations, clearAnnotations } from '@/lib/renderAnnotations';

export function ChartCanvas() {
  const { currentImage, currentPlan } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!currentImage || !imageRef.current) return;

    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      // Fit image within container while maintaining aspect ratio
      const containerRatio = container.clientWidth / container.clientHeight;
      const imageRatio = img.width / img.height;

      let width, height;
      if (imageRatio > containerRatio) {
        width = container.clientWidth;
        height = width / imageRatio;
      } else {
        height = container.clientHeight;
        width = height * imageRatio;
      }

      setDimensions({ width, height });
    };
    img.src = currentImage;
  }, [currentImage]);

  useEffect(() => {
    if (!canvasRef.current || !currentPlan || dimensions.width === 0) return;
    
    // Render annotations when plan or dimensions change
    renderAnnotations(
      canvasRef.current,
      currentPlan,
      dimensions.width,
      dimensions.height
    );
  }, [currentPlan, dimensions]);

  if (!currentImage) return null;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[400px] md:h-[600px] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner"
    >
      <div 
        className="relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <img 
          ref={imageRef}
          src={currentImage} 
          alt="Chart" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />
      </div>
    </div>
  );
}
