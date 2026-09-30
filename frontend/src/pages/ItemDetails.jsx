import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itemService } from '../services/item.service';
import { reviewService } from '../services/review.service';
import { ImageGallery } from '../components/items/ImageGallery';
import { AvailabilitySelector } from '../components/items/AvailabilitySelector';
import { MapPin, ShieldCheck, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import ReviewSummaryCard from '../components/reviews/ReviewSummaryCard';
import ReviewList from '../components/reviews/ReviewList';

export const ItemDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const itemId = Number(id);
        const data = await itemService.getItemById(itemId);
        setItem(data);

        try {
          const revs = await reviewService.getReviewsByItem(itemId);
          setReviews(revs?.data || []);
        } catch {
          // Reviews fetch optional fallback
        }

        try {
          const sum = await reviewService.getItemRatingSummary(itemId);
          if (sum?.data) {
            setRatingSummary(sum.data);
          }
        } catch {
          // Rating summary fallback
        }
      } catch (err) {
        console.error('Fetch item details error:', err);
        setError('Failed to load item details. Item may have been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner label="Loading item details..." size="lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error || 'Item not found.'}
        </div>
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      
      {/* Back Button */}
      <div>
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main Grid: Left Gallery & Details | Right Availability Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (2 Cols): Gallery & Description */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Image Gallery */}
          <ImageGallery images={item.images} title={item.name} />

          {/* Item Metadata */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-card">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                  {item.category}
                </span>
                <span className="flex items-center text-amber-400 font-bold text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Star className="w-4 h-4 fill-amber-400 mr-1.5" />
                  {(item.averageRating || ratingSummary.averageRating || 0) > 0 
                    ? `${(item.averageRating || ratingSummary.averageRating || 0).toFixed(1)} ★ (${item.totalReviews || ratingSummary.totalReviews || 0} ${ (item.totalReviews || ratingSummary.totalReviews) === 1 ? 'review' : 'reviews'})` 
                    : 'New Listing (No reviews yet)'}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">{item.name}</h1>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span className="font-medium text-slate-300">{item.location}</span>
              </p>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Item Description</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Lender Profile Card */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Listed by Lender</h3>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-300 text-slate-950 font-bold text-base flex items-center justify-center shadow">
                    {item.lenderName ? item.lenderName.charAt(0).toUpperCase() : 'L'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.lenderName}</h4>
                    <p className="text-xs text-slate-400">{item.lenderEmail}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-950 border border-brand-500/30 text-brand-400 text-[11px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Lender
                </span>
              </div>
            </div>

            {/* Customer Reviews & Rating Summary Section */}
            <div className="border-t border-slate-800 pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Customer Reviews</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {item.totalReviews || ratingSummary.totalReviews || 0} Total Reviews
                </span>
              </div>

              <ReviewSummaryCard
                averageRating={item.averageRating || ratingSummary.averageRating || 0}
                totalReviews={item.totalReviews || ratingSummary.totalReviews || 0}
              />

              <div className="pt-2">
                <ReviewList reviews={reviews} />
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (1 Col): Availability & Rental Box */}
        <div className="sticky top-28 space-y-6">
          <AvailabilitySelector
            itemId={item.id}
            pricePerDay={item.pricePerDay}
            securityDeposit={item.securityDeposit}
            availabilityStatus={item.availabilityStatus}
          />
        </div>

      </div>

    </div>
  );
};
