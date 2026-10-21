import React, { useState } from 'react';
import { Plus, Search, MessageSquareDashed, Users, Archive, Star } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewChatModal from './NewChatModal';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import SearchInput from '../forms/SearchInput';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

// Loading Skeleton Placeholder for Conversation Items
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3.5 p-3 rounded-2xl animate-pulse">
    <div className="w-10 h-10 rounded-full bg-charcoal-200 dark:bg-charcoal-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <div className="h-3 w-28 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
        <div className="h-2.5 w-10 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
      </div>
      <div className="h-2.5 w-44 bg-charcoal-200 dark:bg-charcoal-800 rounded" />
    </div>
  </div>
);

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onAddConversation,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onToggleFavorite,
  onToggleUnread,
  onClearChat,
  onDeleteChat,
  onToggleBlock,
  filterTab = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
  activeView = 'chats', // 'chats' | 'contacts' | 'archived'
  contacts = [],
  className,
}) => {
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'archived':
        return 'Archived Chats';
      case 'contacts':
        return 'Campus Contacts';
      default:
        return 'Messages';
    }
  };

  return (
    <div
      className={cn(
        'w-full md:w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-charcoal-900 border-r border-charcoal-200 dark:border-charcoal-800 shrink-0 transition-colors',
        className
      )}
    >
      {/* Top Header */}
      <div className="p-4 space-y-3 border-b border-charcoal-100 dark:border-charcoal-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-charcoal-900 dark:text-charcoal-100 tracking-tight">
              {getHeaderTitle()}
            </h2>
            {conversations.length > 0 && activeView === 'chats' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400">
                {conversations.length}
              </span>
            )}
            <ConnectionStatusBadge size="sm" />
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsNewChatModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Chat
          </Button>
        </div>

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          placeholder="Search chats, contacts, or messages..."
        />

        {/* Filter Tabs (All, Unread, Favorites) */}
        {activeView === 'chats' && (
          <div className="flex items-center gap-1.5 pt-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'favorites', label: 'Favorites' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-xl transition-standard capitalize',
                  filterTab === tab.id
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-charcoal-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          // Skeletons
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : activeView === 'contacts' ? (
          // Contacts List View inside Sidebar if activeView is contacts
          contacts.length > 0 ? (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onAddConversation?.(contact)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-charcoal-500">{contact.role || contact.email}</p>
                  </div>
                </div>
                <Button size="xs" variant="secondary">
                  Chat
                </Button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-charcoal-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No contacts found</p>
            </div>
          )
        ) : conversations.length > 0 ? (
          // Regular Conversations List
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
              onTogglePin={onTogglePin}
              onToggleMute={onToggleMute}
              onToggleArchive={onToggleArchive}
              onToggleFavorite={onToggleFavorite}
              onToggleUnread={onToggleUnread}
              onClearChat={onClearChat}
              onDeleteChat={onDeleteChat}
              onToggleBlock={onToggleBlock}
            />
          ))
        ) : (
          // Empty State
          <div className="p-8 text-center text-charcoal-400 dark:text-charcoal-500 space-y-2 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 flex items-center justify-center mx-auto text-charcoal-400">
              {searchQuery ? (
                <Search className="w-6 h-6 opacity-60" />
              ) : filterTab === 'favorites' ? (
                <Star className="w-6 h-6 opacity-60" />
              ) : activeView === 'archived' ? (
                <Archive className="w-6 h-6 opacity-60" />
              ) : (
                <MessageSquareDashed className="w-6 h-6 opacity-60" />
              )}
            </div>
            <h4 className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
              {searchQuery ? 'No matching conversations' : 'No conversations found'}
            </h4>
            <p className="text-[11px] text-charcoal-500 max-w-[200px] mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Check spelling or try a different search.`
                : filterTab === 'unread'
                ? 'All caught up! You have no unread messages.'
                : filterTab === 'favorites'
                ? 'Star your favorite conversations to pin them here.'
                : activeView === 'archived'
                ? 'You do not have any archived chats.'
                : 'Start a direct chat with your peers or team.'}
            </p>
            {searchQuery && (
              <Button size="xs" variant="ghost" onClick={() => onSearchChange('')}>
                Clear Search Filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Direct Chat Interface Modal (Search Registered Users by Name/Email) */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={(user) => {
          onAddConversation?.(user);
          setIsNewChatModalOpen(false);
        }}
      />
    </div>
  );
};

export default ConversationList;
