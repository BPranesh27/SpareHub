import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import RatingStars from './RatingStars';
import { reviewService } from '../../services/review.service';

export default function ReviewFormModal({ booking, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (comment.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reviewService.createReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Star className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Rate Your Rental</h3>
              <p className="text-xs text-slate-400">Ref #{booking.bookingReference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-bold text-slate-100">Thank You!</h4>
              <p className="text-sm text-slate-400">Your review has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Item Info Summary */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center space-x-3">
                {booking.itemImage ? (
                  <img src={booking.itemImage} alt={booking.itemName} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-semibold">
                    ITEM
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-200">{booking.itemName || 'Rental Item'}</div>
                  <div className="text-xs text-slate-400">Completed Rental</div>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div className="space-y-2 text-center py-2">
                <label className="block text-sm font-medium text-slate-300">
                  How would you rate your experience?
                </label>
                <div className="flex justify-center pt-1">
                  <RatingStars
                    rating={rating}
                    size="xl"
                    interactive={true}
                    onChange={(val) => setRating(val)}
                    disabled={loading}
                  />
                </div>
                <div className="text-xs font-semibold text-amber-400 pt-1">
                  {rating === 5 && '🌟 Exceptional!'}
                  {rating === 4 && '😊 Very Good!'}
                  {rating === 3 && '😐 Average'}
                  {rating === 2 && '🙁 Poor'}
                  {rating === 1 && '😤 Terrible'}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="review-comment" className="font-medium text-slate-300">
                    Your Review (Optional)
                  </label>
                  <span className={`text-slate-500 ${comment.length > 900 ? 'text-amber-400' : ''}`}>
                    {comment.length}/1000
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  disabled={loading}
                  placeholder="Share details about item condition, accuracy, communication, or overall rental experience..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || rating < 1}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
