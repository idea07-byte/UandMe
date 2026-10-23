import React, { useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
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
 * Status Filtering, Alphabetical Index, and Loading/Error States.
 */
export const ContactList = ({
  contacts = [],
  selectedContactId,
  onSelectContact,
  onStartChat,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all', // 'all' | 'online' | 'offline'
  onStatusFilterChange,
  isLoading = false,
  error = null,
  onRetry,
  onOpenNewContactModal,
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
        'w-full md:w-88 lg:w-96 flex flex-col h-full bg-white dark:bg-charcoal-900 border-r border-charcoal-200 dark:border-charcoal-800 shrink-0 transition-colors',
        className
      )}
    >
      {/* Header and Controls */}
      <div className="p-4 space-y-3 border-b border-charcoal-100 dark:border-charcoal-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-charcoal-900 dark:text-white tracking-tight">
              Contacts
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300">
              {contacts.length}
            </span>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onOpenNewContactModal}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Contact
          </Button>
        </div>

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            onSearchChange?.(e.target.value);
            if (selectedLetter !== 'ALL') setSelectedLetter('ALL');
          }}
          onClear={() => onSearchChange?.('')}
          placeholder="Search by name, role, email..."
        />

        {/* Status Filter Tabs (All, Online, Offline) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {[
            { id: 'all', label: 'All Contacts' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Offline' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onStatusFilterChange?.(tab.id);
                if (selectedLetter !== 'ALL') setSelectedLetter('ALL');
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-xl transition-all',
                statusFilter === tab.id
                  ? 'bg-primary-600 text-white shadow-soft-sm'
                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
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
                  : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
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
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-800'
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
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-2 p-2">
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
          </div>
        ) : error ? (
          // Error State
          <div className="p-4 my-auto">
            <ErrorState
              title="Unable to load contacts"
              message={
                typeof error === 'string'
                  ? error
                  : 'We encountered an issue fetching your contacts directory. Please retry.'
              }
              onRetry={onRetry}
            />
          </div>
        ) : groupedContacts.length > 0 ? (
          // Alphabetically Grouped Contacts Stream
          groupedContacts.map(({ letter, items }) => (
            <div key={letter} className="space-y-1">
              {/* Group Letter Header */}
              <div className="sticky top-0 z-10 px-3 py-1 bg-charcoal-50/95 dark:bg-charcoal-800/95 backdrop-blur-sm rounded-xl flex items-center justify-between border border-charcoal-100 dark:border-charcoal-700/60 shadow-soft-sm my-1">
                <span className="text-xs font-black text-primary-700 dark:text-primary-300">
                  {letter}
                </span>
                <span className="text-[10px] font-semibold text-charcoal-400">
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
                  ? `No contacts with status "${statusFilter}".`
                  : 'Your address book is empty. Add classmates or faculty to get started.'
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
