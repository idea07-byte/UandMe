import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Languages,
  X,
  Send,
  Volume2,
} from 'lucide-react';
import { Moment, MomentComment } from '../types';
import { MOCK_MOMENTS, CURRENT_USER, LANGUAGES } from '../services/mockHelloTalkData';
import { translateText, speakText } from '../services/translationService';
import { SentenceCorrectionCard } from '../components/SentenceCorrectionCard';

export const MomentsView: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>(MOCK_MOMENTS);
  const [filter, setFilter] = useState<'all' | 'learn_my_lang' | 'classmates'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostLang, setNewPostLang] = useState('ja');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  const handleToggleLike = (id: string) => {
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const isLiked = !m.isLikedByMe;
          return {
            ...m,
            isLikedByMe: isLiked,
            likesCount: isLiked ? m.likesCount + 1 : m.likesCount - 1,
          };
        }
        return m;
      })
    );
  };

  const handleTranslateMoment = async (m: Moment) => {
    if (m.translation) return;
    const translated = await translateText(m.text, CURRENT_USER.nativeLang.code);
    setMoments((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, translation: translated } : item))
    );
  };

  const handleAddComment = (momentId: string) => {
    const text = commentInputs[momentId]?.trim();
    if (!text) return;

    const newComment: MomentComment = {
      id: `c_${Date.now()}`,
      author: CURRENT_USER,
      text,
      createdAt: 'Just now',
    };

    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          return {
            ...m,
            commentsCount: m.commentsCount + 1,
            comments: [...m.comments, newComment],
          };
        }
        return m;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [momentId]: '' }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newMoment: Moment = {
      id: `mom_${Date.now()}`,
      author: CURRENT_USER,
      text: newPostText.trim(),
      imageUrl: newPostImage.trim() || undefined,
      tags: [`#${LANGUAGES[newPostLang]?.name || 'Learning'}`],
      langCode: newPostLang,
      createdAt: 'Just now',
      likesCount: 0,
      isLikedByMe: false,
      commentsCount: 0,
      comments: [],
    };

    setMoments([newMoment, ...moments]);
    setNewPostText('');
    setNewPostImage('');
    setIsCreateModalOpen(false);
  };

  const filteredMoments = moments.filter((m) => {
    if (filter === 'learn_my_lang') {
      return m.langCode === CURRENT_USER.nativeLang.code; // Posts in English
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-3xl mx-auto select-none">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Moments</h2>
          <p className="text-xs text-slate-400">Share language tips, cultural daily life, and questions</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Moment</span>
        </button>
      </div>

      {/* Feed Filters */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Moments
        </button>
        <button
          type="button"
          onClick={() => setFilter('learn_my_lang')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'learn_my_lang'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Help Correct English
        </button>
      </div>

      {/* Moments List */}
      <div className="space-y-6">
        {filteredMoments.map((moment) => (
          <div
            key={moment.id}
            className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
          >
            {/* Author Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={moment.author.avatar}
                  alt={moment.author.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-700"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-sm">{moment.author.name}</h4>
                    <span className="text-xs">{moment.author.nativeLang.flag}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {moment.author.city}, {moment.author.country} • {moment.createdAt}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1">
                {moment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-3 select-text">
              <p className="text-sm text-slate-100 leading-relaxed font-medium">{moment.text}</p>

              {/* Translated Output */}
              {moment.translation && (
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 italic">
                  <span className="text-[10px] font-bold text-sky-400 uppercase block not-italic mb-1">
                    Translation:
                  </span>
                  {moment.translation}
                </div>
              )}

              {/* Image if attached */}
              {moment.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/40 max-h-96">
                  <img
                    src={moment.imageUrl}
                    alt="Moment post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs select-none">
              <div className="flex items-center gap-4">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLike(moment.id)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    moment.isLikedByMe ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${moment.isLikedByMe ? 'fill-rose-500' : ''}`} />
                  <span>{moment.likesCount}</span>
                </button>

                {/* Comments Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveCommentsPostId(
                      activeCommentsPostId === moment.id ? null : moment.id
                    )
                  }
                  className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{moment.commentsCount} Comments</span>
                </button>

                {/* Translate Button */}
                <button
                  type="button"
                  onClick={() => handleTranslateMoment(moment)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <Languages className="w-4 h-4" />
                  <span>Translate</span>
                </button>

                {/* Speak Pronunciation */}
                <button
                  type="button"
                  onClick={() => speakText(moment.text, moment.langCode)}
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Comments Stream & Inline Corrections */}
            {activeCommentsPostId === moment.id && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                {/* Existing comments */}
                <div className="space-y-2.5">
                  {moment.comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200">{comment.author.name}</span>
                        <span className="text-[10px] text-slate-500">{comment.createdAt}</span>
                      </div>
                      <p className="text-slate-300">{comment.text}</p>

                      {/* Comment Correction Card */}
                      {comment.correction && (
                        <div className="mt-2">
                          <SentenceCorrectionCard correction={comment.correction} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentInputs[moment.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [moment.id]: e.target.value }))
                    }
                    placeholder="Write a comment or help with a tip..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(moment.id)}
                    className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Moment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-[#1E293B] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white">Share a Moment</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Language Tag
                </label>
                <select
                  value={newPostLang}
                  onChange={(e) => setNewPostLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="ja">🇯🇵 Japanese Practice</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish Practice</option>
                  <option value="ko">🇰🇷 Korean Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Content *
                </label>
                <textarea
                  rows={4}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share a sentence you learned, a cultural question, or a photo from your day..."
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newPostImage}
                  onChange={(e) => setNewPostImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                >
                  Publish Moment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

