import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange = () => {},
  disabled = false
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9'
  };

  const iconSizeClass = starSizes[size] || starSizes.md;

  return (
    <div className="flex items-center space-x-1" role={interactive ? "radiogroup" : "img"} aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const activeRating = interactive && hoverRating > 0 ? hoverRating : rating;
        const isFilled = starValue <= activeRating;

        return (
          <button
            key={starValue}
            type="button"
            disabled={!interactive || disabled}
            onClick={() => interactive && onChange(starValue)}
            onMouseEnter={() => interactive && !disabled && setHoverRating(starValue)}
            onMouseLeave={() => interactive && !disabled && setHoverRating(0)}
            className={`transition-all duration-150 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
              interactive && !disabled ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
            aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              className={`${iconSizeClass} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                  : 'fill-slate-700/40 text-slate-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
