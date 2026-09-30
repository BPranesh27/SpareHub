import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { bookingService } from '../../services/booking.service';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const AvailabilitySelector = ({
  itemId,
  pricePerDay,
  securityDeposit,
  availabilityStatus,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(dayAfterStr);

  const [days, setDays] = useState(3);
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableResult, setAvailableResult] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    setValidationError(null);
    setAvailableResult(null);

    if (!startDate || !endDate) {
      setValidationError('Please select both start and end rental dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date(todayStr);

    if (start < today) {
      setValidationError('Start date cannot be in the past.');
      return;
    }

    if (end <= start) {
      setValidationError('End date must be strictly after the start date.');
      return;
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDays(diffDays);

    const rentalAmt = diffDays * pricePerDay;
    const totalAmt = rentalAmt + securityDeposit;

    setAvailableResult({
      isAvailable: availabilityStatus === 'AVAILABLE',
      message: availabilityStatus === 'AVAILABLE' ? 'Dates are available for booking!' : 'Item is currently not available',
      rentalAmount: rentalAmt,
      depositAmount: securityDeposit,
      totalAmount: totalAmt,
    });
  }, [startDate, endDate, pricePerDay, securityDeposit, availabilityStatus, todayStr]);

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (validationError || !startDate || !endDate) return;

    setIsSubmitting(true);
    setValidationError(null);
    try {
      const booking = await bookingService.createBooking({
        itemId,
        startDate,
        endDate,
      });
      setConfirmedBooking(booking);
    } catch (err) {
      console.error('Booking creation error:', err);
      setValidationError(err.response?.data?.message || 'Failed to create booking reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Header Pricing Box */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Daily Rental Rate</p>
          <p className="text-2xl font-extrabold text-brand-400">
            ₹{pricePerDay}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Refundable Deposit</p>
          <p className="text-base font-bold text-slate-200">₹{securityDeposit}</p>
        </div>
      </div>

      {/* Date Inputs */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span>Select Rental Period</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              min={todayStr}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              min={startDate || todayStr}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Calculation & Cost Breakdown */}
      {availableResult && !validationError && (
        <div className="space-y-3 pt-2">
          
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Rental Duration</span>
              <span className="font-semibold text-white">{days} Days</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rental Subtotal (₹{pricePerDay} × {days}d)</span>
              <span className="font-semibold text-white">₹{availableResult.rentalAmount}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Security Deposit (Refundable)</span>
              <span className="font-semibold text-white">₹{availableResult.depositAmount}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between text-sm font-bold">
              <span className="text-slate-200">Total Upfront Amount</span>
              <span className="text-brand-400">₹{availableResult.totalAmount}</span>
            </div>
          </div>

          {availableResult.isAvailable ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{availableResult.message}</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{availableResult.message}</span>
            </div>
          )}

          {/* Action CTA Button */}
          <button
            onClick={handleBookNow}
            disabled={!availableResult.isAvailable || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-md hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" label="Reserving Item..." />
            ) : (
              <>
                <span>Rent This Item Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">Booking Confirmed!</h3>
              <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                Ref: {confirmedBooking.bookingReference}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Item</span>
                <span className="font-semibold text-white">{confirmedBooking.itemName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dates</span>
                <span className="font-semibold text-white">{confirmedBooking.startDate} → {confirmedBooking.endDate} ({confirmedBooking.rentalDays} days)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rental Subtotal</span>
                <span className="font-semibold text-white">₹{confirmedBooking.rentalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Security Deposit</span>
                <span className="font-semibold text-white">₹{confirmedBooking.depositAmount}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-white">Total Reserved Amount</span>
                <span className="text-brand-400">₹{confirmedBooking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => navigate(`/bookings/${confirmedBooking.id}`)}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors flex items-center justify-center gap-2"
              >
                <span>View Full Reservation Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmedBooking(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
