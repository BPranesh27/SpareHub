import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';

export const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [selectedMethod, setSelectedMethod] = useState('MOCK_CARD');
  const [testFailure, setTestFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Result State
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Fake Demo Input fields state (visual only)
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = parseInt(bookingId, 10);
        const bookingData = await bookingService.getBookingById(id);
        setBooking(bookingData);

        // Check if payment already exists for this booking
        try {
          const pm = await paymentService.getBookingPayment(id);
          setExistingPayment(pm);
          if (pm.status === 'SUCCESS') {
            setPaymentResult(pm);
          }
        } catch {
          // No payment yet, normal checkout flow
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!booking || isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await paymentService.processPayment({
        bookingId: booking.id,
        paymentMethod: selectedMethod,
        testFailure: testFailure,
      });

      if (result.status === 'SUCCESS') {
        setPaymentResult(result);
      } else {
        setPaymentError('Payment transaction was declined or failed.');
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
          <p className="text-slate-400 text-sm">{error || 'The requested booking could not be loaded.'}</p>
          <Link
            to="/my-rentals"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Rentals</span>
          </Link>
        </div>
      </div>
    );
  }

  // --- SUCCESS VIEW ---
  if (paymentResult && paymentResult.status === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Payment Complete
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Payment Successful!</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Your payment has been processed and your booking is officially confirmed.
                </p>
              </div>
            </div>

            {/* Receipt Card */}
            <div className="mt-8 bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Amount Paid</span>
                <span className="text-2xl font-black text-emerald-400">₹{paymentResult.amount.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Booking Reference</span>
                  <span className="font-mono font-bold text-white text-base">{paymentResult.bookingReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Payment Reference</span>
                  <span className="font-mono font-bold text-emerald-300 text-base">{paymentResult.paymentReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Transaction Reference</span>
                  <span className="font-mono font-bold text-indigo-300 text-base">{paymentResult.transactionReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Payment Method</span>
                  <span className="font-semibold text-white capitalize">{paymentResult.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Financial breakdown recap */}
              <div className="pt-3 border-t border-slate-700/60 text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Rental Charge:</span>
                  <span className="font-medium">₹{paymentResult.rentalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Deposit:</span>
                  <span className="font-medium text-amber-300">₹{paymentResult.depositAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Next Step Info */}
            <div className="mt-6 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Security Deposit Secured</p>
                <p className="text-slate-400 mt-0.5">
                  Your security deposit of ₹{paymentResult.depositAmount} will be safely held until the item is returned to the lender after your rental period.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to={`/bookings/${booking.id}`}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition text-sm"
              >
                <span>View Booking Details</span>
              </Link>
              <Link
                to="/my-rentals"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition text-sm"
              >
                <span>My Rentals</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- FAILURE VIEW ---
  if (paymentError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
              <p className="text-slate-400 text-sm mt-2">{paymentError}</p>
              <p className="text-slate-500 text-xs mt-1">
                Your booking status remains <span className="text-amber-400 font-semibold">PENDING</span>. You can attempt the payment again when ready.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  setTestFailure(false);
                }}
                className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition"
              >
                Try Again
              </button>
              <Link
                to={`/bookings/${booking.id}`}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm border border-slate-700 transition"
              >
                Back to Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN CHECKOUT FORM VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            to={`/bookings/${booking.id}`}
            className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Booking Details</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure 256-bit Mock Gateway</span>
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Checkout & Payment</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review your booking, choose a mock payment method, and confirm your rental.
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-sm text-emerald-300">
          <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-emerald-200">Production-Style Mock Payment System</p>
            <p className="text-emerald-300/80 mt-0.5">
              This is a sandbox simulation environment. No actual money will be charged. Payment amounts are derived exclusively by the server from database booking records.
            </p>
          </div>
        </div>

        {/* Main Grid: Summary Left, Checkout Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Booking & Item Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Rental Summary</span>
              </h2>

              {/* Item Card Preview */}
              <div className="flex space-x-4 pb-4 border-b border-slate-800">
                <img
                  src={booking.itemImage || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32'}
                  alt={booking.itemName}
                  className="w-24 h-24 object-cover rounded-2xl border border-slate-700 bg-slate-800 flex-shrink-0"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {booking.itemCategory}
                  </span>
                  <h3 className="font-bold text-white text-base truncate">{booking.itemName}</h3>
                  <p className="text-slate-400 text-xs flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{booking.location}</span>
                  </p>
                  <p className="text-slate-400 text-xs">
                    Lender: <span className="text-slate-200 font-medium">{booking.lenderName}</span>
                  </p>
                </div>
              </div>

              {/* Dates & Duration */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Rental Dates</span>
                  </span>
                  <span className="font-medium text-white">{booking.startDate} to {booking.endDate}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-2 text-slate-400">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Duration</span>
                  </span>
                  <span className="font-semibold text-white">{booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Booking Reference</span>
                  <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                    {booking.bookingReference}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Breakdown</h3>
                
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Rental Charge ({booking.rentalDays} days @ ₹{booking.pricePerDay}/day)</span>
                  <span className="font-medium text-white">₹{booking.rentalAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-300">
                  <span className="flex items-center space-x-1">
                    <span>Refundable Security Deposit</span>
                    <span className="text-amber-400 font-semibold text-xs bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Refundable
                    </span>
                  </span>
                  <span className="font-semibold text-amber-300">₹{booking.depositAmount.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-white block">Total Payable</span>
                    <span className="text-[11px] text-slate-400">Includes rental + refundable deposit</span>
                  </div>
                  <span className="text-3xl font-black text-emerald-400">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Method & Payment Action */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleProcessPayment} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Select Payment Method</span>
              </h2>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('MOCK_CARD')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition ${
                    selectedMethod === 'MOCK_CARD'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${selectedMethod === 'MOCK_CARD' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">Mock Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('MOCK_UPI')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition ${
                    selectedMethod === 'MOCK_UPI'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <QrCode className={`w-6 h-6 ${selectedMethod === 'MOCK_UPI' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">Mock UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('MOCK_NET_BANKING')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition ${
                    selectedMethod === 'MOCK_NET_BANKING'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <Building2 className={`w-6 h-6 ${selectedMethod === 'MOCK_NET_BANKING' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">Net Banking</span>
                </button>
              </div>

              {/* Demo Fields based on method */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Simulated Demo Credentials</span>
                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded">Safe Sandbox</span>
                </div>

                {selectedMethod === 'MOCK_CARD' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Card Number (Demo)</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'MOCK_UPI' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">UPI ID (Demo)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Virtual Payment Address will receive a mock payment authorization request.
                    </p>
                  </div>
                )}

                {selectedMethod === 'MOCK_NET_BANKING' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Select Bank (Demo)</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="Axis Bank">Axis Bank</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Option: Test Failure Flag */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-300 block">Dev Testing Mode: Simulate Failure</span>
                  <span className="text-[11px] text-slate-400">Toggle on to test payment gateway failure scenario</span>
                </div>
                <input
                  type="checkbox"
                  checked={testFailure}
                  onChange={(e) => setTestFailure(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Primary CTA Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/25 transition flex items-center justify-center space-x-2 text-base"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay ₹{booking.totalAmount.toLocaleString()}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                By clicking Pay, you authorize ShareSpare to record a mock transaction of ₹{booking.totalAmount}.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
