import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  X,
  BellOff,
  Bell,
  Trash2,
  Archive,
  Star,
  UserCheck,
  Pin,
  Mail,
  Ban,
  Eraser,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from './OnlineIndicator';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const ChatHeader = ({
  conversation,
  onBack,
  onOpenInfo,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onToggleFavorite,
  onToggleUnread,
  onClearChat,
  onDeleteChat,
  onToggleBlock,
  searchQuery = '',
  onSearchChange,
  onCloseSearch,
}) => {
  const [showSearch, setShowSearch] = useState(Boolean(searchQuery));
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showMenu]);

  if (!conversation) return null;

  const {
    id,
    name,
    avatar,
    status,
    lastSeen,
    isGroup,
    memberCount,
    isFavorite,
    isArchived,
    isMuted,
    pinned,
    isBlocked,
  } = conversation;

  const handleVoiceCall = () => {
    toast.info(`Voice call started with ${name}. WebRTC signaling connects in Phase 5.`, 'Voice Call');
  };

  const handleVideoCall = () => {
    toast.info(`Video call started with ${name}. WebRTC signaling connects in Phase 5.`, 'Video Call');
  };

  return (
    <div className="flex flex-col border-b border-[#222D34] dark:border-[#222D34] bg-[#F0F2F5] dark:bg-[#202C33] sticky top-0 z-20 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 h-[60px]">
        {/* Left: Contact Info */}
        <div
          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 mr-2"
          onClick={onOpenInfo}
          title="Click to view contact information"
        >
          {/* Back button on mobile */}
          {onBack && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="md:hidden p-1.5 -ml-1 rounded-full text-[#AEBAC1] hover:bg-[#374248] transition-colors"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <Avatar
              src={avatar}
              name={name}
              size="md"
              className="w-10 h-10 ring-0"
            />
            {status === 'online' && !isGroup && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00A884] ring-2 ring-[#202C33]" />
            )}
          </div>

          {/* Contact Name & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[16px] font-medium text-[#111B21] dark:text-[#E9EDEF] truncate leading-tight">
                {name}
              </h3>
              {isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
              {pinned && <Pin className="w-3.5 h-3.5 text-[#00A884] rotate-45 shrink-0" />}
              {isMuted && <BellOff className="w-3.5 h-3.5 text-[#8696A0] shrink-0" />}
              {isBlocked && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 flex items-center gap-0.5">
                  <Ban className="w-2.5 h-2.5" /> Blocked
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#667781] dark:text-[#8696A0] truncate leading-none mt-1">
              {isGroup ? (
                <span>{memberCount || 5} members</span>
              ) : status === 'online' ? (
                <span className="text-[#00A884] font-medium">online</span>
              ) : (
                <span>{lastSeen ? `last seen ${lastSeen}` : 'offline'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Socket Connection Status Badge */}
          <ConnectionStatusBadge size="sm" className="hidden lg:inline-flex mr-1" />

          {/* In-chat search button */}
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className={cn(
              'p-2 rounded-full transition-colors text-[#54656F] dark:text-[#AEBAC1] hover:text-[#111B21] dark:hover:text-[#E9EDEF]',
              showSearch ? 'bg-[#E9EDEF] dark:bg-[#374248] text-[#00A884]' : 'hover:bg-[#E9EDEF] dark:hover:bg-[#374248]'
            )}
            title="Search in conversation"
            aria-label="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Video call */}
          <button
            type="button"
            onClick={handleVideoCall}
            className="p-2 rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:text-[#111B21] dark:hover:text-[#E9EDEF] hover:bg-[#E9EDEF] dark:hover:bg-[#374248] transition-colors"
            title="Video call"
            aria-label="Video call"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Voice call */}
          <button
            type="button"
            onClick={handleVoiceCall}
            className="p-2 rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:text-[#111B21] dark:hover:text-[#E9EDEF] hover:bg-[#E9EDEF] dark:hover:bg-[#374248] transition-colors"
            title="Voice call"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* More options dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className={cn(
                'p-2 rounded-full text-[#54656F] dark:text-[#AEBAC1] hover:text-[#111B21] dark:hover:text-[#E9EDEF] hover:bg-[#E9EDEF] dark:hover:bg-[#374248] transition-colors',
                showMenu && 'bg-[#E9EDEF] dark:bg-[#374248]'
              )}
              title="Menu"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-md bg-white dark:bg-[#233138] border border-[#E9EDEF] dark:border-[#2A3942] shadow-2xl z-30 space-y-0.5 text-[14px] text-[#3B4A54] dark:text-[#D1D7DB] animate-in fade-in zoom-in-95 duration-100">
                {/* Contact Information */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenInfo?.();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] transition-colors flex items-center justify-between"
                >
                  <span>Contact info</span>
                </button>

                {/* Mark as Unread */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleUnread?.(id);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] transition-colors"
                >
                  <span>Mark as unread</span>
                </button>

                {/* Pin / Unpin */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTogglePin?.(id);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] transition-colors"
                >
                  <span>{pinned ? 'Unpin chat' : 'Pin chat'}</span>
                </button>

                {/* Mute / Unmute */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleMute?.(id);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] transition-colors"
                >
                  <span>{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                </button>

                {/* Archive / Unarchive */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleArchive?.(id);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] transition-colors"
                >
                  <span>{isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                </button>

                <div className="border-t border-[#E9EDEF] dark:border-[#2A3942] my-1" />

                {/* Clear chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onClearChat?.(conversation);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] text-amber-500 transition-colors"
                >
                  <span>Clear messages</span>
                </button>

                {/* Delete chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteChat?.(conversation);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F5F6F6] dark:hover:bg-[#182229] text-rose-500 transition-colors"
                >
                  <span>Delete chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar (collapsible) */}
      {showSearch && (
        <div className="px-4 py-2 bg-[#F0F2F5] dark:bg-[#111B21] border-t border-[#E9EDEF] dark:border-[#222D34] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#8696A0] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#111B21] dark:text-[#E9EDEF] placeholder:text-[#8696A0] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-xs text-[#8696A0] hover:text-[#E9EDEF]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              onCloseSearch?.();
            }}
            className="p-1 rounded-full text-[#8696A0] hover:text-[#E9EDEF]"
            aria-label="Close in-chat search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
