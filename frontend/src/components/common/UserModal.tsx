import React, {useEffect, useId, useRef} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
let locks = 0;
let previousOverflow = '';
export const UserModal: React.FC<{open: boolean; onClose: () => void; title: string; children: React.ReactNode}> = ({open,onClose,title,children}) => {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    if (locks++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); }
      if (e.key !== 'Tab') return;
      const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || [])].filter(x => x.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown',onKey);
    return () => { document.removeEventListener('keydown',onKey); if (--locks === 0) document.body.style.overflow = previousOverflow; previous?.focus(); };
  },[open]);
  if (!open) return null;
  return createPortal(<div className="user-surface fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col shadow-2xl overflow-hidden">
      <header className="p-4 border-b flex items-center justify-between gap-3 shrink-0"><h2 id={id} className="font-bold text-[#7C0A1E]">{title}</h2><button aria-label="Cerrar / Close" onClick={onClose} className="p-3 rounded-full hover:bg-rose-50"><X size={20}/></button></header>
      <div className="p-5 overflow-y-auto min-h-0">{children}</div>
    </div></div>,document.body);
};
