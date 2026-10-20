import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  AUTH_OPERATIONS,
  AuthPayload,
  graphqlRequest,
  VerifyResetTokenPayload,
} from '../lib/graphql';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenInfo, setTokenInfo] = useState<VerifyResetTokenPayload | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token.trim()) {
      setTokenInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setVerifying(true);
      try {
        const data = await graphqlRequest<{ verifyResetToken: VerifyResetTokenPayload }>(
          AUTH_OPERATIONS.VERIFY_RESET_TOKEN,
          { token: token.trim() }
        );
        setTokenInfo(data.verifyResetToken);
      } catch {
        setTokenInfo(null);
      } finally {
        setVerifying(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await graphqlRequest<{ resetPassword: AuthPayload }>(
        AUTH_OPERATIONS.RESET_PASSWORD,
        {
          input: {
            token: token.trim(),
            newPassword,
          },
        }
      );

      setSession(data.resetPassword.token, data.resetPassword.user);
      if (data.resetPassword.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Set New Password</h1>
            <p className="text-xs text-slate-400">
              Enter your reset token and choose a new password
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token here..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 font-mono text-xs text-amber-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {verifying && (
              <p className="mt-1.5 text-[11px] text-slate-400">Verifying token...</p>
            )}
            {!verifying && tokenInfo && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  tokenInfo.valid
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {tokenInfo.valid ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>
                      Valid token for <strong className="text-white">{tokenInfo.email}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{tokenInfo.message}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (tokenInfo !== null && !tokenInfo.valid)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                Reset Password & Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-5 text-xs">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Request New Token
          </Link>
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
