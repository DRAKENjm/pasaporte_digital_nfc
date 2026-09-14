import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base = "w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    accent: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
