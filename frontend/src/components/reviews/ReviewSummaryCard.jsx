import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import RatingStars from './RatingStars';

export default function ReviewSummaryCard({ averageRating = 0, totalReviews = 0 }) {
  const formattedRating = Number(averageRating || 0).toFixed(1);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center space-x-5">
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 min-w-[90px]">
          <span className="text-3xl font-extrabold tracking-tight">{formattedRating}</span>
          <span className="text-xs text-amber-400/80 font-medium">out of 5</span>
        </div>
        <div className="space-y-1.5">
          <RatingStars rating={Math.round(averageRating)} size="lg" />
          <p className="text-sm text-slate-400 flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Based on <strong>{totalReviews}</strong> verified {totalReviews === 1 ? 'review' : 'reviews'}</span>
          </p>
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800/50">
        <span className="text-emerald-400 font-semibold">100% Verified</span> Reviews from actual rental completions
      </div>
    </div>
  );
}
