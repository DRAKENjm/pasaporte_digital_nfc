import React, { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
};

export const Modal: React.FC<Props> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${sizes[size]} max-h-[92vh] flex flex-col shadow-2xl border border-[#EFE7DE] dark:border-slate-800 overflow-hidden transform transition-all animate-scaleUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EFE7DE] dark:border-slate-800 bg-[#FAF8F5]/80 dark:bg-slate-900/80 backdrop-blur-xs shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#7C0A1E] rounded-full" />
                <h3 className="text-base sm:text-lg font-extrabold text-[#2D1A1E] dark:text-white tracking-tight">
                  {title}
                </h3>
              </div>
              {subtitle && (
                <p className="text-xs text-[#8E7D7D] dark:text-slate-400 mt-0.5 ml-3.5">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-[#8E7D7D] hover:text-[#2D1A1E] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body con scroll suave */}
        <div className="p-5 sm:p-7 overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
