import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>}
      <input
        className={`bg-slate-950/60 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
          error ? 'border-rose-500' : 'border-slate-800'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
};
