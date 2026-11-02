import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';
import { COUNTRY_CODES, normalizePhone } from '../../utils/phoneUtils';
import { cn } from '../../utils/cn';

export const PhoneInput = ({
  value = '',
  countryCode = '+91',
  onChange,
  onCountryChange,
  label = 'Phone Number',
  error = null,
  disabled = false,
  autoFocus = false,
  required = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const selectedCountry = useMemo(() => {
    return (
      COUNTRY_CODES.find((c) => c.dialCode === countryCode) ||
      COUNTRY_CODES.find((c) => c.code === 'IN') ||
      COUNTRY_CODES[0]
    );
  }, [countryCode]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Clean phone input
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^\d\s-]/g, '');
    onChange?.(val);
  };

  const handleSelectCountry = (country) => {
    onCountryChange?.(country.dialCode, country.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-xs font-semibold text-charcoal-700 dark:text-[#8696A0] flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Country Code Picker Dropdown Button */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-l-xl border border-r-0 border-charcoal-300 dark:border-[#2A3942] bg-charcoal-50 dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#202C33] text-sm font-semibold transition-colors focus:outline-none"
            title="Select country code"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-xs sm:text-sm font-mono">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 dark:text-[#8696A0]" />
          </button>

          {/* Country Selector Popover */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942] shadow-2xl z-50 overflow-hidden flex flex-col max-h-72 animate-scale-in">
              {/* Search Country */}
              <div className="p-2 border-b border-charcoal-100 dark:border-[#2A3942] bg-charcoal-50 dark:bg-[#111B21]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942]">
                  <Search className="w-3.5 h-3.5 text-charcoal-400 dark:text-[#8696A0] shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full bg-transparent text-xs text-charcoal-900 dark:text-[#E9EDEF] placeholder-charcoal-400 dark:placeholder-[#8696A0] focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto divide-y divide-charcoal-100 dark:divide-[#2A3942]/60">
                {filteredCountries.map((c) => {
                  const isSelected = c.dialCode === selectedCountry.dialCode && c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code + c.dialCode}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-charcoal-50 dark:hover:bg-[#111B21] transition-colors',
                        isSelected && 'bg-primary-50 dark:bg-[#00A884]/15 text-primary-600 dark:text-[#00A884] font-semibold'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate text-charcoal-900 dark:text-[#E9EDEF]">{c.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-charcoal-500 dark:text-[#8696A0] ml-2 shrink-0">
                        {c.dialCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* National Number Input */}
        <input
          type="tel"
          disabled={disabled}
          value={value}
          onChange={handlePhoneChange}
          placeholder="e.g. 98765 43210"
          autoFocus={autoFocus}
          className={cn(
            'flex-1 px-3.5 py-2.5 rounded-r-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] placeholder-charcoal-400 dark:placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884] transition-colors font-mono tracking-wide',
            error && 'border-rose-500 focus:border-rose-500'
          )}
        />
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5 animate-slide-down">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default PhoneInput;

