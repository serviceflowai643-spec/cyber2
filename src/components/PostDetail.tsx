import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ThumbsUp, Eye, Trash2, Edit2, Check, X, Shield, CornerDownRight, AlertCircle } from 'lucide-react';
import { Post, Comment } from '../types.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';

interface PostDetailProps {
  postId: number;
  onBack: () => void;
  openAuthModal: () => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({ postId, onBack, openAuthModal }) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Editing state for comments
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchDetail = async () => {
    try {
      const data = await api.getPost(postId);
      setPost(data.post);
      setComments(data.comments || []);
    } catch (e) {
      console.error('Error fetching post:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await api.likePost(postId);
      setPost({ ...post, likes_count: res.likesCount });
    } catch (e) {
      console.error('Like failed:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!newComment.trim()) return;

    setCommentError(null);
    setSubmittingComment(true);

    try {
      const res = await api.createComment({ postId, content: newComment });
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEdit = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditContent(c.content);
  };

  const handleSaveEdit = async (commentId: number) => {
    try {
      await api.editComment(commentId, editContent);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent, updated_at: new Date().toISOString() } : c));
      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to edit comment.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment.');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to permanently delete this discussion?')) return;
    try {
      await api.deletePost(postId);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-2/3" />
          <div className="h-24 bg-slate-800 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-slate-300">Discussion post not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-xs rounded-lg text-white">
          Back to Discussions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussions</span>
        </button>

        {(user?.id === post.author_id || user?.role === 'admin') && (
          <button
            onClick={handleDeletePost}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Post</span>
          </button>
        )}
      </div>

      {/* Main Post Container */}
      <article className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-5 shadow-sm">
        
        {/* Category & Tag unboxed line */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-blue-400 font-semibold">{post.category}</span>
          <span aria-hidden="true">·</span>
          <span>Tags: {post.tags.join(', ')}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
          {post.title}
        </h1>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-[10px]">
              {post.author_display_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-200">{post.author_display_name}</span>
            <span className="text-slate-500 font-mono">(@{post.author_username})</span>
          </div>
          <span aria-hidden="true">·</span>
          <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{post.views} views</span>
        </div>

        {/* Content Body with simple formatting */}
        <div className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans space-y-4 whitespace-pre-line">
          {post.content}
        </div>

        {/* Like Button */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors text-xs font-mono"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums font-semibold">{post.likes_count}</span>
            <span className="text-slate-500">Upvotes</span>
          </button>

          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Parameterized Data Model
          </span>
        </div>
      </article>

      {/* Comments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Discussion Comments ({comments.length})
          </h2>
        </div>

        {/* Add Comment Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">Post a Response</h3>
          
          {commentError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{commentError}</span>
            </div>
          )}

          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "Write your technical thoughts, questions, or review..." : "Sign in to post a comment."}
              disabled={!user}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none font-sans disabled:opacity-50"
            />

            {/* Quick Test SQL Character Presets for Lab Students */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              <span className="text-slate-500 font-mono">Special Character Tests:</span>
              {[
                "Brian O'Connor",
                "Robert'); DROP TABLE Students;--",
                "Test ' OR '1'='1' literal",
              ].map(testStr => (
                <button
                  type="button"
                  key={testStr}
                  onClick={() => setNewComment(testStr)}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 font-mono text-[10px]"
                >
                  {testStr}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Safely bound with parameterized query execution.
              </span>
              {user ? (
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  {submittingComment ? 'Posting...' : 'Submit Comment'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Sign In to Comment
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Comments */}
        <div className="space-y-3">
          {comments.map(c => {
            const isEditing = editingCommentId === c.id;
            const canModify = user && (user.id === c.author_id || user.role === 'admin');

            return (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs"
              >
                {/* Author & Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                      {c.author_display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-200">{c.author_display_name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">@{c.author_username}</span>
                    {c.author_role === 'admin' && (
                      <span className="text-amber-400 font-mono text-[10px] font-semibold">ADMIN</span>
                    )}
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {canModify && !isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(c.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {c.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
};
