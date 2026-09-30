import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Calculator, Image as ImageIcon, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const DamageInspectionModal = ({ booking, isOpen, onClose, onSubmitSuccess }) => {
  const [damageAmount, setDamageAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDamageAmount('0');
      setDescription('');
      setImageUrls([]);
      setNewUrl('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const deposit = booking.depositAmount || 0;
  const numericDamage = parseFloat(damageAmount) || 0;
  const netRefund = Math.max(0, deposit - numericDamage);

  const handleAddEvidenceUrl = () => {
    if (!newUrl.trim()) return;
    setImageUrls([...imageUrls, newUrl.trim()]);
    setNewUrl('');
  };

  const handleRemoveEvidenceUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (numericDamage < 0) {
      setError('Damage amount cannot be negative.');
      return;
    }

    if (numericDamage > deposit) {
      setError(`Damage amount (₹${numericDamage}) cannot exceed the security deposit (₹${deposit}).`);
      return;
    }

    if (numericDamage > 0 && !description.trim()) {
      setError('Please provide a description of the damage when damage amount is greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess(numericDamage, description, imageUrls);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit damage inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Lender Damage Inspection</h3>
              <p className="text-xs text-slate-400">Booking Reference: #{booking.bookingReference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item & Renter Overview */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Item Name:</span>
            <span className="text-white font-semibold text-sm">{booking.itemName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Renter:</span>
            <span className="text-white font-semibold text-sm">{booking.renterName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Security Deposit Held:</span>
            <span className="text-emerald-400 font-bold text-sm">₹{deposit}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Current Status:</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
              {booking.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Damage Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Damage Deduction Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              max={deposit}
              step="any"
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-base font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter ₹0 if item returned undamaged. Max allowable: ₹{deposit}.
            </p>
          </div>

          {/* Damage Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Inspection Notes / Damage Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={numericDamage > 0 ? "Describe condition, scratches, or missing parts..." : "Optional inspection notes..."}
              required={numericDamage > 0}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Damage Evidence Photos */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Damage Evidence Photos (Image URLs)
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/damage-photo.jpg"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddEvidenceUrl}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {imageUrls.length > 0 && (
              <div className="space-y-1.5">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="truncate max-w-[80%]">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceUrl(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Refund Calculation Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
              <Calculator className="w-4 h-4" />
              <span>Realtime Refund Calculation</span>
            </div>

            <div className="space-y-1 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span>Security Deposit Held:</span>
                <span className="font-semibold">₹{deposit}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Damage Deduction:</span>
                <span className="font-semibold">- ₹{numericDamage}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1 border-t border-slate-800">
                <span>Final Refund to Renter:</span>
                <span>₹{netRefund}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" label="Submitting..." />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Inspection</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
