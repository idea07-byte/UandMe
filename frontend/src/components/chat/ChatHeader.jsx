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
    <div className="flex flex-col border-b border-charcoal-200 dark:border-charcoal-800 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Contact Info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar with status indicator */}
          <div
            className="relative cursor-pointer shrink-0"
            onClick={onOpenInfo}
            title="View contact information"
          >
            <Avatar
              src={avatar}
              name={name}
              size="md"
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator status={status} size="sm" pulse={status === 'online'} />
            </div>
          </div>

          {/* Contact Name & Subtitle */}
          <div className="min-w-0 cursor-pointer" onClick={onOpenInfo}>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-charcoal-900 dark:text-charcoal-100 truncate leading-tight">
                {name}
              </h3>
              {isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
              {pinned && <Pin className="w-3 h-3 text-primary-600 rotate-45 shrink-0" />}
              {isMuted && <BellOff className="w-3 h-3 text-charcoal-400 shrink-0" />}
              {isBlocked && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <Ban className="w-2.5 h-2.5" /> Blocked
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 capitalize flex items-center gap-1.5 mt-0.5 truncate">
              {isGroup ? (
                <span>Group • {memberCount || 5} members</span>
              ) : status === 'online' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                </>
              ) : (
                <span>{lastSeen || 'Offline'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Socket Connection Status Badge */}
          <ConnectionStatusBadge size="sm" className="hidden sm:inline-flex mr-1" />

          {/* In-chat search button */}
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl transition-colors',
              showSearch
                ? 'bg-primary-50 text-primary-600 dark:bg-charcoal-800 dark:text-primary-400'
                : 'text-charcoal-600 dark:text-charcoal-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
            )}
            title="Search in conversation"
            aria-label="Search in conversation"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Call actions */}
          <button
            type="button"
            onClick={handleVoiceCall}
            className="p-2 sm:p-2.5 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Voice call"
            aria-label="Voice call"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={handleVideoCall}
            className="p-2 sm:p-2.5 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Video call"
            aria-label="Video call"
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* More options dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 sm:p-2.5 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-charcoal-100 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 p-1.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-lg animate-scale-in z-30 space-y-0.5 text-xs text-charcoal-700 dark:text-charcoal-300">
                {/* Contact Information */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenInfo?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-primary-600" />
                  <span>Contact Information</span>
                </button>

                {/* Pin / Unpin Conversation */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTogglePin?.(id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <Pin className={cn('w-4 h-4', pinned ? 'rotate-45 text-primary-600' : 'text-charcoal-400')} />
                  <span>{pinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
                </button>

                {/* Mute / Unmute Notifications */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleMute?.(id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  {isMuted ? (
                    <Bell className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-charcoal-400" />
                  )}
                  <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                </button>

                {/* Mark as Unread */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleUnread?.(id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary-600" />
                  <span>Mark as Unread</span>
                </button>

                {/* Add / Remove Favorite */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleFavorite?.(id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <Star className={cn('w-4 h-4', isFavorite ? 'text-amber-500 fill-amber-500' : 'text-charcoal-400')} />
                  <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>

                {/* Archive / Unarchive */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleArchive?.(id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <Archive className="w-4 h-4 text-sky-500" />
                  <span>{isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                </button>

                <div className="border-t border-charcoal-100 dark:border-charcoal-800 my-1" />

                {/* Clear Conversation History */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onClearChat?.(conversation);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <Eraser className="w-4 h-4" />
                  <span>Clear Conversation...</span>
                </button>

                {/* Delete Conversation */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteChat?.(conversation);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Conversation...</span>
                </button>

                {/* Block Contact */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleBlock?.(conversation);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors font-medium"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isBlocked ? 'Unblock Contact...' : 'Block Contact...'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar (collapsible) */}
      {showSearch && (
        <div className="px-4 sm:px-6 py-2.5 bg-charcoal-50/90 dark:bg-charcoal-800/80 border-t border-charcoal-200/60 dark:border-charcoal-700/60 flex items-center gap-2 animate-slide-down">
          <Search className="w-4 h-4 text-charcoal-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages in this conversation..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-charcoal-900 dark:text-white placeholder:text-charcoal-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-xs text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200"
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
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200"
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
