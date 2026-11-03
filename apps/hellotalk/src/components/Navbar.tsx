import React from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  BookOpen,
  User as UserIcon,
  Flame,
  Globe2,
} from 'lucide-react';
import { CURRENT_USER } from '../services/mockHelloTalkData';

interface NavbarProps {
  activeTab: 'discovery' | 'chat' | 'moments' | 'vocab' | 'profile';
  onTabChange: (tab: 'discovery' | 'chat' | 'moments' | 'vocab' | 'profile') => void;
  unreadCount?: number;
  vocabDueCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 1,
  vocabDueCount = 2,
}) => {
  const primaryLearning = CURRENT_USER.learningLangs[0];

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0F172A]/95 border-b border-slate-800 flex items-center justify-between shrink-0 select-none backdrop-blur-md z-30">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('discovery')}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Globe2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-white tracking-tight">HelloTalk</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Lingua
            </span>
          </div>
          <p className="text-[11px] text-slate-400 -mt-0.5">Language Exchange</p>
        </div>
      </div>

      {/* Main Nav Tabs */}
      <nav className="flex items-center gap-1 sm:gap-2">
        {/* Discovery Tab */}
        <button
          type="button"
          onClick={() => onTabChange('discovery')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'discovery'
              ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden md:inline">Partners</span>
        </button>

        {/* Chat Tab */}
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden md:inline">Chat</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Moments Feed */}
        <button
          type="button"
          onClick={() => onTabChange('moments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'moments'
              ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden md:inline">Moments</span>
        </button>

        {/* Vocabulary & SRS */}
        <button
          type="button"
          onClick={() => onTabChange('vocab')}
          className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'vocab'
              ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden md:inline">Vocabulary</span>
          {vocabDueCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              {vocabDueCount}
            </span>
          )}
        </button>
      </nav>

      {/* User Quick Info & Profile Action */}
      <div className="flex items-center gap-3">
        {/* Streak Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold" title="Daily Learning Streak">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>{CURRENT_USER.dailyStreak} Days</span>
        </div>

        {/* Language Pairing Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold">
          <span className="text-sm">{CURRENT_USER.nativeLang.flag}</span>
          <span className="text-slate-400 text-[10px]">➔</span>
          <span className="text-sm">{primaryLearning.lang.flag}</span>
          <span className="text-sky-400 text-[11px] font-mono">{primaryLearning.cefr}</span>
        </div>

        {/* User Avatar */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`relative rounded-full ring-2 transition-all p-0.5 ${
            activeTab === 'profile' ? 'ring-sky-400 ring-offset-2 ring-offset-[#0F172A]' : 'ring-slate-700 hover:ring-slate-500'
          }`}
          title="Open Profile"
        >
          <img
            src={CURRENT_USER.avatar}
            alt={CURRENT_USER.name}
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
        </button>
      </div>
    </header>
  );
};

