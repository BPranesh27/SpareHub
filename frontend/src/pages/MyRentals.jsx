import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { returnService } from '../services/return.service';
import { reviewService } from '../services/review.service';
import { Repeat, ArrowRight, AlertCircle, CreditCard, QrCode, RotateCcw, ShieldCheck, Star, Check } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRScanner } from '../components/handover/QRScanner';
import { ReturnSummaryCard } from '../components/booking/ReturnSummaryCard';
import ReviewFormModal from '../components/reviews/ReviewFormModal';

export const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Review state
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewedMap, setReviewedMap] = useState({});

  // Cancel Modal State
  const [cancelId, setCancelId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Return Request State
  const [returningId, setReturningId] = useState(null);

  // Camera QR Scanner Modal State
  const [scanBooking, setScanBooking] = useState(null);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyRentals();
      setRentals(data || []);

      // Check review status for COMPLETED bookings
      if (data && data.length > 0) {
        const completed = data.filter((r) => r.status === 'COMPLETED');
        const map = {};
        await Promise.all(
          completed.map(async (b) => {
            try {
              const res = await reviewService.getBookingReviewStatus(b.id);
              if (res?.data?.reviewed) {
                map[b.id] = true;
              }
            } catch (err) {
              console.error('Error checking review status:', err);
            }
          })
        );
        setReviewedMap(map);
      }
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError('Failed to load your rental bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    setIsCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(cancelId);
      setRentals(rentals.map((r) => (r.id === cancelId ? updated : r)));
      setCancelId(null);
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestReturn = async (bookingId) => {
    setReturningId(bookingId);
    try {
      const updated = await returnService.requestReturn(bookingId);
      setRentals(rentals.map((r) => (r.id === bookingId ? { ...r, status: updated.status } : r)));
    } catch (err) {
      console.error('Request return error:', err);
      alert(err.response?.data?.message || 'Failed to request return.');
    } finally {
      setReturningId(null);
    }
  };

  const filteredRentals = rentals.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <LoadingSpinner label="Loading your rental bookings..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Rental Reservations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your gear bookings, request item returns, and view security deposit refunds
          </p>
        </div>
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow transition-colors"
        >
          <span>Browse Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'RETURN_REQUESTED', 'RETURNED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              filterStatus === st
                ? 'bg-brand-600 text-white border-brand-500 shadow-glow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredRentals.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Repeat className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Rentals Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven't reserved any items yet. Explore the marketplace to book cameras, tools, or gaming gear.
          </p>
          <div className="pt-2">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow transition-colors"
            >
              <span>Explore Items Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Rentals Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRentals.map((r) => (
            <div
              key={r.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-card space-y-5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0">
                    <img src={r.itemImage} alt={r.itemName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-400 font-bold tracking-wider uppercase">Ref: {r.bookingReference}</p>
                    <h3 className="text-base font-bold text-white line-clamp-1">{r.itemName}</h3>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                    r.status === 'CONFIRMED'
                      ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
                      : r.status === 'PENDING'
                      ? 'bg-amber-950/90 text-amber-400 border-amber-500/30 animate-pulse'
                      : r.status === 'ACTIVE'
                      ? 'bg-blue-950/90 text-blue-400 border-blue-500/30 font-bold'
                      : r.status === 'RETURN_REQUESTED'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/30 font-bold'
                      : r.status === 'RETURNED' || r.status === 'COMPLETED'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-950/90 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {r.status === 'PENDING' ? 'PAYMENT PENDING' : r.status}
                </span>
              </div>

              {/* Dates & Location */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">Rental Dates</p>
                  <p className="font-semibold text-white mt-0.5">{r.startDate} → {r.endDate}</p>
                  <p className="text-[11px] text-brand-400 font-medium">({r.rentalDays} Days)</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">Location</p>
                  <p className="font-semibold text-white mt-0.5 truncate">{r.location}</p>
                  <p className="text-[11px] text-slate-400">Lender: {r.lenderName}</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <p className="text-slate-400">Rental Subtotal: <span className="font-semibold text-slate-200">₹{r.rentalAmount}</span></p>
                  <p className="text-slate-400">Deposit: <span className="font-semibold text-amber-300">₹{r.depositAmount}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Upfront</p>
                  <p className="text-lg font-extrabold text-brand-400">₹{r.totalAmount}</p>
                </div>
              </div>

              {/* Phase 7 Return / Deposit Summary if RETURNED/COMPLETED */}
              {(r.status === 'RETURNED' || r.status === 'COMPLETED') && (
                <div className="pt-2">
                  <ReturnSummaryCard summary={{
                    originalDeposit: r.depositAmount,
                    damageDeduction: r.damageDeduction || 0,
                    finalRefund: r.depositAmount - (r.damageDeduction || 0),
                    bookingStatus: r.status
                  }} />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3 border-t border-slate-800/80">
                {r.status === 'PENDING' ? (
                  <Link
                    to={`/payment/${r.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{r.totalAmount} Now</span>
                  </Link>
                ) : r.status === 'CONFIRMED' ? (
                  <button
                    onClick={() => setScanBooking(r)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan Handover QR</span>
                  </button>
                ) : r.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleRequestReturn(r.id)}
                    disabled={returningId === r.id}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {returningId === r.id ? (
                      <LoadingSpinner size="sm" label="Submitting Return..." />
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Request Item Return</span>
                      </>
                    )}
                  </button>
                ) : r.status === 'RETURN_REQUESTED' ? (
                  <div className="flex-1 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-semibold text-center flex items-center justify-center space-x-2">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Return Requested — Awaiting Lender Inspection</span>
                  </div>
                ) : r.status === 'COMPLETED' ? (
                  <div className="flex-1 flex items-center gap-2">
                    {reviewedMap[r.id] ? (
                      <div className="flex-1 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-bold text-center flex items-center justify-center space-x-1.5">
                        <Check className="w-4 h-4" />
                        <span>Review Submitted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewModalBooking(r)}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5"
                      >
                        <Star className="w-4 h-4 fill-slate-950" />
                        <span>Leave a Review</span>
                      </button>
                    )}
                    <Link
                      to={`/bookings/${r.id}`}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/bookings/${r.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white text-xs font-semibold text-center transition-colors shadow"
                  >
                    View Reservation Details
                  </Link>
                )}

                {r.status === 'CONFIRMED' || r.status === 'PENDING' ? (
                  <button
                    onClick={() => setCancelId(r.id)}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 text-xs font-semibold border border-rose-900/40 transition-colors"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      {scanBooking && (
        <QRScanner
          bookingId={scanBooking.id}
          onSuccess={() => {
            fetchRentals();
            setScanBooking(null);
          }}
          onClose={() => setScanBooking(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cancel Booking Reservation?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to cancel this booking? This will free up the dates for other renters.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {isCancelling ? <LoadingSpinner size="sm" label="" /> : null}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewModalBooking && (
        <ReviewFormModal
          booking={reviewModalBooking}
          isOpen={!!reviewModalBooking}
          onClose={() => setReviewModalBooking(null)}
          onSuccess={() => {
            fetchRentals();
          }}
        />
      )}

    </div>
  );
};
