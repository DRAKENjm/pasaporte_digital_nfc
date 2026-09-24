import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  primary:
    "bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white shadow-sm focus:ring-sky-400",
  secondary:
    "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10",
  danger: "bg-red-500 hover:bg-red-400 text-white focus:ring-red-400",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300",
  soft: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/25",
};

const sizes = {
  sm: "px-3 py-2 text-xs rounded-xl min-h-[40px]",
  md: "px-4 py-2.5 text-sm rounded-2xl min-h-[44px]",
  lg: "px-5 py-3 text-base rounded-2xl min-h-[48px]",
};

export const Button: React.FC<Props> = ({
  variant = "primary",
  loading,
  disabled,
  fullWidth,
  size = "md",
  className = "",
  children,
  ...rest
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 font-semibold transition duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none select-none
      ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
    )}
    {children}
  </button>
);
