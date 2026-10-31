import React from 'react';
import {
  Phone,
  Video,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  PhoneMissed,
  Clock,
  Shield,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { cn } from '../../utils/cn';

export const WhatsAppCallDetailsView = ({
  call,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenChat,
}) => {
  if (!call) return null;

  const isMissed = call.type === 'missed';
  const isIncoming = call.type === 'incoming';
  const isOutgoing = call.type === 'outgoing';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111B21] select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222D34] bg-[#202C33]">
        <h3 className="text-base font-bold text-[#E9EDEF]">Call Info</h3>
      </div>

      {/* Main Contact Card */}
      <div className="flex flex-col items-center justify-center p-8 border-b border-[#222D34] bg-[#111B21]/50">
        <div className="relative mb-4">
          <Avatar
            src={call.avatar}
            name={call.name}
            size="xl"
            className="w-24 h-24 text-2xl shadow-xl ring-4 ring-[#202C33]"
          />
        </div>
        <h2 className="text-xl font-bold text-[#E9EDEF]">{call.name}</h2>
        <p className="text-sm text-[#8696A0] mt-1">
          {call.isVideo ? 'WhatsApp Video Call' : 'WhatsApp Voice Call'}
        </p>

        {/* Action Buttons: Voice Call, Video Call, Message */}
        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            onClick={() => onStartVoiceCall?.(call)}
            className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] transition-all group"
            title="Start voice call"
          >
            <div className="w-10 h-10 rounded-full bg-[#00A884]/15 group-hover:bg-[#00A884]/25 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#00A884]" />
            </div>
            <span className="text-xs font-semibold text-[#E9EDEF]">Audio</span>
          </button>

          <button
            type="button"
            onClick={() => onStartVideoCall?.(call)}
            className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] transition-all group"
            title="Start video call"
          >
            <div className="w-10 h-10 rounded-full bg-[#00A884]/15 group-hover:bg-[#00A884]/25 flex items-center justify-center">
              <Video className="w-5 h-5 text-[#00A884]" />
            </div>
            <span className="text-xs font-semibold text-[#E9EDEF]">Video</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenChat?.(call)}
            className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] transition-all group"
            title="Message contact"
          >
            <div className="w-10 h-10 rounded-full bg-[#00A884]/15 group-hover:bg-[#00A884]/25 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#00A884]" />
            </div>
            <span className="text-xs font-semibold text-[#E9EDEF]">Message</span>
          </button>
        </div>
      </div>

      {/* Call History / Details List */}
      <div className="flex-1 p-6 space-y-4 max-w-xl mx-auto w-full">
        <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider">
          Call Activity
        </h4>

        <div className="bg-[#202C33] rounded-2xl border border-[#2A3942] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                isMissed
                  ? 'bg-rose-950/60 text-rose-400'
                  : isIncoming
                  ? 'bg-[#00A884]/15 text-[#00A884]'
                  : 'bg-blue-950/60 text-blue-400'
              )}
            >
              {isMissed ? (
                <PhoneMissed className="w-5 h-5" />
              ) : isIncoming ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#E9EDEF]">
                {isMissed
                  ? 'Missed call'
                  : isIncoming
                  ? 'Incoming call'
                  : 'Outgoing call'}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#8696A0] mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{call.time}</span>
                <span>•</span>
                <span>{call.duration || (isMissed ? 'Ringing timeout' : '4m 32s')}</span>
              </div>
            </div>
          </div>

          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full',
              isMissed
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                : 'bg-[#111B21] text-[#00A884] border border-[#2A3942]'
            )}
          >
            {isMissed ? 'Missed' : 'Completed'}
          </span>
        </div>

        {/* End to end encryption notice */}
        <div className="flex items-center justify-center gap-2 pt-6 text-xs text-[#8696A0]">
          <Shield className="w-4 h-4 text-[#00A884]" />
          <span>End-to-end encrypted • Your calls and audio never leave this direct line</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCallDetailsView;

