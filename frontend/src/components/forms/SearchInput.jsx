import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search conversations or messages...',
  className,
  autoFocus = false,
  ...props
}) => {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3.5 w-4 h-4 text-charcoal-400 dark:text-charcoal-500 pointer-events-none" />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full text-sm rounded-xl pl-10 pr-9 py-2 outline-none transition-standard',
          'bg-charcoal-100 dark:bg-charcoal-800/80',
          'text-charcoal-900 dark:text-charcoal-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500',
          'border border-transparent focus:border-primary-500/50 dark:focus:border-primary-500/50',
          'focus:bg-white dark:focus:bg-charcoal-900 focus:ring-2 focus:ring-primary-500/20'
        )}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
