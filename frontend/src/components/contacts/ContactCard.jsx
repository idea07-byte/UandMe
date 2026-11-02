import React from 'react';
import { Star, MessageSquare, Ban, Phone, Share2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from '../chat/OnlineIndicator';
import { cn } from '../../utils/cn';

/**
 * Reusable Contact Card component for Contacts list.
 */
export const ContactCard = ({
  contact,
  isSelected = false,
  onSelect,
  onStartChat,
  onInvite,
}) => {
  const {
    name,
    phone,
    formattedPhone,
    contactUser,
    isRegistered = true,
    isFavorite = false,
    isBlocked = false,
  } = contact;

  const displayAvatar = contactUser?.avatar || contact.avatar;
  const displayStatus = contactUser?.status || contact.status || 'offline';
  const displayPhone = formattedPhone || phone || contact.email || '';

  return (
    <div
      onClick={() => onSelect?.(contact)}
      className={cn(
        'w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl text-left cursor-pointer transition-all border group relative select-none',
        isSelected
          ? 'bg-primary-50/90 dark:bg-[#202C33] border-primary-400 dark:border-[#00A884]/40 shadow-soft-sm'
          : 'hover:bg-charcoal-100/70 dark:hover:bg-[#202C33]/60 border-transparent'
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Profile Avatar with Online Indicator */}
        <div className="relative shrink-0">
          <Avatar src={displayAvatar} name={name} size="md" />
          {isRegistered && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator status={displayStatus} size="sm" pulse={displayStatus === 'online'} />
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                'text-sm font-bold truncate leading-tight',
                isSelected
                  ? 'text-primary-950 dark:text-[#E9EDEF]'
                  : 'text-charcoal-900 dark:text-[#E9EDEF]'
              )}
            >
              {name}
            </h4>

            {isFavorite && (
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            )}

            {isBlocked && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                <Ban className="w-2.5 h-2.5" /> Blocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-charcoal-500 dark:text-[#8696A0] truncate">
            {displayPhone && (
              <span className="font-mono text-[11px] truncate">{displayPhone}</span>
            )}
            <span className="text-charcoal-300 dark:text-charcoal-600">•</span>
            <span
              className={cn(
                'text-[10.5px] font-semibold',
                isRegistered ? 'text-[#00A884]' : 'text-amber-500'
              )}
            >
              {isRegistered ? 'On uandi' : 'Not registered'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Trigger */}
      <div className="shrink-0 ml-2">
        {isRegistered ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartChat?.(contactUser || contact);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Message</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInvite?.(contact);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-charcoal-100 dark:bg-[#111B21] hover:bg-[#00A884]/20 text-charcoal-700 dark:text-[#8696A0] hover:text-[#00A884] text-xs font-semibold transition-colors border border-charcoal-200 dark:border-[#2A3942]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactCard;
