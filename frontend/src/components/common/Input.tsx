import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  hint?: string;
}

export const Input: React.FC<Props> = ({
  label,
  error,
  type = "text",
  isPassword = false,
  className = "",
  hint,
  ...rest
}) => {
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
            {label}
          </label>
          {hint && (
            <span className="text-[10px] text-[#A39696] font-medium">{hint}</span>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type={inputType}
          className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-slate-900 border border-[#D9D0C7] dark:border-slate-700 rounded-xl text-xs sm:text-sm text-[#2D1A1E] dark:text-slate-100 placeholder:text-[#A39696] focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#7C0A1E] dark:focus:border-[#C5A059] focus:ring-3 focus:ring-[#7C0A1E]/12 transition-all shadow-2xs ${
            isPassword ? "pr-11" : ""
          } ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/20"
              : ""
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 p-1.5 text-[#8E7D7D] hover:text-[#2D1A1E] dark:hover:text-white transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            tabIndex={-1}
            aria-label={show ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 mt-1">
          <span>•</span> {error}
        </p>
      )}
    </div>
  );
};
