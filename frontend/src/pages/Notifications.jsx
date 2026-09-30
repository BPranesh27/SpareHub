import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notification.service';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      const list = data.notifications || data || [];
      setNotifications(list);
      const count = list.filter((n) => !n.isRead && !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleItemClick = (n) => {
    if (!n.isRead && !n.read) {
      handleMarkAsRead(n.id);
    }
    if (n.relatedEntityType === 'BOOKING' && n.relatedEntityId) {
      navigate(`/bookings/${n.relatedEntityId}`);
    } else if (n.relatedEntityType === 'ITEM' && n.relatedEntityId) {
      navigate(`/items/${n.relatedEntityId}`);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'BOOKING_CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'PAYMENT_SUCCESS':
      case 'REFUND_PROCESSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'HANDOVER_READY':
      case 'HANDOVER_COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DAMAGE_REPORTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'REVIEW_RECEIVED':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatTypeLabel = (type) => {
    if (!type) return 'System';
    return type.replace('_', ' ');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') {
      return !n.isRead && !n.read;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Stay updated on your rental activity, handovers, payments and reviews.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold rounded-xl transition-all duration-200 shadow-md shrink-0 self-start sm:self-auto"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'UNREAD'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List Container */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 animate-pulse flex flex-col gap-2"
              >
                <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-6 rounded-2xl text-center space-y-3">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadNotifications}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-xs font-medium transition-colors border border-red-500/30"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">No notifications yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {filter === 'UNREAD'
                ? "You've read all your notifications!"
                : 'When you rent items, receive bookings, or get reviews, updates will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => {
              const isRead = n.isRead || n.read;
              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    !isRead
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/10 hover:border-amber-500/60'
                      : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Dot */}
                    <div
                      className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                        !isRead ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-slate-700'
                      }`}
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadge(
                            n.type
                          )}`}
                        >
                          {formatTypeLabel(n.type)}
                        </span>
                        <h3
                          className={`text-base font-semibold ${
                            !isRead ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {n.title}
                        </h3>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-500">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {!isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs rounded-xl font-medium transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    {n.relatedEntityId && (
                      <span className="text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                        View &rarr;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
