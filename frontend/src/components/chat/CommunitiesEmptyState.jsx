import React from 'react';
import {
  Users2,
  Lock,
  Plus,
} from 'lucide-react';
import useToast from '../../hooks/useToast';

export const CommunitiesEmptyState = () => {
  const toast = useToast();

  return (
    <div className="flex-1 flex flex-col items-center justify-between h-full bg-[#111B21] text-[#E9EDEF] p-8 select-none">
      <div />

      <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#202C33] border border-[#222D34] flex items-center justify-center text-[#00A884] mb-6 shadow-xl">
          <Users2 className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-[#E9EDEF] mb-2">Create communities</h3>
        <p className="text-sm text-[#8696A0] leading-relaxed mb-8">
          Bring members together in topic-based groups and easily send them admin announcements. Ideal for departments, research labs, student clubs, and campus cohorts.
        </p>

        <button
          type="button"
          onClick={() => toast.info('Community creation modal opened.')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00A884] text-white font-semibold text-sm hover:bg-[#008f6f] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Start a community</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#8696A0]">
        <Lock className="w-3.5 h-3.5 text-[#8696A0]" />
        <span>Communities are protected by end-to-end encryption</span>
      </div>
    </div>
  );
};

export default CommunitiesEmptyState;
