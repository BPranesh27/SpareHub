import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';

export const ItemCard = ({ item }) => {
  const primaryImage =
    item.images && item.images.length > 0
      ? item.images.find((img) => img.isPrimary)?.imageUrl || item.images[0].imageUrl
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all duration-300 shadow-card flex flex-col group hover:-translate-y-1">
      {/* Primary Image Container */}
      <div className="relative h-52 overflow-hidden bg-slate-950">
        <img
          src={primaryImage}
          alt={item.name}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-slate-700/80 shadow">
          {item.category}
        </span>

        {/* Status Pill */}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            item.availabilityStatus === 'AVAILABLE'
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-950/90 text-amber-400 border-amber-500/30'
          }`}
        >
          {item.availabilityStatus}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate max-w-[140px]">{item.location}</span>
            </span>
            <span className="flex items-center text-amber-400 font-semibold text-[11px]">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
              5.0 (Verified)
            </span>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing Breakdown Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Daily Rate</p>
            <p className="text-lg font-extrabold text-brand-400">
              ₹{item.pricePerDay}
              <span className="text-xs font-normal text-slate-400">/day</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Deposit</p>
            <p className="text-xs font-bold text-slate-300">₹{item.securityDeposit}</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/items/${item.id}`}
          className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-brand-600 text-slate-200 hover:text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
