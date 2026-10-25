import React, { useState, useEffect } from 'react';
import { Search, Plus, ThumbsUp, Eye, MessageSquare, ShieldCheck, Tag, Filter, X, ArrowUpRight } from 'lucide-react';
import { Post } from '../types.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';

interface ForumFeedProps {
  onSelectPost: (postId: number) => void;
  openAuthModal: () => void;
  onOpenLab: () => void;
}

const CATEGORIES = [
  'All',
  'Defensive Engineering',
  'Vulnerability Research',
  'Database Internals',
  'AppSec & Compliance',
];

export const ForumFeed: React.FC<ForumFeedProps> = ({ onSelectPost, openAuthModal, onOpenLab }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'latest' | 'popular' | 'views'>('latest');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // New post form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Defensive Engineering');
  const [newTags, setNewTags] = useState('application-security,sql-injection');
  const [newContent, setNewContent] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getPosts({ search, category, sort });
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, category, sort]);

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    try {
      const res = await api.likePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: res.likesCount } : p));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await api.createPost({
        title: newTitle,
        category: newCategory,
        tags: newTags,
        content: newContent,
      });

      setIsCreatingPost(false);
      setNewTitle('');
      setNewContent('');
      fetchPosts();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to publish discussion.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Educational Mode Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Production-Style Defensive Platform
              </h2>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                PARAMETERIZED SQL ENFORCED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
              Every query in this forum utilizes prepared statements with strictly typed bind markers. Unusual strings, quotes, and SQL syntax characters (e.g., <code className="text-blue-300 font-mono text-[11px]">Robert&apos;); DROP TABLE...</code>) are treated strictly as data literals.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLab}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 self-start md:self-center shadow-sm shadow-blue-900/30"
        >
          <span>Open SQLi Practice Lab</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussions (safe parameterized lookup)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSort('latest')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                sort === 'latest' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                sort === 'popular' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Upvoted
            </button>
            <button
              onClick={() => setSort('views')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                sort === 'views' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Views
            </button>
          </div>

          <button
            onClick={() => (user ? setIsCreatingPost(true) : openAuthModal())}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Discussion</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs (Zero-pill discipline: segmented interactive buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              category === cat
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse h-28" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <p className="text-sm font-medium text-slate-300">No discussions match your filter.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords or category filters, or publish the first article in this topic.
          </p>
          <button
            onClick={() => { setSearch(''); setCategory('All'); }}
            className="px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-sm md:text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  {post.excerpt}
                </p>

                {/* Metadata Line (Strict Zero-Pill: clean unboxed text with typographic separators) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-sans pt-1">
                  <span className="font-medium text-slate-300">{post.author_display_name}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-400 font-mono text-[11px]">{post.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{post.views} views</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{post.comments_count || 0} comments</span>
                </div>
              </div>

              {/* Upvote & Action Strip */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={(e) => handleLike(e, post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors text-xs font-mono"
                  title="Upvote discussion"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-semibold">{post.likes_count}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* New Discussion Modal */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-sm font-bold text-white tracking-tight">Start New Security Discussion</h2>
              <button onClick={() => setIsCreatingPost(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. AST Evaluation of Parameterized Prepared Statements"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="appsec, parameterization, sqlite"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Content (Markdown supported)</label>
                <textarea
                  required
                  rows={8}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Share code examples, architectural patterns, or vulnerability research details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {creating ? 'Publishing...' : 'Publish Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
