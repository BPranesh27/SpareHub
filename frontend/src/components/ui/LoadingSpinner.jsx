import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-6 text-slate-400">
      <Loader2 className={`${sizeClasses[size] || 'w-8 h-8'} animate-spin text-brand-500`} />
      {label && <p className="text-xs font-medium tracking-wide text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};
