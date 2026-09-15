import React from 'react';

export const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div
    className="border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"
    style={{ width: size, height: size }}
  />
);
