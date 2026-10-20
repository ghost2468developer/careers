import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm">Verifying session & role permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Role Required</h2>
        <p className="mt-2 text-sm text-slate-400">
          Your account (<span className="text-slate-200">{user.email}</span>) is currently assigned the{' '}
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
            {user.role}
          </span>{' '}
          role. Only users with the{' '}
          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs font-semibold text-indigo-300">
            ADMIN
          </span>{' '}
          role can access the Admin Console.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Return to User Portal
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
