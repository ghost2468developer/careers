import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import {
  AUTH_OPERATIONS,
  ForgotPasswordPayload,
  graphqlRequest,
} from '../lib/graphql';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('user@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await graphqlRequest<{ forgotPassword: ForgotPasswordPayload }>(
        AUTH_OPERATIONS.FORGOT_PASSWORD,
        {
          input: { email },
        }
      );
      setResult(data.forgotPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!result?.resetToken) return;
    navigator.clipboard.writeText(result.resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reset Your Password</h1>
            <p className="text-xs text-slate-400">
              Generate a cryptographic reset token stored in PostgreSQL
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Account Email Address
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmail('user@example.com')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Use Demo User
                </button>
                <span className="text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setEmail('admin@example.com')}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Use Demo Admin
                </button>
              </div>
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Reset Token...
              </>
            ) : (
              <>
                Send Password Reset Token
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {result && result.resetToken && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="text-xs text-emerald-200">
                <p className="font-semibold">Reset Token Created in PostgreSQL</p>
                <p className="mt-0.5 text-emerald-300/80">{result.message}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <code className="truncate text-[11px] font-mono text-amber-300">
                  {result.resetToken}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/reset-password?token=${encodeURIComponent(result.resetToken || '')}`)
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              Complete Password Reset with Token
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-5 text-xs">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
          <Link
            to="/reset-password"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Have a reset token?
          </Link>
        </div>
      </div>
    </div>
  );
};
