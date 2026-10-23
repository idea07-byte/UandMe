import React from 'react';
import { cn } from '../../utils/cn';
import { USER_STATUS } from '../../utils/constants';

const sizeMap = {
  xs: 'w-2 h-2 border-[1px]',
  sm: 'w-2.5 h-2.5 border-1.5',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
};

const statusColors = {
  [USER_STATUS.ONLINE]: 'bg-emerald-500',
  [USER_STATUS.OFFLINE]: 'bg-charcoal-400 dark:bg-charcoal-500',
  [USER_STATUS.AWAY]: 'bg-amber-500',
  [USER_STATUS.BUSY]: 'bg-rose-500',
};

export const OnlineIndicator = ({
  status = USER_STATUS.OFFLINE,
  size = 'md',
  pulse = true,
  className,
}) => {
  const isOnline = status === USER_STATUS.ONLINE;

  return (
    <span
      className={cn(
        'relative inline-block rounded-full border-white dark:border-charcoal-900 shrink-0 transition-colors',
        sizeMap[size] || sizeMap.md,
        statusColors[status] || statusColors[USER_STATUS.OFFLINE],
        className
      )}
      title={`Status: ${status}`}
      aria-label={`Status: ${status}`}
    >
      {isOnline && pulse && (
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75 pointer-events-none" />
      )}
    </span>
  );
};

export default OnlineIndicator;
