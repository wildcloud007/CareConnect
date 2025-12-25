import React, { useEffect, useRef } from 'react';
import { AudioVisualizerProps } from '../types';

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, isListening, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Base circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      
      if (isListening) {
         ctx.fillStyle = '#ef4444'; // Red for recording
      } else if (isPlaying) {
         ctx.fillStyle = '#3b82f6'; // Blue for speaking
      } else {
         ctx.fillStyle = '#94a3b8'; // Grey for idle
      }
      ctx.fill();

      // Ripple effect based on volume
      if (isPlaying || isListening) {
        // Create dynamic rings
        const numRings = 3;
        const maxRadius = 80;
        
        // Simulating volume fluctuation if volume isn't provided as a stream
        const currentScale = 1 + (Math.sin(Date.now() / 100) * 0.2) + (volume * 2);

        for (let i = 0; i < numRings; i++) {
          ctx.beginPath();
          const radius = 30 + (i * 15 * currentScale);
          ctx.arc(centerX, centerY, Math.min(radius, maxRadius), 0, 2 * Math.PI);
          ctx.strokeStyle = isListening 
            ? `rgba(239, 68, 68, ${0.5 - i * 0.15})` 
            : `rgba(59, 130, 246, ${0.5 - i * 0.15})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isListening, volume]);

  return (
    <div className="flex justify-center items-center py-8">
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={200}
        className="rounded-full bg-slate-100/50 backdrop-blur-sm shadow-inner"
      />
    </div>
  );
};
