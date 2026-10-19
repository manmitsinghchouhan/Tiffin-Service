import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChefHat,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ShieldCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

const QUICK_REJECTION_REASONS = [
  'Incomplete or unverified kitchen address details',
  'Food safety standards or basic FSSAI certification required',
  'Provided contact phone number is unreachable or invalid',
  'Duplicate kitchen listing or unserviceable delivery radius',
  'Uploaded kitchen photos/information failed hygiene review',
];

export default function AdminProviders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'PENDING';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [cityFilter, setCityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProviders: 0,
    hasMore: false,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [inspectingProvider, setInspectingProvider] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [rejectingProvider, setRejectingProvider] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch Providers List
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        status: statusFilter,
      };
      if (cityFilter) params.city = cityFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const { data } = await api.get('/admin/providers', { params });
      if (data.success && data.data) {
        setProviders(data.data.providers || []);
        setPagination(
          data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProviders: 0,
            hasMore: false,
          }
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load providers list.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, cityFilter, searchTerm]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Handle Tab Switch
  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
    setSearchParams(newStatus === 'ALL' ? {} : { status: newStatus });
  };

  // Inspect Provider Modal Fetch
  const handleInspect = async (providerId) => {
    setInspectLoading(true);
    setInspectingProvider(null);
    try {
      const { data } = await api.get(`/admin/providers/${providerId}`);
      if (data.success && data.data) {
        setInspectingProvider(data.data.provider);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to inspect provider details.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Approve Provider Action
  const handleApprove = async (provider) => {
    if (!window.confirm(`Are you sure you want to approve "${provider.businessName}"?`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { data } = await api.patch(`/admin/providers/${provider._id}/verify`);
      setSuccessMessage(data.message || 'Provider verified successfully!');
      
      // Close inspect modal if open
      setInspectingProvider(null);

      // Refresh list
      fetchProviders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify provider.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Rejection Dialog
  const openRejectDialog = (provider) => {
    setRejectingProvider(provider);
    setRejectionReason('');
  };

  // Submit Rejection Action
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { data } = await api.patch(
        `/admin/providers/${rejectingProvider._id}/reject`,
        { rejectionReason: rejectionReason.trim() }
      );
      setSuccessMessage(data.message || 'Provider application rejected.');
      
      // Close modals
      setRejectingProvider(null);
      setInspectingProvider(null);

      // Refresh list
      fetchProviders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject provider.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout activePage="providers">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Provider Verification & Oversight
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review onboarding applications, verify kitchen food safety standards, and manage provider status.
          </p>
        </div>

        <button
          onClick={fetchProviders}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        {[
          { id: 'PENDING', label: 'Pending Review', color: 'amber' },
          { id: 'VERIFIED', label: 'Verified Kitchens', color: 'emerald' },
          { id: 'REJECTED', label: 'Rejected', color: 'red' },
          { id: 'ALL', label: 'All Applications', color: 'blue' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & City Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProviders()}
            placeholder="Search by kitchen name, address, or city..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* City Filter */}
        <div className="w-full sm:w-56">
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Cities</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Bangalore">Bangalore</option>
          </select>
        </div>

        <button
          onClick={fetchProviders}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Main Table / Content List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mb-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-medium text-slate-400">Loading providers...</span>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-16 text-center">
            <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No providers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no kitchen applications matching the selected status or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-5">Kitchen Details</th>
                  <th className="py-4 px-5">Owner Contact</th>
                  <th className="py-4 px-5">City & Localities</th>
                  <th className="py-4 px-5">Food Type</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {providers.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Kitchen Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.businessName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm">{p.businessName}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Contact */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-200">{p.userId?.name || 'Owner'}</div>
                      <div className="text-slate-400 text-[11px]">{p.userId?.email}</div>
                      <div className="text-slate-400 text-[11px]">{p.contactNumber || p.userId?.phone}</div>
                    </td>

                    {/* City & Service Areas */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-200 mb-1">{p.city}</div>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.serviceArea?.slice(0, 2).map((area) => (
                          <span
                            key={area}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            {area}
                          </span>
                        ))}
                        {p.serviceArea?.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-semibold self-center">
                            +{p.serviceArea.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Food Type */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          p.foodType === 'VEG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.foodType === 'NON_VEG'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {p.foodType === 'VEG'
                          ? 'Pure Veg'
                          : p.foodType === 'NON_VEG'
                          ? 'Non-Veg'
                          : 'Veg & Non-Veg'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          p.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.verificationStatus === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {p.verificationStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                        {p.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {p.verificationStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                        <span>{p.verificationStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspect Details Button */}
                        <button
                          onClick={() => handleInspect(p._id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Inspect Application"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve Button (shown if not already verified) */}
                        {p.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleApprove(p)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Reject Button (shown if not already rejected) */}
                        {p.verificationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => openRejectDialog(p)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-xs border border-red-500/30 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <strong className="text-white">{pagination.currentPage}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong> (Total: {pagination.totalProviders} kitchens)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-white bg-slate-800 rounded-lg">
                {pagination.currentPage}
              </span>

              <button
                disabled={!pagination.hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Inspect Provider Details */}
      {inspectingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setInspectingProvider(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-800">
              {inspectingProvider.imageUrl ? (
                <img
                  src={inspectingProvider.imageUrl}
                  alt={inspectingProvider.businessName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{inspectingProvider.businessName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      inspectingProvider.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : inspectingProvider.verificationStatus === 'REJECTED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {inspectingProvider.verificationStatus}
                  </span>
                  <span className="text-xs text-slate-400">
                    Applied on: {new Date(inspectingProvider.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Reason Notice if rejected */}
            {inspectingProvider.verificationStatus === 'REJECTED' && inspectingProvider.rejectionReason && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <span className="font-bold block mb-1">Previous Rejection Reason:</span>
                <p>{inspectingProvider.rejectionReason}</p>
              </div>
            )}

            {/* Inspection Details Grid */}
            <div className="space-y-4 text-xs mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Owner Contact:</span>
                  <span className="font-bold text-white block">{inspectingProvider.userId?.name}</span>
                  <span className="text-slate-400 block">{inspectingProvider.userId?.email}</span>
                  <span className="text-slate-400 block">{inspectingProvider.contactNumber || inspectingProvider.userId?.phone}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Dietary Specialization:</span>
                  <span className="font-bold text-white block">
                    {inspectingProvider.foodType === 'VEG'
                      ? 'Pure Vegetarian (100% Veg)'
                      : inspectingProvider.foodType === 'NON_VEG'
                      ? 'Non-Vegetarian'
                      : 'Both (Veg & Non-Veg)'}
                  </span>
                  <span className="text-slate-500 block mt-2 mb-1">City:</span>
                  <span className="font-bold text-white">{inspectingProvider.city}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-1">Kitchen Street Address:</span>
                <span className="font-medium text-slate-200">{inspectingProvider.address}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-2">Delivery Localities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingProvider.serviceArea?.map((area) => (
                    <span
                      key={area}
                      className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-xs border border-slate-700"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {inspectingProvider.description && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Culinary Bio & Description:</span>
                  <p className="text-slate-300 leading-relaxed">{inspectingProvider.description}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setInspectingProvider(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {inspectingProvider.verificationStatus !== 'REJECTED' && (
                  <button
                    onClick={() => openRejectDialog(inspectingProvider)}
                    className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-xs border border-red-500/30 cursor-pointer"
                  >
                    Reject Application
                  </button>
                )}

                {inspectingProvider.verificationStatus !== 'VERIFIED' && (
                  <button
                    onClick={() => handleApprove(inspectingProvider)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Verify & Approve Kitchen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Rejection Reason Dialog */}
      {rejectingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setRejectingProvider(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reject Kitchen Application</h3>
                <p className="text-xs text-slate-400">{rejectingProvider.businessName}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason why this application was rejected (visible to provider)..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                ></textarea>
              </div>

              {/* Quick Template Reason Chips */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Quick reasons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REJECTION_REASONS.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer text-left"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingProvider(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
