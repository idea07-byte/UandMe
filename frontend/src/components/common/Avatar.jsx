import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { getInitials, getAvatarColor } from '../../utils/formatters';
import { USER_STATUS } from '../../utils/constants';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const badgeSizeMap = {
  xs: 'w-1.5 h-1.5 border-[1px]',
  sm: 'w-2 h-2 border-[1.5px]',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-[2.5px]',
  '2xl': 'w-5 h-5 border-[3px]',
};

const statusColors = {
  [USER_STATUS.ONLINE]: 'bg-emerald-500',
  [USER_STATUS.OFFLINE]: 'bg-charcoal-400',
  [USER_STATUS.AWAY]: 'bg-amber-500',
  [USER_STATUS.BUSY]: 'bg-rose-500',
};

export const Avatar = ({
  src,
  alt = 'Avatar',
  name = '',
  size = 'md',
  status,
  statusPulse = false,
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(name || alt);
  const colorBg = getAvatarColor(name || alt);

  const hasImage = Boolean(src) && !imageError;

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center', className)} {...props}>
      <div
        className={cn(
          'relative flex items-center justify-center font-semibold overflow-hidden rounded-full transition-transform',
          sizeMap[size] || sizeMap.md,
          hasImage ? 'bg-charcoal-200 dark:bg-charcoal-700' : colorBg
        )}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="tracking-tight uppercase">{initials}</span>
        )}
      </div>

      {status && statusColors[status] && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white dark:border-charcoal-900',
            badgeSizeMap[size] || badgeSizeMap.md,
            statusColors[status]
          )}
        >
          {status === USER_STATUS.ONLINE && statusPulse && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </span>
      )}
    </div>
  );
};

export default Avatar;
