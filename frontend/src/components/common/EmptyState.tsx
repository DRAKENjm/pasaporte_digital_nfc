import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
      </div>
    )}
    <h3 className="text-base font-semibold">{title}</h3>
    {description && (
      <p className="text-sm text-muted mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <Button className="mt-5" onClick={onAction} size="md">
        {actionLabel}
      </Button>
    )}
  </div>
);
