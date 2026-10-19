import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'CUSTOMER';

  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasMore: false,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [inspectingUser, setInspectingUser] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [statusModalUser, setStatusModalUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');

  const [deletingUser, setDeletingUser] = useState(null);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        order,
      };
      if (roleFilter && roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const { data } = await api.get('/admin/users', { params });
      if (data.success && data.data) {
        setUsers(data.data.users || []);
        setPagination(
          data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalUsers: 0,
            hasMore: false,
          }
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load users directory.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, statusFilter, searchTerm, sortBy, order]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Tab switch
  const handleRoleTabChange = (newRole) => {
    setRoleFilter(newRole);
    setPage(1);
    setSearchParams(newRole === 'ALL' ? {} : { role: newRole });
  };

  // Inspect User
  const handleInspect = async (user) => {
    setInspectingUser(user);
    setInspectData(null);
    setInspectLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${user._id}`);
      if (data.success && data.data) {
        setInspectData(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch detailed user profile.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Open Status Update Modal
  const openStatusModal = (user) => {
    if (user._id === currentAdmin?.id || user._id === currentAdmin?._id) {
      alert('You cannot modify the status of your own administrator account.');
      return;
    }
    setStatusModalUser(user);
    setSelectedStatus(user.status);
  };

  // Submit Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalUser) return;

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { data } = await api.patch(
        `/admin/users/${statusModalUser._id}/status`,
        { status: selectedStatus }
      );
      setSuccessMessage(data.message || 'User status updated successfully.');
      setStatusModalUser(null);
      if (inspectingUser && inspectingUser._id === statusModalUser._id) {
        setInspectingUser((prev) => ({ ...prev, status: selectedStatus }));
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (user) => {
    if (user._id === currentAdmin?.id || user._id === currentAdmin?._id) {
      alert('You cannot delete your own administrator account.');
      return;
    }
    setDeletingUser(user);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { data } = await api.delete(`/admin/users/${deletingUser._id}`);
      setSuccessMessage(data.message || 'User account permanently deleted.');
      setDeletingUser(null);
      if (inspectingUser && inspectingUser._id === deletingUser._id) {
        setInspectingUser(null);
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user account.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for user avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout activePage="users">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer & User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oversee registered customers, tiffin providers, account access status, and customer order histories.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh List</span>
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

      {/* Role Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        {[
          { id: 'CUSTOMER', label: 'Customers' },
          { id: 'PROVIDER', label: 'Tiffin Providers' },
          { id: 'ADMIN', label: 'Administrators' },
          { id: 'ALL', label: 'All Accounts' },
        ].map((tab) => {
          const isActive = roleFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleRoleTabChange(tab.id)}
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

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by customer name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mb-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-medium text-slate-400">Loading user accounts...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No users found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No accounts match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-5">Contact Details</th>
                  <th className="py-4 px-5">Role</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Joined Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => {
                  const isSelf = u._id === currentAdmin?.id || u._id === currentAdmin?._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 font-bold flex items-center justify-center border border-slate-700 shadow-sm shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px]">ID: {u._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5">
                        <div className="text-slate-300 font-medium">{u.email}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{u.phone || 'No phone'}</div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            u.role === 'CUSTOMER'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : u.role === 'PROVIDER'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => openStatusModal(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-opacity ${
                            isSelf ? 'cursor-default' : 'hover:opacity-80 cursor-pointer'
                          } ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                          }`}
                          title={isSelf ? 'Cannot alter self' : 'Click to change status'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : u.status === 'SUSPENDED'
                                ? 'bg-red-400'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-5 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Inspect Details */}
                          <button
                            onClick={() => handleInspect(u)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Inspect Profile & Orders"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Status Toggle */}
                          {!isSelf && (
                            <button
                              onClick={() => openStatusModal(u)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Account */}
                          {!isSelf && (
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <strong className="text-white">{pagination.currentPage}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong> (Total: {pagination.totalUsers} users)
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

      {/* Modal 1: User Detailed Inspector */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => {
                setInspectingUser(null);
                setInspectData(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                {getInitials(inspectingUser.name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{inspectingUser.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      inspectingUser.role === 'CUSTOMER'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : inspectingUser.role === 'PROVIDER'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {inspectingUser.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      inspectingUser.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {inspectingUser.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Registered: {new Date(inspectingUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {inspectLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-400">Loading user history...</span>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Contact Overview Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Email Address:</span>
                    <span className="font-bold text-white">{inspectingUser.email}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Phone Number:</span>
                    <span className="font-bold text-white">{inspectingUser.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* If Customer: Metrics & Orders */}
                {inspectingUser.role === 'CUSTOMER' && inspectData?.customerData && (
                  <>
                    {/* Customer Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                        <span className="text-xs text-blue-300 font-semibold block mb-1">Total Orders Placed</span>
                        <div className="text-2xl font-black text-white">
                          {inspectData.customerData.metrics.totalOrders}
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <span className="text-xs text-emerald-300 font-semibold block mb-1">Total Lifetime Spent</span>
                        <div className="text-2xl font-black text-white">
                          ₹{inspectData.customerData.metrics.totalSpent?.toLocaleString('en-IN') || 0}
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders List */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-blue-400" />
                        <span>Recent Orders ({inspectData.customerData.recentOrders?.length || 0})</span>
                      </h4>

                      {inspectData.customerData.recentOrders?.length === 0 ? (
                        <div className="p-4 bg-slate-950 rounded-xl text-slate-500 text-center">
                          No orders placed yet.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {inspectData.customerData.recentOrders.map((ord) => (
                            <div
                              key={ord._id}
                              className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-white block">
                                  {ord.providerId?.businessName || 'Tiffin Provider'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {new Date(ord.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-400 block">
                                  ₹{ord.totalAmount}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* If Provider: Kitchen Details */}
                {inspectingUser.role === 'PROVIDER' && inspectData?.providerData && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Associated Kitchen Profile</span>
                    </h4>

                    {inspectData.providerData.profile ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">
                            {inspectData.providerData.profile.businessName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inspectData.providerData.profile.verificationStatus}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs">
                          {inspectData.providerData.profile.address}, {inspectData.providerData.profile.city}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Food Type: <strong>{inspectData.providerData.profile.foodType}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 rounded-xl text-slate-500 text-center">
                        Provider has not completed Step 2 kitchen onboarding yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between mt-6">
              <button
                onClick={() => openStatusModal(inspectingUser)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Change Account Status
              </button>

              <button
                onClick={() => {
                  setInspectingUser(null);
                  setInspectData(null);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Update Status Dialog */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setStatusModalUser(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Update Account Status</h3>
                <p className="text-xs text-slate-400">{statusModalUser.name}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Select Status
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'ACTIVE', label: 'Active', desc: 'Full access to place orders or operate services', color: 'emerald' },
                    { id: 'INACTIVE', label: 'Inactive', desc: 'Account is temporarily dormant', color: 'slate' },
                    { id: 'SUSPENDED', label: 'Suspended', desc: 'Blocked from signing in or transacting', color: 'red' },
                  ].map((st) => (
                    <label
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedStatus === st.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountStatus"
                        value={st.id}
                        checked={selectedStatus === st.id}
                        onChange={() => setSelectedStatus(st.id)}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{st.label}</span>
                        <span className="text-[11px] text-slate-400">{st.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Confirmation Dialog */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDeletingUser(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-red-400">Irreversible action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})? 
              This will permanently purge this account and all associated profile records.
            </p>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
