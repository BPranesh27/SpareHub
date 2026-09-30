import React from 'react';

export const LoadingSkeleton = ({ count = 6 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletons.map((idx) => (
        <div
          key={idx}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse shadow-card"
        >
          <div className="w-full h-48 bg-slate-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
          <div className="h-10 bg-slate-800 rounded-xl" />
        </div>
      ))}
    </div>
  );
};
