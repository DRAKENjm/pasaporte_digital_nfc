import React from "react";
import { Outlet, Link } from "react-router-dom";
import { CreditCard } from "lucide-react";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] relative flex flex-col justify-center sm:p-6 overflow-hidden">
      {/* Desktop Background Decorations - Much more prominent */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#FAF8F5] via-[#F3E8E8] to-[#EAE0E0]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-gradient-to-br from-[#7C0A1E]/15 to-[#4A0612]/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-tl from-[#7C0A1E]/20 to-[#9B1B30]/10 blur-[120px]" />
        
        {/* Abstract shapes for more 'design' feel */}
        <svg className="absolute top-[10%] right-[15%] w-64 h-64 text-[#7C0A1E]/5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M45.7,-76.1C58.9,-69.3,69.1,-55.4,75.9,-40.5C82.8,-25.6,86.2,-9.7,84.4,5.4C82.5,20.5,75.4,34.8,65.3,46.1C55.2,57.4,42,65.6,27.8,70.6C13.6,75.5,-1.7,77.1,-16.4,74.9C-31,72.6,-45.1,66.6,-56.9,56.7C-68.7,46.8,-78.2,33.1,-82.9,17.7C-87.5,2.4,-87.3,-14.5,-80.6,-28.9C-73.8,-43.3,-60.5,-55.1,-46.2,-61.6C-31.9,-68.2,-16,-69.5,0.7,-70.6C17.3,-71.7,32.6,-82.9,45.7,-76.1Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute bottom-[10%] left-[10%] w-96 h-96 text-[#7C0A1E]/5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M38.1,-63.9C51.6,-55.5,66.3,-48.6,75.6,-36.8C84.9,-25,88.8,-8.3,86.5,7.6C84.3,23.5,75.9,38.6,64.2,49.8C52.4,61,37.3,68.2,21.5,71.5C5.7,74.8,-10.7,74.2,-25.3,69.2C-39.8,64.3,-52.4,55,-61.7,42.7C-71,30.4,-77,15.2,-78.5,-0.9C-80,-17,-77,-34,-67.7,-46.1C-58.4,-58.3,-42.8,-65.7,-28.5,-69C-14.2,-72.3,0,-71.4,14.6,-69.6C29.2,-67.8,45,-65.1,38.1,-63.9Z" transform="translate(100 100)" />
        </svg>
      </div>

      <main className="w-full h-full flex flex-col justify-center max-w-md mx-auto my-auto relative z-10">
        <Outlet />
      </main>

      <footer className="max-w-md w-full mx-auto sm:border-t border-[#EFE7DE]/60 pt-4 pb-2 text-center text-xs text-[#8E7D7D] hidden sm:block relative z-10">
        <p>© {new Date().getFullYear()} Pasaporte Digital NFC</p>
      </footer>
    </div>
  );
};
