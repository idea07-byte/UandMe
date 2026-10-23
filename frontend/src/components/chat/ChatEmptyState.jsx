import React from 'react';
import { Laptop, Lock, ShieldCheck } from 'lucide-react';

export const ChatEmptyState = ({ onNewChat }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#222E35] dark:bg-[#222E35] text-[#E9EDEF] select-none h-full relative border-b-[6px] border-[#00A884]">
      <div className="max-w-md flex flex-col items-center">
        {/* Central Illustration Device/Laptop */}
        <div className="w-32 h-32 rounded-full bg-[#111B21]/60 flex items-center justify-center mb-8 border border-[#2A3942]/50 shadow-inner">
          <Laptop className="w-16 h-16 text-[#8696A0] stroke-[1.2]" />
        </div>

        {/* Title */}
        <h2 className="text-[32px] font-light text-[#E9EDEF] tracking-normal mb-3 font-sans">
          WhatsApp Web
        </h2>

        {/* Subtitle */}
        <p className="text-[14px] text-[#8696A0] leading-relaxed max-w-sm mb-6">
          Send and receive messages without keeping your phone online.
          <br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>

        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="px-5 py-2.5 rounded-full bg-[#00A884] hover:bg-[#008F6F] text-[#111B21] font-semibold text-sm transition-all shadow-md active:scale-95 mb-6"
          >
            Start a new chat
          </button>
        )}
      </div>

      {/* Footer Encryption Notice (Spec Page 2 & 7) */}
      <div className="absolute bottom-10 flex items-center justify-center gap-1.5 text-[13px] text-[#8696A0]">
        <Lock className="w-3.5 h-3.5 text-[#8696A0]" />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};

export default ChatEmptyState;
