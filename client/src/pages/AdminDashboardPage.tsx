import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  UserPlus,
  KeyRound,
  Activity,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import {
  ADMIN_OPERATIONS,
  AdminStats,
  AuditLog,
  ForgotPasswordPayload,
  graphqlRequest,
  PasswordResetTokenInfo,
  Role,
  User,
} from '../lib/graphql';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'audit'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [resetTokens, setResetTokens] = useState<PasswordResetTokenInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  // Create user modal/card state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('USER');
  const [creatingUser, setCreatingUser] = useState(false);

  // Action feedback
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    resetToken?: string | null;
  } | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await graphqlRequest<{
        adminStats: AdminStats;
        adminUsers: User[];
        adminResetTokens: PasswordResetTokenInfo[];
        adminAuditLogs: AuditLog[];
      }>(ADMIN_OPERATIONS.ADMIN_DASHBOARD, {
        search: search.trim() || null,
        role: roleFilter === 'ALL' ? null : roleFilter,
        isActive: null,
      });

      setStats(data.adminStats);
      setUsers(data.adminUsers);
      setResetTokens(data.adminResetTokens);
      setAuditLogs(data.adminAuditLogs);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load admin console data',
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setCreatingUser(true);

    try {
      const data = await graphqlRequest<{ adminCreateUser: User }>(
        ADMIN_OPERATIONS.CREATE_USER,
        {
          input: {
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
          },
        }
      );

      setBanner({
        type: 'success',
        text: `Created ${data.adminCreateUser.role} account for ${data.adminCreateUser.email}`,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('USER');
      setShowCreateModal(false);
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create user',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const nextRole: Role = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.UPDATE_USER_ROLE, {
        userId: targetUser.id,
        role: nextRole,
      });
      setBanner({
        type: 'success',
        text: `Updated ${targetUser.email} role to ${nextRole}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role',
      });
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.TOGGLE_USER_STATUS, {
        userId: targetUser.id,
        isActive: !targetUser.isActive,
      });
      setBanner({
        type: 'success',
        text: `${!targetUser.isActive ? 'Activated' : 'Deactivated'} account ${targetUser.email}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update status',
      });
    }
  };

  const handleTriggerReset = async (targetUser: User) => {
    setBanner(null);
    try {
      const data = await graphqlRequest<{
        adminTriggerPasswordReset: ForgotPasswordPayload;
      }>(ADMIN_OPERATIONS.TRIGGER_PASSWORD_RESET, {
        userId: targetUser.id,
      });

      setBanner({
        type: 'success',
        text: data.adminTriggerPasswordReset.message,
        resetToken: data.adminTriggerPasswordReset.resetToken,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to generate reset token',
      });
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.DELETE_USER, {
        userId: targetUser.id,
      });
      setBanner({
        type: 'success',
        text: `Deleted user ${targetUser.email}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete user',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-0.5 text-xs font-bold text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              ADMIN ROLE CONSOLE
            </span>
            <code className="rounded bg-slate-950/90 px-2 py-0.5 text-[11px] text-sky-300 border border-slate-800">
              src/components/admin/&#123;schema.graphql.ts, resolvers.ts&#125;
            </code>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">
            User, Role & Security Administration
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Manage users, assign ADMIN/USER roles, issue password reset tokens, and audit PostgreSQL events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(!showCreateModal)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
          >
            <UserPlus className="h-4 w-4" />
            Create New User
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
            banner.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{banner.text}</span>
          </div>

          {banner.resetToken && (
            <div className="flex items-center gap-2">
              <code className="rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-amber-300">
                {banner.resetToken.slice(0, 18)}...
              </code>
              <button
                onClick={() =>
                  navigate(`/reset-password?token=${encodeURIComponent(banner.resetToken || '')}`)
                }
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Open Reset Link
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create User Form Drawer */}
      {showCreateModal && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-400" />
              Provision New Account (Admin Mutation)
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-5">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full Name"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Initial Password"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="USER">Role: USER</option>
              <option value="ADMIN">Role: ADMIN</option>
            </select>
            <button
              type="submit"
              disabled={creatingUser}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Total Users</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats?.totalUsers ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="text-[11px] font-medium text-indigo-300">Admins (ADMIN)</p>
          <p className="mt-1 text-2xl font-extrabold text-indigo-300">{stats?.adminCount ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[11px] font-medium text-emerald-300">Standard (USER)</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-300">{stats?.userCount ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Active Accounts</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats?.activeUsers ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[11px] font-medium text-amber-300">Active Reset Tokens</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-300">
            {stats?.activeResetTokens ?? '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Audit Events</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {stats?.totalAuditEvents ?? '-'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Users & Roles ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'tokens'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Password Reset Tokens ({resetTokens.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            System Audit Trail ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | Role)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN Only</option>
              <option value="USER">USER Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Users & Role Management */}
      {activeTab === 'users' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-4 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-normal text-slate-400">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf}
                            title="Switch Role between ADMIN and USER"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                            Make {u.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                          </button>

                          <button
                            onClick={() => handleTriggerReset(u)}
                            title="Generate Password Reset Token"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20"
                          >
                            <KeyRound className="h-3 w-3" />
                            Reset Token
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                          >
                            <Power className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf}
                            title="Delete User"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Password Reset Tokens */}
      {activeTab === 'tokens' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Reset Token</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Expires At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {resetTokens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No password reset tokens generated yet. Click &quot;Reset Token&quot; on any user or use the Forgot Password page.
                    </td>
                  </tr>
                ) : (
                  resetTokens.map((t) => {
                    const isExpired = new Date(t.expiresAt).getTime() < Date.now();
                    const isUsed = Boolean(t.usedAt);
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{t.userName}</div>
                          <div className="text-slate-400">{t.userEmail}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-amber-300">
                          {t.token.slice(0, 20)}...
                        </td>
                        <td className="px-4 py-3.5">
                          {isUsed ? (
                            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
                              Used
                            </span>
                          ) : isExpired ? (
                            <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] text-rose-300">
                              Expired
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {new Date(t.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {!isUsed && !isExpired && (
                            <button
                              onClick={() =>
                                navigate(`/reset-password?token=${encodeURIComponent(t.token)}`)
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                            >
                              Use Token
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Actor / User</th>
                  <th className="px-4 py-3.5">Details</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white">{log.userName}</div>
                      <div className="text-slate-400">{log.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{log.details}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
