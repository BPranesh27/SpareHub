import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Calendar, ShieldCheck, Edit3, CheckCircle, Package, Repeat, Star, Save } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!name.trim()) {
      setError('Name cannot be blank.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name, phone);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-300 text-slate-950 font-extrabold text-3xl flex items-center justify-center shadow-glow border-2 border-brand-400">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{user?.name}</h1>
              <span className="px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-400 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Verified Lender & Renter
              </span>
            </div>
            
            <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{user?.email}</span>
            </p>

            <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2026'}</span>
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-brand-400" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Profile Details or Edit Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Account Details */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-card space-y-6">
          <h2 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Account Information
          </h2>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  {isSubmitting ? <LoadingSpinner size="sm" label="" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-white">{user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-white">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Account Role</span>
                <span className="font-semibold text-brand-400">Lender & Renter</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Platform Activity Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Activity Stats
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-medium text-slate-300">Listed Items</span>
              </div>
              <span className="text-base font-bold text-white">0</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Repeat className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-medium text-slate-300">Active Rentals</span>
              </div>
              <span className="text-base font-bold text-white">0</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-medium text-slate-300">Average Rating</span>
              </div>
              <span className="text-base font-bold text-white">5.0 ★</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
