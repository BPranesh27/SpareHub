import React from 'react';
import { User, Calendar, MessageSquareOff } from 'lucide-react';
import RatingStars from './RatingStars';

export default function ReviewList({ reviews = [] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 p-8 space-y-3">
        <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-500">
          <MessageSquareOff className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-slate-300">No Reviews Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Be the first to review this item after completing a rental!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => {
        const dateStr = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : '';

        return (
          <div
            key={rev.id}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-slate-700/80 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm font-bold uppercase">
                  {rev.reviewerName ? rev.reviewerName.charAt(0) : 'U'}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-200">
                    {rev.reviewerName || 'Verified User'}
                  </h5>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <RatingStars rating={rev.rating} size="sm" />
                    <span className="text-amber-400 font-medium">{rev.rating}.0</span>
                  </div>
                </div>
              </div>

              {dateStr && (
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{dateStr}</span>
                </div>
              )}
            </div>

            {rev.comment && (
              <p className="text-sm text-slate-300 leading-relaxed pl-12">
                "{rev.comment}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
