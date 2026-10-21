import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../common/Avatar';

export const TypingIndicator = ({
  senderName = 'Someone',
  avatar,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-charcoal-800/90 border border-charcoal-200/80 dark:border-charcoal-700/70 shadow-soft-sm animate-fade-in select-none',
        className
      )}
    >
      {avatar && (
        <Avatar
          src={avatar}
          name={senderName}
          size="xs"
        />
      )}

      <span className="text-xs text-charcoal-600 dark:text-charcoal-300 font-medium">
        <span className="font-semibold text-primary-600 dark:text-primary-400">{senderName}</span> is typing
      </span>

      {/* 3 Animated Bouncing Dots */}
      <div className="flex items-center gap-1 pl-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" />
      </div>
    </div>
  );
};

export default TypingIndicator;
