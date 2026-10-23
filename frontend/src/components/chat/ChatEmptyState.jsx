import React from 'react';
import { MessageSquare, Lock, ShieldCheck, Zap, Users, Plus } from 'lucide-react';
import Button from '../common/Button';

export const ChatEmptyState = ({ onNewChat }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-charcoal-50/40 dark:bg-charcoal-950/40 select-none">
      <div className="max-w-md space-y-6">
        {/* Brand Icon Graphic */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-emerald-glow">
          <MessageSquare className="w-10 h-10 fill-current/20" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-charcoal-900 border-2 border-emerald-500 flex items-center justify-center text-emerald-600">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
            PulseChat Web
          </h2>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
            Select a conversation from the sidebar to start messaging your team, review class discussions, and share files in real time.
          </p>
        </div>

        {/* Security & Features Pill Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
          <div className="p-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-soft-sm space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-charcoal-900 dark:text-white">Encrypted</p>
            <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">E2E security verified</p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-soft-sm space-y-1">
            <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <p className="text-xs font-bold text-charcoal-900 dark:text-white">Ultra Fast</p>
            <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">Low latency delivery</p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-soft-sm space-y-1">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-charcoal-900 dark:text-white">Groups</p>
            <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">Team channels</p>
          </div>
        </div>

        {/* Action Button */}
        {onNewChat && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={onNewChat}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Start New Conversation
            </Button>
          </div>
        )}

        <div className="pt-4 flex items-center justify-center gap-1.5 text-[11px] text-charcoal-400">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Your personal messages are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;
