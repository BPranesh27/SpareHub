import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Camera, 
  Wrench, 
  Gamepad2, 
  Tent, 
  Car,
  ArrowRight,
  Star
} from 'lucide-react';

export const Home = () => {
  const categories = [
    { name: 'Electronics & Cameras', icon: Camera, count: '120+ items', color: 'from-blue-500/20 to-indigo-500/20' },
    { name: 'Tools & Equipment', icon: Wrench, count: '85+ items', color: 'from-amber-500/20 to-orange-500/20' },
    { name: 'Gaming & VR', icon: Gamepad2, count: '64+ items', color: 'from-purple-500/20 to-pink-500/20' },
    { name: 'Outdoor & Camping', icon: Tent, count: '92+ items', color: 'from-emerald-500/20 to-teal-500/20' },
    { name: 'Vehicles & Mobility', icon: Car, count: '45+ items', color: 'from-rose-500/20 to-red-500/20' },
  ];

  const featuredItems = [
    {
      id: 1,
      title: 'Sony FX3 Cinema Camera Kit',
      category: 'Electronics',
      price: '₹1,500',
      deposit: '₹15,000',
      location: 'Coimbatore, TN',
      rating: 4.9,
      reviews: 28,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 2,
      title: 'DeWalt 20V Max Cordless Drill Combo',
      category: 'Tools',
      price: '₹400',
      deposit: '₹4,000',
      location: 'Bangalore, KA',
      rating: 4.8,
      reviews: 14,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 3,
      title: 'PlayStation 5 Console + 2 Controllers',
      category: 'Gaming',
      price: '₹750',
      deposit: '₹8,000',
      location: 'Chennai, TN',
      rating: 5.0,
      reviews: 42,
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20 pb-16 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-950/80 border border-brand-500/30 text-brand-400 text-xs font-semibold tracking-wide shadow-glow">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Peer-to-Peer Item Rental Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Rent what you need. <br />
              <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Earn from what you own.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Unlock access to high-value cameras, tools, gaming consoles, and gear without buying. 
              List your idle items safely with QR handover and deposit protection.
            </p>

            {/* Hero Search Box */}
            <div className="pt-4 max-w-2xl mx-auto">
              <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 flex items-center px-4 w-full">
                  <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search cameras, drills, PS5, camping tents..."
                    className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm py-2"
                  />
                </div>
                <Link
                  to="/items"
                  className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Explore Market</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Micro Stats */}
            <div className="pt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center border-t border-slate-800/80">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">100%</p>
                <p className="text-[11px] text-slate-400 font-medium">Verified Deposit Protection</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">QR Code</p>
                <p className="text-[11px] text-slate-400 font-medium">Physical Handover Proof</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">Dual Role</p>
                <p className="text-[11px] text-slate-400 font-medium">One Account Lends & Rents</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Explore Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Browse thousands of available gear items near you</p>
          </div>
          <Link to="/items" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/items?category=${encodeURIComponent(cat.name)}`}
                className={`p-5 rounded-2xl bg-gradient-to-br ${cat.color} border border-slate-800 hover:border-brand-500/50 transition-all duration-200 group flex flex-col items-center text-center space-y-3 shadow-card hover:-translate-y-1`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{cat.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Listings</h2>
            <p className="text-xs text-slate-400 mt-1">Popular items available for immediate booking</p>
          </div>
          <Link to="/items" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <span>Browse All Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 shadow-card flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-700">
                  {item.category}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                  Available
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{item.location}</span>
                    <span className="flex items-center text-amber-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      {item.rating} ({item.reviews})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Daily Rate</p>
                    <p className="text-lg font-bold text-brand-400">{item.price}<span className="text-xs font-normal text-slate-400">/day</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Deposit</p>
                    <p className="text-sm font-semibold text-slate-300">{item.deposit}</p>
                  </div>
                </div>

                <Link
                  to={`/items/${item.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How ShareSpare Works Section */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white">How ShareSpare Works</h2>
            <p className="text-sm text-slate-400 mt-2">Simple, transparent, and secured end-to-end rental workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-brand-950 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Search & Book</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose dates, review transparent daily rates & deposit amounts, and submit a instant booking request with overlap guard validation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-brand-950 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">QR Code Handover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renter shows generated secure QR token upon physical pickup. Lender scans QR to confirm handover and activate rental period.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-brand-950 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Return & Refund</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Return item to lender. Upon inspection approval, security deposit is automatically refunded to your payment method.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
