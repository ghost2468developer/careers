import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  ShieldCheck,
  Lock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  AuditLog,
  graphqlRequest,
  User,
  USER_OPERATIONS,
} from '../lib/graphql';
import { useAuth } from '../context/AuthContext';

export const UserDashboardPage: React.FC = () => {
  const { user, updateUserState } = useAuth();

  const [profile, setProfile] = useState<User | null>(user);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await graphqlRequest<{
        myProfile: User;
        myAuditLogs: AuditLog[];
      }>(USER_OPERATIONS.MY_DASHBOARD);

      setProfile(data.myProfile);
      setName(data.myProfile.name);
      setAuditLogs(data.myAuditLogs);
      updateUserState(data.myProfile);
    } catch (err) {
      console.error('Error loading user dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  }, [updateUserState]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const data = await graphqlRequest<{ updateProfile: User }>(
        USER_OPERATIONS.UPDATE_PROFILE,
        {
          input: { name },
        }
      );
      setProfile(data.updateProfile);
      updateUserState(data.updateProfile);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      await fetchDashboard();
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await graphqlRequest<{ changePassword: boolean }>(
        USER_OPERATIONS.CHANGE_PASSWORD,
        {
          input: {
            currentPassword,
            newPassword,
          },
        }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      await fetchDashboard();
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xl font-bold text-emerald-300">
            {(profile?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  profile?.role === 'ADMIN'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile?.role} ROLE
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                Active Account
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {profile?.email} · Powered by{' '}
              <code className="text-sky-300">src/components/user/resolvers.ts</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {profile?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
            >
              <ShieldCheck className="h-4 w-4" />
              Open Admin Console
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Assigned Role & Permissions
          </div>
          <p className="mt-2 text-lg font-bold text-white">{profile?.role}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {profile?.role === 'ADMIN'
              ? 'Full access to User Portal + Admin User & Role Management'
              : 'Standard User access to profile, password & personal activity logs'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Clock className="h-4 w-4 text-indigo-400" />
            Last Sign-In
          </div>
          <p className="mt-2 text-lg font-bold text-white">
            {profile?.lastLoginAt
              ? new Date(profile.lastLoginAt).toLocaleString()
              : 'Just now'}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Authenticated via JWT Bearer token</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Calendar className="h-4 w-4 text-sky-400" />
            Account Created
          </div>
          <p className="mt-2 text-lg font-bold text-white">
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString()
              : 'Today'}
          </p>
          <p className="mt-0.5 text-xs font-mono text-slate-500 truncate">
            ID: {profile?.id}
          </p>
        </div>
      </div>

      {/* Main Grid: Edit Profile + Change Password + Activity Log */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Forms */}
        <div className="space-y-6 lg:col-span-5">
          {/* Edit Profile Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <UserIcon className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Profile Information</h2>
            </div>

            {profileMsg && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
                  profileMsg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Email Address (Primary Identifier)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-800/60 bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Change Password</h2>
            </div>

            {passwordMsg && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
                  passwordMsg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {savingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Personal Security & Audit Log */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Account Security & Activity Log
                  </h2>
                  <p className="text-xs text-slate-400">
                    Recent events recorded in PostgreSQL for your account
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                {auditLogs.length} events
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  No activity logs found yet.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-md bg-indigo-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-300">
                        {log.action}
                      </span>
                      <p className="text-xs text-slate-300">{log.details}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
