import React from 'react';
import {
  CircleDashed,
  PenLine,
  Camera,
  Lock,
} from 'lucide-react';
import useToast from '../../hooks/useToast';

/**
 * WhatsApp Desktop Style Status Empty State (Main Pane).
 * Spec Page 3 & 5:
 * "Empty state: 'Share statuses' with Text status and Photo and video buttons
 *  (disappear after 24 hours)."
 */
export const StatusEmptyState = ({ activeStatus }) => {
  const toast = useToast();

  if (activeStatus) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0B141A] text-[#E9EDEF] p-8 select-none relative">
        {/* Progress bar at top */}
        <div className="absolute top-4 left-8 right-8 flex gap-1.5">
          <div className="flex-1 h-1 bg-[#00A884] rounded-full" />
          <div className="flex-1 h-1 bg-[#202C33] rounded-full" />
        </div>

        {/* Status card preview */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#222D34] bg-[#111B21] flex flex-col items-center p-8 text-center animate-scale-in">
          <img
            src={activeStatus.avatar}
            alt={activeStatus.name}
            className="w-20 h-20 rounded-full border-4 border-[#00A884] mb-4 object-cover"
          />
          <h4 className="text-xl font-bold text-[#E9EDEF] mb-1">{activeStatus.name}</h4>
          <p className="text-xs text-[#8696A0] mb-6">{activeStatus.time}</p>

          <div
            className="w-full p-6 rounded-2xl flex items-center justify-center min-h-[140px] text-lg font-medium text-white mb-4"
            style={{ backgroundColor: activeStatus.latestStory?.bgColor || '#005C4B' }}
          >
            {activeStatus.latestStory?.content || 'Status update story'}
          </div>

          <p className="text-xs text-[#8696A0]">Stories disappear automatically after 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between h-full bg-[#111B21] text-[#E9EDEF] p-8 select-none">
      <div />

      {/* Center Hero Card */}
      <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#202C33] border border-[#222D34] flex items-center justify-center text-[#00A884] mb-6 shadow-xl">
          <CircleDashed className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-[#E9EDEF] mb-2">Share statuses</h3>
        <p className="text-sm text-[#8696A0] leading-relaxed mb-8">
          Share photos, videos and text that disappear after 24 hours. Your contacts can view your updates and reply to them directly.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.info('Text status composer opened.')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A884] text-white font-medium text-sm hover:bg-[#008f6f] transition-colors shadow-sm"
          >
            <PenLine className="w-4 h-4" />
            <span>Text status</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info('Select photos or videos from your computer.')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#202C33] text-[#E9EDEF] font-medium text-sm hover:bg-[#2A3942] transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span>Photo and video</span>
          </button>
        </div>
      </div>

      {/* Encryption Footer */}
      <div className="flex items-center gap-2 text-xs text-[#8696A0]">
        <Lock className="w-3.5 h-3.5 text-[#8696A0]" />
        <span>Your status updates are end-to-end encrypted</span>
      </div>
    </div>
  );
};

export default StatusEmptyState;
