import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Search, Shield, Building2, User as UserIcon,
  CheckCircle, ShieldAlert, Loader2, X, Edit3, Trash2, Key,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { adminApi } from '../../api';
import type { User } from '../../types';

const roleBadges: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  SUPER_ADMIN: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Shield,
    label: 'Super Admin',
  },
  RESELLER: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Building2,
    label: 'Reseller',
  },
  USER: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: UserIcon,
    label: 'Customer',
  },
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    phone: '',
    status: 'active',
    organization_id: '',
  });

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    phone: '',
    status: 'active',
    organization_id: '',
  });

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter],
    queryFn: () => adminApi.users({ search, role: roleFilter, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  // Fetch Organizations for dropdown
  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'organizations-list'],
    queryFn: () => adminApi.organizations({ per_page: 100 }).then(r => r.data),
    staleTime: 60000,
  });

  const users: User[] = data?.data ?? [];
  const organizations: any[] = orgsData?.data ?? [];

  // Metrics calculation
  const totalUsers = users.length;
  const superAdminCount = users.filter(u => {
    const roles = (u.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    return roles.includes('SUPER_ADMIN');
  }).length;
  const resellerCount = users.filter(u => {
    const roles = (u.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    return roles.includes('RESELLER');
  }).length;
  const customerCount = users.filter(u => {
    const roles = (u.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    return roles.includes('USER');
  }).length;

  // Add User Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        phone: '',
        status: 'active',
        organization_id: '',
      });
      setSuccessMessage('User account created successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to create user.');
    },
  });

  // Edit User Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to update user.');
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSuccessMessage('User deleted.');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to delete user.');
    },
  });

  // Open Edit Modal
  const openEditModal = (u: User) => {
    setEditingUser(u);
    const primaryRole = (u.roles && u.roles.length > 0)
      ? (typeof u.roles[0] === 'string' ? u.roles[0] : (u.roles[0] as any).name)
      : 'USER';

    setEditForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: primaryRole,
      phone: u.phone || '',
      status: u.status || 'active',
      organization_id: (u as any).current_organization_id || '',
    });
    setErrorMessage('');
  };

  const getPrimaryRole = (u: User): string => {
    const roles = (u.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
    if (roles.includes('RESELLER')) return 'RESELLER';
    return 'USER';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            User Directory & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage all platform accounts: provision Super Admins, Resellers, and Customers with granular roles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAddModalOpen(true);
            setErrorMessage('');
          }}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setRoleFilter('')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            roleFilter === '' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">All Users</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalUsers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('SUPER_ADMIN')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            roleFilter === 'SUPER_ADMIN' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Super Admins</div>
            <div className="text-xl font-bold text-purple-700 mt-1">{superAdminCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('RESELLER')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            roleFilter === 'RESELLER' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Resellers</div>
            <div className="text-xl font-bold text-indigo-600 mt-1">{resellerCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('USER')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            roleFilter === 'USER' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Customers</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{customerCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admins Only</option>
          <option value="RESELLER">Resellers Only</option>
          <option value="USER">Customers Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading user directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your first user or adjust your filter parameters.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add User Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Organization / Tenant</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map(u => {
                  const roleKey = getPrimaryRole(u);
                  const badge = roleBadges[roleKey] || roleBadges.USER;
                  const Icon = badge.icon;
                  const currentOrg = (u as any).current_organization;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {(u.name || u.email || 'U').trim().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{u.name || 'Unnamed User'}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {currentOrg ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{currentOrg.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Platform Level</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[u.status || 'active']}`}>
                          {u.status === 'active' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <ShieldAlert className="w-3 h-3 text-red-500" />
                          )}
                          <span className="capitalize">{u.status || 'active'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(u.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit User & Roles"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user ${u.email}?`)) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New User</h2>
                  <p className="text-xs text-slate-500">Create an account and assign roles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage('');
                createMutation.mutate(addForm);
              }}
              className="space-y-4 text-xs"
            >
              {/* Role Selection Radio Cards */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">Select User Role *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full platform & infrastructure control', icon: Shield, color: 'text-purple-600', border: 'border-purple-500' },
                    { id: 'RESELLER', label: 'Reseller', desc: 'Owns an organization, sells to customers', icon: Building2, color: 'text-indigo-600', border: 'border-indigo-500' },
                    { id: 'USER', label: 'Customer', desc: 'Purchases and uses subscribed services', icon: UserIcon, color: 'text-emerald-600', border: 'border-emerald-500' },
                  ].map(r => {
                    const isSelected = addForm.role === r.id;
                    const Icon = r.icon;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setAddForm(f => ({ ...f, role: r.id }))}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${r.border} bg-slate-50 shadow-xs`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                          <Icon className={`w-4 h-4 ${r.color}`} />
                          <span>{r.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Organization Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Organization (Optional)</label>
                  <select
                    value={addForm.organization_id}
                    onChange={e => setAddForm(f => ({ ...f, organization_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">No Organization (Platform Level)</option>
                    {organizations.map((org: any) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={addForm.status}
                    onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">Active (Immediate Access)</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Edit User Account</h2>
                  <p className="text-xs text-slate-500">{editingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage('');
                updateMutation.mutate({
                  id: editingUser.id,
                  payload: editForm,
                });
              }}
              className="space-y-4 text-xs"
            >
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">User Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield, color: 'text-purple-600', border: 'border-purple-500' },
                    { id: 'RESELLER', label: 'Reseller', icon: Building2, color: 'text-indigo-600', border: 'border-indigo-500' },
                    { id: 'USER', label: 'Customer', icon: UserIcon, color: 'text-emerald-600', border: 'border-emerald-500' },
                  ].map(r => {
                    const isSelected = editForm.role === r.id;
                    const Icon = r.icon;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setEditForm(f => ({ ...f, role: r.id }))}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${r.border} bg-slate-50 shadow-xs`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Icon className={`w-4 h-4 ${r.color}`} />
                          <span>{r.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reset Password (leave empty to keep)</label>
                  <input
                    type="text"
                    placeholder="New password..."
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Organization</label>
                  <select
                    value={editForm.organization_id}
                    onChange={e => setEditForm(f => ({ ...f, organization_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">No Organization (Platform Level)</option>
                    {organizations.map((org: any) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
