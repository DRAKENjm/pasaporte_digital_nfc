import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin ${sizeMap[size]}`} />
    </div>
  );
};
