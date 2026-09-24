import React from "react";
import { Plus } from "lucide-react";

export interface StoryItem {
  id: string;
  name: string;
  avatar?: string;
  seen?: boolean;
  isOwn?: boolean;
}

interface Props {
  stories: StoryItem[];
  onAdd?: () => void;
  onOpen?: (id: string) => void;
}

export const StoryBar: React.FC<Props> = ({ stories, onAdd, onOpen }) => (
  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scroll-touch">
    <button
      type="button"
      onClick={onAdd}
      className="flex flex-col items-center gap-1.5 shrink-0 w-16"
    >
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <Plus className="w-5 h-5 text-slate-400" />
      </div>
      <span className="text-[10px] text-muted truncate w-full text-center">
        Tu historia
      </span>
    </button>

    {stories.map((s) => (
      <button
        key={s.id}
        type="button"
        onClick={() => onOpen?.(s.id)}
        className="flex flex-col items-center gap-1.5 shrink-0 w-16"
      >
        <div
          className={`w-14 h-14 rounded-full p-[2px] ${
            s.seen
              ? "bg-slate-300 dark:bg-slate-600"
              : "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500"
          }`}
        >
          <div className="w-full h-full rounded-full bg-[rgb(var(--app-bg))] p-[2px]">
            {s.avatar ? (
              <img
                src={s.avatar}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                {s.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] truncate w-full text-center">
          {s.name}
        </span>
      </button>
    ))}
  </div>
);
