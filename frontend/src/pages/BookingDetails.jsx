import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { handoverService } from '../services/handover.service';
import { returnService } from '../services/return.service';
import { reviewService } from '../services/review.service';
import { ShieldCheck, MapPin, ArrowLeft, CreditCard, Lock, Sparkles, QrCode, X, CheckCircle2, RotateCcw, ShieldAlert, Star, Check } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRCodeView } from '../components/ui/QRCodeView';
import { QRScanner } from '../components/handover/QRScanner';
import { DamageInspectionModal } from '../components/booking/DamageInspectionModal';
import { ReturnSummaryCard } from '../components/booking/ReturnSummaryCard';
import ReviewFormModal from '../components/reviews/ReviewFormModal';

export const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [handover, setHandover] = useState(null);
  const [damageReport, setDamageReport] = useState(null);
  const [returnSummary, setReturnSummary] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Lender QR Modal State
  const [qrModal, setQrModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Renter Camera Scanner Modal State
  const [scannerModal, setScannerModal] = useState(false);

  // Phase 7 Damage Inspection & Return State
  const [inspectModal, setInspectModal] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const bookingId = Number(id);
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);

      try {
        const pm = await paymentService.getBookingPayment(bookingId);
        setPayment(pm);
      } catch {
        // No payment record yet
      }

      try {
        const ho = await handoverService.getHandoverStatus(bookingId);
        setHandover(ho);
      } catch {
        // No handover record yet
      }

      if (data.status === 'RETURNED' || data.status === 'COMPLETED' || data.status === 'RETURN_REQUESTED') {
        try {
          const dr = await returnService.getDamageReport(bookingId);
          setDamageReport(dr);
        } catch {
          // Damage report optional
        }

        try {
          const rs = await returnService.getReturnSummary(bookingId);
          setReturnSummary(rs);
        } catch {
          // Return summary optional
        }
      }

      if (data.status === 'COMPLETED') {
        try {
          const revStatus = await reviewService.getBookingReviewStatus(bookingId);
          if (revStatus?.data?.reviewed) {
            setHasReviewed(true);
          }
        } catch (err) {
          console.error('Error fetching booking review status:', err);
        }
      }
    } catch (err) {
      console.error('Fetch booking error:', err);
      setError(err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id);
      setBooking(updated);
      setCancelModal(false);
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenQrModal = async () => {
    if (!booking) return;
    setQrModal(true);
    setQrLoading(true);
    setQrError(null);
    try {
      const ho = await handoverService.getOrCreateHandover(booking.id);
      setHandover(ho);
    } catch (err) {
      setQrError(err.response?.data?.message || 'Failed to generate handover QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!booking) return;
    setIsReturning(true);
    try {
      const updated = await returnService.requestReturn(booking.id);
      setBooking(updated);
    } catch (err) {
      console.error('Request return error:', err);
      alert(err.response?.data?.message || 'Failed to request return.');
    } finally {
      setIsReturning(false);
    }
  };

  const handleSubmitDamageInspection = async (damageAmount, description, imageUrls) => {
    if (!booking) return;
    await returnService.submitDamageInspection(booking.id, damageAmount, description, imageUrls);
    fetchDetails();
    setInspectModal(false);
  };

  const handleCompleteReturn = async () => {
    if (!booking) return;
    setIsCompleting(true);
    try {
      const updated = await returnService.completeReturn(booking.id);
      setBooking(updated);
      fetchDetails();
    } catch (err) {
      console.error('Complete return error:', err);
      alert(err.response?.data?.message || 'Failed to complete return.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner label="Loading reservation details..." size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error || 'Booking not found.'}
        </div>
        <Link
          to="/my-rentals"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Rentals</span>
        </Link>
      </div>
    );
  }

  const isRenter = user?.email?.toLowerCase() === booking.renterEmail?.toLowerCase();
  const isLender = user?.email?.toLowerCase() === booking.lenderEmail?.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20 text-slate-100">
      
      {/* Back Button & Role Badge */}
      <div className="flex items-center justify-between">
        <Link
          to={isLender ? '/lender-bookings' : '/my-rentals'}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isLender ? 'Back to Lender Orders' : 'Back to My Rentals'}</span>
        </Link>

        <span className="px-3.5 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-400 text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          {isRenter ? 'You are the Renter' : isLender ? 'You are the Lender' : 'Verified Booking'}
        </span>
      </div>

      {/* Main Reservation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
              Booking Ref: {booking.bookingReference}
            </p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Reservation Summary
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Created on {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
              booking.status === 'CONFIRMED'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 shadow-glow'
                : booking.status === 'PENDING'
                ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                : booking.status === 'ACTIVE'
                ? 'bg-blue-950 text-blue-400 border-blue-500/40 font-bold'
                : booking.status === 'RETURN_REQUESTED'
                ? 'bg-amber-950 text-amber-300 border-amber-500/40 font-bold animate-pulse'
                : booking.status === 'RETURNED' || booking.status === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : booking.status === 'CANCELLED'
                ? 'bg-rose-950 text-rose-400 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Booking Status: {booking.status === 'PENDING' ? 'PAYMENT PENDING' : booking.status}
          </span>
        </div>

        {/* Item & User Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
            <img src={booking.itemImage} alt={booking.itemName} className="w-full h-full object-cover" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
              {booking.itemCategory}
            </span>
            <h3 className="text-lg font-bold text-white">{booking.itemName}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{booking.location}</span>
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
              <p><span className="text-slate-500">Lender:</span> <span className="font-semibold text-white">{booking.lenderName}</span></p>
              <p><span className="text-slate-500">Renter:</span> <span className="font-semibold text-white">{booking.renterName}</span></p>
            </div>
          </div>
        </div>

        {/* Rental Dates Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Check-in Date</p>
            <p className="text-sm font-bold text-white mt-1">{booking.startDate}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Duration</p>
            <p className="text-sm font-bold text-brand-400 mt-1">{booking.rentalDays} Rental Days</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Check-out Date</p>
            <p className="text-sm font-bold text-white mt-1">{booking.endDate}</p>
          </div>
        </div>

        {/* Financial Breakdown & Payment Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Financial Breakdown & Payment
          </h3>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Daily Rate</span>
              <span className="font-semibold text-white">₹{booking.pricePerDay}/day</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rental Subtotal (₹{booking.pricePerDay} × {booking.rentalDays} days)</span>
              <span className="font-semibold text-white">₹{booking.rentalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center space-x-1">
                <span>Refundable Security Deposit</span>
                <span className="text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Refundable on return
                </span>
              </span>
              <span className="font-semibold text-amber-300">₹{booking.depositAmount?.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between text-base font-extrabold">
              <span className="text-white">Total Upfront Amount</span>
              <span className="text-emerald-400">₹{booking.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {payment ? (
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Payment Gateway Record</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {payment.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Payment Reference</span>
                  <span className="font-mono font-semibold text-emerald-300">{payment.paymentReference}</span>
                </div>
                {payment.transactionReference && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Transaction Reference</span>
                    <span className="font-mono font-semibold text-indigo-300">{payment.transactionReference}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[11px] block">Payment Method</span>
                  <span className="font-semibold text-white capitalize">{payment.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Amount Paid</span>
                  <span className="font-bold text-emerald-400">₹{payment.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : isRenter && booking.status === 'PENDING' ? (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Payment Required to Confirm Reservation</span>
                </span>
                <p className="text-slate-400 text-xs">
                  Complete the mock payment checkout to confirm dates and secure the security deposit.
                </p>
              </div>
              <Link
                to={`/payment/${booking.id}`}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition text-center flex items-center justify-center space-x-2 shrink-0"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{booking.totalAmount?.toLocaleString()} Now</span>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Phase 7 Return Summary Card */}
        {(returnSummary || damageReport || booking.status === 'RETURNED' || booking.status === 'COMPLETED') && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Phase 7 Deposit Refund & Damage Breakdown
            </h3>
            <ReturnSummaryCard summary={returnSummary} damageReport={damageReport} />
          </div>
        )}

        {/* Handover Verification Card */}
        {booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-2">
                <QrCode className="w-4 h-4" />
                <span>Item Handover Verification</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  handover?.status === 'VERIFIED' || booking.status === 'ACTIVE'
                    ? 'bg-blue-950 text-blue-400 border-blue-500/40'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {booking.status === 'ACTIVE' ? 'HANDOVER VERIFIED' : 'READY FOR HANDOVER'}
              </span>
            </div>

            {booking.status === 'CONFIRMED' && isLender && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-300">
                  Generate and display the Handover QR Code for renter <span className="font-semibold text-white">{booking.renterName}</span> upon item pickup.
                </p>
                <button
                  onClick={handleOpenQrModal}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2 shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Handover QR Code</span>
                </button>
              </div>
            )}

            {booking.status === 'CONFIRMED' && isRenter && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-300">
                  Collecting the item from lender <span className="font-semibold text-white">{booking.lenderName}</span>? Scan the handover QR code here.
                </p>
                <button
                  onClick={() => setScannerModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center space-x-2 shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Handover QR</span>
                </button>
              </div>
            )}

            {booking.status === 'ACTIVE' && (
              <div className="flex items-center space-x-3 text-xs text-blue-300 bg-blue-950/30 border border-blue-500/20 p-4 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Item Handover Successfully Verified</p>
                  <p className="text-slate-400 mt-0.5">
                    Physical handover was confirmed. The rental duration is currently <span className="text-blue-300 font-semibold">ACTIVE</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Phase 7 Return Workflow Controls */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>Rental Return Workflow</span>
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              STATUS: {booking.status}
            </span>
          </div>

          {booking.status === 'ACTIVE' && isRenter && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-300">
                Finished using the gear? Submit an item return request to initiate lender inspection and deposit refund.
              </p>
              <button
                onClick={handleRequestReturn}
                disabled={isReturning}
                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {isReturning ? (
                  <LoadingSpinner size="sm" label="Submitting..." />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Request Item Return</span>
                  </>
                )}
              </button>
            </div>
          )}

          {booking.status === 'RETURN_REQUESTED' && isLender && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-300">
                Renter has requested item return. Perform damage inspection to calculate deposit refund.
              </p>
              <button
                onClick={() => setInspectModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 shrink-0"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Inspect Return & Calculate Refund</span>
              </button>
            </div>
          )}

          {booking.status === 'RETURN_REQUESTED' && isRenter && (
            <p className="text-xs text-amber-300 bg-amber-950/30 p-3 rounded-xl border border-amber-500/20">
              Return requested! The lender has been notified to inspect the returned item.
            </p>
          )}

          {booking.status === 'RETURNED' && isLender && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-300">
                Inspection completed. Finalize the return to release the calculated security deposit refund.
              </p>
              <button
                onClick={handleCompleteReturn}
                disabled={isCompleting}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {isCompleting ? (
                  <LoadingSpinner size="sm" label="Finalizing..." />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Return & Release Refund</span>
                  </>
                )}
              </button>
            </div>
          )}

          {booking.status === 'COMPLETED' && (
            <div className="space-y-3">
              <p className="text-xs text-emerald-300 bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 font-semibold text-center">
                Rental Return Completed Successfully! Deposit refund issued to renter.
              </p>

              <div className="flex justify-center pt-2">
                {hasReviewed ? (
                  <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Review Submitted</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>Leave a Review for This Rental</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            ShareSpare Phase 7 Rental Return & Damage Inspection Workflow.
          </p>

          {isRenter && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') ? (
            <button
              onClick={() => setCancelModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 text-xs font-semibold border border-rose-900/40 transition-colors"
            >
              Cancel Reservation
            </button>
          ) : null}
        </div>

      </div>

      {/* Lender QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setQrModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Lender Handover QR Code
              </span>
              <h3 className="text-xl font-extrabold text-white">{booking.itemName}</h3>
              <p className="text-xs text-slate-400">
                Show this QR code to renter <span className="text-slate-200 font-semibold">{booking.renterName}</span> upon physical handover.
              </p>
            </div>

            {qrLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Generating secure handover token...</p>
              </div>
            ) : qrError ? (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center">
                {qrError}
              </div>
            ) : handover ? (
              <div className="space-y-4">
                <QRCodeView value={handover.handoverToken} size={200} label="Handover Verification Token" />
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                  Status: <span className="text-amber-400 font-semibold">Waiting for renter verification</span>
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setQrModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Renter Camera Scanner Modal */}
      {scannerModal && (
        <QRScanner
          bookingId={booking.id}
          onSuccess={() => {
            fetchDetails();
            setScannerModal(false);
          }}
          onClose={() => setScannerModal(false)}
        />
      )}

      {/* Lender Damage Inspection Modal */}
      {inspectModal && (
        <DamageInspectionModal
          booking={booking}
          isOpen={inspectModal}
          onClose={() => setInspectModal(false)}
          onSubmitSuccess={handleSubmitDamageInspection}
        />
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Confirm Cancellation?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to cancel booking reference <span className="text-brand-400 font-semibold">{booking.bookingReference}</span>?
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                No, Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {isCancelling ? <LoadingSpinner size="sm" label="" /> : null}
                <span>Yes, Cancel Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewModalOpen && (
        <ReviewFormModal
          booking={booking}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            fetchDetails();
          }}
        />
      )}

    </div>
  );
};
