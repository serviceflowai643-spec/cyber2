import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, Users, FileText, MessageSquare, History, RefreshCw, Ban, CheckCircle, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import { AuditLog } from '../types.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, logsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminLogs(50, logFilter),
      ]);
      setStats(statsData);
      setUsersList(usersData.users || []);
      setAuditLogs(logsData.logs || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [logFilter]);

  const handleToggleBan = async (targetId: number, currentBan: boolean) => {
    try {
      await api.toggleUserBan(targetId, !currentBan);
      setActionSuccess(`User ${!currentBan ? 'suspended' : 'unbanned'} successfully.`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      await api.resetDatabase();
      setResetModalOpen(false);
      setActionSuccess('Database fully reset and reseeded with clean synthetic lab data.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Database reset failed.');
    } finally {
      setResetting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">403 — Unauthorized Access</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The administrator control plane requires verified administrative credentials. Sign in as <code className="text-blue-300 font-mono">admin</code> to view this view.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-[11px] font-semibold">
              ADMINISTRATIVE CONTROL PLANE
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ROLE-BASED AUTHORIZATION ENFORCED
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            SecureLab Management & Audit Console
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Monitor accounts, review tamper-evident audit logs, moderate discussions, and control database state. All administrative endpoints require valid server-side session checks.
          </p>
        </div>

        <button
          onClick={() => setResetModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors whitespace-nowrap self-start md:self-center shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-red-400" />
          <span>Reset Full Database</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Total Users
            </span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.bannedUsers} suspended
            </span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Forum Posts
            </span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {stats.totalPosts}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Defensive & Research</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Comments
            </span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {stats.totalComments}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Threaded discussions</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              Audit Logs
            </span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {stats.totalAuditLogs}
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              {stats.flaggedAuditLogs} flagged events
            </span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl col-span-2 lg:col-span-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Security Posture
            </span>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-2">
              MEDIUM-HIGH
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Parameterized & Audited
            </span>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          User Accounts ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h2 className="text-xs font-bold text-white">Registered User Accounts & RBAC Privileges</h2>
            <span className="text-[11px] text-slate-500 font-mono">Server-side authorization required</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Reputation</th>
                  <th className="p-3.5">Activity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{u.display_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">@{u.username} · {u.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {u.role === 'admin' ? (
                        <span className="text-amber-400 font-bold">ADMINISTRATOR</span>
                      ) : (
                        <span className="text-slate-400">STANDARD USER</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono tabular-nums">
                      {u.reputation}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {u.post_count} posts · {u.comment_count} comments
                    </td>
                    <td className="p-3.5">
                      {u.is_banned === 1 ? (
                        <span className="text-red-400 font-mono text-[11px] font-semibold">SUSPENDED</span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px] font-semibold">ACTIVE</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBan(u.id, u.is_banned === 1)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                            u.is_banned === 1
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {u.is_banned === 1 ? 'Reactivate User' : 'Suspend Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-white">Immutable Security Audit Trail</h2>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {['ALL', 'SUCCESS', 'DENIED', 'FLAGGED'].map(status => (
                <button
                  key={status}
                  onClick={() => setLogFilter(status)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    logFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {log.actor_username}
                    </td>
                    <td className="p-3 text-blue-300">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-400">
                      {log.ip_address}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'DENIED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Reset */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-bold text-white">Confirm Complete Database Reset</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This action will drop all user-created discussions, comments, and lab attempts, restoring all SQLite tables and synthetic target secrets to their factory laboratory seed baseline.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDatabase}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
              >
                {resetting ? 'Resetting Database...' : 'Confirm Full Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
