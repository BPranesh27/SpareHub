import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../services/item.service';
import { PlusCircle, Edit, Trash2, Package, MapPin, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const data = await itemService.getMyItems();
      setItems(data);
    } catch (err) {
      console.error('Error fetching my items:', err);
      setError('Failed to load your listed items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await itemService.deleteItem(deleteId);
      setItems(items.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Delete item error:', err);
      alert(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <LoadingSpinner label="Loading your listed items..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Listed Items</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your rental listings, toggle status, or publish new gear for passive income
          </p>
        </div>
        <Link
          to="/items/add"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-glow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Item Listing</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Items Listed Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            You haven't added any items for rent yet. Turn your idle cameras, tools, or gaming gear into daily income by creating your first listing.
          </p>
          <div className="pt-2">
            <Link
              to="/items/add"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Listing</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 shadow-card flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={
                    item.images && item.images.length > 0
                      ? item.images[0].imageUrl
                      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800'
                  }
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-700">
                  {item.category}
                </span>
                
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    item.availabilityStatus === 'AVAILABLE'
                      ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
                      : item.availabilityStatus === 'RENTED'
                      ? 'bg-amber-950/90 text-amber-400 border-amber-500/30'
                      : 'bg-slate-950/90 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.availabilityStatus}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.location}</span>
                  </p>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Daily Rate</p>
                    <p className="text-lg font-bold text-brand-400">₹{item.pricePerDay}<span className="text-xs font-normal text-slate-400">/day</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Deposit</p>
                    <p className="text-sm font-semibold text-slate-300">₹{item.securityDeposit}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/items/edit/${item.id}`}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-brand-400" />
                    <span>Edit Listing</span>
                  </Link>

                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-900/40 transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Item Listing?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove this item from ShareSpare? This action cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <LoadingSpinner size="sm" label="" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
