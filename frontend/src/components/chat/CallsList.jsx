import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Video,
  PhoneMissed,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Plus,
  Heart,
  X,
  Hash,
  Trash2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import callHistoryService from '../../services/callHistoryService';
import { MOCK_CALLS } from '../../services/mockWhatsAppExtras';
import { cn } from '../../utils/cn';

export const CallsList = ({ onSelectCall, selectedCallId, onStartCall, onOpenDialpad }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'missed'
  const [calls, setCalls] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load real call logs or fallback
  const refreshCalls = useCallback(() => {
    const logs = callHistoryService.getCalls(userId, filterTab);
    if (logs && logs.length > 0) {
      setCalls(logs);
    } else {
      // Use mock calls if no local call history exists yet
      const base = filterTab === 'missed'
        ? MOCK_CALLS.filter((c) => c.direction === 'missed')
        : MOCK_CALLS;
      setCalls(base);
    }
  }, [userId, filterTab]);

  useEffect(() => {
    refreshCalls();
  }, [refreshCalls]);

  // Reactive listener for call history updates
  useEffect(() => {
    const handleUpdate = () => refreshCalls();
    window.addEventListener('uandi:call-history-updated', handleUpdate);
    return () => window.removeEventListener('uandi:call-history-updated', handleUpdate);
  }, [refreshCalls]);

  const filteredCalls = search.trim()
    ? calls.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
          (c.peer?.name || '').toLowerCase().includes(search.toLowerCase().trim())
      )
    : calls;

  const handleStartCall = (callItem, type = 'voice') => {
    const targetPeer = callItem.peer || {
      id: callItem.id,
      _id: callItem.id,
      name: callItem.name,
      avatar: callItem.avatar,
    };

    if (onStartCall) {
      onStartCall(targetPeer, type);
    } else {
      toast.info(`Calling ${targetPeer.name}...`);
    }
  };

  const handleDeleteCall = (e, callId) => {
    e.stopPropagation();
    callHistoryService.deleteCall(userId, callId);
    setCalls((prev) => prev.filter((c) => c.id !== callId));
    toast.success('Call log deleted');
  };

  const handleClearHistory = () => {
    callHistoryService.clearHistory(userId);
    setCalls([]);
    setShowClearConfirm(false);
    toast.success('Call history cleared');
  };

  return (
    <div className="w-full sm:w-80 md:w-96 flex flex-col h-full bg-[#111B21] border-r border-[#222D34] select-none">
      {/* Calls Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222D34]">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Calls</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenDialpad}
            className="p-2 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#202C33] transition-colors"
            title="Open Dialpad"
            aria-label="Open Dialpad"
          >
            <Hash className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenDialpad}
            className="p-2 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors"
            title="New call"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowClearConfirm((prev) => !prev)}
            className="p-2 rounded-full text-[#8696A0] hover:text-rose-400 hover:bg-[#202C33] transition-colors"
            title="Clear Call History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Prompt */}
      {showClearConfirm && (
        <div className="px-4 py-2 bg-rose-950/40 border-b border-rose-800/30 flex items-center justify-between animate-fade-in">
          <span className="text-xs text-rose-300">Clear all call logs?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="text-xs px-2 py-1 text-[#8696A0] hover:text-[#E9EDEF]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

      {/* Filter Tabs: All vs Missed */}
      <div className="flex items-center px-4 py-2 border-b border-[#222D34] gap-2 bg-[#111B21]">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
            filterTab === 'all'
              ? 'bg-[#00A884] text-[#111B21]'
              : 'bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF]'
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('missed')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
            filterTab === 'missed'
              ? 'bg-rose-600 text-white'
              : 'bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF]'
          )}
        >
          Missed
        </button>
      </div>

      {/* Scrollable Calls List */}
      <div className="flex-1 overflow-y-auto">
        {/* Favourites Quick Bar */}
        <div className="px-4 py-3 border-b border-[#222D34]">
          <button
            type="button"
            onClick={onOpenDialpad}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#202C33] text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884] group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#00A884]">Favourites</p>
              <p className="text-xs text-[#8696A0]">1-tap voice and video calls</p>
            </div>
          </button>
        </div>

        {/* Recent Calls Section */}
        <div className="py-2">
          <div className="px-4 py-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
              {filterTab === 'missed' ? 'Missed Calls' : 'Recent Calls'}
            </span>
            <span className="text-[11px] text-[#8696A0] font-mono">{filteredCalls.length} logs</span>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="p-8 text-center text-[#8696A0] text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00A884]" />
              <p>No call logs found</p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const isMissed = call.direction === 'missed';
              const isOutgoing = call.direction === 'outgoing';
              const isVideo = call.type === 'video';

              return (
                <div
                  key={call.id}
                  onClick={() => onSelectCall?.(call)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 hover:bg-[#202C33] cursor-pointer transition-colors border-b border-[#182229] group',
                    selectedCallId === call.id && 'bg-[#2A3942]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={call.avatar || call.peer?.avatar} name={call.name || call.peer?.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-semibold truncate', isMissed ? 'text-rose-400' : 'text-[#E9EDEF]')}>
                        {call.name || call.peer?.name || 'Contact'}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#8696A0] mt-0.5">
                        {isMissed ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : isOutgoing ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#00A884] shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-[#8696A0] shrink-0" />
                        )}
                        <span>{call.time || call.timestamp}</span>
                        {call.durationFormatted && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{call.durationFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Delete Log Button (Visible on hover or active) */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCall(e, call.id)}
                      className="p-1.5 rounded-full text-[#8696A0] hover:text-rose-400 hover:bg-[#111B21] transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete call log"
                      aria-label="Delete call log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Quick Call Back Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCall(call, isVideo ? 'video' : 'voice');
                      }}
                      className="p-2 rounded-full text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] transition-colors"
                      title={`Call back ${call.name || 'contact'}`}
                    >
                      {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CallsList;
