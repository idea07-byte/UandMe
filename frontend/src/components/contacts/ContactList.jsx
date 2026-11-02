import React, { useMemo, useState } from 'react';
import { UserPlus, Users, Smartphone, RefreshCw } from 'lucide-react';
import ContactCard from './ContactCard';
import SearchInput from '../forms/SearchInput';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { cn } from '../../utils/cn';

// Loading Skeleton for Contacts
const ContactSkeleton = () => (
  <div className="flex items-center gap-3.5 p-3 rounded-2xl animate-pulse">
    <div className="w-10 h-10 rounded-full bg-charcoal-200 dark:bg-charcoal-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-32 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
      <div className="h-2.5 w-44 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
    </div>
    <div className="w-16 h-6 rounded-xl bg-charcoal-200 dark:bg-charcoal-800 shrink-0" />
  </div>
);

/**
 * Alphabetically Grouped Contacts List with Live Search,
 * Phone matching, Device Sync, and Quick Actions.
 */
export const ContactList = ({
  contacts = [],
  selectedContactId,
  onSelectContact,
  onStartChat,
  onInvite,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all', // 'all' | 'registered' | 'unregistered' | 'favorites'
  onStatusFilterChange,
  isLoading = false,
  error = null,
  onRetry,
  onOpenNewContactModal,
  onOpenSyncModal,
  className,
}) => {
  const [selectedLetter, setSelectedLetter] = useState('ALL');

  // Filter contacts by selected letter if user clicked a jump pill
  const letterFilteredContacts = useMemo(() => {
    if (selectedLetter === 'ALL') return contacts;
    return contacts.filter(
      (c) => (c.name[0] || '').toUpperCase() === selectedLetter
    );
  }, [contacts, selectedLetter]);

  // Compute alphabetical groups
  const groupedContacts = useMemo(() => {
    const groups = {};
    letterFilteredContacts.forEach((contact) => {
      const letter = (contact.name[0] || '#').toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        items: groups[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [letterFilteredContacts]);

  // Available letters across all current contacts for the jump rail
  const availableLetters = useMemo(() => {
    const set = new Set();
    contacts.forEach((c) => {
      if (c.name) set.add(c.name[0].toUpperCase());
    });
    return Array.from(set).sort();
  }, [contacts]);

  return (
    <div
      className={cn(
        'w-full md:w-88 lg:w-96 flex flex-col h-full bg-white dark:bg-[#111B21] border-r border-charcoal-200 dark:border-[#222D34] shrink-0 transition-colors select-none',
        className
      )}
    >
      {/* Header and Controls */}
      <div className="p-4 space-y-3 border-b border-charcoal-100 dark:border-[#222D34] shrink-0 bg-white dark:bg-[#111B21]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-[#E9EDEF] tracking-tight">
              Contacts
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00A884]/15 text-[#00A884]">
              {contacts.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sync Device Contacts Button */}
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="p-2 rounded-xl text-charcoal-500 hover:text-charcoal-800 dark:text-[#8696A0] dark:hover:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#202C33] transition-colors"
              title="Sync device contacts"
              aria-label="Sync device contacts"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Add Contact Button */}
            <button
              type="button"
              onClick={onOpenNewContactModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Contact</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            onSearchChange?.(e.target.value);
            if (selectedLetter !== 'ALL') setSelectedLetter('ALL');
          }}
          onClear={() => onSearchChange?.('')}
          placeholder="Search by name or phone..."
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'registered', label: 'On uandi' },
            { id: 'unregistered', label: 'Not on app' },
            { id: 'favorites', label: 'Favorites' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onStatusFilterChange?.(tab.id);
                if (selectedLetter !== 'ALL') setSelectedLetter('ALL');
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-xl transition-all whitespace-nowrap',
                statusFilter === tab.id
                  ? 'bg-[#00A884] text-white shadow-soft-sm'
                  : 'bg-charcoal-100 dark:bg-[#202C33] text-charcoal-600 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alphabetical Quick-Jump Filter Bar */}
        {availableLetters.length > 1 && !searchQuery && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLetter('ALL')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all shrink-0',
                selectedLetter === 'ALL'
                  ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900'
                  : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-[#202C33]'
              )}
            >
              All
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={cn(
                  'w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all shrink-0',
                  selectedLetter === letter
                    ? 'bg-[#00A884] text-white shadow-soft-sm'
                    : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-[#202C33]'
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main List Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Unable to Load Contacts"
              message={error}
              onRetry={onRetry}
            />
          </div>
        ) : groupedContacts.length > 0 ? (
          // Alphabetically Grouped Contacts Stream
          groupedContacts.map(({ letter, items }) => (
            <div key={letter} className="space-y-1">
              {/* Group Letter Header */}
              <div className="sticky top-0 z-10 px-3 py-1 bg-charcoal-50/95 dark:bg-[#202C33]/95 backdrop-blur-sm rounded-xl flex items-center justify-between border border-charcoal-100 dark:border-[#2A3942]/60 shadow-soft-sm my-1">
                <span className="text-xs font-bold text-[#00A884]">
                  {letter}
                </span>
                <span className="text-[10px] font-semibold text-charcoal-400 dark:text-[#8696A0]">
                  {items.length} {items.length === 1 ? 'contact' : 'contacts'}
                </span>
              </div>

              {/* Items in this alphabetical group */}
              <div className="space-y-0.5">
                {items.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={contact.id === selectedContactId}
                    onSelect={onSelectContact}
                    onStartChat={onStartChat}
                    onInvite={onInvite}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Empty State
          <div className="p-8 text-center my-auto">
            <EmptyState
              icon={Users}
              title={searchQuery ? 'No contacts found' : 'No contacts available'}
              description={
                searchQuery
                  ? `No contacts matched "${searchQuery}". Check the spelling or clear the search.`
                  : selectedLetter !== 'ALL'
                  ? `No contacts starting with letter "${selectedLetter}".`
                  : statusFilter !== 'all'
                  ? `No contacts match filter "${statusFilter}".`
                  : 'Your address book is empty. Add a new contact by phone number or sync your device contacts.'
              }
              actionLabel={
                searchQuery || selectedLetter !== 'ALL' || statusFilter !== 'all'
                  ? 'Reset Filters'
                  : 'Add New Contact'
              }
              onAction={
                searchQuery || selectedLetter !== 'ALL' || statusFilter !== 'all'
                  ? () => {
                      onSearchChange?.('');
                      setSelectedLetter('ALL');
                      onStatusFilterChange?.('all');
                    }
                  : onOpenNewContactModal
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;
