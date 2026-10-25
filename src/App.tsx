import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { ForumFeed } from './components/ForumFeed.js';
import { PostDetail } from './components/PostDetail.js';
import { LabConsole } from './components/LabConsole.js';
import { SecurityTestSuite } from './components/SecurityTestSuite.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { DocumentationView } from './components/DocumentationView.js';
import { AuthModal } from './components/AuthModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<'forum' | 'lab' | 'tests' | 'docs' | 'admin'>('forum');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleSelectPost = (id: number) => {
    setSelectedPostId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToForum = () => {
    setSelectedPostId(null);
    setActiveTab('forum');
  };

  const handleOpenTab = (tab: 'forum' | 'lab' | 'tests' | 'docs' | 'admin') => {
    setSelectedPostId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleOpenTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openProfileModal={() => setProfileModalOpen(true)}
      />

      <main className="flex-1">
        {selectedPostId !== null ? (
          <PostDetail
            postId={selectedPostId}
            onBack={handleBackToForum}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'forum' && (
              <ForumFeed
                onSelectPost={handleSelectPost}
                openAuthModal={() => setAuthModalOpen(true)}
                onOpenLab={() => handleOpenTab('lab')}
              />
            )}
            {activeTab === 'lab' && <LabConsole />}
            {activeTab === 'tests' && <SecurityTestSuite />}
            {activeTab === 'docs' && <DocumentationView />}
            {activeTab === 'admin' && <AdminDashboard />}
          </>
        )}
      </main>

      {/* Clean Editorial Footer (Anti-slop: zero fake telemetry tickers, zero pill badges) */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">DevSecExchange</span>
            <span aria-hidden="true">·</span>
            <span>SecureLab Cybersecurity Practice Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Designed for authorized educational testing</span>
            <span aria-hidden="true">·</span>
            <span>Isolated SQLite Environment</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
