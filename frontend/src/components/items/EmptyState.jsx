import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

export const EmptyState = ({
  title = 'No Items Found',
  description = 'We couldn’t find any rental listings matching your search or filters.',
  onReset,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-card">
      <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      {onReset && (
        <div className="pt-2">
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
