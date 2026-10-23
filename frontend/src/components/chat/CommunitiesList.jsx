import React, { useState } from 'react';
import {
  Users2,
  Plus,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useToast from '../../hooks/useToast';
import { MOCK_COMMUNITIES } from '../../services/mockWhatsAppExtras';
import { cn } from '../../utils/cn';

export const CommunitiesList = ({ onSelectGroup }) => {
  const toast = useToast();
  const [communities] = useState(MOCK_COMMUNITIES);

  return (
    <div className="w-full sm:w-80 md:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222D34]">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Communities</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New Community Trigger */}
        <div
          onClick={() => toast.info('Community creation wizard: organize multiple topic groups under one roof.')}
          className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#202C33] cursor-pointer transition-colors border-b border-[#222D34]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
            <Plus className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E9EDEF]">New community</p>
            <p className="text-xs text-[#8696A0]">Bring related groups together</p>
          </div>
        </div>

        {/* Communities Items */}
        {communities.map((comm) => (
          <div key={comm.id} className="border-b border-[#222D34]">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#111B21]">
              <img
                src={comm.avatar}
                alt={comm.name}
                className="w-11 h-11 rounded-2xl object-cover border border-[#222D34]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#E9EDEF] truncate">{comm.name}</p>
                <p className="text-xs text-[#8696A0] truncate">{comm.description}</p>
              </div>
            </div>

            {/* Subgroups */}
            <div className="pl-6 bg-[#0B141A]/50">
              {comm.subgroups.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onSelectGroup?.(sub)}
                  className="flex items-center justify-between py-2.5 pr-4 border-b border-[#182229] hover:bg-[#202C33] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#202C33] flex items-center justify-center text-[#00A884] shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E9EDEF] truncate">{sub.name}</p>
                      <p className="text-[11px] text-[#8696A0] truncate">{sub.lastMsg}</p>
                    </div>
                  </div>

                  {sub.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#00A884] text-white text-[10px] font-bold flex items-center justify-center">
                      {sub.unread}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunitiesList;
