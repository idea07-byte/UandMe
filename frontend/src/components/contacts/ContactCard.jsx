import React from 'react';
import { Star, MessageSquare, Ban } from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from '../chat/OnlineIndicator';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

/**
 * Reusable Contact Card component for Contacts list.
 */
export const ContactCard = ({
  contact,
  isSelected = false,
  onSelect,
  onStartChat,
}) => {
  const {
    name,
    avatar,
    status = 'offline',
    role,
    department,
    handle,
    email,
    isFavorite = false,
    isBlocked = false,
  } = contact;

  return (
    <div
      onClick={() => onSelect?.(contact)}
      className={cn(
        'w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl text-left cursor-pointer transition-standard border group relative select-none',
        isSelected
          ? 'bg-primary-50/80 dark:bg-charcoal-800 border-primary-300 dark:border-primary-900 shadow-soft-sm'
          : 'hover:bg-charcoal-100/70 dark:hover:bg-charcoal-800/60 border-transparent'
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Profile Avatar with Online Indicator */}
        <div className="relative shrink-0">
          <Avatar src={avatar} name={name} size="md" />
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineIndicator status={status} size="sm" pulse={status === 'online'} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                'text-sm font-bold truncate leading-tight',
                isSelected
                  ? 'text-primary-950 dark:text-primary-100'
                  : 'text-charcoal-900 dark:text-charcoal-100'
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

          <div className="flex items-center gap-2 mt-0.5 text-xs text-charcoal-500 dark:text-charcoal-400 truncate">
            <span className="truncate">{role || department || email}</span>
            {handle && (
              <>
                <span className="text-charcoal-300 dark:text-charcoal-600">•</span>
                <span className="text-[11px] font-mono text-charcoal-400 truncate">{handle}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action: Quick Message Trigger */}
      <div className="shrink-0 ml-2">
        <Button
          size="xs"
          variant={isSelected ? 'primary' : 'secondary'}
          onClick={(e) => {
            e.stopPropagation();
            onStartChat?.(contact);
          }}
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          className="shadow-soft-sm"
        >
          <span className="hidden sm:inline">Message</span>
        </Button>
      </div>
    </div>
  );
};

export default ContactCard;
