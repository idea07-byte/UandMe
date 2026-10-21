import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Star,
  Check,
  CheckCheck,
  BellOff,
  Bell,
  MoreVertical,
  Archive,
  Trash2,
  Ban,
  MailCheck,
  Mail,
  Eraser,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from './OnlineIndicator';
import { formatListTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export const ConversationItem = ({
  conversation,
  isActive = false,
  onClick,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  _onToggleFavorite,
  onToggleUnread,
  onClearChat,
  onDeleteChat,
  onToggleBlock,
}) => {
  const {
    id,
    name,
    avatar,
    status,
    lastMessage,
    unreadCount = 0,
    pinned = false,
    isFavorite = false,
    isMuted = false,
    isBlocked = false,
    isArchived = false,
  } = conversation;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close context menu on outside click
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

  const isOutgoing = lastMessage?.senderId === 'usr_me_1';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-standard select-none group relative border cursor-pointer',
        isActive
          ? 'bg-primary-50/80 dark:bg-charcoal-800/90 border-primary-200 dark:border-primary-900/60 shadow-soft-sm'
          : 'hover:bg-charcoal-100/70 dark:hover:bg-charcoal-800/50 border-transparent'
      )}
    >
      {/* Avatar with Online Presence Badge */}
      <div className="relative shrink-0">
        <Avatar src={avatar} name={name} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator status={status} size="sm" pulse={status === 'online'} />
        </div>
      </div>

      {/* Center Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              className={cn(
                'text-sm font-semibold truncate leading-tight',
                isActive
                  ? 'text-primary-950 dark:text-primary-100'
                  : 'text-charcoal-900 dark:text-charcoal-100'
              )}
            >
              {name}
            </h4>

            {isFavorite && (
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            )}

            {isBlocked && (
              <span className="text-[9px] font-bold px-1 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                <Ban className="w-2.5 h-2.5" /> Blocked
              </span>
            )}
          </div>

          {/* Timestamp */}
          {lastMessage?.timestamp && (
            <span
              className={cn(
                'text-[11px] shrink-0 font-medium',
                unreadCount > 0
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-charcoal-400 dark:text-charcoal-500'
              )}
            >
              {formatListTime(lastMessage.timestamp)}
            </span>
          )}
        </div>

        {/* Last Message Preview & Indicators */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate flex items-center gap-1 min-w-0',
              unreadCount > 0
                ? 'font-medium text-charcoal-900 dark:text-charcoal-200'
                : 'text-charcoal-500 dark:text-charcoal-400'
            )}
          >
            {isOutgoing && (
              <span className="shrink-0 text-charcoal-400 dark:text-charcoal-500">
                {lastMessage.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-primary-500" />
                ) : lastMessage.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            <span className="truncate">{lastMessage?.text || 'No messages yet'}</span>
          </p>

          {/* Badges: Muted, Pinned, Unread Count & Options Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && (
              <BellOff className="w-3.5 h-3.5 text-charcoal-400 dark:text-charcoal-500 shrink-0" title="Notifications muted" />
            )}

            {pinned && (
              <Pin className="w-3.5 h-3.5 text-charcoal-400 dark:text-charcoal-500 rotate-45 shrink-0" title="Pinned chat" />
            )}

            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-soft">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {/* Quick 3-Dots Conversation Options Trigger */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-200/60 dark:hover:bg-charcoal-700/60 transition-opacity"
                title="Conversation options"
                aria-label="Conversation options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Context Dropdown Menu */}
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 p-1.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-lg animate-scale-in z-30 space-y-0.5 text-xs text-charcoal-700 dark:text-charcoal-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pin / Unpin */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin?.(id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                  >
                    <Pin className={cn('w-3.5 h-3.5', pinned && 'rotate-45 text-primary-600')} />
                    <span>{pinned ? 'Unpin Chat' : 'Pin to Top'}</span>
                  </button>

                  {/* Mute / Unmute */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onToggleMute?.(id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                  >
                    {isMuted ? (
                      <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-charcoal-400" />
                    )}
                    <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>

                  {/* Mark as Unread / Read */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onToggleUnread?.(id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                  >
                    {unreadCount > 0 ? (
                      <MailCheck className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                    )}
                    <span>{unreadCount > 0 ? 'Mark as Read' : 'Mark as Unread'}</span>
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
                    <Archive className="w-3.5 h-3.5 text-sky-500" />
                    <span>{isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                  </button>

                  <div className="border-t border-charcoal-100 dark:border-charcoal-800 my-1" />

                  {/* Clear Messages */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onClearChat?.(conversation);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-amber-600 dark:text-amber-400 transition-colors"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Messages...</span>
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
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Conversation...</span>
                  </button>

                  {/* Block / Unblock Contact */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onToggleBlock?.(conversation);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors font-medium"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isBlocked ? 'Unblock Contact...' : 'Block Contact...'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
