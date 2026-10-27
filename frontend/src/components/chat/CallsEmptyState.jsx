import React from 'react';
import {
  Phone,
  Video,
  Link,
  Calendar,
  Lock,
  Plus,
} from 'lucide-react';
import useToast from '../../hooks/useToast';

/**
 * WhatsApp Desktop Style Calls Empty State (Main Pane).
 * Spec Page 2 & 4:
 * "Empty state: 'Voice and video calling' with four actions:
 *  Start call, New call link, Call a number, Schedule call.
 *  Footer: calls are end-to-end encrypted."
 */
export const CallsEmptyState = ({ onStartCall, onOpenDialpad }) => {
  const toast = useToast();

  const actions = [
    {
      id: 'start',
      label: 'Start call',
      icon: Phone,
      color: 'bg-[#00A884] text-white hover:bg-[#008f6f]',
      action: () => {
        if (onStartCall) {
          onStartCall();
        } else {
          toast.info('Pick a contact from your list to place an audio or video call.');
        }
      },
    },
    {
      id: 'link',
      label: 'New call link',
      icon: Link,
      color: 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]',
      action: () => toast.success('Call link generated! Anyone with this link can join your call.'),
    },
    {
      id: 'dial',
      label: 'Call a number',
      icon: Phone,
      color: 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]',
      action: () => {
        if (onOpenDialpad) {
          onOpenDialpad();
        } else {
          toast.info('Opening dialpad...');
        }
      },
    },
    {
      id: 'schedule',
      label: 'Schedule call',
      icon: Calendar,
      color: 'bg-[#202C33] text-[#E9EDEF] hover:bg-[#2A3942]',
      action: () => toast.info('Call scheduler opened. Connects with Google Calendar / Outlook.'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-between h-full bg-[#111B21] text-[#E9EDEF] p-8 select-none">
      <div />

      {/* Center Hero Card */}
      <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
        {/* WhatsApp Phone/Video Illustration Icon */}
        <div className="w-20 h-20 rounded-3xl bg-[#202C33] border border-[#222D34] flex items-center justify-center text-[#00A884] mb-6 shadow-xl">
          <Phone className="w-10 h-10 fill-current/20" />
        </div>

        <h3 className="text-2xl font-bold text-[#E9EDEF] mb-2">Voice and video calling</h3>
        <p className="text-sm text-[#8696A0] leading-relaxed mb-8">
          Make private, high-quality audio and video calls to anyone on campus or in your contact list. Group calls support up to 32 participants.
        </p>

        {/* 4 Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.action}
                className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${act.color}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* End-to-end encryption footer */}
      <div className="flex items-center gap-2 text-xs text-[#8696A0]">
        <Lock className="w-3.5 h-3.5 text-[#8696A0]" />
        <span>Your personal calls are end-to-end encrypted</span>
      </div>
    </div>
  );
};

export default CallsEmptyState;
