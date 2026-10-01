import React from "react";
import { Link } from "react-router-dom";

export const LegalLink: React.FC<{
  type: "TERMINOS_CONDICIONES" | "POLITICA_PRIVACIDAD";
  children: React.ReactNode;
}> = ({ type, children }) => {
  const queryParam = type === "POLITICA_PRIVACIDAD" ? "privacidad" : "terminos";
  return (
    <Link
      to={`/legal?tipo=${queryParam}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#7C0A1E] font-semibold underline hover:text-[#580614] transition-colors"
      title="Ver documento completo"
    >
      {children}
    </Link>
  );
};

