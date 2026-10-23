import React, { useState } from 'react';
import {
  CircleDashed,
  Plus,
  MoreVertical,
  Camera,
  PenLine,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { MOCK_STATUSES } from '../../services/mockWhatsAppExtras';
import { cn } from '../../utils/cn';

export const StatusList = ({ onSelectStatus, selectedStatusId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [statuses] = useState(MOCK_STATUSES);

  const handleAddStatus = () => {
    toast.info('Status composer: share text, photo, or video that disappears after 24 hours.');
  };

  return (
    <div className="w-full sm:w-80 md:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] select-none">
      {/* Status Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222D34]">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Status</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAddStatus}
            className="p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
            title="Add status update"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status Row */}
        <div
          onClick={handleAddStatus}
          className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#202C33] cursor-pointer transition-colors border-b border-[#222D34]"
        >
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name || 'Me'} size="md" />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00A884] border-2 border-[#111B21] flex items-center justify-center text-white">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E9EDEF]">My status</p>
            <p className="text-xs text-[#8696A0]">Click to add status update</p>
          </div>
        </div>

        {/* Recent Updates Header */}
        <div className="px-4 py-3">
          <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Recent updates</span>
        </div>

        {/* Status Items List */}
        <div>
          {statuses.map((item) => {
            const isSelected = selectedStatusId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectStatus?.(item)}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 hover:bg-[#202C33] cursor-pointer transition-colors border-b border-[#182229]',
                  isSelected && 'bg-[#2A3942]'
                )}
              >
                {/* Avatar with Status Ring */}
                <div className="relative p-0.5">
                  <div
                    className={cn(
                      'rounded-full p-[2px]',
                      item.hasUnseen
                        ? 'ring-2 ring-[#00A884] ring-offset-2 ring-offset-[#111B21]'
                        : 'ring-2 ring-[#8696A0]/50 ring-offset-2 ring-offset-[#111B21]'
                    )}
                  >
                    <Avatar src={item.avatar} name={item.name} size="md" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#E9EDEF] truncate">{item.name}</p>
                  <p className="text-xs text-[#8696A0] mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusList;
