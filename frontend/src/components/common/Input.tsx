import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export const Input: React.FC<Props> = ({
  label,
  error,
  type = "text",
  isPassword = false,
  className = "",
  ...rest
}) => {
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={inputType}
          className={`input-base ${isPassword ? "pr-12" : ""} ${
            error ? "border-red-300 focus:ring-red-400" : ""
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 p-2 min-h-touch min-w-touch flex items-center justify-center text-slate-400"
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
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};
