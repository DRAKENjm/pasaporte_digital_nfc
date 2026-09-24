import React from "react";

export const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div
    className="border-2 border-sky-400/30 border-t-sky-500 rounded-full animate-spin"
    style={{ width: size, height: size }}
    role="status"
    aria-label="Cargando"
  />
);
