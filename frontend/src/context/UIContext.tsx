import React, { createContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  message: string;
  type: ToastType;
}

interface UIContextType {
  toast: Toast | null;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  lastVisitBanner: { puntos: number; visible: boolean } | null;
  showVisitBanner: (puntos: number) => void;
  hideVisitBanner: () => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastVisitBanner, setLastVisitBanner] = useState<{
    puntos: number;
    visible: boolean;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const showVisitBanner = useCallback((puntos: number) => {
    setLastVisitBanner({ puntos, visible: true });
    window.setTimeout(() => setLastVisitBanner(null), 5000);
  }, []);

  return (
    <UIContext.Provider
      value={{
        toast,
        showToast,
        hideToast: () => setToast(null),
        profileOpen,
        openProfile: () => setProfileOpen(true),
        closeProfile: () => setProfileOpen(false),
        lastVisitBanner,
        showVisitBanner,
        hideVisitBanner: () => setLastVisitBanner(null),
      }}
    >
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] max-w-[90%] px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium animate-slideUp
            ${toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-slate-800"}`}
        >
          {toast.message}
        </div>
      )}
    </UIContext.Provider>
  );
};
