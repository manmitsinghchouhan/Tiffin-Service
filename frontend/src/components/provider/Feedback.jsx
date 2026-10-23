import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Search,
  RefreshCw,
  ThumbsUp,
  AlertCircle,
  Filter,
  Calendar,
  CheckCircle2,
  Smile,
  Frown,
  Loader2,
  TrendingUp,
  User
} from 'lucide-react';
import api from '../../services/api';

export default function Feedback({ onToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {
      averageRating: 0,
      totalReviews: 0,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    reviews: [],
  });

  const [ratingFilter, setRatingFilter] = useState('ALL'); // 'ALL' | '5' | '4' | '3' | '2' | '1'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback/provider', {
        params: { ratingFilter },
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
      onToast?.(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter]);

  const { summary, reviews } = data;
  const totalReviews = summary.totalReviews || 0;
  const avgRating = summary.averageRating || 0;

  // Filter reviews locally by search query
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const customerName = r.customerId?.name?.toLowerCase() || '';
    const reviewText = r.review?.toLowerCase() || '';
    return customerName.includes(query) || reviewText.includes(query);
  });

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-7 pb-12 animate-in fade-in duration-200">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              Customer Feedback & Reviews
            </h1>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>{avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : 'New'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Real customer ratings, satisfaction breakdown, and qualitative meal feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Score Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-7 shadow-xl shadow-slate-900/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kitchen Reputation
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tight text-white">
                {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-xs text-slate-300 leading-relaxed">
              {totalReviews === 0
                ? "You haven't received any reviews yet. Customer ratings will appear here as soon as orders are delivered."
                : avgRating >= 4.5
                ? 'Excellent performance! Subscribers love your culinary quality and punctuality.'
                : avgRating >= 3.5
                ? 'Good overall ratings. Review feedback to pinpoint areas for taste and portion improvements.'
                : 'Attention needed. Review customer feedback to improve meal quality and service.'}
            </p>
          </div>
        </div>

        {/* Right: Star Distribution Progress Bars */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-center">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Rating Distribution</span>
          </h2>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.breakdown?.[stars] || 0;
              const pct = getPercentage(count);
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 font-bold text-slate-700 shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4
                          ? 'bg-amber-400'
                          : stars === 3
                          ? 'bg-amber-300'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="w-16 text-right font-medium text-slate-500 text-[11px] shrink-0">
                    <span className="font-bold text-slate-700">{count}</span> ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Review Filter Bar & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Star Rating Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Reviews', count: totalReviews },
            { id: '5', label: '5 Stars', count: summary.breakdown?.[5] || 0 },
            { id: '4', label: '4 Stars', count: summary.breakdown?.[4] || 0 },
            { id: '3', label: '3 Stars', count: summary.breakdown?.[3] || 0 },
            { id: '2', label: '2 Stars', count: summary.breakdown?.[2] || 0 },
            { id: '1', label: '1 Star', count: summary.breakdown?.[1] || 0 },
          ].map((pill) => {
            const isActive = ratingFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setRatingFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-700/80 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 4. Reviews List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading customer reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3.5 border border-amber-100">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {ratingFilter !== 'ALL' || searchQuery
              ? 'No matching reviews'
              : 'No customer feedback yet'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {ratingFilter !== 'ALL' || searchQuery
              ? 'Try adjusting your rating filter or search term to see other feedback.'
              : 'As customers receive meals, their star ratings and written reviews will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const customerName = rev.customerId?.name || 'Customer';
            const firstLetter = customerName.charAt(0).toUpperCase();

            return (
              <div
                key={rev._id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-150"
              >
                <div>
                  {/* Review Header: User Info & Star Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
                        {firstLetter}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {customerName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(rev.createdAt)}
                          </span>
                          {rev.type === 'COMPLAINT' && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                              Complaint
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  {/* Review Body */}
                  <div className="mt-3.5">
                    {rev.review ? (
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                        "{rev.review}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Customer submitted a {rev.rating}-star rating without written notes.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Verified Customer Review</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
