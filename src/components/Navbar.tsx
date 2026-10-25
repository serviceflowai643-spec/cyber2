import React, { useState } from 'react';
import { Shield, Terminal, BookOpen, CheckCircle2, User, LogOut, Settings, Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: 'forum' | 'lab' | 'tests' | 'docs' | 'admin';
  setActiveTab: (tab: 'forum' | 'lab' | 'tests' | 'docs' | 'admin') => void;
  openAuthModal: () => void;
  openProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openProfileModal,
}) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('forum')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
                DevSecExchange
              </span>
              <span className="block text-[11px] text-slate-400 font-mono tracking-wider -mt-1">
                SECURELAB v2.4
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('forum')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'forum'
                ? 'text-blue-400 font-semibold'
                : 'hover:text-white text-slate-300'
            }`}
          >
            Discussions
            {activeTab === 'forum' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'lab'
                ? 'text-blue-400 font-semibold'
                : 'hover:text-white text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            SQLi Lab
            {activeTab === 'lab' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'tests'
                ? 'text-blue-400 font-semibold'
                : 'hover:text-white text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Test Runner
            {activeTab === 'tests' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              activeTab === 'docs'
                ? 'text-blue-400 font-semibold'
                : 'hover:text-white text-slate-300'
            }`}
          >
            Documentation
            {activeTab === 'docs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                activeTab === 'admin'
                  ? 'text-amber-400 font-semibold'
                  : 'hover:text-amber-300 text-amber-400/80'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Admin Panel
              {activeTab === 'admin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / Account */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-md bg-blue-700/40 border border-blue-500/50 flex items-center justify-center font-bold text-blue-300 text-[11px]">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-slate-200 truncate max-w-[110px]">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {user.role === 'admin' ? 'Administrator' : `Rep: ${user.reputation}`}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-medium text-slate-200">{user.displayName}</p>
                    <p className="text-slate-400 font-mono text-[11px] truncate">@{user.username} · {user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      openProfileModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('admin');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-amber-400 hover:text-amber-300"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Administrator Console
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shadow-sm shadow-blue-900/30"
            >
              Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
