import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics.service';
import {
  TrendingUp,
  Package,
  CalendarCheck,
  Zap,
  CheckCircle2,
  Star,
  Shield,
  ShieldAlert,
  RotateCcw,
  XCircle,
  RefreshCw,
  Download,
  PlusCircle,
  AlertCircle,
  Layers,
  Award,
  DollarSign
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Analytics = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [itemsPerformance, setItemsPerformance] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topItems, setTopItems] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTopTab, setActiveTopTab] = useState('mostBooked');

  const fetchAnalyticsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [sumRes, itemsRes, trendRes, topRes] = await Promise.all([
        analyticsService.getAnalyticsSummary(),
        analyticsService.getItemPerformance(),
        analyticsService.getRevenueTrend(),
        analyticsService.getTopItems()
      ]);

      setSummary(sumRes.data || null);
      setItemsPerformance(itemsRes.data || []);
      setRevenueTrend(trendRes.data || []);
      setTopItems(topRes.data || null);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(err.response?.data?.message || 'Failed to load lender analytics dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Export Item Performance CSV
  const handleExportCsv = () => {
    if (!itemsPerformance || itemsPerformance.length === 0) return;

    const headers = ['Item ID', 'Item Name', 'Category', 'Total Bookings', 'Completed', 'Active', 'Cancelled', 'Revenue (INR)', 'Rating', 'Reviews'];
    const rows = itemsPerformance.map(i => [
      i.itemId,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.totalBookings,
      i.completedBookings,
      i.activeBookings,
      i.cancelledBookings,
      i.totalRevenue,
      i.averageRating,
      i.totalReviews
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sharespare_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner label="Loading lender analytics & financial trends..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-6 rounded-3xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm space-y-3 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Analytics Unavailable</h3>
          <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchAnalyticsData()}
            className="mt-2 inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const hasNoItems = summary && summary.totalItems === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-24 text-slate-100">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" />
            <span>Lender Performance Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Analytics Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <span className="text-slate-200 font-semibold">{user?.name}</span>! Track earnings, bookings, and item performance.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {itemsPerformance.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {hasNoItems ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Rental Activity Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              List your first item on ShareSpare to start receiving bookings and viewing performance metrics.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/items/add"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg shadow-brand-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your First Item</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Primary KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Total Items */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all shadow-card">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Items</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{summary?.totalItems || 0}</div>
              <p className="text-[10px] text-slate-500">Listed on marketplace</p>
            </div>

            {/* Total Bookings */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all shadow-card">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Bookings</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{summary?.totalBookings || 0}</div>
              <p className="text-[10px] text-slate-500">All-time reservations</p>
            </div>

            {/* Active Rentals */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all shadow-card">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">{summary?.activeRentals || 0}</div>
              <p className="text-[10px] text-slate-500">Currently out on rent</p>
            </div>

            {/* Completed Rentals */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all shadow-card">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-teal-300">{summary?.completedRentals || 0}</div>
              <p className="text-[10px] text-slate-500">Successfully returned</p>
            </div>

            {/* Total Revenue */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-brand-500/30 space-y-3 hover:border-brand-500/50 transition-all shadow-lg shadow-brand-500/5">
              <div className="flex items-center justify-between text-brand-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-400">₹{summary?.totalRevenue || 0}</div>
              <p className="text-[10px] text-slate-400">Net rental income</p>
            </div>

            {/* Average Rating */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all shadow-card">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-400">{summary?.averageRating || '0.0'} ★</div>
              <p className="text-[10px] text-slate-500">Lender average score</p>
            </div>

          </div>

          {/* Secondary Financial Metrics Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Total Deposits Managed</span>
                </div>
                <div className="text-lg font-bold text-slate-200">₹{summary?.totalDeposits || 0}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Damage Deductions</span>
                </div>
                <div className="text-lg font-bold text-amber-400">₹{summary?.totalDamageDeductions || 0}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Net Refunds Issued</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">₹{summary?.totalRefunds || 0}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cancelled Bookings</span>
                </div>
                <div className="text-lg font-bold text-rose-400">{summary?.cancelledBookings || 0}</div>
              </div>

            </div>
          </div>

          {/* Monthly Revenue Trend SVG Chart */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Monthly Revenue Trend</h3>
                <p className="text-xs text-slate-400">Income and booking volume over time</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-950 border border-brand-500/30 text-brand-400 text-xs font-semibold">
                Monthly Aggregate
              </span>
            </div>

            {revenueTrend.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No revenue trend data accumulated yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Visual Bar Chart */}
                <div className="h-48 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 overflow-x-auto">
                  {revenueTrend.map((t, idx) => {
                    const maxRev = Math.max(...revenueTrend.map(r => Number(r.revenue) || 100), 100);
                    const revVal = Number(t.revenue) || 0;
                    const heightPercent = Math.max(Math.round((revVal / maxRev) * 100), 12);

                    return (
                      <div key={t.period || idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-[10px] font-bold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ₹{revVal}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-brand-600 to-emerald-400 rounded-t-lg group-hover:brightness-125 transition-all relative"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {t.bookingCount} {t.bookingCount === 1 ? 'booking' : 'bookings'}
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 truncate w-full text-center">
                          {t.period}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Performing Items Section */}
          {topItems && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Top Performing Items</h3>
                </div>

                {/* Tab Controls */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTopTab('mostBooked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTopTab === 'mostBooked'
                        ? 'bg-brand-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Most Booked
                  </button>
                  <button
                    onClick={() => setActiveTopTab('highestRevenue')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTopTab === 'highestRevenue'
                        ? 'bg-brand-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Highest Revenue
                  </button>
                  <button
                    onClick={() => setActiveTopTab('highestRated')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTopTab === 'highestRated'
                        ? 'bg-brand-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Highest Rated
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(topItems[activeTopTab] || []).map((item, index) => (
                  <div
                    key={item.itemId}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/20">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                        {item.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.itemName}</h4>
                      <p className="text-xs text-brand-400 font-semibold mt-0.5">₹{item.totalRevenue} Total Revenue</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-800/80">
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">Bookings</p>
                        <p className="font-bold text-slate-200">{item.totalBookings}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">Completed</p>
                        <p className="font-bold text-emerald-400">{item.completedBookings}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">Rating</p>
                        <p className="font-bold text-amber-400">{item.averageRating} ★</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Item Performance Detailed Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Item-Wise Performance Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {itemsPerformance.length} {itemsPerformance.length === 1 ? 'Item' : 'Items'} Listed
              </span>
            </div>

            {itemsPerformance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No items listed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Bookings</th>
                      <th className="py-3 px-4 text-center">Completed</th>
                      <th className="py-3 px-4 text-center">Active</th>
                      <th className="py-3 px-4 text-center">Cancelled</th>
                      <th className="py-3 px-4 text-right">Revenue</th>
                      <th className="py-3 px-4 text-center">Rating</th>
                      <th className="py-3 px-4 text-center">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {itemsPerformance.map((item) => (
                      <tr key={item.itemId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <Link to={`/items/${item.itemId}`} className="hover:text-brand-400 transition-colors">
                            {item.itemName}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">{item.totalBookings}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{item.completedBookings}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-400">{item.activeBookings}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-rose-400">{item.cancelledBookings}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-brand-400">₹{item.totalRevenue}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-400">{item.averageRating} ★</td>
                        <td className="py-3.5 px-4 text-center text-slate-400">{item.totalReviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

    </div>
  );
};

export default Analytics;
