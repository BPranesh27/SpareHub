import React from 'react';
import { Filter, MapPin, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Tools',
  'Gaming',
  'Outdoor',
  'Vehicles',
  'Photography',
  'Other',
];

export const FilterPanel = ({
  selectedCategory,
  onSelectCategory,
  locationFilter,
  onChangeLocation,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Marketplace Filters</h3>
        </div>

        {/* Location Filter Input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => onChangeLocation(e.target.value)}
              placeholder="Filter location (e.g. Coimbatore)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 text-xs font-semibold border border-rose-900/40 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Categories
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected =
              cat === selectedCategory || (cat === 'All' && !selectedCategory);
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat === 'All' ? '' : cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-500 shadow-glow'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
