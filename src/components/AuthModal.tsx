import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(usernameOrEmail, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Authentication failed.');
        }
      } else {
        const res = await register(username, email, password, displayName);
        if (res.success) {
          setSuccessMsg('Account created! Welcome to DevSecExchange.');
          setTimeout(() => onClose(), 800);
        } else {
          setError(res.error || 'Registration failed.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setError(null);
    setLoading(true);
    const res = await login(u, p);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Quick login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              {mode === 'login' ? 'Authentication Portal' : 'Create SecureLab Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="e.g. admin or alex_dev"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. pentester_99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@devsec.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-900/30"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to DevSecExchange' : 'Register Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
            </span>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {mode === 'login' ? 'Create an account' : 'Sign In instead'}
            </button>
          </div>

          {/* Quick Demo Pre-Seeded Accounts */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="block text-[11px] font-mono text-slate-400 mb-2">
              QUICK LAB DEMO ACCOUNTS (1-CLICK SIGN IN)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'DevSecAdmin2026!')}
                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-amber-300">Admin</div>
                <div className="text-[10px] text-amber-400/80 font-mono">admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah_sec', 'SarahSec#2026')}
                className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-blue-300">Security Lead</div>
                <div className="text-[10px] text-blue-400/80 font-mono">sarah_sec</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('alex_dev', 'AlexDev#2026')}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-slate-200">Developer</div>
                <div className="text-[10px] text-slate-400 font-mono">alex_dev</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
