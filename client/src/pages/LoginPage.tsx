import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { AUTH_OPERATIONS, AuthPayload, graphqlRequest } from '../lib/graphql';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await graphqlRequest<{ login: AuthPayload }>(AUTH_OPERATIONS.LOGIN, {
        input: {
          email: loginEmail,
          password: loginPass,
        },
      });

      setSession(data.login.token, data.login.user);
      if (data.login.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    await performLogin(demoEmail, demoPass);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left column: Value prop + Demo Role Cards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            React + TypeScript + GraphQL + Prisma + PostgreSQL
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Role-Based Authentication & Modular GraphQL API
          </h1>

          <p className="text-sm leading-relaxed text-slate-400">
            Full-stack authentication system featuring JWT sessions, bcrypt password hashing,
            token-based password reset, and granular{' '}
            <span className="text-indigo-300 font-semibold">ADMIN</span> &{' '}
            <span className="text-emerald-300 font-semibold">USER</span> role access control.
          </p>

          {/* 1-Click Demo Role Switcher */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instant Demo Accounts (Seeded in PostgreSQL)
            </p>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('admin@example.com', 'Admin123!')}
                className="group flex flex-col items-start rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-left transition hover:border-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ADMIN ROLE
                  </span>
                  <ArrowRight className="h-4 w-4 text-indigo-400 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-white">admin@example.com</p>
                <p className="text-[11px] text-slate-400">Pass: Admin123!</p>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('user@example.com', 'User123!')}
                className="group flex flex-col items-start rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    <UserCheck className="h-3.5 w-3.5" />
                    USER ROLE
                  </span>
                  <ArrowRight className="h-4 w-4 text-emerald-400 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-white">user@example.com</p>
                <p className="text-[11px] text-slate-400">Pass: User123!</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Sign-in Card */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Sign in to your account</h2>
              <p className="mt-1 text-xs text-slate-400">
                Enter your credentials or select one of the seeded demo accounts.
              </p>
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
                  Email Address
                </label>
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account yet?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Create a new account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
