import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { handoverService } from '../services/handover.service';
import { returnService } from '../services/return.service';
import { Package, AlertCircle, ArrowRight, QrCode, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRCodeView } from '../components/ui/QRCodeView';
import { DamageInspectionModal } from '../components/booking/DamageInspectionModal';
import { ReturnSummaryCard } from '../components/booking/ReturnSummaryCard';

export const LenderBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handover QR Modal State
  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState(null);
  const [handoverData, setHandoverData] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState(null);

  // Damage Inspection Modal State
  const [inspectingBooking, setInspectingBooking] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const fetchLenderBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyLendingBookings();
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching lender bookings:', err);
      setError('Failed to load incoming rental bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenderBookings();
  }, []);

  const handleOpenHandoverModal = async (b) => {
    setSelectedHandoverBooking(b);
    setHandoverLoading(true);
    setHandoverError(null);
    setHandoverData(null);

    try {
      const data = await handoverService.getOrCreateHandover(b.id);
      setHandoverData(data);
    } catch (err) {
      console.error('Handover QR fetch error:', err);
      setHandoverError(err.response?.data?.message || 'Failed to generate handover QR code.');
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleSubmitDamageInspection = async (damageAmount, description, imageUrls) => {
    if (!inspectingBooking) return;
    await returnService.submitDamageInspection(inspectingBooking.id, damageAmount, description, imageUrls);
    fetchLenderBookings();
    setInspectingBooking(null);
  };

  const handleCompleteReturn = async (bookingId) => {
    setCompletingId(bookingId);
    try {
      await returnService.completeReturn(bookingId);
      fetchLenderBookings();
    } catch (err) {
      console.error('Complete return error:', err);
      alert(err.response?.data?.message || 'Failed to complete return.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <LoadingSpinner label="Loading incoming item reservations..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Incoming Rental Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Reservations placed by renters on your listed items & return inspections
          </p>
        </div>
        <Link
          to="/my-items"
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-5 py-3 rounded-xl border border-slate-700 transition-colors"
        >
          <span>Manage My Listed Items</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {bookings.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Rental Orders Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There are currently no active reservations placed on your items. When renters book your listed gear, they will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/my-items"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow transition-colors"
            >
              <span>View Your Items</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Bookings List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-card space-y-5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0">
                    <img src={b.itemImage} alt={b.itemName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-400 font-bold tracking-wider uppercase">Ref: {b.bookingReference}</p>
                    <h3 className="text-base font-bold text-white line-clamp-1">{b.itemName}</h3>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
                      : b.status === 'ACTIVE'
                      ? 'bg-blue-950/90 text-blue-400 border-blue-500/30 font-bold'
                      : b.status === 'RETURN_REQUESTED'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/30 font-bold animate-pulse'
                      : b.status === 'RETURNED' || b.status === 'COMPLETED'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">Renter Information</p>
                  <p className="font-semibold text-white mt-0.5">{b.renterName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{b.renterEmail}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold">Rental Dates</p>
                  <p className="font-semibold text-white mt-0.5">{b.startDate} → {b.endDate}</p>
                  <p className="text-[11px] text-brand-400 font-medium">({b.rentalDays} Days)</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <p className="text-slate-400">Rental Subtotal: <span className="font-semibold text-slate-200">₹{b.rentalAmount}</span></p>
                  <p className="text-slate-400">Security Deposit: <span className="font-semibold text-slate-200">₹{b.depositAmount}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Upfront</p>
                  <p className="text-lg font-extrabold text-brand-400">₹{b.totalAmount}</p>
                </div>
              </div>

              {/* Phase 7 Return Summary if RETURNED/COMPLETED */}
              {(b.status === 'RETURNED' || b.status === 'COMPLETED') && (
                <div className="pt-2">
                  <ReturnSummaryCard summary={{
                    originalDeposit: b.depositAmount,
                    damageDeduction: b.damageDeduction || 0,
                    finalRefund: b.depositAmount - (b.damageDeduction || 0),
                    bookingStatus: b.status
                  }} />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3 border-t border-slate-800/80">
                {b.status === 'CONFIRMED' ? (
                  <button
                    onClick={() => handleOpenHandoverModal(b)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show Handover QR Code</span>
                  </button>
                ) : b.status === 'RETURN_REQUESTED' ? (
                  <button
                    onClick={() => setInspectingBooking(b)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Inspect Return & Calculate Refund</span>
                  </button>
                ) : b.status === 'RETURNED' ? (
                  <button
                    onClick={() => handleCompleteReturn(b.id)}
                    disabled={completingId === b.id}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {completingId === b.id ? (
                      <LoadingSpinner size="sm" label="Completing Return..." />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Return & Release Refund</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={`/bookings/${b.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white text-xs font-semibold text-center transition-colors shadow flex items-center justify-center gap-1.5"
                  >
                    <span>View Full Order Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Handover QR Modal */}
      {selectedHandoverBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedHandoverBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Item Handover QR Code
              </span>
              <h3 className="text-xl font-extrabold text-white">{selectedHandoverBooking.itemName}</h3>
              <p className="text-xs text-slate-400">
                Show this QR code to renter <span className="text-slate-200 font-semibold">{selectedHandoverBooking.renterName}</span> upon physical handover.
              </p>
            </div>

            {handoverLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Generating secure handover token...</p>
              </div>
            ) : handoverError ? (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center">
                {handoverError}
              </div>
            ) : handoverData ? (
              <div className="space-y-4">
                <QRCodeView value={handoverData.handoverToken} size={200} label="Handover Verification Token" />
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5 text-center">
                  <p className="text-[11px] text-slate-400">
                    Status: <span className="text-amber-400 font-bold">Waiting for renter verification</span>
                  </p>
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setSelectedHandoverBooking(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Lender Damage Inspection Modal */}
      {inspectingBooking && (
        <DamageInspectionModal
          booking={inspectingBooking}
          isOpen={!!inspectingBooking}
          onClose={() => setInspectingBooking(null)}
          onSubmitSuccess={handleSubmitDamageInspection}
        />
      )}

    </div>
  );
};
