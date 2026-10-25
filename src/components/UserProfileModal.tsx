import React, { useState } from 'react';
import { X, User, Lock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    const res = await updateProfile(displayName, bio);
    setSaving(false);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile details saved.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    const res = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Password update failed.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Account & Security Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          
          {/* User Identity Summary */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white text-sm">{user.displayName}</p>
              <p className="text-slate-400 font-mono">@{user.username} · {user.email}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block font-mono text-[11px] font-semibold ${user.role === 'admin' ? 'text-amber-400' : 'text-blue-400'}`}>
                {user.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'VERIFIED USER'}
              </span>
              <p className="text-[11px] text-slate-500 font-mono">Reputation: {user.reputation}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-1">Profile Information</h3>
            
            {profileMsg && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {profileMsg.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Biography</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Share your engineering background, research areas, or security topics..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Save Profile Details
            </button>
          </form>

          {/* Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Change Password
            </h3>

            {passwordMsg && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {passwordMsg.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">New Password (8+ chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Update Password
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
