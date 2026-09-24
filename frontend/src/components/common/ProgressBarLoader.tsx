import React, { useState, useEffect } from "react";

interface Props {
  text?: string;
}

export const ProgressBarLoader: React.FC<Props> = ({ text }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentProgress = 0;
    
    // Simulate smart loading
    const interval = setInterval(() => {
      // Logic for fake progress: fast at first, then slows down
      let increment = 0;
      if (currentProgress < 30) {
        increment = Math.random() * 15; // Fast
      } else if (currentProgress < 70) {
        increment = Math.random() * 8;  // Medium
      } else if (currentProgress < 95) {
        increment = Math.random() * 2;  // Slow, never reaches 100%
      }

      currentProgress += increment;
      if (currentProgress > 95) currentProgress = 95;
      
      setProgress(Math.floor(currentProgress));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  let statusText = "Cargando...";
  if (progress < 30) statusText = "Conectando al servidor...";
  else if (progress < 70) statusText = "Procesando información...";
  else statusText = "Renderizando interfaz...";

  // Override text if provided via props
  const displayText = text || statusText;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full max-w-sm mx-auto px-4 gap-4 animate-fadeIn">
      {/* Progress Text */}
      <div className="flex justify-between w-full text-sm font-semibold">
        <span className="text-slate-500 dark:text-slate-400">{displayText}</span>
        <span className="text-teal-600 dark:text-teal-400">{progress}%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
        {/* Animated Bar */}
        <div 
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
        </div>
      </div>
      
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
        Asegurando conexión...
      </p>
    </div>
  );
};
