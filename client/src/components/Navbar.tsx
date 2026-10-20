import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  LogOut,
  Code2,
  BookOpenCheck,
  KeyRound,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                Matric<span className="text-emerald-400">Prep</span>
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                Grade 10–12 Exam Revision
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive('/dashboard') || location.pathname.startsWith('/exam/')
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <BookOpenCheck className="h-4 w-4 text-emerald-400" />
                  Learner Exam Prep (Grade {user.grade})
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive('/admin')
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    Admin Progress & Papers
                  </Link>
                )}
              </>
            )}

            <Link
              to="/architecture"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive('/architecture')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Code2 className="h-4 w-4 text-sky-400" />
              API Modules & GraphQL
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {user.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                        user.role === 'ADMIN'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'ADMIN' : `LEARNER · GR ${user.grade}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive('/login')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register Learner
              </Link>
              <Link
                to="/forgot-password"
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium transition ${
                  isActive('/forgot-password') || isActive('/reset-password')
                    ? 'border-amber-500/40 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Reset Password
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {user && (
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
              isActive('/dashboard') ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
            }`}
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
            Grade {user.grade} Prep
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                isActive('/admin') ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Console
            </Link>
          )}
          <Link
            to="/architecture"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
              isActive('/architecture') ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            API Schema
          </Link>
        </div>
      )}
    </header>
  );
};
