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
import WhatsAppNewCommunityModal from './WhatsAppNewCommunityModal';

export const CommunitiesList = ({ onSelectCommunity, onSelectGroup, selectedCommunityId }) => {
  const toast = useToast();
  const [communities, setCommunities] = useState(MOCK_COMMUNITIES);
  const [isNewCommunityModalOpen, setIsNewCommunityModalOpen] = useState(false);

  const handleCommunityCreated = (newComm) => {
    setCommunities((prev) => [newComm, ...prev]);
    toast.success(`Community "${newComm.name}" has been created!`, 'Community Created');
    onSelectCommunity?.(newComm);
  };

  return (
    <div className="w-full sm:w-80 md:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222D34]">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Communities</h2>
        <button
          type="button"
          onClick={() => setIsNewCommunityModalOpen(true)}
          className="p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
          title="Create new community"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New Community Trigger */}
        <div
          onClick={() => setIsNewCommunityModalOpen(true)}
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
        {communities.map((comm) => {
          const isSelected = selectedCommunityId === comm.id;
          const groups = comm.subgroups || comm.groups || [];

          return (
            <div key={comm.id} className="border-b border-[#222D34]">
              <div
                onClick={() => onSelectCommunity?.(comm)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202C33] transition-colors',
                  isSelected ? 'bg-[#202C33]' : 'bg-[#111B21]'
                )}
              >
                <img
                  src={comm.avatar}
                  alt={comm.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-[#222D34]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#E9EDEF] truncate">{comm.name}</p>
                  <p className="text-xs text-[#8696A0] truncate">{comm.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696A0]" />
              </div>

              {/* Subgroups */}
              <div className="pl-6 bg-[#0B141A]/50">
                {groups.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectGroup?.({
                      id: sub.id,
                      name: sub.name,
                      avatar: comm.avatar,
                      isGroup: true,
                    })}
                    className="flex items-center justify-between py-2.5 pr-4 border-b border-[#182229] hover:bg-[#202C33] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#202C33] flex items-center justify-center text-[#00A884] shrink-0">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#E9EDEF] truncate">{sub.name}</p>
                        <p className="text-[11px] text-[#8696A0] truncate">
                          {sub.lastMsg || `${sub.members || 12} members`}
                        </p>
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
          );
        })}
      </div>

      {/* Modal */}
      <WhatsAppNewCommunityModal
        isOpen={isNewCommunityModalOpen}
        onClose={() => setIsNewCommunityModalOpen(false)}
        onCreated={handleCommunityCreated}
      />
    </div>
  );
};

export default CommunitiesList;
