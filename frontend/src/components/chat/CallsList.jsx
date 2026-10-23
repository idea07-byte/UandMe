import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Plus,
  Heart,
  X,
  PhoneForwarded,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { MOCK_CALLS } from '../../services/mockWhatsAppExtras';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const CallsList = ({ onSelectCall, selectedCallId }) => {
  const [search, setSearch] = useState('');
  const [calls, setCalls] = useState(MOCK_CALLS);
  const toast = useToast();

  const filteredCalls = search.trim()
    ? calls.filter((c) => c.name.toLowerCase().includes(search.toLowerCase().trim()))
    : calls;

  const handleStartCall = (contact, type = 'voice') => {
    toast.info(`Starting ${type} call with ${contact.name}...`, type === 'video' ? 'Video Call' : 'Voice Call');
  };

  return (
    <div className="w-full sm:w-80 md:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] select-none">
      {/* Calls Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222D34]">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Calls</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('Select a contact to start a new call.')}
            className="p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
            title="New call"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-[#222D34]">
        <div className="flex items-center bg-[#202C33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884]">
          <Search className="w-4 h-4 text-[#8696A0] mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start a new call"
            className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-[#8696A0] hover:text-[#E9EDEF]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Calls List */}
      <div className="flex-1 overflow-y-auto">
        {/* Favourites Section */}
        <div className="px-4 py-3 border-b border-[#222D34]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Favourites</span>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Add favourite contacts for quick voice and video calls.')}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#202C33] text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884] group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#00A884]">Add favourite</p>
              <p className="text-xs text-[#8696A0]">1-tap voice and video calls</p>
            </div>
          </button>
        </div>

        {/* Recent Calls Section */}
        <div className="py-2">
          <div className="px-4 py-1.5">
            <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Recent</span>
          </div>

          {filteredCalls.map((call) => {
            const isMissed = call.direction === 'missed';
            const isOutgoing = call.direction === 'outgoing';

            return (
              <div
                key={call.id}
                onClick={() => onSelectCall?.(call)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 hover:bg-[#202C33] cursor-pointer transition-colors border-b border-[#182229]',
                  selectedCallId === call.id && 'bg-[#2A3942]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={call.avatar} name={call.name} size="md" />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold truncate', isMissed ? 'text-rose-400' : 'text-[#E9EDEF]')}>
                      {call.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#8696A0] mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : isOutgoing ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#00A884] shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-[#8696A0] shrink-0" />
                      )}
                      <span>{call.timestamp}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCall(call, call.type);
                  }}
                  className="p-2 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] transition-colors"
                  title={`Call ${call.name}`}
                >
                  {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CallsList;
