import React from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface Props {
  to: string;
  label: string;
  icon: LucideIcon;
  activeColor?: string;
}

export const BottomNavItem: React.FC<Props> = ({
  to,
  label,
  icon: Icon,
  activeColor = "text-sky-400",
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-colors ${
          isActive ? activeColor : "text-slate-500 hover:text-slate-300"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
            aria-hidden
          />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
};
